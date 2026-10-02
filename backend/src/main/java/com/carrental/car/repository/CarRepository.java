package com.carrental.car.repository;

import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Long> {

    Optional<Car> findByPlate(String plate);

    boolean existsByPlate(String plate);

    List<Car> findByOwnerId(Long ownerId);

    List<Car> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    List<Car> findByStatus(CarStatus status);

    List<Car> findByStatusAndDeletedAtIsNull(CarStatus status);

    List<Car> findByCarType(CarType carType);

    List<Car> findByStatusAndCarTypeAndDeletedAtIsNull(CarStatus status, CarType carType);

    List<Car> findByStatusAndCarType(CarStatus status, CarType carType);
}