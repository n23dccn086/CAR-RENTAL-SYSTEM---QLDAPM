package com.carrental.dispute.service;

import com.carrental.admin.dto.DisputeMapper;
import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.entity.Dispute;
import com.carrental.admin.repository.DisputeRepository;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.dispute.dto.DisputeRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DisputeServiceImpl implements DisputeService {

    DisputeRepository disputeRepository;
    BookingRepository bookingRepository;
    DisputeMapper disputeMapper;

    @Override
    @Transactional
    public DisputeResponse createDispute(Long userId, DisputeRequest request) {
        log.info("Create dispute: userId={}, bookingId={}", userId, request.getBookingId());

        // 1. Check booking tồn tại
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        // 2. Check user có liên quan đến booking (customer hoặc owner)
        boolean isCustomer = booking.getCustomerId().equals(userId);
        boolean isOwner = booking.getOwnerId().equals(userId);
        if (!isCustomer && !isOwner) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền tạo tranh chấp cho đơn này");
        }

        // 3. Xác định bên bị tranh chấp
        Long againstUser = isCustomer ? booking.getOwnerId() : booking.getCustomerId();

        // 4. Tạo mã tranh chấp
        String disputeCode = "DSP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 5. Tạo Dispute
        Dispute dispute = Dispute.builder()
                .disputeCode(disputeCode)
                .bookingId(request.getBookingId())
                .raisedBy(userId)
                .againstUser(againstUser)
                .category(request.getCategory())
                .description(request.getDescription())
                .evidence(request.getEvidence())
                .claimedAmount(request.getClaimedAmount())
                .status("PENDING")
                .build();

        Dispute saved = disputeRepository.save(dispute);
        log.info("Dispute created: id={}, code={}", saved.getId(), disputeCode);

        return disputeMapper.toResponse(saved);
    }

    @Override
    public List<DisputeResponse> getMyDisputes(Long userId) {
        List<Dispute> disputes = disputeRepository.findByRaisedByOrderByCreatedAtDesc(userId);
        return disputeMapper.toResponseList(disputes);
    }

    @Override
    public DisputeResponse getMyDisputeById(Long id, Long userId) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DISPUTE_NOT_FOUND));

        // Check user là người tạo hoặc bị tranh chấp
        if (!dispute.getRaisedBy().equals(userId) && !dispute.getAgainstUser().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        return disputeMapper.toResponse(dispute);
    }
}