package com.carrental.common.security;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Date;
import java.util.HexFormat;

/**
 * Thu hồi JWT khi đăng xuất bằng Redis.
 * <p>
 * Lưu SHA-256 của token (không lưu token gốc) với TTL bằng thời gian sống còn lại của token,
 * nên key tự biến mất khi token hết hạn tự nhiên.
 * <p>
 * Nếu Redis không truy cập được, hệ thống <b>fail-open</b> (coi như token chưa bị thu hồi)
 * để không làm sập toàn bộ API — đánh đổi có chủ đích cho môi trường demo, có ghi log cảnh báo.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TokenBlacklistService {

    static final String KEY_PREFIX = "jwt:blacklist:";

    StringRedisTemplate redisTemplate;

    /** Thu hồi token tới hết hạn của nó. Token đã hết hạn thì bỏ qua. */
    public void revoke(String token, Date expiresAt) {
        if (token == null || token.isBlank() || expiresAt == null) {
            return;
        }
        long ttlMs = expiresAt.getTime() - System.currentTimeMillis();
        if (ttlMs <= 0) {
            return;
        }
        try {
            redisTemplate.opsForValue().set(KEY_PREFIX + sha256(token), "1", Duration.ofMillis(ttlMs));
        } catch (Exception e) {
            log.warn("[TokenBlacklist] Cannot revoke token (Redis unavailable): {}", e.getMessage());
        }
    }

    public boolean isRevoked(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + sha256(token)));
        } catch (Exception e) {
            log.warn("[TokenBlacklist] Cannot check token (Redis unavailable): {}", e.getMessage());
            return false;
        }
    }

    static String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
