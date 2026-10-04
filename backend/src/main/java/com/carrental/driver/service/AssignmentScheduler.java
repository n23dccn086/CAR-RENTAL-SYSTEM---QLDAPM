package com.carrental.driver.service;

import com.carrental.driver.entity.AssignmentStatus;
import com.carrental.driver.entity.DriverAssignment;
import com.carrental.driver.repository.DriverAssignmentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler kiểm tra assignment hết hạn mỗi phút.
 * Nếu tài xế không phản hồi trong 5 phút → đánh dấu EXPIRED và gán tài xế tiếp theo.
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AssignmentScheduler {

    DriverAssignmentRepository assignmentRepository;
    DriverAssignmentService assignmentService;

    @Scheduled(fixedDelay = 60_000)  // Chạy mỗi phút
    public void checkExpiredAssignments() {
        List<DriverAssignment> expired = assignmentRepository
                .findByStatusAndDeadlineAtBefore(AssignmentStatus.PENDING, LocalDateTime.now());

        if (expired.isEmpty()) {
            return;
        }

        log.info("Found {} expired assignments", expired.size());

        for (DriverAssignment assignment : expired) {
            try {
                assignmentService.expireAssignment(assignment.getId());
            } catch (Exception e) {
                log.error("Failed to expire assignment {}", assignment.getId(), e);
            }
        }
    }
}