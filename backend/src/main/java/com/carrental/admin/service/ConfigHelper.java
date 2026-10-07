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
 * Helper đọc config từ DB, có cache 60 giây.
 * Sau khi Admin sửa config → clearCache() → áp dụng NGAY.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ConfigHelper {

    PlatformConfigRepository configRepository;

    private final ConcurrentHashMap<String, CachedValue> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60_000L;

    // ===== COMMISSION =====

    public BigDecimal getCommissionRate() {
        return getDecimalConfig("commission_rate", new BigDecimal("15"));
    }

    public BigDecimal getOwnerShareRate() {
        BigDecimal commission = getCommissionRate();
        BigDecimal rate = BigDecimal.ONE.subtract(
                commission.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
        );
        if (rate.compareTo(BigDecimal.ZERO) < 0) rate = BigDecimal.ZERO;
        if (rate.compareTo(BigDecimal.ONE) > 0) rate = BigDecimal.ONE;
        return rate;
    }

    // ===== WITHDRAWAL =====

    public BigDecimal getMinWithdrawal() {
        return getDecimalConfig("min_withdrawal", new BigDecimal("100000"));
    }

    public BigDecimal getWithdrawalFee() {
        return getDecimalConfig("withdrawal_fee", BigDecimal.ZERO);
    }

    // ===== DEPOSIT =====

    public BigDecimal getDefaultDepositPercent() {
        return getDecimalConfig("default_deposit_percent", new BigDecimal("30"));
    }

    // ===== LATE FEE =====

    public BigDecimal getLateFeePerHour() {
        return getDecimalConfig("default_late_fee_per_hour", new BigDecimal("100000"));
    }

    // ===== REFUND (Khách hủy) =====

    public BigDecimal getRefundBefore24hPercent() {
        return getDecimalConfig("refund_before_24h_percent", new BigDecimal("100"));
    }

    public BigDecimal getRefund4To24hPercent() {
        return getDecimalConfig("refund_4_to_24h_percent", new BigDecimal("70"));
    }

    public BigDecimal getRefundBefore4hPercent() {
        return getDecimalConfig("refund_before_4h_percent", new BigDecimal("50"));
    }

    public BigDecimal getRefundAfterPickupPercent() {
        return getDecimalConfig("refund_after_pickup_percent", BigDecimal.ZERO);
    }

    // ===== KM OVERAGE (áp dụng MỌI loại xe) =====

    public int getDefaultKmPerDay() {
        return getDecimalConfig("default_km_per_day", new BigDecimal("300")).intValue();
    }

    public int getKmOverageBracket1Limit() {
        return getDecimalConfig("km_overage_bracket_1_limit", new BigDecimal("50")).intValue();
    }

    public BigDecimal getKmOverageBracket1Price() {
        return getDecimalConfig("km_overage_bracket_1_price", new BigDecimal("5000"));
    }

    public int getKmOverageBracket2Limit() {
        return getDecimalConfig("km_overage_bracket_2_limit", new BigDecimal("100")).intValue();
    }

    public BigDecimal getKmOverageBracket2Price() {
        return getDecimalConfig("km_overage_bracket_2_price", new BigDecimal("8000"));
    }

    public BigDecimal getKmOverageBracket3Price() {
        return getDecimalConfig("km_overage_bracket_3_price", new BigDecimal("12000"));
    }

    // ===== SUPPORT =====

    public String getSupportHotline() {
        return getStringConfig("support_hotline", "1900-xxxx");
    }

    public String getSupportEmail() {
        return getStringConfig("support_email", "support@carrental.com");
    }

    // ===== CACHE =====

    public void clearCache() {
        cache.clear();
        log.info("Config cache cleared");
    }

    // ===== INTERNAL =====

    private BigDecimal getDecimalConfig(String key, BigDecimal defaultValue) {
        String raw = getRawConfig(key);
        if (raw == null || raw.isBlank()) return defaultValue;
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

        String value = configRepository.findByConfigKey(key)
                .map(PlatformConfig::getConfigValue)
                .orElse(null);

        cache.put(key, new CachedValue(value, now));
        return value;
    }

    private record CachedValue(String value, long timestamp) {}
}