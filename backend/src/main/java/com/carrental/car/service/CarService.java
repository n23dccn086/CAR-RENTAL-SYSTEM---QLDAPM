package com.carrental.car.service;

import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CarService {

    CarResponse createCar(Long ownerId, CarRequest request);

    CarResponse getCarById(Long id);

    Car getCarEntityById(Long id);

    List<CarResponse> getAllCars();

    List<CarResponse> getCarsByOwner(Long ownerId);

    CarResponse updateCar(Long id, Long ownerId, CarRequest request);

    void deleteCar(Long id, Long ownerId);

    List<CarResponse> searchCars(CarStatus status, CarType carType);

    List<CarResponse> getAvailableCars();

    CarResponse approveCar(Long id);

    CarResponse rejectCar(Long id, String reason);

    // ===== ẢNH XE =====
    List<String> uploadImages(Long carId, Long ownerId, MultipartFile[] files) throws IOException;

    List<String> getCarImages(Long carId);

    void deleteImage(Long carId, Long ownerId, String imageUrl);
}