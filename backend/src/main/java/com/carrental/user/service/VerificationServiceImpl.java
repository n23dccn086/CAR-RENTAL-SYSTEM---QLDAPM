package com.carrental.user.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.service.FileStorageService;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.user.dto.SubmitVerificationRequest;
import com.carrental.user.dto.VerificationResponse;
import com.carrental.user.entity.Role;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    // ============================================================
    // CONTRACT 2.2: UPLOAD GPLX
    // ============================================================

    @Override
    @Transactional
    public Map<String, Object> uploadGplx(Long userId, MultipartFile gplxFront, MultipartFile gplxBack,
                                          String gplxNumber, String gplxClass) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài khoản đã được xác thực, không thể upload lại");
        }

        if (gplxFront == null || gplxFront.isEmpty() || gplxBack == null || gplxBack.isEmpty()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Vui lòng cung cấp cả ảnh mặt trước và mặt sau GPLX");
        }

        // Delete old GPLX docs
        List<UserDocument> oldDocs = documentRepository.findByUserId(userId).stream()
                .filter(d -> "GPLX_FRONT".equalsIgnoreCase(d.getDocumentType())
                        || "GPLX_BACK".equalsIgnoreCase(d.getDocumentType()))
                .toList();
        for (UserDocument old : oldDocs) {
            try {
                fileStorageService.deleteFile(old.getDocumentUrl());
            } catch (Exception e) {
                log.warn("Cannot delete old file: {}", e.getMessage());
            }
            documentRepository.delete(old);
        }

        String frontUrl = fileStorageService.storeFile(gplxFront, "verification/" + userId);
        String backUrl = fileStorageService.storeFile(gplxBack, "verification/" + userId);

        UserDocument docFront = documentRepository.save(UserDocument.builder()
                .userId(userId)
                .documentType("GPLX_FRONT")
                .documentUrl(frontUrl)
                .build());

        UserDocument docBack = documentRepository.save(UserDocument.builder()
                .userId(userId)
                .documentType("GPLX_BACK")
                .documentUrl(backUrl)
                .build());

        Map<String, Object> frontMap = new LinkedHashMap<>();
        frontMap.put("id", docFront.getId());
        frontMap.put("doc_type", "gplx_front");
        frontMap.put("document_type", "GPLX_FRONT");
        frontMap.put("file_url", frontUrl);
        frontMap.put("document_url", frontUrl);

        Map<String, Object> backMap = new LinkedHashMap<>();
        backMap.put("id", docBack.getId());
        backMap.put("doc_type", "gplx_back");
        backMap.put("document_type", "GPLX_BACK");
        backMap.put("file_url", backUrl);
        backMap.put("document_url", backUrl);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("documents", List.of(frontMap, backMap));
        return result;
    }

    // ============================================================
    // CONTRACT 2.3: UPLOAD CCCD
    // ============================================================

    @Override
    @Transactional
    public Map<String, Object> uploadCccd(Long userId, MultipartFile cccdFront, MultipartFile cccdBack,
                                          String cccdNumber) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài khoản đã được xác thực, không thể upload lại");
        }

        if (cccdFront == null || cccdFront.isEmpty() || cccdBack == null || cccdBack.isEmpty()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Vui lòng cung cấp cả ảnh mặt trước và mặt sau CCCD");
        }

        // Delete old CCCD docs
        List<UserDocument> oldDocs = documentRepository.findByUserId(userId).stream()
                .filter(d -> "CCCD_FRONT".equalsIgnoreCase(d.getDocumentType())
                        || "CCCD_BACK".equalsIgnoreCase(d.getDocumentType()))
                .toList();
        for (UserDocument old : oldDocs) {
            try {
                fileStorageService.deleteFile(old.getDocumentUrl());
            } catch (Exception e) {
                log.warn("Cannot delete old file: {}", e.getMessage());
            }
            documentRepository.delete(old);
        }

        String frontUrl = fileStorageService.storeFile(cccdFront, "verification/" + userId);
        String backUrl = fileStorageService.storeFile(cccdBack, "verification/" + userId);

        UserDocument docFront = documentRepository.save(UserDocument.builder()
                .userId(userId)
                .documentType("CCCD_FRONT")
                .documentUrl(frontUrl)
                .build());

        UserDocument docBack = documentRepository.save(UserDocument.builder()
                .userId(userId)
                .documentType("CCCD_BACK")
                .documentUrl(backUrl)
                .build());

        Map<String, Object> frontMap = new LinkedHashMap<>();
        frontMap.put("id", docFront.getId());
        frontMap.put("doc_type", "cccd_front");
        frontMap.put("document_type", "CCCD_FRONT");
        frontMap.put("file_url", frontUrl);
        frontMap.put("document_url", frontUrl);

        Map<String, Object> backMap = new LinkedHashMap<>();
        backMap.put("id", docBack.getId());
        backMap.put("doc_type", "cccd_back");
        backMap.put("document_type", "CCCD_BACK");
        backMap.put("file_url", backUrl);
        backMap.put("document_url", backUrl);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("documents", List.of(frontMap, backMap));
        return result;
    }

    // ============================================================
    // CONTRACT 2.4: UPLOAD SELFIE
    // ============================================================

    @Override
    @Transactional
    public Map<String, Object> uploadSelfie(Long userId, MultipartFile selfie) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài khoản đã được xác thực, không thể upload lại");
        }

        if (selfie == null || selfie.isEmpty()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Vui lòng cung cấp ảnh selfie");
        }

        // Delete old selfie doc
        List<UserDocument> oldDocs = documentRepository.findByUserId(userId).stream()
                .filter(d -> "SELFIE".equalsIgnoreCase(d.getDocumentType()))
                .toList();
        for (UserDocument old : oldDocs) {
            try {
                fileStorageService.deleteFile(old.getDocumentUrl());
            } catch (Exception e) {
                log.warn("Cannot delete old file: {}", e.getMessage());
            }
            documentRepository.delete(old);
        }

        String selfieUrl = fileStorageService.storeFile(selfie, "verification/" + userId);

        UserDocument doc = documentRepository.save(UserDocument.builder()
                .userId(userId)
                .documentType("SELFIE")
                .documentUrl(selfieUrl)
                .build());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", doc.getId());
        result.put("doc_type", "selfie");
        result.put("document_type", "SELFIE");
        result.put("file_url", selfieUrl);
        result.put("document_url", selfieUrl);
        return result;
    }

    // ============================================================
    // CONTRACT 2.5: SUBMIT VERIFICATION
    // ============================================================

    @Override
    @Transactional
    public Map<String, Object> submitVerification(Long userId, SubmitVerificationRequest request) {
        log.info("User {} submitting verification", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài khoản đã được xác thực trước đó");
        }

        List<UserDocument> docs = documentRepository.findByUserId(userId);

        // Security check: if specific document IDs are passed, ensure they belong to this user
        if (request != null) {
            if (request.getGplxDocIds() != null) {
                for (Long docId : request.getGplxDocIds()) {
                    boolean exists = docs.stream().anyMatch(d -> d.getId().equals(docId));
                    if (!exists) {
                        throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                                "Tài liệu GPLX id " + docId + " không hợp lệ hoặc không thuộc về người dùng");
                    }
                }
            }
            if (request.getCccdDocIds() != null) {
                for (Long docId : request.getCccdDocIds()) {
                    boolean exists = docs.stream().anyMatch(d -> d.getId().equals(docId));
                    if (!exists) {
                        throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                                "Tài liệu CCCD id " + docId + " không hợp lệ hoặc không thuộc về người dùng");
                    }
                }
            }
            if (request.getSelfieDocId() != null) {
                boolean exists = docs.stream().anyMatch(d -> d.getId().equals(request.getSelfieDocId()));
                if (!exists) {
                    throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                            "Tài liệu selfie id " + request.getSelfieDocId() + " không hợp lệ hoặc không thuộc về người dùng");
                }
            }
        }

        // Validate that user has uploaded all required 5 documents
        List<String> uploadedTypes = docs.stream().map(d -> d.getDocumentType().toUpperCase()).toList();
        List<String> missing = new ArrayList<>(REQUIRED_TYPES);
        missing.removeAll(uploadedTypes);

        if (!missing.isEmpty()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Thiếu giấy tờ: " + String.join(", ", missing));
        }

        user.setVerificationStatus(VerificationStatus.PENDING);
        user.setRejectionReason(null);
        userRepository.save(user);

        // Notify admins
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.VERIFICATION_SUBMITTED,
                        "Hồ sơ xác thực mới",
                        String.format("User %s (%s) vừa gửi hồ sơ xác thực. Vui lòng vào duyệt.",
                                user.getName(), user.getPhone()),
                        userId
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("verification_status", "pending");
        data.put("verificationStatus", "PENDING");
        return data;
    }

    // ============================================================
    // LEGACY / FRONTEND: UPLOAD 5 FILES
    // ============================================================

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

        List<UserDocument> oldDocs = documentRepository.findByUserId(userId);
        for (UserDocument old : oldDocs) {
            try {
                fileStorageService.deleteFile(old.getDocumentUrl());
            } catch (Exception e) {
                log.warn("Cannot delete old file: {}", e.getMessage());
            }
        }
        documentRepository.deleteByUserId(userId);

        for (int i = 0; i < files.length; i++) {
            String type = types[i].toUpperCase();
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

    @Override
    @Transactional
    public VerificationResponse submitForReview(Long userId) {
        submitVerification(userId, null);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        return buildResponse(user);
    }

    // ============================================================
    // READ / APPROVE / REJECT
    // ============================================================

    @Override
    public VerificationResponse getMyVerification(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        return buildResponse(user);
    }

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
                    NotificationType.VERIFICATION_APPROVED,
                    "Hồ sơ xác thực đã được duyệt",
                    "Tài khoản của bạn đã được xác thực. Bạn có thể thuê xe tự lái.",
                    userId
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        return buildResponse(user);
    }

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
                    NotificationType.VERIFICATION_REJECTED,
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