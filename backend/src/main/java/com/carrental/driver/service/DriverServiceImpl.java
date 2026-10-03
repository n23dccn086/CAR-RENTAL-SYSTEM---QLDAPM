package com.carrental.driver.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.driver.dto.DriverMapper;
import com.carrental.driver.dto.DriverRequest;
import com.carrental.driver.dto.DriverResponse;
import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.repository.DriverRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DriverServiceImpl implements DriverService {

    DriverRepository driverRepository;
    DriverMapper driverMapper;

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
        return driverMapper.toResponse(driver);
    }

    @Override
    public List<DriverResponse> getAvailableDrivers() {
        List<Driver> drivers = driverRepository
                .findByStatusAndDeletedAtIsNull(DriverStatus.ACTIVE);   // ← SỬA
        return driverMapper.toResponseList(drivers);
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

        Driver updated = driverRepository.save(driver);
        log.info("Driver updated id: {}", id);

        return driverMapper.toResponse(updated);
    }

    // ===== DELETE (soft) =====

    @Override
    @Transactional
    public void deleteDriver(Long id, Long ownerId) {
        log.info("Delete driver id: {} by owner: {}", id, ownerId);

        Driver driver = getEntityById(id);

        if (!driver.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không sở hữu tài xế này");
        }

        driver.setDeletedAt(LocalDateTime.now());
        driverRepository.save(driver);

        log.info("Driver soft deleted id: {}", id);
    }

    // ===== ADMIN =====

    @Override
    @Transactional
    public DriverResponse approveDriver(Long id) {
        log.info("Approve driver id: {}", id);

        Driver driver = getEntityById(id);
        driver.setStatus(DriverStatus.ACTIVE);   // ← SỬA
        Driver updated = driverRepository.save(driver);

        return driverMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public DriverResponse rejectDriver(Long id, String reason) {
        log.info("Reject driver id: {}, reason: {}", id, reason);

        Driver driver = getEntityById(id);
        driver.setStatus(DriverStatus.REJECTED);
        Driver updated = driverRepository.save(driver);

        return driverMapper.toResponse(updated);
    }

    // ===== HELPER =====

    private Driver getEntityById(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DRIVER_NOT_FOUND));
    }
}