package com.carrental.driver.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.service.FileStorageService;
import com.carrental.driver.dto.DriverMapper;
import com.carrental.driver.dto.DriverRequest;
import com.carrental.driver.dto.DriverResponse;
import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.repository.DriverAssignmentRepository;
import com.carrental.driver.repository.DriverRepository;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DriverServiceImpl implements DriverService {

    DriverRepository driverRepository;
    DriverMapper driverMapper;
    NotificationService notificationService;
    UserRepository userRepository;
    DriverAssignmentRepository driverAssignmentRepository;
    FileStorageService fileStorageService;

    static final Set<DriverStatus> LOCKED_FOR_EDIT = Set.of(
            DriverStatus.PENDING,
            DriverStatus.BUSY);

    // ===== CREATE =====

    @Override
    @Transactional
    public DriverResponse createDriver(Long ownerId, DriverRequest request) {
        log.info("Create driver for owner: {}, phone: {}", ownerId, request.getPhone());

        if (driverRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.PHONE_EXISTED,
                    "Số điện thoại tài xế đã tồn tại");
        }

        Driver driver = driverMapper.toEntity(request);
        driver.setOwnerId(ownerId);
        driver.setStatus(DriverStatus.PENDING);

        Driver saved = driverRepository.save(driver);
        log.info("Driver created with id: {}", saved.getId());

        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.DRIVER_PENDING,
                        "Tài xế mới chờ duyệt",
                        String.format("Tài xế %s (%s) vừa được thêm. Vui lòng vào duyệt.",
                                saved.getName(), saved.getPhone()),
                        saved.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        return driverMapper.toResponse(saved);
    }

    // ===== READ =====

    @Override
    public List<DriverResponse> getMyDrivers(Long ownerId) {
        List<Driver> drivers = driverRepository.findByOwnerIdAndDeletedAtIsNull(ownerId);
        return driverMapper.toResponseList(drivers);
    }

    @Override
    public List<DriverResponse> getMyDriversByStatus(Long ownerId, DriverStatus status) {
        List<Driver> drivers = driverRepository
                .findByOwnerIdAndStatusAndDeletedAtIsNull(ownerId, status);
        return driverMapper.toResponseList(drivers);
    }

    @Override
    public DriverResponse getDriverById(Long id) {
        Driver driver = getEntityById(id);
        DriverResponse response = driverMapper.toResponse(driver);
        
        // ★ MỚI: Enrich owner info cho Admin xem chi tiết
        if (driver.getOwnerId() != null) {
            userRepository.findById(driver.getOwnerId()).ifPresent(owner -> {
                response.setOwnerName(owner.getName());
                response.setOwnerPhone(owner.getPhone());
                response.setOwnerAvatarUrl(owner.getAvatarUrl());
            });
        }
        
        return response;
    }

    @Override
    public List<DriverResponse> getAvailableDrivers() {
        List<Driver> drivers = driverRepository
                .findByStatusAndDeletedAtIsNull(DriverStatus.ACTIVE);
        return driverMapper.toResponseList(drivers);
    }

    // ===== SEARCH + PHÂN TRANG =====

    @Override
    @Transactional(readOnly = true)
    public Page<DriverResponse> searchOwnerDrivers(
            Long ownerId,
            String status,
            String search,
            Pageable pageable) {

        String statusParam = (status != null && !status.isBlank()) ? status.trim() : null;
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;

        log.info("Search owner drivers: ownerId={}, status={}, search={}",
                ownerId, statusParam, searchParam);

        return driverRepository.searchOwnerDrivers(ownerId, statusParam, searchParam, pageable)
                .map(driverMapper::toResponse);
    }

    // ===== UPDATE =====

    @Override
    @Transactional
    public DriverResponse updateDriver(Long id, Long ownerId, DriverRequest request) {
        log.info("Update driver id: {} by owner: {}", id, ownerId);

        Driver driver = getEntityById(id);

        if (!driver.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không sở hữu tài xế này");
        }

        if (LOCKED_FOR_EDIT.contains(driver.getStatus())) {
            String reason = switch (driver.getStatus()) {
                case PENDING -> "Tài xế đang chờ Admin duyệt, không thể sửa";
                case BUSY -> "Tài xế đang chạy chuyến, không thể sửa";
                default -> "Không thể sửa tài xế ở trạng thái này";
            };
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, reason);
        }

        if (!driver.getPhone().equals(request.getPhone())
                && driverRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.PHONE_EXISTED,
                    "Số điện thoại tài xế đã tồn tại");
        }

        driver.setName(request.getName());
        driver.setPhone(request.getPhone());
        driver.setEmail(request.getEmail());
        driver.setCccd(request.getCccd());
        driver.setLicenseNumber(request.getLicenseNumber());
        driver.setLicenseClass(request.getLicenseClass());
        driver.setLicenseExpiry(request.getLicenseExpiry());
        driver.setDateOfBirth(request.getDateOfBirth());
        driver.setAddress(request.getAddress());
        driver.setExperienceYears(request.getExperienceYears());
        driver.setAvatarUrl(request.getAvatarUrl());

        // Xóa lý do từ chối khi Owner sửa
        driver.setRejectionReason(null);

        // Reset về PENDING — Admin duyệt lại
        if (driver.getStatus() != DriverStatus.PENDING) {
            DriverStatus oldStatus = driver.getStatus();
            log.info("Driver {} status reset: {} → PENDING (do Owner sửa thông tin)",
                    id, oldStatus);
            driver.setStatus(DriverStatus.PENDING);

            try {
                List<User> admins = userRepository.findByRole(Role.ADMIN);
                for (User admin : admins) {
                    notificationService.createNotification(
                            admin.getId(),
                            NotificationType.DRIVER_RESUBMITTED,
                            "Tài xế cần duyệt lại",
                            String.format("Tài xế %s (%s) đã được Owner cập nhật thông tin. Vui lòng duyệt lại.",
                                    driver.getName(), driver.getPhone()),
                            driver.getId());
                }
            } catch (Exception e) {
                log.warn("Failed to notify admins: {}", e.getMessage());
            }
        }

        Driver updated = driverRepository.save(driver);
        log.info("Driver updated id: {}", id);

        return driverMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public DriverResponse updateDriverStatus(Long id, Long ownerId, String newStatus) {
        log.info("Owner {} update driver {} status to {}", ownerId, id, newStatus);

        Driver driver = getEntityById(id);

        if (!driver.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không sở hữu tài xế này");
        }

        DriverStatus target;
        try {
            target = DriverStatus.valueOf(newStatus.toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Trạng thái không hợp lệ: " + newStatus);
        }

        if (target != DriverStatus.ACTIVE && target != DriverStatus.INACTIVE) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Bạn chỉ có thể khóa/mở khóa tài xế");
        }

        if (driver.getStatus() == DriverStatus.BUSY) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài xế đang chạy chuyến, không thể khóa");
        }
        if (driver.getStatus() == DriverStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài xế đang chờ Admin duyệt, không thể đổi trạng thái");
        }
        if (driver.getStatus() == DriverStatus.REJECTED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài xế đã bị Admin từ chối, không thể đổi trạng thái");
        }

        DriverStatus oldStatus = driver.getStatus();
        driver.setStatus(target);
        Driver updated = driverRepository.save(driver);

        log.info("Driver {} status: {} → {}", id, oldStatus, target);
        return driverMapper.toResponse(updated);
    }

    // ===== DELETE (HARD DELETE) =====

    @Override
    @Transactional
    public void deleteDriver(Long id, Long ownerId) {
        log.info("Delete driver id: {} by owner: {}", id, ownerId);

        Driver driver = getEntityById(id);

        if (!driver.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không sở hữu tài xế này");
        }

        if (driver.getStatus() == DriverStatus.BUSY) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Tài xế đang chạy chuyến, không thể xóa");
        }

        long assignmentCount = driverAssignmentRepository.countByDriverId(id);
        if (assignmentCount > 0) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Không thể xóa tài xế vì đã có " + assignmentCount +
                    " chuyến được phân công. Vui lòng chuyển sang Tạm nghỉ (INACTIVE).");
        }

        if (driver.getAvatarUrl() != null && !driver.getAvatarUrl().isBlank()) {
            try {
                fileStorageService.deleteFile(driver.getAvatarUrl());
            } catch (Exception e) {
                log.warn("Cannot delete avatar file: {}", e.getMessage());
            }
        }

        try {
            driverRepository.delete(driver);
            log.info("Driver HARD DELETED id: {}", id);
        } catch (DataIntegrityViolationException e) {
            log.error("Cannot hard delete driver {}: {}", id, e.getMessage());
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Không thể xóa tài xế vì còn dữ liệu liên quan");
        }
    }

    // ===== ADMIN =====

    @Override
    @Transactional
    public DriverResponse approveDriver(Long id) {
        log.info("Approve driver id: {}", id);

        Driver driver = getEntityById(id);
        driver.setStatus(DriverStatus.ACTIVE);
        driver.setRejectionReason(null);
        Driver updated = driverRepository.save(driver);

        try {
            notificationService.createNotification(
                    driver.getOwnerId(),
                    NotificationType.DRIVER_APPROVED,
                    "Tài xế đã được duyệt",
                    String.format("Tài xế %s (%s) đã được Admin duyệt.",
                            driver.getName(), driver.getPhone()),
                    driver.getId());
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        return driverMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public DriverResponse rejectDriver(Long id, String reason) {
        log.info("Reject driver id: {}, reason: {}", id, reason);

        Driver driver = getEntityById(id);
        driver.setStatus(DriverStatus.REJECTED);
        driver.setRejectionReason(reason != null && !reason.isBlank()
                ? reason
                : "Không có lý do");
        Driver updated = driverRepository.save(driver);

        try {
            notificationService.createNotification(
                    driver.getOwnerId(),
                    NotificationType.DRIVER_REJECTED,
                    "Tài xế bị từ chối",
                    String.format("Tài xế %s (%s) bị Admin từ chối. Lý do: %s. " +
                                    "Vui lòng sửa thông tin và gửi duyệt lại.",
                            driver.getName(), driver.getPhone(),
                            reason != null ? reason : "Không có lý do"),
                    driver.getId());
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        return driverMapper.toResponse(updated);
    }

    @Override
    public List<DriverResponse> getAllDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        return drivers.stream()
                .filter(d -> d.getDeletedAt() == null)
                .map(driverMapper::toResponse)
                .toList();
    }

    @Override
    public List<DriverResponse> getDriversByStatus(DriverStatus status) {
        List<Driver> drivers = driverRepository.findByStatus(status);
        return drivers.stream()
                .filter(d -> d.getDeletedAt() == null)
                .map(driverMapper::toResponse)
                .toList();
    }

    @Override
    public long countPendingDrivers() {
        return driverRepository.countByStatusAndDeletedAtIsNull(DriverStatus.PENDING);
    }

    // ============================================================
    // Pagination cho ADMIN
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public Page<DriverResponse> getAllDriversPaged(Pageable pageable) {
        log.info("Admin: Get all drivers paged: {}", pageable);
        return driverRepository.findByDeletedAtIsNull(pageable)
                .map(this::enrichWithOwner);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DriverResponse> getDriversByStatusPaged(DriverStatus status, Pageable pageable) {
        log.info("Admin: Get drivers by status paged: {}, {}", status, pageable);
        return driverRepository.findByStatusAndDeletedAtIsNull(status, pageable)
                .map(this::enrichWithOwner);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(DriverStatus status) {
        return driverRepository.countByStatusAndDeletedAtIsNull(status);
    }

    // ===== HELPER =====

    private Driver getEntityById(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DRIVER_NOT_FOUND));
    }

    // ★ MỚI: Enrich owner info cho DriverResponse (dùng cho Admin)
    private DriverResponse enrichWithOwner(Driver driver) {
        DriverResponse response = driverMapper.toResponse(driver);
        
        if (driver.getOwnerId() != null) {
            userRepository.findById(driver.getOwnerId()).ifPresent(owner -> {
                response.setOwnerName(owner.getName());
                response.setOwnerPhone(owner.getPhone());
                response.setOwnerAvatarUrl(owner.getAvatarUrl());
            });
        }
        
        return response;
    }
}