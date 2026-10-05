package com.carrental.user.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.service.FileStorageService;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.user.dto.VerificationResponse;
import com.carrental.user.entity.User;
import com.carrental.user.entity.UserDocument;
import com.carrental.user.entity.VerificationStatus;
import com.carrental.user.repository.UserDocumentRepository;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VerificationServiceImpl implements VerificationService {

    UserRepository userRepository;
    UserDocumentRepository documentRepository;
    FileStorageService fileStorageService;
    NotificationService notificationService;

    private static final List<String> ALLOWED_TYPES = List.of(
            "GPLX_FRONT", "GPLX_BACK", "CCCD_FRONT", "CCCD_BACK", "SELFIE"
    );

    private static final List<String> REQUIRED_TYPES = List.of(
            "GPLX_FRONT", "GPLX_BACK", "CCCD_FRONT", "CCCD_BACK", "SELFIE"
    );

    // ===== UPLOAD =====

    @Override
    @Transactional
    public VerificationResponse uploadDocuments(Long userId, MultipartFile[] files, String[] types) throws IOException {
        log.info("User {} uploading {} verification documents", userId, files.length);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài khoản đã được xác thực, không thể upload lại");
        }

        if (files.length != types.length) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Số lượng file và loại không khớp");
        }

        // Xóa ảnh cũ nếu có (để re-upload)
        List<UserDocument> oldDocs = documentRepository.findByUserId(userId);
        for (UserDocument old : oldDocs) {
            try {
                fileStorageService.deleteFile(old.getDocumentUrl());
            } catch (Exception e) {
                log.warn("Cannot delete old file: {}", e.getMessage());
            }
        }
        documentRepository.deleteByUserId(userId);

        // Upload ảnh mới
        for (int i = 0; i < files.length; i++) {
            String type = types[i];
            if (!ALLOWED_TYPES.contains(type)) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Loại giấy tờ không hợp lệ: " + type);
            }

            String url = fileStorageService.storeFile(files[i], "verification/" + userId);

            UserDocument doc = UserDocument.builder()
                    .userId(userId)
                    .documentType(type)
                    .documentUrl(url)
                    .build();
            documentRepository.save(doc);
        }

        log.info("User {} uploaded {} docs, status remains: {}", userId, files.length, user.getVerificationStatus());

        return buildResponse(user);
    }

    // ===== SUBMIT =====

    @Override
    @Transactional
    public VerificationResponse submitForReview(Long userId) {
        log.info("User {} submitting verification for review", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        List<UserDocument> docs = documentRepository.findByUserId(userId);

        // Validate đủ 5 loại ảnh
        List<String> uploadedTypes = docs.stream().map(UserDocument::getDocumentType).toList();
        List<String> missing = new ArrayList<>(REQUIRED_TYPES);
        missing.removeAll(uploadedTypes);

        if (!missing.isEmpty()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Thiếu giấy tờ: " + String.join(", ", missing));
        }

        user.setVerificationStatus(VerificationStatus.PENDING);
        user.setRejectionReason(null);
        userRepository.save(user);

        log.info("User {} verification status -> PENDING", userId);
        return buildResponse(user);
    }

    // ===== READ =====

    @Override
    public VerificationResponse getMyVerification(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        return buildResponse(user);
    }

    // ===== APPROVE =====

    @Override
    @Transactional
    public VerificationResponse approve(Long userId, Long adminId) {
        log.info("Admin {} approving user {}", adminId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Chỉ có thể duyệt hồ sơ đang ở trạng thái PENDING");
        }

        user.setVerificationStatus(VerificationStatus.VERIFIED);
        user.setRejectionReason(null);
        userRepository.save(user);

        try {
            notificationService.createNotification(
                    userId,
                    NotificationType.SYSTEM,
                    "Hồ sơ xác thực đã được duyệt",
                    "Tài khoản của bạn đã được xác thực. Bạn có thể thuê xe tự lái.",
                    userId
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        return buildResponse(user);
    }

    // ===== REJECT =====

    @Override
    @Transactional
    public VerificationResponse reject(Long userId, Long adminId, String reason) {
        log.info("Admin {} rejecting user {}, reason: {}", adminId, userId, reason);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Chỉ có thể từ chối hồ sơ đang ở trạng thái PENDING");
        }

        user.setVerificationStatus(VerificationStatus.REJECTED);
        user.setRejectionReason(reason);
        userRepository.save(user);

        try {
            notificationService.createNotification(
                    userId,
                    NotificationType.SYSTEM,
                    "Hồ sơ xác thực bị từ chối",
                    "Lý do: " + reason + ". Vui lòng upload lại giấy tờ đúng chuẩn.",
                    userId
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        return buildResponse(user);
    }

    // ===== HELPER =====

    private VerificationResponse buildResponse(User user) {
        List<UserDocument> docs = documentRepository.findByUserId(user.getId());

        List<VerificationResponse.DocumentInfo> docInfos = docs.stream()
                .map(d -> VerificationResponse.DocumentInfo.builder()
                        .id(d.getId())
                        .documentType(d.getDocumentType())
                        .documentUrl(d.getDocumentUrl())
                        .uploadedAt(d.getUploadedAt())
                        .build())
                .toList();

        return VerificationResponse.builder()
                .userId(user.getId())
                .userName(user.getName())
                .userPhone(user.getPhone())
                .status(user.getVerificationStatus())
                .rejectionReason(user.getRejectionReason())
                .documents(docInfos)
                .build();
    }
}