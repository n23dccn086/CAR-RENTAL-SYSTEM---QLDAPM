package com.carrental.car.repository;

import com.carrental.car.entity.CarImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarImageRepository extends JpaRepository<CarImage, Long> {

    List<CarImage> findByCarId(Long carId);

    List<CarImage> findByCarIdOrderByDisplayOrderAsc(Long carId);

    void deleteByCarId(Long carId);

    long countByCarId(Long carId);
}