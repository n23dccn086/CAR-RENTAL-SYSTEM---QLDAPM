package com.carrental.car.service;

import com.carrental.car.dto.CarMapper;
import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarImage;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;
import com.carrental.car.repository.CarImageRepository;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.service.FileStorageService;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CarServiceImpl implements CarService {

    CarRepository carRepository;
    CarImageRepository carImageRepository;
    UserRepository userRepository;
    CarMapper carMapper;
    FileStorageService fileStorageService;

    // ===== CREATE =====

    @Override
    @Transactional
    public CarResponse createCar(Long ownerId, CarRequest request) {
        log.info("Create car for owner: {}, plate: {}", ownerId, request.getPlate());

        if (!userRepository.existsById(ownerId)) {
            throw new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        if (carRepository.existsByPlate(request.getPlate())) {
            throw new BadRequestException(ErrorCode.CAR_PLATE_EXISTED);
        }

        Car car = carMapper.toEntity(request);
        car.setOwnerId(ownerId);
        car.setStatus(CarStatus.PENDING);

        if (car.getCurrentKm() == null) car.setCurrentKm(0);
        if (car.getExtraKmPrice() == null) car.setExtraKmPrice(5000L);
        if (car.getDeliveryFee() == null) car.setDeliveryFee(100000L);
        if (car.getCleaningFee() == null) car.setCleaningFee(0L);
        if (car.getDeliveryRadius() == null) car.setDeliveryRadius(20);

        Car saved = carRepository.save(car);
        log.info("Car created with id: {}", saved.getId());

        return carMapper.toResponse(saved);
    }

    // ===== READ =====

    @Override
    public CarResponse getCarById(Long id) {
        Car car = getCarEntityById(id);
        return carMapper.toResponse(car);
    }

    @Override
    public Car getCarEntityById(Long id) {
        return carRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CAR_NOT_FOUND));
    }

    @Override
    public List<CarResponse> getAllCars() {
        List<Car> cars = carRepository.findAll();
        return carMapper.toResponseList(cars);
    }

    @Override
    public List<CarResponse> getCarsByOwner(Long ownerId) {
        List<Car> cars = carRepository.findByOwnerIdAndDeletedAtIsNull(ownerId);
        return carMapper.toResponseList(cars);
    }

    // ===== UPDATE =====

    @Override
    @Transactional
    public CarResponse updateCar(Long id, Long ownerId, CarRequest request) {
        log.info("Update car id: {} by owner: {}", id, ownerId);

        Car car = getCarEntityById(id);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        if (!car.getPlate().equals(request.getPlate())
                && carRepository.existsByPlate(request.getPlate())) {
            throw new BadRequestException(ErrorCode.CAR_PLATE_EXISTED);
        }

        car.setPlate(request.getPlate());
        car.setBrand(request.getBrand());
        car.setModel(request.getModel());
        car.setYear(request.getYear());
        car.setSeats(request.getSeats());
        car.setTransmission(request.getTransmission());
        car.setFuelType(request.getFuelType());
        car.setColor(request.getColor());
        car.setCurrentKm(request.getCurrentKm());
        car.setPricePerDay(request.getPricePerDay());
        car.setPriceWeekend(request.getPriceWeekend());
        car.setPriceHoliday(request.getPriceHoliday());
        car.setExtraKmPrice(request.getExtraKmPrice());
        car.setDeliveryFee(request.getDeliveryFee());
        car.setCleaningFee(request.getCleaningFee());
        car.setCarType(request.getCarType());
        car.setRentalMode(request.getRentalMode());
        car.setAddress(request.getAddress());
        car.setDeliveryRadius(request.getDeliveryRadius());
        car.setDescription(request.getDescription());

        Car updated = carRepository.save(car);
        log.info("Car updated id: {}", id);

        return carMapper.toResponse(updated);
    }

    // ===== DELETE (soft) =====

    @Override
    @Transactional
    public void deleteCar(Long id, Long ownerId) {
        log.info("Delete car id: {} by owner: {}", id, ownerId);

        Car car = getCarEntityById(id);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        car.setDeletedAt(LocalDateTime.now());
        carRepository.save(car);

        log.info("Car soft deleted id: {}", id);
    }

    // ===== SEARCH =====

    @Override
    public List<CarResponse> searchCars(CarStatus status, CarType carType) {
        List<Car> cars;

        if (status != null && carType != null) {
            cars = carRepository.findByStatusAndCarType(status, carType);
        } else if (status != null) {
            cars = carRepository.findByStatus(status);
        } else if (carType != null) {
            cars = carRepository.findByCarType(carType);
        } else {
            cars = carRepository.findAll();
        }

        return carMapper.toResponseList(cars);
    }

    @Override
    public List<CarResponse> getAvailableCars() {
        List<Car> cars = carRepository.findByStatusAndDeletedAtIsNull(CarStatus.AVAILABLE);
        return carMapper.toResponseList(cars);
    }

    // ===== ADMIN =====

    @Override
    @Transactional
    public CarResponse approveCar(Long id) {
        log.info("Approve car id: {}", id);

        Car car = getCarEntityById(id);
        car.setStatus(CarStatus.AVAILABLE);
        Car updated = carRepository.save(car);

        return carMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public CarResponse rejectCar(Long id, String reason) {
        log.info("Reject car id: {}, reason: {}", id, reason);

        Car car = getCarEntityById(id);
        car.setStatus(CarStatus.INACTIVE);
        if (reason != null) {
            car.setDescription(car.getDescription() + "\n[REJECT] " + reason);
        }
        Car updated = carRepository.save(car);

        return carMapper.toResponse(updated);
    }

    // ============================================================
    // ===== ẢNH XE — UPLOAD / GET / DELETE =====
    // ============================================================

    @Override
    @Transactional
    public List<String> uploadImages(Long carId, Long ownerId, MultipartFile[] files) throws IOException {
        log.info("Upload {} images for car {} by owner {}", files.length, carId, ownerId);

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        List<String> urls = new ArrayList<>();
        long existing = carImageRepository.countByCarId(carId);

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            if (existing + urls.size() >= 10) {
                log.warn("Vượt quá 10 ảnh cho car {}", carId);
                break;
            }

            String url = fileStorageService.storeFile(file, "cars/" + carId);
            urls.add(url);

            CarImage image = CarImage.builder()
                    .carId(carId)
                    .imageUrl(url)
                    .imageType("OTHER")
                    .build();
            carImageRepository.save(image);
        }

        log.info("Uploaded {} images for car {}", urls.size(), carId);
        return urls;
    }

    @Override
    public List<String> getCarImages(Long carId) {
        getCarEntityById(carId);
        return carImageRepository.findByCarIdOrderByDisplayOrderAsc(carId).stream()
                .map(CarImage::getImageUrl)
                .toList();
    }

    @Override
    @Transactional
    public void deleteImage(Long carId, Long ownerId, String imageUrl) {
        log.info("Delete image for car {} by owner {}", carId, ownerId);

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        CarImage image = carImageRepository.findByCarIdOrderByDisplayOrderAsc(carId).stream()
                .filter(img -> img.getImageUrl().equals(imageUrl))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CAR_NOT_FOUND));

        fileStorageService.deleteFile(image.getImageUrl());
        carImageRepository.delete(image);

        log.info("Deleted image for car {}", carId);
    }
}