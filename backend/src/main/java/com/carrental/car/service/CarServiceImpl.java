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
import com.carrental.booking.repository.BookingRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.service.FileStorageService;
import com.carrental.review.repository.ReviewRepository;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

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
    ReviewRepository reviewRepository;
    BookingRepository bookingRepository;

    // ★ Chỉ cho phép Owner đổi 4 trạng thái này qua dropdown
    static final Set<CarStatus> OWNER_ALLOWED_STATUSES = Set.of(
            CarStatus.AVAILABLE,
            CarStatus.MAINTENANCE,
            CarStatus.BROKEN,
            CarStatus.INACTIVE
    );

    // ★ Trạng thái KHÔNG cho Sửa/Xóa
    static final Set<CarStatus> LOCKED_FOR_EDIT = Set.of(
            CarStatus.PENDING,
            CarStatus.RENTED,
            CarStatus.REJECTED
    );

    // ===== CREATE =====

    @Override
    @Transactional
    public CarResponse createCar(Long ownerId, CarRequest request) {
        log.info("Create car for owner: {}, plate: {}", ownerId, request.getPlate());

        if (!userRepository.existsById(ownerId)) {
            throw new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        // Check trùng biển số — với TẤT CẢ xe (mọi trạng thái)
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
    @Transactional(readOnly = true)
    public CarResponse getCarById(Long id) {
        Car car = getCarEntityById(id);
        return carMapper.toResponse(car);
    }

    @Override
    @Transactional(readOnly = true)
    public Car getCarEntityById(Long id) {
        return carRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CAR_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarResponse> getAllCars() {
        List<Car> cars = carRepository.findAll();
        return carMapper.toResponseList(cars);
    }

    @Override
    @Transactional(readOnly = true)
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

        // ★ Không cho sửa khi PENDING/RENTED/REJECTED
        if (LOCKED_FOR_EDIT.contains(car.getStatus())) {
            String reason = switch (car.getStatus()) {
                case PENDING -> "Xe đang chờ Admin duyệt, không thể sửa";
                case RENTED -> "Xe đang được thuê, không thể sửa";
                case REJECTED -> "Xe đã bị Admin từ chối, không thể sửa";
                default -> "Không thể sửa xe ở trạng thái này";
            };
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, reason);
        }

        // ★ CHECK TRÙNG BIỂN SỐ VỚI TẤT CẢ XE (mọi trạng thái)
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

        // ★ Reset về PENDING — Admin duyệt lại
        if (car.getStatus() != CarStatus.PENDING) {
            log.info("Car {} status reset: {} → PENDING (do Owner sửa thông tin)",
                    id, car.getStatus());
            car.setStatus(CarStatus.PENDING);
        }

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

        // ★ Không cho xóa khi PENDING/RENTED/REJECTED
        if (LOCKED_FOR_EDIT.contains(car.getStatus())) {
            String reason = switch (car.getStatus()) {
                case PENDING -> "Xe đang chờ Admin duyệt, không thể xóa";
                case RENTED -> "Xe đang được thuê, không thể xóa";
                case REJECTED -> "Xe đã bị Admin từ chối, không thể xóa";
                default -> "Không thể xóa xe ở trạng thái này";
            };
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, reason);
        }

        car.setDeletedAt(LocalDateTime.now());
        carRepository.save(car);

        log.info("Car soft deleted id: {}", id);
    }

    // ===== SEARCH =====

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<CarResponse> getAvailableCars() {
        List<Car> cars = carRepository.findByStatusAndDeletedAtIsNull(CarStatus.AVAILABLE);
        return carMapper.toResponseList(cars);
    }

    // ===== PUBLIC SEARCH =====

    @Override
    @Transactional(readOnly = true)
    public Page<CarResponse> searchAvailableCars(
            String location,
            List<Integer> seats,
            String carType,
            Pageable pageable) {

        List<Integer> seatsParam = (seats != null && !seats.isEmpty()) ? seats : null;
        String typeParam = (carType != null && !carType.isBlank()) ? carType.trim() : null;
        String locParam = (location != null && !location.isBlank()) ? location.trim() : null;

        log.info("Search available cars: location={}, seats={}, carType={}",
                locParam, seatsParam, typeParam);

        Page<Car> cars;
        if (seatsParam != null) {
            cars = carRepository.searchWithSeats(locParam, seatsParam, typeParam, pageable);
        } else {
            cars = carRepository.searchWithoutSeats(locParam, typeParam, pageable);
        }

        return cars.map(carMapper::toResponse);
    }

    // ===== OWNER SEARCH =====

    @Override
    @Transactional(readOnly = true)
    public Page<CarResponse> searchOwnerCars(
            Long ownerId,
            String carType,
            String status,
            List<Integer> seats,
            String search,
            Pageable pageable) {

        List<Integer> seatsParam = (seats != null && !seats.isEmpty()) ? seats : null;
        String typeParam = (carType != null && !carType.isBlank()) ? carType.trim() : null;
        String statusParam = (status != null && !status.isBlank()) ? status.trim() : null;
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;

        log.info("Search owner cars: ownerId={}, carType={}, status={}, seats={}, search={}",
                ownerId, typeParam, statusParam, seatsParam, searchParam);

        return carRepository.searchOwnerCars(ownerId, typeParam, statusParam, seatsParam, searchParam, pageable)
                .map(this::enrichStats);
    }

    /**
     * Enrich CarResponse với stats: rating, reviewCount, rentalCount
     */
    private CarResponse enrichStats(Car car) {
        CarResponse response = carMapper.toResponse(car);

        try {
            Double avg = reviewRepository.getAverageCarRating(car.getId());
            response.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);

            long reviewCount = reviewRepository.countByCarId(car.getId());
            response.setReviewCount(reviewCount);

            long rentalCount = bookingRepository.countCompletedByCarId(car.getId());
            response.setRentalCount(rentalCount);
        } catch (Exception e) {
            log.warn("Failed to load stats for car {}: {}", car.getId(), e.getMessage());
            response.setAverageRating(0.0);
            response.setReviewCount(0L);
            response.setRentalCount(0L);
        }

        return response;
    }

    // ============================================================
    // OWNER — ĐỔI TRẠNG THÁI XE
    // ============================================================

    @Override
    @Transactional
    public CarResponse updateCarStatus(Long carId, Long ownerId, String newStatus) {
        log.info("Owner {} update car {} status to {}", ownerId, carId, newStatus);

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        CarStatus targetStatus;
        try {
            targetStatus = CarStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Trạng thái không hợp lệ: " + newStatus);
        }

        if (!OWNER_ALLOWED_STATUSES.contains(targetStatus)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Bạn chỉ có thể đổi sang: Sẵn sàng, Bảo dưỡng, Hỏng, hoặc Đã khóa");
        }

        CarStatus currentStatus = car.getStatus();
        if (currentStatus == CarStatus.RENTED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Xe đang được thuê, không thể đổi trạng thái");
        }
        if (currentStatus == CarStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Xe đang chờ Admin duyệt, không thể đổi trạng thái");
        }
        if (currentStatus == CarStatus.REJECTED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Xe đã bị Admin từ chối, không thể đổi trạng thái");
        }

        car.setStatus(targetStatus);
        Car updated = carRepository.save(car);

        log.info("Car {} status: {} → {}", carId, currentStatus, targetStatus);
        return carMapper.toResponse(updated);
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
        car.setStatus(CarStatus.REJECTED);
        if (reason != null) {
            car.setDescription(car.getDescription() + "\n[REJECT] " + reason);
        }
        Car updated = carRepository.save(car);

        return carMapper.toResponse(updated);
    }

    // ============================================================
    // ẢNH XE
    // ============================================================

    @Override
    @Transactional
    public List<String> uploadImages(Long carId, Long ownerId, MultipartFile[] files) throws IOException {
        log.info("Upload {} images for car {} by owner {}", files.length, carId, ownerId);

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        // ★ Không cho upload khi PENDING/RENTED/REJECTED
        if (LOCKED_FOR_EDIT.contains(car.getStatus())) {
            String reason = switch (car.getStatus()) {
                case PENDING -> "Xe đang chờ Admin duyệt, không thể thêm ảnh";
                case RENTED -> "Xe đang được thuê, không thể thêm ảnh";
                case REJECTED -> "Xe đã bị Admin từ chối, không thể thêm ảnh";
                default -> "Không thể thêm ảnh ở trạng thái này";
            };
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, reason);
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

        // ★ Reset về PENDING — Admin duyệt lại
        if (car.getStatus() != CarStatus.PENDING) {
            log.info("Car {} status reset: {} → PENDING (do Owner thêm ảnh)",
                    carId, car.getStatus());
            car.setStatus(CarStatus.PENDING);
            carRepository.save(car);
        }

        log.info("Uploaded {} images for car {}", urls.size(), carId);
        return urls;
    }

    @Override
    @Transactional(readOnly = true)
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

        // ★ Không cho xóa ảnh khi PENDING/RENTED/REJECTED
        if (LOCKED_FOR_EDIT.contains(car.getStatus())) {
            String reason = switch (car.getStatus()) {
                case PENDING -> "Xe đang chờ Admin duyệt, không thể xóa ảnh";
                case RENTED -> "Xe đang được thuê, không thể xóa ảnh";
                case REJECTED -> "Xe đã bị Admin từ chối, không thể xóa ảnh";
                default -> "Không thể xóa ảnh ở trạng thái này";
            };
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, reason);
        }

        CarImage image = carImageRepository.findByCarIdOrderByDisplayOrderAsc(carId).stream()
                .filter(img -> img.getImageUrl().equals(imageUrl))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CAR_NOT_FOUND));

        fileStorageService.deleteFile(image.getImageUrl());
        carImageRepository.delete(image);

        // ★ Reset về PENDING — Admin duyệt lại
        if (car.getStatus() != CarStatus.PENDING) {
            log.info("Car {} status reset: {} → PENDING (do Owner xóa ảnh)",
                    carId, car.getStatus());
            car.setStatus(CarStatus.PENDING);
            carRepository.save(car);
        }

        log.info("Deleted image for car {}", carId);
    }
}