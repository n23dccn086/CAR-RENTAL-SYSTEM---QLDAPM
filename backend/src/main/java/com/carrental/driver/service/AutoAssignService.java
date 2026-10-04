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
                .findByOwnerIdAndStatusAndDeletedAtIsNull(ownerId, DriverStatus.ACTIVE);

        if (activeDrivers.isEmpty()) {
            log.warn("No active drivers for owner: {}", ownerId);
            return null;
        }

        List<Driver> availableDrivers = activeDrivers.stream()
                .filter(d -> !isDriverBusy(d.getId(), booking.getStartDate(), booking.getEndDate()))
                .toList();

        if (availableDrivers.isEmpty()) {
            log.warn("No available drivers for booking: {}", booking.getId());
            return null;
        }

        Driver best = availableDrivers.stream()
                .sorted(Comparator
                        .comparing(Driver::getTotalTrips, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(Driver::getRating, Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .orElse(null);

        log.info("Best driver found: id={}, name={}",
                best != null ? best.getId() : null,
                best != null ? best.getName() : null);

        return best;
    }

    /**
     * Tìm tài xế phù hợp, loại trừ những driverId đã cho.
     */
    public Driver findBestDriverExcluding(Long ownerId, Booking booking, List<Long> excludeDriverIds) {
        log.info("Finding best driver excluding {} for booking: {}",
                excludeDriverIds.size(), booking.getId());

        List<Driver> activeDrivers = driverRepository
                .findByOwnerIdAndStatusAndDeletedAtIsNull(ownerId, DriverStatus.ACTIVE);

        if (activeDrivers.isEmpty()) {
            return null;
        }

        List<Driver> availableDrivers = activeDrivers.stream()
                .filter(d -> !excludeDriverIds.contains(d.getId()))
                .filter(d -> !isDriverBusy(d.getId(), booking.getStartDate(), booking.getEndDate()))
                .toList();

        if (availableDrivers.isEmpty()) {
            return null;
        }

        return availableDrivers.stream()
                .sorted(Comparator
                        .comparing(Driver::getTotalTrips, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(Driver::getRating, Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .orElse(null);
    }

    /**
     * Kiểm tra tài xế có đang bận trong khoảng thời gian không.
     */
    private boolean isDriverBusy(Long driverId, LocalDateTime start, LocalDateTime end) {
        return bookingRepository.existsByDriverIdAndTimeOverlap(driverId, start, end);
    }
}