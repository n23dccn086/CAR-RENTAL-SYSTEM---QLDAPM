package com.carrental.car.service;

import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;

import java.util.List;

public interface CarService {

    // ===== CRUD =====

    CarResponse createCar(Long ownerId, CarRequest request);

    CarResponse getCarById(Long id);

    Car getCarEntityById(Long id);

    List<CarResponse> getAllCars();

    List<CarResponse> getCarsByOwner(Long ownerId);

    CarResponse updateCar(Long id, Long ownerId, CarRequest request);

    void deleteCar(Long id, Long ownerId);

    // ===== SEARCH/FILTER =====

    List<CarResponse> searchCars(CarStatus status, CarType carType);

    List<CarResponse> getAvailableCars();

    // ===== ADMIN =====

    CarResponse approveCar(Long id);

    CarResponse rejectCar(Long id, String reason);
}