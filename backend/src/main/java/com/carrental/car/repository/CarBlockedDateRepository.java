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
}
