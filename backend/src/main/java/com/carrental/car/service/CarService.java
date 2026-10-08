package com.carrental.car.service;

import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    List<String> uploadImages(Long carId, Long ownerId, MultipartFile[] files) throws IOException;

    List<String> getCarImages(Long carId);

    void deleteImage(Long carId, Long ownerId, String imageUrl);

    // ============================================================
    // PUBLIC SEARCH
    // ============================================================
    Page<CarResponse> searchAvailableCars(
            String location,
            List<Integer> seats,
            String carType,
            Pageable pageable);

    // ============================================================
    // OWNER — SEARCH XE CỦA MÌNH
    // ============================================================
    Page<CarResponse> searchOwnerCars(
            Long ownerId,
            String carType,
            String status,
            List<Integer> seats,
            String search,
            Pageable pageable);

    // ============================================================
    // ★ MỚI: OWNER — ĐỔI TRẠNG THÁI XE
    // Chỉ cho phép: AVAILABLE, MAINTENANCE, BROKEN, INACTIVE
    // ============================================================
    CarResponse updateCarStatus(Long carId, Long ownerId, String newStatus);
}