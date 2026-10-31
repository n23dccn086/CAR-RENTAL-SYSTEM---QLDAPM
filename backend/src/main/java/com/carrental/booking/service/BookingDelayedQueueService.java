package com.carrental.booking.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service quản lý hàng đợi hủy đơn quá hạn bằng Redis Sorted Set (ZSET).
 * Dữ liệu được Redis lưu trên đĩa (AOF/RDB). Khi server backend bị sập/khởi động lại,
 * các job chưa được xử lý vẫn được giữ nguyên và sẽ được quét, xử lý tiếp tục.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingDelayedQueueService {

    StringRedisTemplate redisTemplate;

    public static final String QUEUE_KEY = "booking:delayed_cancellation_queue";

    /**
     * Đưa đơn vào hàng đợi hủy sau thời hạn deadline (mặc định 4 tiếng sau khi cọc).
     * Score là epoch millisecond của thời điểm hết hạn.
     */
    public void scheduleCancellation(Long bookingId, LocalDateTime deadline) {
        if (bookingId == null || deadline == null) return;
        try {
            long score = deadline.toInstant(ZoneOffset.UTC).toEpochMilli();
            redisTemplate.opsForZSet().add(QUEUE_KEY, bookingId.toString(), score);
            log.info("[RedisQueue] Scheduled auto-cancellation for booking #{} at {} (score: {})",
                    bookingId, deadline, score);
        } catch (Exception e) {
            log.error("[RedisQueue] Failed to schedule cancellation in Redis for booking #{}: {}",
                    bookingId, e.getMessage());
        }
    }

    /**
     * Hủy job khỏi Redis khi đơn đã được chủ xe duyệt hoặc bị từ chối/hủy thủ công.
     */
    public void removeScheduledCancellation(Long bookingId) {
        if (bookingId == null) return;
        try {
            redisTemplate.opsForZSet().remove(QUEUE_KEY, bookingId.toString());
            log.info("[RedisQueue] Removed booking #{} from delayed cancellation queue", bookingId);
        } catch (Exception e) {
            log.warn("[RedisQueue] Failed to remove booking #{} from Redis queue: {}",
                    bookingId, e.getMessage());
        }
    }

    /**
     * Lấy danh sách bookingId đã quá hạn (score <= now) từ Redis.
     */
    public Set<Long> getExpiredBookingIds() {
        try {
            long now = System.currentTimeMillis();
            Set<String> members = redisTemplate.opsForZSet().rangeByScore(QUEUE_KEY, 0, now);
            if (members == null || members.isEmpty()) {
                return Collections.emptySet();
            }
            return members.stream()
                    .map(Long::parseLong)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.warn("[RedisQueue] Failed to query expired bookings from Redis: {}", e.getMessage());
            return Collections.emptySet();
        }
    }

    /**
     * Kiểm tra một booking có đang nằm trong hàng đợi Redis không.
     */
    public boolean isInQueue(Long bookingId) {
        if (bookingId == null) return false;
        try {
            Double score = redisTemplate.opsForZSet().score(QUEUE_KEY, bookingId.toString());
            return score != null;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy số lượng job hiện có trong hàng đợi Redis.
     */
    public long getQueueSize() {
        try {
            Long size = redisTemplate.opsForZSet().zCard(QUEUE_KEY);
            return size != null ? size : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }
}

