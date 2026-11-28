package com.carrental.car.repository;

import com.carrental.car.entity.CarBlockedDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CarBlockedDateRepository extends JpaRepository<CarBlockedDate, Long> {

    List<CarBlockedDate> findByCarId(Long carId);

    List<CarBlockedDate> findByCarIdAndEndDateGreaterThanEqual(Long carId, LocalDate date);

    /** Có khoảng chặn lịch nào giao với [from, to] (tính theo ngày, bao gồm 2 đầu) không. */
    boolean existsByCarIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long carId, LocalDate to, LocalDate from);

    // ★ MỚI THÊM: Dùng để xóa cứng blocked dates khi hard delete car
    void deleteByCarId(Long carId);
}