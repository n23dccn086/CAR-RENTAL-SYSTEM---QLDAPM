package com.carrental.car.service;

import com.carrental.car.dto.BlockedDateRequest;
import com.carrental.car.dto.CarPricingRequest;
import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarBlockedDate;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface CarService {

    CarResponse createCar(Long ownerId, CarRequest request);

    CarResponse getCarById(Long id);

    Car getCarEntityById(Long id);

    List<CarResponse> getAllCars();

    List<CarResponse> getCarsByOwner(Long ownerId);

    Page<CarResponse> getCarsByOwner(Long ownerId, String status, Pageable pageable);

    CarResponse updateCar(Long id, Long ownerId, CarRequest request);

    void deleteCar(Long id, Long ownerId);

    List<CarResponse> searchCars(CarStatus status, CarType carType);

    List<CarResponse> getAvailableCars();

    CarResponse approveCar(Long id);

    CarResponse rejectCar(Long id, String reason);

    List<String> uploadImages(Long carId, Long ownerId, MultipartFile[] files) throws IOException;

    List<Map<String, Object>> uploadImagesWithTypes(Long carId, Long ownerId, MultipartFile[] files, String[] imageTypes) throws IOException;

    List<String> getCarImages(Long carId);

    void deleteImage(Long carId, Long ownerId, String imageUrl);

    // ============================================================
    // 3.7 UPLOAD GIẤY TỜ XE (POST /cars/:id/documents)
    // ============================================================
    List<Map<String, Object>> uploadDocuments(Long carId, Long ownerId, Map<String, MultipartFile> docFiles) throws IOException;

    // ============================================================
    // 3.8 CẤU HÌNH GIÁ XE (PUT /cars/:id/pricing)
    // ============================================================
    CarResponse configurePricing(Long carId, Long ownerId, CarPricingRequest request);

    // ============================================================
    // 3.9 CHẶN LỊCH XE (POST /cars/:id/blocked-dates)
    // ============================================================
    CarBlockedDate blockDates(Long carId, Long ownerId, BlockedDateRequest request);

    // ============================================================
    // PUBLIC SEARCH
    // ============================================================
    Page<CarResponse> searchAvailableCars(
            String location,
            List<Integer> seats,
            String carType,
            Pageable pageable);

    Page<CarResponse> searchAvailableCarsFull(
            String location,
            String brand,
            String carType,
            String transmission,
            String fuelType,
            String rentalMode,
            List<Integer> seats,
            Long minPrice,
            Long maxPrice,
            LocalDate startDate,
            LocalDate endDate,
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
    // OWNER — ĐỔI TRẠNG THÁI XE
    // ============================================================
    CarResponse updateCarStatus(Long carId, Long ownerId, String newStatus);
}