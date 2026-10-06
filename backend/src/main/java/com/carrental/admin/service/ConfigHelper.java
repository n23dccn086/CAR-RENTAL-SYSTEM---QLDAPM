package com.carrental.admin.service;

import com.carrental.admin.entity.PlatformConfig;
import com.carrental.admin.repository.PlatformConfigRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Helper đọc config từ DB, có cache 60 giây để tránh query liên tục.
 *
 * Sau khi Admin sửa config trong /admin/config, cache sẽ tự refresh sau tối đa 60s.
 * (Hoặc gọi clearCache() để refresh ngay)
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ConfigHelper {

    PlatformConfigRepository configRepository;

    // Cache: key → [value, timestamp]
    private final ConcurrentHashMap<String, CachedValue> cache = new ConcurrentHashMap<>();

    // Cache TTL = 60 giây
    private static final long CACHE_TTL_MS = 60_000L;

    // ===== GETTERS =====

    /**
     * Lấy commission_rate (% hoa hồng nền tảng).
     * VD: 15 → có nghĩa 15%.
     */
    public BigDecimal getCommissionRate() {
        return getDecimalConfig("commission_rate", new BigDecimal("15"));
    }

    /**
     * Tỷ lệ owner nhận được = 1 - commission_rate/100.
     * VD: commission=15% → owner share = 0.85.
     */
    public BigDecimal getOwnerShareRate() {
        BigDecimal commission = getCommissionRate();
        BigDecimal rate = BigDecimal.ONE.subtract(
                commission.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
        );
        // Clamp 0..1
        if (rate.compareTo(BigDecimal.ZERO) < 0) rate = BigDecimal.ZERO;
        if (rate.compareTo(BigDecimal.ONE) > 0) rate = BigDecimal.ONE;
        return rate;
    }

    /**
     * Số tiền rút tối thiểu.
     */
    public BigDecimal getMinWithdrawal() {
        return getDecimalConfig("min_withdrawal", new BigDecimal("100000"));
    }

    /**
     * Phí rút tiền (mỗi lần rút).
     */
    public BigDecimal getWithdrawalFee() {
        return getDecimalConfig("withdrawal_fee", BigDecimal.ZERO);
    }

    /**
     * Tỷ lệ cọc mặc định (%).
     * VD: 30 → có nghĩa 30%.
     */
    public BigDecimal getDefaultDepositPercent() {
        return getDecimalConfig("default_deposit_percent", new BigDecimal("30"));
    }

    /**
     * Phí vượt km (VND/km).
     */
    public BigDecimal getOverageKmPrice() {
        return getDecimalConfig("default_overage_km_price", new BigDecimal("5000"));
    }

    /**
     * Phí trả xe muộn (VND/giờ).
     */
    public BigDecimal getLateFeePerHour() {
        return getDecimalConfig("default_late_fee_per_hour", new BigDecimal("100000"));
    }

    /**
     * Hotline hỗ trợ.
     */
    public String getSupportHotline() {
        return getStringConfig("support_hotline", "1900-xxxx");
    }

    /**
     * Email hỗ trợ.
     */
    public String getSupportEmail() {
        return getStringConfig("support_email", "support@carrental.com");
    }

    // ===== CACHE MANAGEMENT =====

    /**
     * Xoá cache — gọi sau khi Admin update config để áp dụng ngay lập tức.
     */
    public void clearCache() {
        cache.clear();
        log.info("Config cache cleared");
    }

    // ===== INTERNAL =====

    private BigDecimal getDecimalConfig(String key, BigDecimal defaultValue) {
        String raw = getRawConfig(key);
        if (raw == null || raw.isBlank()) {
            return defaultValue;
        }
        try {
            return new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            log.warn("Invalid NUMBER config '{}': '{}', fallback to {}", key, raw, defaultValue);
            return defaultValue;
        }
    }

    private String getStringConfig(String key, String defaultValue) {
        String raw = getRawConfig(key);
        return (raw == null || raw.isBlank()) ? defaultValue : raw;
    }

    private String getRawConfig(String key) {
        CachedValue cached = cache.get(key);
        long now = System.currentTimeMillis();

        if (cached != null && (now - cached.timestamp) < CACHE_TTL_MS) {
            return cached.value;
        }

        // Cache miss hoặc hết hạn → query DB
        String value = configRepository.findByConfigKey(key)
                .map(PlatformConfig::getConfigValue)
                .orElse(null);

        cache.put(key, new CachedValue(value, now));
        return value;
    }

    // ===== INNER =====

    private record CachedValue(String value, long timestamp) {}
}