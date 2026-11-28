package com.carrental.common.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistServiceTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @InjectMocks TokenBlacklistService service;

    @Test
    @DisplayName("Đăng xuất: lưu hash của token với TTL = thời gian sống còn lại")
    void revokeStoresHashWithRemainingTtl() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        Date exp = new Date(System.currentTimeMillis() + 30 * 60 * 1000);

        service.revoke("access.jwt.token", exp);

        String key = TokenBlacklistService.KEY_PREFIX + TokenBlacklistService.sha256("access.jwt.token");
        verify(valueOps).set(eq(key), eq("1"), argThat((Duration d) ->
                d.toMinutes() >= 29 && d.toMinutes() <= 30));
    }

    @Test
    @DisplayName("Token đã hết hạn thì không cần lưu vào blacklist")
    void expiredTokenIsNotStored() {
        service.revoke("old.token", new Date(System.currentTimeMillis() - 1000));
        verify(redisTemplate, never()).opsForValue();
    }

    @Test
    @DisplayName("Token nằm trong blacklist bị coi là đã thu hồi")
    void revokedTokenDetected() {
        when(redisTemplate.hasKey(TokenBlacklistService.KEY_PREFIX + TokenBlacklistService.sha256("t1"))).thenReturn(true);
        assertTrue(service.isRevoked("t1"));
    }

    @Test
    @DisplayName("Redis mất kết nối: fail-open, không chặn request")
    void redisDownFailsOpen() {
        when(redisTemplate.hasKey(anyString())).thenThrow(new RedisConnectionFailureException("down"));
        assertFalse(service.isRevoked("t1"));

        when(redisTemplate.opsForValue()).thenThrow(new RedisConnectionFailureException("down"));
        service.revoke("t1", new Date(System.currentTimeMillis() + 60_000)); // không ném lỗi
        verify(valueOps, never()).set(anyString(), anyString(), any(Duration.class));
    }
}
