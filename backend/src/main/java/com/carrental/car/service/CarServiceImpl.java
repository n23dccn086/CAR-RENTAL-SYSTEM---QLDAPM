package com.carrental.car.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.dto.BlockedDateRequest;
import com.carrental.car.dto.CarMapper;
import com.carrental.car.dto.CarPricingRequest;
import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.*;
import com.carrental.car.repository.CarBlockedDateRepository;
import com.carrental.car.repository.CarDocumentRepository;
import com.carrental.car.repository.CarImageRepository;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.service.FileStorageService;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.review.entity.Review;
import com.carrental.review.repository.ReviewRepository;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CarServiceImpl implements CarService {

    CarRepository carRepository;
    CarImageRepository carImageRepository;
    CarDocumentRepository carDocumentRepository;
    CarBlockedDateRepository carBlockedDateRepository;
    UserRepository userRepository;
    CarMapper carMapper;
    FileStorageService fileStorageService;
    ReviewRepository reviewRepository;
    BookingRepository bookingRepository;
    NotificationService notificationService;

    static final Set<CarStatus> OWNER_ALLOWED_STATUSES = Set.of(
            CarStatus.AVAILABLE,
            CarStatus.MAINTENANCE,
            CarStatus.BROKEN,
            CarStatus.INACTIVE);

    static final Set<CarStatus> LOCKED_FOR_EDIT = Set.of(
            CarStatus.PENDING,
            CarStatus.RENTED,
            CarStatus.REJECTED);

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

        if (request.getCarType() == null) {
            request.setCarType(request.getSeats() != null && request.getSeats() >= 7 ? CarType.MPV : CarType.SEDAN);
        }
        if (request.getPricePerDay() == null) {
            request.setPricePerDay(1000000L);
        }
        if (request.getRentalMode() == null) {
            request.setRentalMode(RentalMode.SELF_DRIVE);
        }

        Car car = carMapper.toEntity(request);
        car.setOwnerId(ownerId);
        car.setStatus(CarStatus.PENDING);

        if (car.getCurrentKm() == null) car.setCurrentKm(0);
        if (car.getExtraKmPrice() == null) car.setExtraKmPrice(5000L);
        if (car.getDeliveryFee() == null) car.setDeliveryFee(100000L);
        if (car.getCleaningFee() == null) car.setCleaningFee(0L);
        if (car.getDeliveryRadius() == null) car.setDeliveryRadius(20);
        if (car.getBaseKmPerDay() == null) car.setBaseKmPerDay(300);
        if (car.getDepositPercent() == null) car.setDepositPercent(30);
        if (car.getInsuranceFeePerDay() == null) car.setInsuranceFeePerDay(100000L);

        Car saved = carRepository.save(car);
        log.info("Car created with id: {}", saved.getId());

        // ★ Thông báo cho tất cả Admin
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.CAR_PENDING,
                        "Xe mới chờ duyệt",
                        String.format("Xe %s %s (%s) vừa được thêm. Vui lòng vào duyệt.",
                                saved.getBrand(), saved.getModel(), saved.getPlate()),
                        saved.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        return enrichStats(saved);
    }

    // ===== READ =====

    @Override
    @Transactional(readOnly = true)
    public CarResponse getCarById(Long id) {
        Car car = getCarEntityById(id);
        CarResponse response = enrichStats(car);

        // ★ Load blocked dates: Bookings + CarBlockedDates
        List<Map<String, Object>> blockedList = new ArrayList<>();
        try {
            List<Booking> activeBookings = bookingRepository.findByCarIdAndStatusIn(
                    id, List.of(BookingStatus.PAID, BookingStatus.APPROVED, BookingStatus.RENTED));
            for (Booking b : activeBookings) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("start_date", b.getStartDate().toLocalDate().toString());
                map.put("end_date", b.getEndDate().toLocalDate().toString());
                map.put("reason", "booked");
                blockedList.add(map);
            }

            List<CarBlockedDate> explicitBlocks = carBlockedDateRepository.findByCarId(id);
            for (CarBlockedDate cbd : explicitBlocks) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("start_date", cbd.getStartDate().toString());
                map.put("end_date", cbd.getEndDate().toString());
                map.put("reason", cbd.getReason());
                if (cbd.getNote() != null) map.put("note", cbd.getNote());
                blockedList.add(map);
            }
        } catch (Exception e) {
            log.warn("Failed to load blocked dates for car {}: {}", id, e.getMessage());
        }
        response.setBlockedDates(blockedList);

        // ★ Load reviews
        try {
            List<Review> reviews = reviewRepository.findByCarIdOrderByCreatedAtDesc(id);
            List<Map<String, Object>> reviewList = new ArrayList<>();
            for (Review r : reviews) {
                Map<String, Object> rMap = new LinkedHashMap<>();
                rMap.put("id", r.getId());
                User reviewer = userRepository.findById(r.getCustomerId()).orElse(null);
                rMap.put("reviewer_name", reviewer != null ? reviewer.getName() : "Khách hàng");
                rMap.put("car_rating", r.getCarRating());
                rMap.put("comment", r.getComment());
                rMap.put("created_at", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
                reviewList.add(rMap);
            }
            response.setReviews(reviewList);
        } catch (Exception e) {
            log.warn("Failed to load reviews for car {}: {}", id, e.getMessage());
        }

        return response;
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
        return cars.stream().map(this::enrichStats).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarResponse> getCarsByOwner(Long ownerId) {
        List<Car> cars = carRepository.findByOwnerIdAndDeletedAtIsNull(ownerId);
        return cars.stream().map(this::enrichStats).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CarResponse> getCarsByOwner(Long ownerId, String status, Pageable pageable) {
        Page<Car> cars;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            CarStatus carStatus = CarStatus.fromString(status);
            cars = carRepository.findByOwnerIdAndStatusAndDeletedAtIsNull(ownerId, carStatus, pageable);
        } else {
            cars = carRepository.findByOwnerIdAndDeletedAtIsNull(ownerId, pageable);
        }
        return cars.map(this::enrichStats);
    }

    // ===== UPDATE =====

    @Override
    @Transactional
    public CarResponse updateCar(Long id, Long ownerId, CarRequest request) {
        log.info("Update car id: {} by owner: {}", id, ownerId);

        Car car = getCarEntityById(id);

        if (!car.getOwnerId().equals(ownerId)) {
            User caller = userRepository.findById(ownerId).orElse(null);
            if (caller == null || caller.getRole() != Role.ADMIN) {
                throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
            }
        }

        if (LOCKED_FOR_EDIT.contains(car.getStatus())) {
            String reason = switch (car.getStatus()) {
                case PENDING -> "Xe đang chờ Admin duyệt, không thể sửa";
                case RENTED -> "Xe đang được thuê, không thể sửa";
                case REJECTED -> "Xe đã bị Admin từ chối, không thể sửa";
                default -> "Không thể sửa xe ở trạng thái này";
            };
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, reason);
        }

        if (request.getPlate() != null && !car.getPlate().equals(request.getPlate())
                && carRepository.existsByPlate(request.getPlate())) {
            throw new BadRequestException(ErrorCode.CAR_PLATE_EXISTED);
        }

        if (request.getPlate() != null) car.setPlate(request.getPlate());
        if (request.getBrand() != null) car.setBrand(request.getBrand());
        if (request.getModel() != null) car.setModel(request.getModel());
        if (request.getYear() != null) car.setYear(request.getYear());
        if (request.getSeats() != null) car.setSeats(request.getSeats());
        if (request.getTransmission() != null) car.setTransmission(request.getTransmission());
        if (request.getFuelType() != null) car.setFuelType(request.getFuelType());
        if (request.getColor() != null) car.setColor(request.getColor());
        if (request.getCurrentKm() != null) car.setCurrentKm(request.getCurrentKm());
        if (request.getPricePerDay() != null) car.setPricePerDay(request.getPricePerDay());
        if (request.getPriceWeekend() != null) car.setPriceWeekend(request.getPriceWeekend());
        if (request.getPriceHoliday() != null) car.setPriceHoliday(request.getPriceHoliday());
        if (request.getPriceWithDriver() != null) car.setPriceWithDriver(request.getPriceWithDriver());
        if (request.getExtraKmPrice() != null) car.setExtraKmPrice(request.getExtraKmPrice());
        if (request.getDeliveryFee() != null) car.setDeliveryFee(request.getDeliveryFee());
        if (request.getCleaningFee() != null) car.setCleaningFee(request.getCleaningFee());
        if (request.getCarType() != null) car.setCarType(request.getCarType());
        if (request.getRentalMode() != null) car.setRentalMode(request.getRentalMode());
        if (request.getAddress() != null) car.setAddress(request.getAddress());
        if (request.getDeliveryRadius() != null) car.setDeliveryRadius(request.getDeliveryRadius());
        if (request.getDescription() != null) car.setDescription(request.getDescription());

        // ★ Reset về PENDING — Admin duyệt lại nếu không phải Admin sửa
        User caller = userRepository.findById(ownerId).orElse(null);
        boolean isAdmin = caller != null && caller.getRole() == Role.ADMIN;
        if (!isAdmin && car.getStatus() != CarStatus.PENDING) {
            log.info("Car {} status reset: {} → PENDING (do Owner sửa thông tin)",
                    id, car.getStatus());
            car.setStatus(CarStatus.PENDING);

            try {
                List<User> admins = userRepository.findByRole(Role.ADMIN);
                for (User admin : admins) {
                    notificationService.createNotification(
                            admin.getId(),
                            NotificationType.CAR_RESUBMITTED,
                            "Xe cần duyệt lại",
                            String.format("Xe %s %s (%s) đã được Owner cập nhật thông tin. Vui lòng duyệt lại.",
                                    car.getBrand(), car.getModel(), car.getPlate()),
                            car.getId()
                    );
                }
            } catch (Exception e) {
                log.warn("Failed to notify admins: {}", e.getMessage());
            }
        }

        Car updated = carRepository.save(car);
        log.info("Car updated id: {}", id);

        return enrichStats(updated);
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

        // ★ Kiểm tra nếu xe đang có đơn đặt xe hoạt động (Contract 3.5: CAR_HAS_ACTIVE_BOOKING)
        long activeBookings = bookingRepository.countByCarIdAndStatusIn(
                id, List.of(BookingStatus.PENDING, BookingStatus.PAID, BookingStatus.APPROVED, BookingStatus.RENTED));
        if (activeBookings > 0) {
            throw new BadRequestException(ErrorCode.BOOKING_ALREADY_EXISTS,
                    "Không thể xóa xe đang có đơn hoạt động");
        }

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

        return cars.stream().map(this::enrichStats).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarResponse> getAvailableCars() {
        List<Car> cars = carRepository.findByStatusAndDeletedAtIsNull(CarStatus.AVAILABLE);
        return cars.stream().map(this::enrichStats).toList();
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

        Page<Car> cars;
        if (seatsParam != null) {
            cars = carRepository.searchWithSeats(locParam, seatsParam, typeParam, pageable);
        } else {
            cars = carRepository.searchWithoutSeats(locParam, typeParam, pageable);
        }

        return cars.map(this::enrichStats);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CarResponse> searchAvailableCarsFull(
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
            Pageable pageable) {

        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(23, 59, 59) : null;
        List<Integer> seatsParam = (seats != null && !seats.isEmpty()) ? seats : null;

        Page<Car> cars = carRepository.searchAvailableCarsFull(
                (location != null && !location.isBlank()) ? location.trim() : null,
                (brand != null && !brand.isBlank()) ? brand.trim() : null,
                (carType != null && !carType.isBlank()) ? carType.trim() : null,
                (transmission != null && !transmission.isBlank()) ? transmission.trim() : null,
                (fuelType != null && !fuelType.isBlank()) ? fuelType.trim() : null,
                (rentalMode != null && !rentalMode.isBlank()) ? rentalMode.trim() : null,
                seatsParam,
                minPrice,
                maxPrice,
                startDt,
                endDt,
                pageable
        );

        return cars.map(this::enrichStats);
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

    private CarResponse enrichStats(Car car) {
        CarResponse response = carMapper.toResponse(car);

        // Load images
        if (car.getImages() != null && !car.getImages().isEmpty()) {
            response.setImageUrls(car.getImages().stream().map(CarImage::getImageUrl).toList());
            response.setImageCount(car.getImages().size());
        } else {
            List<CarImage> dbImages = carImageRepository.findByCarIdOrderByDisplayOrderAsc(car.getId());
            if (dbImages != null && !dbImages.isEmpty()) {
                response.setImageUrls(dbImages.stream().map(CarImage::getImageUrl).toList());
                response.setImageCount(dbImages.size());
            }
        }

        // Load owner info
        if (car.getOwnerId() != null) {
            userRepository.findById(car.getOwnerId()).ifPresent(owner -> {
                response.setOwnerName(owner.getName());
                response.setOwnerPhone(owner.getPhone());
                response.setOwnerAvatarUrl(owner.getAvatarUrl());
            });
        }

        try {
            Double avg = reviewRepository.getAverageCarRating(car.getId());
            response.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0);

            long reviewCount = reviewRepository.countByCarId(car.getId());
            response.setReviewCount(reviewCount);

            long rentalCount = bookingRepository.countCompletedByCarId(car.getId());
            response.setRentalCount(rentalCount);
        } catch (Exception e) {
            log.warn("Failed to load stats for car {}: {}", car.getId(), e.getMessage());
            response.setAverageRating(5.0);
            response.setReviewCount(0L);
            response.setRentalCount(0L);
        }

        return response;
    }

    // ===== OWNER — ĐỔI TRẠNG THÁI XE =====

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
            targetStatus = CarStatus.fromString(newStatus);
        } catch (Exception e) {
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
        return enrichStats(updated);
    }

    // ===== ADMIN =====

    @Override
    @Transactional
    public CarResponse approveCar(Long id) {
        log.info("Approve car id: {}", id);

        Car car = getCarEntityById(id);
        car.setStatus(CarStatus.AVAILABLE);
        Car updated = carRepository.save(car);

        // ★ Thông báo cho Owner
        try {
            notificationService.createNotification(
                    car.getOwnerId(),
                    NotificationType.CAR_APPROVED,
                    "Xe đã được duyệt",
                    String.format("Xe %s %s (%s) đã được Admin duyệt và hiển thị ra bộ sưu tập.",
                            car.getBrand(), car.getModel(), car.getPlate()),
                    car.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        return enrichStats(updated);
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

        // ★ Thông báo cho Owner
        try {
            notificationService.createNotification(
                    car.getOwnerId(),
                    NotificationType.CAR_REJECTED,
                    "Xe bị từ chối",
                    String.format("Xe %s %s (%s) bị Admin từ chối. Lý do: %s. " +
                                    "Vui lòng sửa thông tin và gửi duyệt lại.",
                            car.getBrand(), car.getModel(), car.getPlate(),
                            reason != null ? reason : "Không có lý do"),
                    car.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        return enrichStats(updated);
    }

    // ============================================================
    // 3.6 ẢNH XE
    // ============================================================

    @Override
    @Transactional
    public List<String> uploadImages(Long carId, Long ownerId, MultipartFile[] files) throws IOException {
        List<Map<String, Object>> imageMaps = uploadImagesWithTypes(carId, ownerId, files, null);
        return imageMaps.stream().map(m -> (String) m.get("image_url")).toList();
    }

    @Override
    @Transactional
    public List<Map<String, Object>> uploadImagesWithTypes(Long carId, Long ownerId, MultipartFile[] files, String[] imageTypes) throws IOException {
        log.info("Upload {} images for car {} by owner {}", files.length, carId, ownerId);

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        if (LOCKED_FOR_EDIT.contains(car.getStatus())) {
            String reason = switch (car.getStatus()) {
                case PENDING -> "Xe đang chờ Admin duyệt, không thể thêm ảnh";
                case RENTED -> "Xe đang được thuê, không thể thêm ảnh";
                case REJECTED -> "Xe đã bị Admin từ chối, không thể thêm ảnh";
                default -> "Không thể thêm ảnh ở trạng thái này";
            };
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, reason);
        }

        List<Map<String, Object>> savedImages = new ArrayList<>();
        long existing = carImageRepository.countByCarId(carId);

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;
            if (existing + savedImages.size() >= 10) {
                log.warn("Vượt quá 10 ảnh cho car {}", carId);
                break;
            }

            String url = fileStorageService.storeFile(file, "cars/" + carId);
            String type = (imageTypes != null && i < imageTypes.length && imageTypes[i] != null && !imageTypes[i].isBlank())
                    ? imageTypes[i] : (existing + savedImages.size() == 0 ? "front" : "other");

            CarImage image = CarImage.builder()
                    .carId(carId)
                    .imageUrl(url)
                    .imageType(type)
                    .displayOrder((int) (existing + savedImages.size()))
                    .build();
            CarImage saved = carImageRepository.save(image);

            Map<String, Object> imgMap = new LinkedHashMap<>();
            imgMap.put("id", saved.getId());
            imgMap.put("image_url", saved.getImageUrl());
            imgMap.put("image_type", saved.getImageType());
            savedImages.add(imgMap);
        }

        // Reset về PENDING — Admin duyệt lại
        if (car.getStatus() != CarStatus.PENDING) {
            log.info("Car {} status reset: {} → PENDING (do Owner thêm ảnh)",
                    carId, car.getStatus());
            car.setStatus(CarStatus.PENDING);
            carRepository.save(car);
        }

        return savedImages;
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

        if (car.getStatus() != CarStatus.PENDING) {
            log.info("Car {} status reset: {} → PENDING (do Owner xóa ảnh)",
                    carId, car.getStatus());
            car.setStatus(CarStatus.PENDING);
            carRepository.save(car);
        }

        log.info("Deleted image for car {}", carId);
    }

    // ============================================================
    // 3.7 UPLOAD GIẤY TỜ XE (POST /cars/:id/documents)
    // ============================================================

    @Override
    @Transactional
    public List<Map<String, Object>> uploadDocuments(Long carId, Long ownerId, Map<String, MultipartFile> docFiles) throws IOException {
        log.info("Upload documents for car {} by owner {}", carId, ownerId);

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
        }

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map.Entry<String, MultipartFile> entry : docFiles.entrySet()) {
            String docType = entry.getKey();
            MultipartFile file = entry.getValue();
            if (file == null || file.isEmpty()) continue;

            String fileUrl = fileStorageService.storeFile(file, "cars/" + carId + "/documents");

            // Xóa document cũ cùng loại nếu có
            carDocumentRepository.findByCarIdAndDocumentType(carId, docType).ifPresent(old -> {
                fileStorageService.deleteFile(old.getDocumentUrl());
                carDocumentRepository.delete(old);
            });

            CarDocument doc = CarDocument.builder()
                    .car(car)
                    .documentType(docType)
                    .documentUrl(fileUrl)
                    .verified(false)
                    .build();
            CarDocument saved = carDocumentRepository.save(doc);

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", saved.getId());
            map.put("doc_type", saved.getDocumentType());
            map.put("file_url", saved.getDocumentUrl());
            result.add(map);
        }

        return result;
    }

    // ============================================================
    // 3.8 CẤU HÌNH GIÁ XE (PUT /cars/:id/pricing)
    // ============================================================

    @Override
    @Transactional
    public CarResponse configurePricing(Long carId, Long ownerId, CarPricingRequest request) {
        log.info("Configure pricing for car {} by owner {}", carId, ownerId);

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            User caller = userRepository.findById(ownerId).orElse(null);
            if (caller == null || caller.getRole() != Role.ADMIN) {
                throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
            }
        }

        if (request.getPricePerDay() != null) car.setPricePerDay(request.getPricePerDay());
        if (request.getPriceWeekend() != null) car.setPriceWeekend(request.getPriceWeekend());
        if (request.getPriceHoliday() != null) car.setPriceHoliday(request.getPriceHoliday());
        if (request.getPriceWithDriver() != null) car.setPriceWithDriver(request.getPriceWithDriver());
        if (request.getBaseKmPerDay() != null) car.setBaseKmPerDay(request.getBaseKmPerDay());
        if (request.getExtraKmPrice() != null) car.setExtraKmPrice(request.getExtraKmPrice());
        if (request.getDeliveryFee() != null) car.setDeliveryFee(request.getDeliveryFee());
        if (request.getCleaningFee() != null) car.setCleaningFee(request.getCleaningFee());
        if (request.getInsuranceFeePerDay() != null) car.setInsuranceFeePerDay(request.getInsuranceFeePerDay());
        if (request.getDepositPercent() != null) car.setDepositPercent(request.getDepositPercent());

        Car updated = carRepository.save(car);
        return enrichStats(updated);
    }

    // ============================================================
    // 3.9 CHẶN LỊCH XE (POST /cars/:id/blocked-dates)
    // ============================================================

    @Override
    @Transactional
    public CarBlockedDate blockDates(Long carId, Long ownerId, BlockedDateRequest request) {
        log.info("Block dates for car {} by owner {}: {} -> {}", carId, ownerId, request.getStartDate(), request.getEndDate());

        Car car = getCarEntityById(carId);

        if (!car.getOwnerId().equals(ownerId)) {
            User caller = userRepository.findById(ownerId).orElse(null);
            if (caller == null || caller.getRole() != Role.ADMIN) {
                throw new UnauthorizedException(ErrorCode.CAR_NOT_OWNED);
            }
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException(ErrorCode.INVALID_BOOKING_DATES, "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }

        CarBlockedDate blockedDate = CarBlockedDate.builder()
                .carId(carId)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason() != null ? request.getReason() : "maintenance")
                .note(request.getNote())
                .build();

        return carBlockedDateRepository.save(blockedDate);
    }
}