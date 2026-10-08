package com.carrental.admin.service;

import com.carrental.admin.dto.OwnerRequestDto;
import com.carrental.admin.dto.OwnerRequestResponse;
import com.carrental.admin.entity.OwnerRequest;
import com.carrental.admin.entity.OwnerRequestDocument;
import com.carrental.admin.repository.OwnerRequestDocumentRepository;
import com.carrental.admin.repository.OwnerRequestRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.service.FileStorageService;
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

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OwnerRegistrationServiceImpl implements OwnerRegistrationService {

    OwnerRequestRepository ownerRequestRepository;
    OwnerRequestDocumentRepository documentRepository;
    UserRepository userRepository;
    FileStorageService fileStorageService;
    NotificationService notificationService;

    private static final List<String> REQUIRED_TYPES = List.of(
            "CCCD_FRONT", "CCCD_BACK", "GPLX_FRONT", "GPLX_BACK", "SELFIE"
    );

    // ============================================================
    // 1. SUBMIT REQUEST
    // ============================================================

    @Override
    @Transactional
    public OwnerRequestResponse submitRequest(Long userId, OwnerRequestDto dto) {
        log.info("User {} submitting owner request", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() == Role.OWNER) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Bạn đã là chủ xe.");
        }

        boolean hasPending = ownerRequestRepository
                .existsByUserIdAndStatusAndDeletedAtIsNull(userId, "PENDING");
        if (hasPending) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Bạn đã có yêu cầu đang chờ duyệt. Vui lòng chờ Admin xử lý.");
        }

        List<OwnerRequest> oldRejected = ownerRequestRepository
                .findByUserIdAndStatusAndDeletedAtIsNull(userId, "REJECTED");

        for (OwnerRequest old : oldRejected) {
            documentRepository.deleteByRequestId(old.getId());
            ownerRequestRepository.delete(old);
            log.info("Deleted old REJECTED owner request: id={}, userId={}",
                    old.getId(), userId);
        }

        if (dto.getDateOfBirth() != null) {
            int age = LocalDateTime.now().getYear() - dto.getDateOfBirth().getYear();
            if (age < 18) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Bạn phải đủ 18 tuổi để đăng ký làm chủ xe.");
            }
        }

        OwnerRequest request = OwnerRequest.builder()
                .userId(userId)
                .fullName(dto.getFullName().trim())
                .dateOfBirth(dto.getDateOfBirth())
                .gender(dto.getGender())
                .address(dto.getAddress().trim())
                .cccd(dto.getCccd().trim())
                .cccdIssuedDate(dto.getCccdIssuedDate())
                .cccdIssuedPlace(dto.getCccdIssuedPlace().trim())
                .bankName(dto.getBankName().trim())
                .bankAccount(dto.getBankAccount().trim())
                .accountHolder(dto.getAccountHolder().trim().toUpperCase())
                .status("PENDING")
                .build();

        OwnerRequest saved = ownerRequestRepository.save(request);
        log.info("Owner request created: id={}, userId={}", saved.getId(), userId);

        // ★ Thông báo cho Admin
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.OWNER_REQUEST_SUBMITTED,
                        "Có yêu cầu đăng ký chủ xe mới",
                        String.format("%s vừa gửi yêu cầu đăng ký làm chủ xe. Vui lòng vào duyệt.",
                                user.getName()),
                        saved.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        return toResponse(saved);
    }

    // ============================================================
    // 2. UPLOAD DOCUMENTS
    // ============================================================

    @Override
    @Transactional
    public OwnerRequestResponse uploadDocuments(Long requestId, Long userId,
                                                  MultipartFile[] files, String[] types) throws IOException {
        log.info("User {} uploading {} docs for request {}", userId, files.length, requestId);

        OwnerRequest request = getEntityById(requestId);

        if (!request.getUserId().equals(userId)) {
            throw new BadRequestException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền upload cho yêu cầu này");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Chỉ có thể upload khi yêu cầu đang chờ duyệt");
        }

        if (files.length != types.length) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Số file và số loại không khớp");
        }

        List<OwnerRequestDocument> oldDocs = documentRepository.findByRequestId(requestId);
        for (OwnerRequestDocument old : oldDocs) {
            try {
                fileStorageService.deleteFile(old.getDocumentUrl());
            } catch (Exception e) {
                log.warn("Cannot delete old file: {}", e.getMessage());
            }
        }
        documentRepository.deleteByRequestId(requestId);

        for (int i = 0; i < files.length; i++) {
            String type = types[i];
            if (!REQUIRED_TYPES.contains(type)) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Loại giấy tờ không hợp lệ: " + type);
            }

            String url = fileStorageService.storeFile(files[i],
                    "owner-requests/" + requestId);

            OwnerRequestDocument doc = OwnerRequestDocument.builder()
                    .requestId(requestId)
                    .documentType(type)
                    .documentUrl(url)
                    .build();
            documentRepository.save(doc);
        }

        log.info("Uploaded {} docs for request {}", files.length, requestId);

        return toResponse(request);
    }

    // ============================================================
    // 3. READ
    // ============================================================

    @Override
    public OwnerRequestResponse getMyRequest(Long userId) {
        OwnerRequest request = ownerRequestRepository
                .findFirstByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .orElse(null);

        return request != null ? toResponse(request) : null;
    }

    @Override
    public List<OwnerRequestResponse> getAllRequests(String status) {
        List<OwnerRequest> requests = (status != null && !status.isBlank())
                ? ownerRequestRepository.findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(status)
                : ownerRequestRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();

        return requests.stream().map(this::toResponse).toList();
    }

    @Override
    public OwnerRequestResponse getRequestById(Long requestId) {
        return toResponse(getEntityById(requestId));
    }

    // ============================================================
    // 4. APPROVE
    // ============================================================

    @Override
    @Transactional
    public OwnerRequestResponse approveRequest(Long requestId, Long adminId) {
        log.info("Admin {} approving owner request {}", adminId, requestId);

        OwnerRequest request = getEntityById(requestId);

        if (!"PENDING".equals(request.getStatus())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Chỉ có thể duyệt yêu cầu đang chờ");
        }

        List<OwnerRequestDocument> docs = documentRepository.findByRequestId(requestId);
        List<String> uploadedTypes = docs.stream()
                .map(OwnerRequestDocument::getDocumentType).toList();

        if (!uploadedTypes.containsAll(REQUIRED_TYPES)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Yêu cầu chưa đủ 5 ảnh. Không thể duyệt.");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        user.setRole(Role.OWNER);
        userRepository.save(user);

        request.setStatus("APPROVED");
        request.setProcessedBy(adminId);
        request.setProcessedAt(LocalDateTime.now());
        request.setRejectionReason(null);

        OwnerRequest updated = ownerRequestRepository.save(request);

        // ★ Thông báo cho Customer
        try {
            notificationService.createNotification(
                    user.getId(),
                    NotificationType.OWNER_REQUEST_APPROVED,
                    "Đăng ký chủ xe đã được duyệt",
                    "Chúc mừng! Bạn đã trở thành chủ xe. Vui lòng đăng nhập lại để thấy menu mới.",
                    updated.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify user: {}", e.getMessage());
        }

        log.info("Owner request {} approved. User {} role → OWNER", requestId, user.getId());

        return toResponse(updated);
    }

    // ============================================================
    // 5. REJECT
    // ============================================================

    @Override
    @Transactional
    public OwnerRequestResponse rejectRequest(Long requestId, Long adminId, String reason) {
        log.info("Admin {} rejecting owner request {}", adminId, requestId);

        if (reason == null || reason.isBlank()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Vui lòng nhập lý do từ chối");
        }

        OwnerRequest request = getEntityById(requestId);

        if (!"PENDING".equals(request.getStatus())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Chỉ có thể từ chối yêu cầu đang chờ");
        }

        request.setStatus("REJECTED");
        request.setRejectionReason(reason.trim());
        request.setProcessedBy(adminId);
        request.setProcessedAt(LocalDateTime.now());

        OwnerRequest updated = ownerRequestRepository.save(request);

        // ★ Thông báo cho Customer
        try {
            notificationService.createNotification(
                    request.getUserId(),
                    NotificationType.OWNER_REQUEST_REJECTED,
                    "Đăng ký chủ xe bị từ chối",
                    String.format("Lý do: %s. Bạn có thể bổ sung và gửi lại yêu cầu.", reason),
                    updated.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify user: {}", e.getMessage());
        }

        return toResponse(updated);
    }

    @Override
    public long countPending() {
        return ownerRequestRepository.countByStatusAndDeletedAtIsNull("PENDING");
    }

    // ============================================================
    // HELPER
    // ============================================================

    private OwnerRequest getEntityById(Long id) {
        return ownerRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.VALIDATION_ERROR,
                        "Không tìm thấy yêu cầu"));
    }

    private OwnerRequestResponse toResponse(OwnerRequest request) {
        User user = userRepository.findById(request.getUserId()).orElse(null);

        List<OwnerRequestDocument> docs = documentRepository.findByRequestId(request.getId());
        List<OwnerRequestResponse.DocumentInfo> docInfos = docs.stream()
                .map(d -> OwnerRequestResponse.DocumentInfo.builder()
                        .id(d.getId())
                        .documentType(d.getDocumentType())
                        .documentUrl(d.getDocumentUrl())
                        .uploadedAt(d.getUploadedAt())
                        .build())
                .toList();

        return OwnerRequestResponse.builder()
                .id(request.getId())
                .userId(request.getUserId())
                .userName(user != null ? user.getName() : null)
                .userPhone(user != null ? user.getPhone() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .address(request.getAddress())
                .cccd(request.getCccd())
                .cccdIssuedDate(request.getCccdIssuedDate())
                .cccdIssuedPlace(request.getCccdIssuedPlace())
                .bankName(request.getBankName())
                .bankAccount(request.getBankAccount())
                .accountHolder(request.getAccountHolder())
                .status(request.getStatus())
                .rejectionReason(request.getRejectionReason())
                .processedBy(request.getProcessedBy())
                .processedAt(request.getProcessedAt())
                .documents(docInfos)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}