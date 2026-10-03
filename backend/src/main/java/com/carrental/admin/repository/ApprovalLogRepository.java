package com.carrental.admin.repository;

import com.carrental.admin.entity.ApprovalLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalLogRepository extends JpaRepository<ApprovalLog, Long> {

    List<ApprovalLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);

    List<ApprovalLog> findByApprovedByOrderByCreatedAtDesc(Long approvedBy);
}