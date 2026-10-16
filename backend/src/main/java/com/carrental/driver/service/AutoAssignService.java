package com.carrental.driver.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.repository.DriverRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Service tự động tìm và gán tài xế phù hợp cho booking.
 * Rule engine:
 *   1. Lọc tài xế ACTIVE của owner
 *   2. Lọc tài xế rảnh trong khoảng thời gian đơn
 *   3. Sắp xếp: ít chuyến → rating cao
 *   4. Trả về tài xế top 1
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AutoAssignService {

    DriverRepository driverRepository;
    BookingRepository bookingRepository;

    /**
     * Tìm tài xế phù hợp nhất cho booking.
     */
    public Driver findBestDriver(Long ownerId, Booking booking) {
        log.info("Finding best driver for booking: {}, owner: {}", booking.getId(), ownerId);

        List<Driver> activeDrivers = driverRepository
                .findByOwnerIdAndStatusInAndDeletedAtIsNull(ownerId, List.of(DriverStatus.ACTIVE, DriverStatus.BUSY));

        if (activeDrivers.isEmpty()) {
            log.warn("No active drivers for owner: {}", ownerId);
            return null;
        }

        List<Driver> availableDrivers = activeDrivers.stream()
                .filter(d -> !isDriverBusy(d.getId(), booking.getStartDate(), booking.getEndDate(), booking.getId()))
                .toList();

        if (availableDrivers.isEmpty()) {
            log.warn("No available drivers for booking: {}", booking.getId());
            return null;
        }

        int randomIndex = java.util.concurrent.ThreadLocalRandom.current().nextInt(availableDrivers.size());
        Driver selected = availableDrivers.get(randomIndex);

        log.info("Driver randomly assigned: id={}, name={}", selected.getId(), selected.getName());
        return selected;
    }

    /**
     * Tìm tài xế phù hợp, loại trừ những driverId đã cho.
     */
    public Driver findBestDriverExcluding(Long ownerId, Booking booking, List<Long> excludeDriverIds) {
        log.info("Finding random driver excluding {} for booking: {}",
                excludeDriverIds.size(), booking.getId());

        List<Driver> activeDrivers = driverRepository
                .findByOwnerIdAndStatusInAndDeletedAtIsNull(ownerId, List.of(DriverStatus.ACTIVE, DriverStatus.BUSY));

        if (activeDrivers.isEmpty()) {
            return null;
        }

        List<Driver> availableDrivers = activeDrivers.stream()
                .filter(d -> !excludeDriverIds.contains(d.getId()))
                .filter(d -> !isDriverBusy(d.getId(), booking.getStartDate(), booking.getEndDate(), booking.getId()))
                .toList();

        if (availableDrivers.isEmpty()) {
            return null;
        }

        int randomIndex = java.util.concurrent.ThreadLocalRandom.current().nextInt(availableDrivers.size());
        Driver selected = availableDrivers.get(randomIndex);

        log.info("Replacement driver randomly assigned: id={}, name={}", selected.getId(), selected.getName());
        return selected;
    }

    /**
     * Kiểm tra tài xế có đang bận trong khoảng thời gian không (loại trừ chính booking hiện tại).
     */
    private boolean isDriverBusy(Long driverId, LocalDateTime start, LocalDateTime end, Long excludeBookingId) {
        return bookingRepository.existsByDriverIdAndTimeOverlapExcludingBooking(driverId, start, end, excludeBookingId);
    }
}