package com.carrental.dispute.service;

import com.carrental.admin.dto.DisputeMapper;
import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.entity.Dispute;
import com.carrental.admin.repository.DisputeRepository;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.service.FileStorageService;
import com.carrental.dispute.dto.DisputeRequest;
import com.carrental.dispute.dto.EvidenceRequest;
import com.carrental.dispute.dto.UploadResponse;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
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
    NotificationService notificationService;
    FileStorageService fileStorageService;
    UserRepository userRepository;

    // ===== CREATE =====

    @Override
    @Transactional
    public DisputeResponse createDispute(Long userId, DisputeRequest request) {
        log.info("Create dispute: userId={}, bookingId={}", userId, request.getBookingId());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        boolean isCustomer = booking.getCustomerId().equals(userId);
        boolean isOwner = booking.getOwnerId().equals(userId);
        if (!isCustomer && !isOwner) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền tạo tranh chấp cho đơn này");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID,
                    "Chỉ được tạo tranh chấp cho đơn đã hoàn thành");
        }

        Long againstUser = isCustomer ? booking.getOwnerId() : booking.getCustomerId();
        String disputeCode = "DSP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

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
                .lastSubmittedAt(LocalDateTime.now())
                .counterDeadlineAt(LocalDateTime.now().plusHours(48))
                .deadlineAt(LocalDateTime.now().plusHours(48))
                .build();

        Dispute saved = disputeRepository.save(dispute);
        log.info("Dispute created: id={}, code={}", saved.getId(), disputeCode);

        // ★ Thông báo cho bên bị kiện
        try {
            notificationService.createNotification(
                    againstUser,
                    NotificationType.DISPUTE_CREATED,
                    "Bạn có tranh chấp mới",
                    String.format("Bạn bị kiện trong tranh chấp %s. Vui lòng phản hồi trong vòng 48 giờ.",
                            disputeCode),
                    saved.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        // ★ Thông báo cho tất cả Admin
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.DISPUTE_CREATED,
                        "Tranh chấp mới",
                        String.format("Tranh chấp %s vừa được tạo cho đơn #%d. Vui lòng vào xử lý.",
                                disputeCode, booking.getId()),
                        saved.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        return disputeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public DisputeResponse createDisputeMultipart(
            Long userId,
            Long bookingId,
            Long againstUserId,
            String category,
            String description,
            java.math.BigDecimal claimedAmount,
            List<MultipartFile> evidenceFiles) {

        String evidenceJson = null;
        if (evidenceFiles != null && !evidenceFiles.isEmpty()) {
            List<java.util.Map<String, String>> evidenceList = new java.util.ArrayList<>();
            for (MultipartFile file : evidenceFiles) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = fileStorageService.storeFile(file, "disputes/" + userId);
                        java.util.Map<String, String> item = new java.util.LinkedHashMap<>();
                        item.put("url", url);
                        item.put("note", file.getOriginalFilename());
                        evidenceList.add(item);
                    } catch (Exception e) {
                        log.warn("Failed to save evidence file {}: {}", file.getOriginalFilename(), e.getMessage());
                    }
                }
            }
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                evidenceJson = mapper.writeValueAsString(evidenceList);
            } catch (Exception e) {
                log.warn("Failed to serialize evidence files: {}", e.getMessage());
            }
        }

        DisputeRequest request = DisputeRequest.builder()
                .bookingId(bookingId)
                .againstUserId(againstUserId)
                .category(category)
                .description(description)
                .evidence(evidenceJson)
                .claimedAmount(claimedAmount)
                .build();

        return createDispute(userId, request);
    }

    // ===== READ =====

    @Override
    public List<DisputeResponse> getMyDisputes(Long userId) {
        List<Dispute> disputes = disputeRepository.findByRaisedByOrderByCreatedAtDesc(userId);
        return disputeMapper.toResponseList(disputes);
    }

    @Override
    public org.springframework.data.domain.Page<DisputeResponse> getMyDisputesPaged(
            Long userId, String status, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Dispute> paged;
        if (status != null && !status.isBlank()) {
            paged = disputeRepository.findByRaisedByAndStatusOrderByCreatedAtDesc(userId, status, pageable);
        } else {
            paged = disputeRepository.findByRaisedByOrderByCreatedAtDesc(userId, pageable);
        }
        return paged.map(disputeMapper::toResponse);
    }

    @Override
    public List<DisputeResponse> getDisputesAgainstMe(Long userId) {
        List<Dispute> disputes = disputeRepository.findByAgainstUserOrderByCreatedAtDesc(userId);
        return disputeMapper.toResponseList(disputes);
    }

    @Override
    public DisputeResponse getMyDisputeById(Long id, Long userId) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DISPUTE_NOT_FOUND));

        User caller = userRepository.findById(userId).orElse(null);
        boolean isAdmin = caller != null && caller.getRole() == Role.ADMIN;

        if (!isAdmin && !dispute.getRaisedBy().equals(userId) && !dispute.getAgainstUser().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        return disputeMapper.toResponse(dispute);
    }

    // ===== SUBMIT EVIDENCE =====

    @Override
    @Transactional
    public DisputeResponse submitEvidence(Long disputeId, Long userId, EvidenceRequest request) {
        log.info("User {} submitting evidence for dispute {}", userId, disputeId);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!dispute.getRaisedBy().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Chỉ người tạo tranh chấp mới có thể bổ sung bằng chứng");
        }

        if (!"PENDING".equals(dispute.getStatus()) && !"WAITING_EVIDENCE".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Không thể bổ sung bằng chứng ở trạng thái này");
        }

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            dispute.setDescription(request.getDescription().trim());
        }

        if (request.getEvidence() != null && !request.getEvidence().isBlank()) {
            dispute.setEvidence(request.getEvidence());

            String historyEntry = String.format(
                    "{\"at\": \"%s\", \"by\": %d, \"note\": \"%s\", \"evidence\": %s}",
                    LocalDateTime.now(),
                    userId,
                    request.getUserNote() != null ? request.getUserNote().replace("\"", "'") : "",
                    request.getEvidence()
            );

            String currentHistory = dispute.getEvidenceHistory();
            if (currentHistory == null || currentHistory.isBlank()) {
                dispute.setEvidenceHistory("[" + historyEntry + "]");
            } else {
                String trimmed = currentHistory.trim();
                if (trimmed.endsWith("]")) {
                    dispute.setEvidenceHistory(
                            trimmed.substring(0, trimmed.length() - 1) + "," + historyEntry + "]"
                    );
                }
            }
        }

        dispute.setStatus("PENDING");
        dispute.setAdminRequest(null);
        dispute.setLastSubmittedAt(LocalDateTime.now());

        Dispute updated = disputeRepository.save(dispute);

        log.info("Evidence submitted for dispute {}, status reset to PENDING", disputeId);
        return disputeMapper.toResponse(updated);
    }

    // ===== UPLOAD (Word, PDF, ảnh) =====

    @Override
    public UploadResponse uploadEvidence(MultipartFile file, Long userId) throws IOException {
        log.info("User {} uploading evidence file: {}", userId, file.getOriginalFilename());

        if (file.isEmpty()) {
            throw new BadRequestException(ErrorCode.FILE_EMPTY);
        }

        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase()
                : "";

        boolean isImage = contentType != null && contentType.startsWith("image/");
        boolean isPdf = "application/pdf".equals(contentType) || ".pdf".equals(ext);
        boolean isWord = ".doc".equals(ext) || ".docx".equals(ext);

        if (!isImage && !isPdf && !isWord) {
            throw new BadRequestException(ErrorCode.FILE_INVALID_FORMAT,
                    "Chỉ chấp nhận file ảnh, PDF hoặc Word (.doc, .docx)");
        }

        long maxSize = (isPdf || isWord) ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new BadRequestException(ErrorCode.FILE_TOO_LARGE,
                    (isPdf || isWord) ? "File không được vượt quá 20MB" : "Ảnh không được vượt quá 5MB");
        }

        String subDir = "disputes/" + userId;
        String url = fileStorageService.storeFile(file, subDir);

        return UploadResponse.builder()
                .url(url)
                .filename(originalName)
                .size(file.getSize())
                .contentType(contentType)
                .build();
    }
}