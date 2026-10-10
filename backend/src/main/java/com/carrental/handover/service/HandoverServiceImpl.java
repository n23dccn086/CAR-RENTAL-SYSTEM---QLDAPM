package com.carrental.handover.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.RentalMode;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.handover.dto.HandoverMapper;
import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverResponse;
import com.carrental.handover.entity.HandoverImage;
import com.carrental.handover.entity.HandoverRecord;
import com.carrental.handover.entity.HandoverStatus;
import com.carrental.handover.repository.HandoverImageRepository;
import com.carrental.handover.repository.HandoverRecordRepository;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class HandoverServiceImpl implements HandoverService {

    HandoverRecordRepository handoverRepository;
    HandoverImageRepository imageRepository;
    BookingRepository bookingRepository;
    CarRepository carRepository;
    HandoverMapper handoverMapper;
    NotificationService notificationService;
    ConfigHelper configHelper;
    com.carrental.common.service.FileStorageService fileStorageService;

    private static final long FREE_MINUTES = 15L;
    private static final long HOURLY_THRESHOLD = 60L;
    private static final long HALF_DAY_THRESHOLD = 240L;
    private static final long FULL_DAY_THRESHOLD = 1440L;

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    // ===== CREATE =====

    @Override
    @Transactional
    public HandoverResponse createHandover(Long userId, HandoverRequest request) {
        log.info("User {} creating handover for booking {}, type {}",
                userId, request.getBookingId(), request.getHandoverType());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getOwnerId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Chỉ chủ xe mới có thể tạo biên bản");
        }

        String type = request.getHandoverType();
        if ("PICKUP".equalsIgnoreCase(type)) {
            if (booking.getStatus() != BookingStatus.APPROVED) {
                throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID,
                        "Chỉ tạo biên bản giao xe khi đơn ở trạng thái APPROVED");
            }
        } else if ("RETURN".equalsIgnoreCase(type)) {
            if (booking.getStatus() != BookingStatus.RENTED) {
                throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID,
                        "Chỉ tạo biên bản nhận xe khi đơn ở trạng thái RENTED");
            }
        } else {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Loại biên bản phải là PICKUP hoặc RETURN");
        }

        if (handoverRepository.existsByBookingIdAndHandoverType(
                request.getBookingId(), type)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Biên bản loại này đã tồn tại cho đơn này");
        }

        if (request.getKmReading() == null || request.getKmReading() < 0) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Số km không hợp lệ");
        }

        if (request.getFuelLevel() != null
                && (request.getFuelLevel() < 0 || request.getFuelLevel() > 100)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Mức xăng phải từ 0 đến 100");
        }

        LocalDateTime actualReturnTime = null;
        BigDecimal lateFee = BigDecimal.ZERO;
        int lateMinutes = 0;

        Integer kmDriven = null;
        Integer kmAllowed = null;
        int kmOverage = 0;
        BigDecimal kmOverageFee = BigDecimal.ZERO;

        if ("RETURN".equalsIgnoreCase(type)) {
            actualReturnTime = request.getActualReturnTime() != null
                    ? request.getActualReturnTime()
                    : LocalDateTime.now();
            LateFeeResult result = calculateLateFee(booking, actualReturnTime);
            lateFee = result.fee;
            lateMinutes = result.minutesLate;

            log.info("Late fee calculated for booking {}: {} minutes → {}đ",
                    booking.getId(), lateMinutes, lateFee);

            if (booking.getRentalMode() == RentalMode.SELF_DRIVE) {
                HandoverRecord pickupRecord = handoverRepository
                        .findByBookingIdAndHandoverType(booking.getId(), "PICKUP")
                        .orElse(null);

                if (pickupRecord != null && pickupRecord.getKmReading() != null) {
                    KmOverageResult kmResult = calculateKmOverage(
                            booking, pickupRecord.getKmReading(), request.getKmReading());

                    kmDriven = kmResult.kmDriven;
                    kmAllowed = kmResult.kmAllowed;
                    kmOverage = kmResult.kmOverage;
                    kmOverageFee = kmResult.fee;

                    log.info("Km overage for booking {}: driven={}, allowed={}, over={}, fee={}đ",
                            booking.getId(), kmDriven, kmAllowed, kmOverage, kmOverageFee);
                }
            }
        }

        HandoverRecord record = HandoverRecord.builder()
                .bookingId(request.getBookingId())
                .handoverType(type.toUpperCase())
                .kmReading(request.getKmReading())
                .fuelLevel(request.getFuelLevel())
                .exteriorNote(request.getExteriorNote())
                .interiorNote(request.getInteriorNote())
                .damages(request.getDamages())
                .extraFees(request.getExtraFees())
                .extraFeesNote(request.getExtraFeesNote())
                .actualReturnTime(actualReturnTime)
                .lateFee(lateFee)
                .lateMinutes(lateMinutes)
                .kmDriven(kmDriven)
                .kmAllowed(kmAllowed)
                .kmOverage(kmOverage)
                .kmOverageFee(kmOverageFee)
                .status(HandoverStatus.PENDING)
                .build();

        if (request.getSignature() != null && !request.getSignature().isBlank()) {
            if (booking.getOwnerId().equals(userId)) {
                record.setOwnerSignature(request.getSignature());
                record.setOwnerSignedAt(LocalDateTime.now());
            } else if (booking.getCustomerId().equals(userId)) {
                record.setCustomerSignature(request.getSignature());
                record.setCustomerSignedAt(LocalDateTime.now());
            }
        }

        HandoverRecord saved = handoverRepository.save(record);
        if (saved.getOwnerSignature() != null || saved.getCustomerSignature() != null) {
            saved.setRecordHash(generateHash(saved));
            saved = handoverRepository.save(saved);
        }
        log.info("Handover created: id={}, lateFee={}, kmOverageFee={}",
                saved.getId(), saved.getLateFee(), saved.getKmOverageFee());

        final Long savedId = saved.getId();
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<HandoverImage> images = request.getImages().stream()
                    .map(img -> HandoverImage.builder()
                            .handoverId(savedId)
                            .imageUrl(img.getImageUrl())
                            .imageType(img.getImageType() != null ? img.getImageType() : "OTHER")
                            .note(img.getNote())
                            .build())
                    .toList();
            imageRepository.saveAll(images);
        }

        // ★ Thông báo cho Customer
        try {
            String typeLabel = "PICKUP".equals(type) ? "giao xe" : "nhận xe";
            NotificationType notifType = "PICKUP".equals(type)
                    ? NotificationType.HANDOVER_PICKUP_CREATED
                    : NotificationType.HANDOVER_RETURN_CREATED;

            StringBuilder feeMsg = new StringBuilder();
            if (lateFee.compareTo(BigDecimal.ZERO) > 0) {
                feeMsg.append(String.format(" (phí trả muộn %sđ)", formatMoney(lateFee)));
            }
            if (kmOverageFee.compareTo(BigDecimal.ZERO) > 0) {
                feeMsg.append(String.format(" (phí vượt %d km: %sđ)",
                        kmOverage, formatMoney(kmOverageFee)));
            }

            notificationService.createNotification(
                    booking.getCustomerId(),
                    notifType,
                    "Có biên bản " + typeLabel + " cần ký",
                    String.format("Chủ xe đã tạo biên bản %s cho đơn #%d%s. Vui lòng vào ký xác nhận.",
                            typeLabel, booking.getId(), feeMsg.toString()),
                    saved.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        return buildResponse(saved, userId);
    }

    // ===== READ =====

    @Override
    public HandoverResponse getHandoverById(Long id, Long userId) {
        HandoverRecord record = getEntityById(id);
        checkUserInBooking(record.getBookingId(), userId);
        return buildResponse(record, userId);
    }

    @Override
    public List<HandoverResponse> getHandoversByBooking(Long bookingId, Long userId) {
        checkUserInBooking(bookingId, userId);
        List<HandoverRecord> records = handoverRepository.findByBookingId(bookingId);
        return records.stream().map(r -> buildResponse(r, userId)).toList();
    }

    // ===== SIGN =====

    @Override
    @Transactional
    public HandoverResponse signHandover(Long id, Long userId, String role, String signatureUrl) {
        log.info("User {} signing handover {} as {}", userId, id, role);

        if (signatureUrl == null || signatureUrl.isBlank()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Chữ ký không hợp lệ");
        }

        HandoverRecord record = getEntityById(id);
        Booking booking = bookingRepository.findById(record.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (record.getStatus() == HandoverStatus.CANCELLED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Biên bản đã bị hủy");
        }

        if ("OWNER".equalsIgnoreCase(role)) {
            if (!booking.getOwnerId().equals(userId)) {
                throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
            }
            if (record.getOwnerSignature() != null) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Bạn đã ký rồi");
            }
            record.setOwnerSignature(signatureUrl);
            record.setOwnerSignedAt(LocalDateTime.now());
        } else if ("CUSTOMER".equalsIgnoreCase(role)) {
            if (!booking.getCustomerId().equals(userId)) {
                throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
            }
            if (record.getCustomerSignature() != null) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Bạn đã ký rồi");
            }
            record.setCustomerSignature(signatureUrl);
            record.setCustomerSignedAt(LocalDateTime.now());
        } else {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Role không hợp lệ");
        }

        if (record.getOwnerSignature() != null && record.getCustomerSignature() != null) {
            record.setStatus(HandoverStatus.SIGNED);
            record.setRecordHash(generateHash(record));

            if ("PICKUP".equals(record.getHandoverType())) {
                booking.setStatus(BookingStatus.RENTED);
                log.info("Booking {} → RENTED", booking.getId());
            } else if ("RETURN".equals(record.getHandoverType())) {
                booking.setStatus(BookingStatus.RETURNED);
                booking.setActualReturnDate(record.getActualReturnTime());

                long oldTotal = booking.getTotalPrice();
                long newTotal = oldTotal;

                if (record.getLateFee() != null
                        && record.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
                    newTotal += record.getLateFee().longValue();
                }
                if (record.getKmOverageFee() != null
                        && record.getKmOverageFee().compareTo(BigDecimal.ZERO) > 0) {
                    newTotal += record.getKmOverageFee().longValue();
                }
                if (record.getExtraFees() != null
                        && record.getExtraFees().compareTo(BigDecimal.ZERO) > 0) {
                    newTotal += record.getExtraFees().longValue();
                }

                if (newTotal != oldTotal) {
                    booking.setTotalPrice(newTotal);
                    booking.setRemainingAmount(newTotal - booking.getDepositAmount());
                }

                log.info("Booking {} → RETURNED", booking.getId());
            }
            bookingRepository.save(booking);

            // ★ Thông báo 2 bên — dùng đúng type
            try {
                String typeLabel = "PICKUP".equals(record.getHandoverType()) ? "giao xe" : "nhận xe";
                NotificationType signedType = "PICKUP".equals(record.getHandoverType())
                        ? NotificationType.HANDOVER_PICKUP_SIGNED
                        : NotificationType.HANDOVER_RETURN_SIGNED;

                StringBuilder msgBuilder = new StringBuilder();
                msgBuilder.append(String.format("Biên bản %s đơn #%d đã được 2 bên ký.",
                        typeLabel, booking.getId()));

                if (record.getLateFee() != null
                        && record.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
                    msgBuilder.append(String.format(" Phí trả muộn: %sđ.",
                            formatMoney(record.getLateFee())));
                }
                if (record.getKmOverageFee() != null
                        && record.getKmOverageFee().compareTo(BigDecimal.ZERO) > 0) {
                    msgBuilder.append(String.format(" Phí vượt km (%d km): %sđ.",
                            record.getKmOverage(), formatMoney(record.getKmOverageFee())));
                }
                if (record.getExtraFees() != null
                        && record.getExtraFees().compareTo(BigDecimal.ZERO) > 0) {
                    msgBuilder.append(String.format(" Phí phát sinh: %sđ.",
                            formatMoney(record.getExtraFees())));
                }

                String msg = msgBuilder.toString();

                notificationService.createNotification(
                        booking.getOwnerId(), signedType,
                        "Biên bản đã hoàn tất", msg, record.getId());
                notificationService.createNotification(
                        booking.getCustomerId(), signedType,
                        "Biên bản đã hoàn tất", msg, record.getId());
            } catch (Exception e) {
                log.warn("Failed to send notification: {}", e.getMessage());
            }
        } else {
            try {
                Long notifyUserId = "OWNER".equalsIgnoreCase(role)
                        ? booking.getCustomerId()
                        : booking.getOwnerId();

                NotificationType pendingType = "PICKUP".equals(record.getHandoverType())
                        ? NotificationType.HANDOVER_PICKUP_CREATED
                        : NotificationType.HANDOVER_RETURN_CREATED;

                notificationService.createNotification(
                        notifyUserId, pendingType,
                        "Đối phương đã ký biên bản",
                        String.format("Đối phương đã ký biên bản đơn #%d. Vui lòng ký xác nhận.",
                                booking.getId()),
                        record.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send notification: {}", e.getMessage());
            }
        }

        HandoverRecord updated = handoverRepository.save(record);
        return buildResponse(updated, userId);
    }

    // ===== CALCULATIONS =====

    private LateFeeResult calculateLateFee(Booking booking, LocalDateTime actualReturnTime) {
        if (actualReturnTime == null || booking.getEndDate() == null) {
            return new LateFeeResult(BigDecimal.ZERO, 0);
        }

        LocalDateTime endDateVN = booking.getEndDate()
                .atZone(ZoneOffset.UTC)
                .withZoneSameInstant(VN_ZONE)
                .toLocalDateTime();

        long minutesLate = Duration.between(endDateVN, actualReturnTime).toMinutes();
        if (minutesLate <= 0) {
            return new LateFeeResult(BigDecimal.ZERO, 0);
        }

        int minutes = (int) minutesLate;
        long pricePerDay = getPricePerDay(booking);
        BigDecimal feePerHour = configHelper.getLateFeePerHour();

        if (minutes < FREE_MINUTES) {
            return new LateFeeResult(BigDecimal.ZERO, minutes);
        }
        if (minutes < HOURLY_THRESHOLD) {
            return new LateFeeResult(feePerHour, minutes);
        }
        if (minutes < HALF_DAY_THRESHOLD) {
            long fee = pricePerDay / 2;
            return new LateFeeResult(BigDecimal.valueOf(fee), minutes);
        }
        if (minutes < FULL_DAY_THRESHOLD) {
            return new LateFeeResult(BigDecimal.valueOf(pricePerDay), minutes);
        }

        long fee = pricePerDay + (pricePerDay * 20 / 100);
        return new LateFeeResult(BigDecimal.valueOf(fee), minutes);
    }

    private KmOverageResult calculateKmOverage(
            Booking booking, int pickupKm, int returnKm) {

        int kmDriven = returnKm - pickupKm;
        if (kmDriven <= 0) {
            return new KmOverageResult(0, 0, 0, BigDecimal.ZERO);
        }

        int rentalDays = calculateRentalDays(booking);
        int kmPerDay = configHelper.getDefaultKmPerDay();
        int kmAllowed = kmPerDay * rentalDays;

        if (kmDriven <= kmAllowed) {
            return new KmOverageResult(kmDriven, kmAllowed, 0, BigDecimal.ZERO);
        }

        int kmOver = kmDriven - kmAllowed;

        int limit1 = configHelper.getKmOverageBracket1Limit();
        BigDecimal price1 = configHelper.getKmOverageBracket1Price();

        int limit2 = configHelper.getKmOverageBracket2Limit();
        BigDecimal price2 = configHelper.getKmOverageBracket2Price();

        BigDecimal price3 = configHelper.getKmOverageBracket3Price();

        BigDecimal totalFee;

        if (kmOver <= limit1) {
            totalFee = BigDecimal.valueOf(kmOver).multiply(price1);
        } else if (kmOver <= limit2) {
            totalFee = BigDecimal.valueOf(limit1).multiply(price1)
                    .add(BigDecimal.valueOf(kmOver - limit1).multiply(price2));
        } else {
            totalFee = BigDecimal.valueOf(limit1).multiply(price1)
                    .add(BigDecimal.valueOf(limit2 - limit1).multiply(price2))
                    .add(BigDecimal.valueOf(kmOver - limit2).multiply(price3));
        }

        return new KmOverageResult(kmDriven, kmAllowed, kmOver, totalFee);
    }

    private int calculateRentalDays(Booking booking) {
        long hours = Duration.between(
                booking.getStartDate(), booking.getEndDate()).toHours();
        return Math.max(1, (int) Math.ceil(hours / 24.0));
    }

    private long getPricePerDay(Booking booking) {
        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        if (car == null) return 1_000_000L;
        if (booking.getStartDate() != null && car.getPriceWeekend() != null
                && car.getPriceWeekend() > 0) {
            int dow = booking.getStartDate().getDayOfWeek().getValue();
            if (dow == 6 || dow == 7) {
                return car.getPriceWeekend();
            }
        }
        return car.getPricePerDay() != null ? car.getPricePerDay() : 1_000_000L;
    }

    // ===== HELPER =====

    private HandoverRecord getEntityById(Long id) {
        return handoverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.VALIDATION_ERROR, "Không tìm thấy biên bản"));
    }

    private void checkUserInBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        boolean isOwner = booking.getOwnerId().equals(userId);
        boolean isCustomer = booking.getCustomerId().equals(userId);
        if (!isOwner && !isCustomer) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền truy cập biên bản này");
        }
    }

    private HandoverResponse buildResponse(HandoverRecord record, Long userId) {
        List<HandoverImage> images = imageRepository.findByHandoverId(record.getId());
        HandoverResponse response = handoverMapper.toResponse(record, images);

        response.setKmDriven(record.getKmDriven());
        response.setKmAllowed(record.getKmAllowed());
        response.setKmOverage(record.getKmOverage());
        response.setKmOverageFee(record.getKmOverageFee());

        if (record.getKmOverage() != null && record.getKmOverage() > 0) {
            response.setKmOverageBreakdown(buildKmOverageBreakdown(record));
        }

        Booking booking = bookingRepository.findById(record.getBookingId()).orElse(null);
        if (booking != null) {
            response.setBookingStatus(booking.getStatus().name());

            if ("RETURN".equals(record.getHandoverType())) {
                handoverRepository.findByBookingIdAndHandoverType(
                        record.getBookingId(), "PICKUP"
                ).ifPresent(pickup -> {
                    response.setPickupKmReading(pickup.getKmReading());
                    if (pickup.getKmReading() != null && record.getKmReading() != null) {
                        response.setKmDriven(record.getKmReading() - pickup.getKmReading());
                    }
                });

                if (record.getLateMinutes() != null && record.getLateMinutes() > 0
                        && record.getLateFee() != null
                        && record.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
                    response.setLateFeeBreakdown(buildLateFeeBreakdown(record));
                }
            }

            boolean isOwner = booking.getOwnerId().equals(userId);
            boolean isCustomer = booking.getCustomerId().equals(userId);

            boolean canSign = record.getStatus() == HandoverStatus.PENDING
                    && ((isOwner && record.getOwnerSignature() == null)
                        || (isCustomer && record.getCustomerSignature() == null));
            response.setCanSign(canSign);

            boolean canCreate = isOwner
                    && record.getStatus() == HandoverStatus.PENDING
                    && record.getOwnerSignature() == null;
            response.setCanCreate(canCreate);
        }

        return response;
    }

    private String buildLateFeeBreakdown(HandoverRecord record) {
        int minutes = record.getLateMinutes() != null ? record.getLateMinutes() : 0;
        int hours = minutes / 60;
        int mins = minutes % 60;

        String timeStr = hours > 0
                ? String.format("%dh%02dp", hours, mins)
                : String.format("%dp", mins);

        return String.format("Trả muộn %s → Phí: %sđ", timeStr, formatMoney(record.getLateFee()));
    }

    private String buildKmOverageBreakdown(HandoverRecord record) {
        int kmOver = record.getKmOverage() != null ? record.getKmOverage() : 0;
        int kmDriven = record.getKmDriven() != null ? record.getKmDriven() : 0;
        int kmAllowed = record.getKmAllowed() != null ? record.getKmAllowed() : 0;

        int limit1 = configHelper.getKmOverageBracket1Limit();
        int limit2 = configHelper.getKmOverageBracket2Limit();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Đã chạy %d km, được phép %d km, vượt %d km:\n",
                kmDriven, kmAllowed, kmOver));

        if (kmOver <= limit1) {
            sb.append(String.format("  • %d km × %sđ = %sđ",
                    kmOver,
                    formatMoney(configHelper.getKmOverageBracket1Price()),
                    formatMoney(record.getKmOverageFee())));
        } else if (kmOver <= limit2) {
            BigDecimal fee1 = BigDecimal.valueOf(limit1)
                    .multiply(configHelper.getKmOverageBracket1Price());
            BigDecimal fee2 = BigDecimal.valueOf(kmOver - limit1)
                    .multiply(configHelper.getKmOverageBracket2Price());
            sb.append(String.format("  • Bậc 1: %d km × %sđ = %sđ\n",
                    limit1,
                    formatMoney(configHelper.getKmOverageBracket1Price()),
                    formatMoney(fee1)));
            sb.append(String.format("  • Bậc 2: %d km × %sđ = %sđ",
                    kmOver - limit1,
                    formatMoney(configHelper.getKmOverageBracket2Price()),
                    formatMoney(fee2)));
        } else {
            BigDecimal fee1 = BigDecimal.valueOf(limit1)
                    .multiply(configHelper.getKmOverageBracket1Price());
            BigDecimal fee2 = BigDecimal.valueOf(limit2 - limit1)
                    .multiply(configHelper.getKmOverageBracket2Price());
            BigDecimal fee3 = BigDecimal.valueOf(kmOver - limit2)
                    .multiply(configHelper.getKmOverageBracket3Price());
            sb.append(String.format("  • Bậc 1: %d km × %sđ = %sđ\n",
                    limit1,
                    formatMoney(configHelper.getKmOverageBracket1Price()),
                    formatMoney(fee1)));
            sb.append(String.format("  • Bậc 2: %d km × %sđ = %sđ\n",
                    limit2 - limit1,
                    formatMoney(configHelper.getKmOverageBracket2Price()),
                    formatMoney(fee2)));
            sb.append(String.format("  • Bậc 3: %d km × %sđ = %sđ",
                    kmOver - limit2,
                    formatMoney(configHelper.getKmOverageBracket3Price()),
                    formatMoney(fee3)));
        }

        return sb.toString();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount.setScale(0, RoundingMode.DOWN).longValue());
    }

    private String generateHash(HandoverRecord record) {
        try {
            String raw = record.getId() + "|" + record.getBookingId() + "|"
                    + record.getHandoverType() + "|" + record.getOwnerSignature()
                    + "|" + record.getCustomerSignature();
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private record LateFeeResult(BigDecimal fee, int minutesLate) {}
    private record KmOverageResult(int kmDriven, int kmAllowed, int kmOverage, BigDecimal fee) {}

    // ===== CONTRACT MODULE 6: HANDOVER IMPLEMENTATION =====

    @Override
    @Transactional
    public java.util.Map<String, Object> createPickupHandover(
            Long userId,
            com.carrental.handover.dto.HandoverPickupRequest request,
            List<org.springframework.web.multipart.MultipartFile> imageFiles) {

        log.info("createPickupHandover: user={}, booking={}", userId, request.getBookingId());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getOwnerId().equals(userId) && !booking.getCustomerId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền tạo biên bản cho đơn này");
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID,
                    "Chỉ tạo biên bản giao xe khi đơn ở trạng thái APPROVED");
        }

        if (handoverRepository.existsByBookingIdAndHandoverType(request.getBookingId(), "PICKUP")) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Biên bản giao xe đã tồn tại cho đơn này");
        }

        if (request.getKmReading() == null || request.getKmReading() < 0) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Số km không hợp lệ");
        }

        if (request.getFuelLevel() != null
                && (request.getFuelLevel() < 0 || request.getFuelLevel() > 100)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Mức xăng phải từ 0 đến 100");
        }

        HandoverRecord record = HandoverRecord.builder()
                .bookingId(request.getBookingId())
                .handoverType("PICKUP")
                .kmReading(request.getKmReading())
                .fuelLevel(request.getFuelLevel())
                .exteriorNote(request.getExteriorNote())
                .interiorNote(request.getInteriorNote())
                .damages(request.getDamages())
                .status(HandoverStatus.PENDING)
                .build();

        if (request.getSignature() != null && !request.getSignature().isBlank()) {
            if (booking.getOwnerId().equals(userId)) {
                record.setOwnerSignature(request.getSignature());
                record.setOwnerSignedAt(LocalDateTime.now());
            } else {
                record.setCustomerSignature(request.getSignature());
                record.setCustomerSignedAt(LocalDateTime.now());
            }
        }

        HandoverRecord saved = handoverRepository.save(record);
        saved.setRecordHash(generateHash(saved));
        saved = handoverRepository.save(saved);

        // Lưu ảnh upload (multipart) nếu có
        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (org.springframework.web.multipart.MultipartFile file : imageFiles) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = fileStorageService.storeFile(file, "handovers/" + userId);
                        imageRepository.save(HandoverImage.builder()
                                .handoverId(saved.getId())
                                .imageUrl(url)
                                .imageType("PICKUP")
                                .build());
                    } catch (Exception e) {
                        log.warn("Failed to store handover pickup image: {}", e.getMessage());
                    }
                }
            }
        }

        // Lưu ảnh từ URL (nếu có từ JSON request)
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                if (url != null && !url.isBlank()) {
                    imageRepository.save(HandoverImage.builder()
                            .handoverId(saved.getId())
                            .imageUrl(url)
                            .imageType("PICKUP")
                            .build());
                }
            }
        }

        // Thông báo
        try {
            Long recipientId = booking.getOwnerId().equals(userId)
                    ? booking.getCustomerId()
                    : booking.getOwnerId();
            notificationService.createNotification(
                    recipientId,
                    NotificationType.HANDOVER_PICKUP_CREATED,
                    "Có biên bản giao xe cần xác nhận",
                    String.format("Biên bản giao xe cho đơn #%d đã được tạo. Vui lòng vào kiểm tra và ký xác nhận.", booking.getId()),
                    saved.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("handover_id", saved.getId());
        data.put("booking_id", saved.getBookingId());
        data.put("handover_type", "pickup");
        data.put("km_reading", saved.getKmReading());
        data.put("owner_signed_at", saved.getOwnerSignedAt());
        data.put("record_hash", saved.getRecordHash());
        data.put("message", "Chờ khách xác nhận");
        return data;
    }

    @Override
    @Transactional
    public java.util.Map<String, Object> createReturnHandover(
            Long userId,
            com.carrental.handover.dto.HandoverReturnRequest request,
            List<org.springframework.web.multipart.MultipartFile> imageFiles) {

        log.info("createReturnHandover: user={}, booking={}", userId, request.getBookingId());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getOwnerId().equals(userId) && !booking.getCustomerId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền tạo biên bản cho đơn này");
        }

        if (booking.getStatus() != BookingStatus.RENTED) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID,
                    "Chỉ tạo biên bản nhận xe khi đơn ở trạng thái RENTED");
        }

        if (handoverRepository.existsByBookingIdAndHandoverType(request.getBookingId(), "RETURN")) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Biên bản nhận xe đã tồn tại cho đơn này");
        }

        if (request.getKmReading() == null || request.getKmReading() < 0) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Số km không hợp lệ");
        }

        if (request.getFuelLevel() != null
                && (request.getFuelLevel() < 0 || request.getFuelLevel() > 100)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Mức xăng phải từ 0 đến 100");
        }

        LocalDateTime actualReturnTime = request.getActualReturnTime() != null
                ? request.getActualReturnTime()
                : LocalDateTime.now();

        LateFeeResult lateResult = calculateLateFee(booking, actualReturnTime);
        BigDecimal lateFee = lateResult.fee;
        int lateMinutes = lateResult.minutesLate;

        Integer kmDriven = null;
        Integer kmAllowed = null;
        int kmOverage = 0;
        BigDecimal kmOverageFee = BigDecimal.ZERO;

        if (booking.getRentalMode() == RentalMode.SELF_DRIVE) {
            HandoverRecord pickupRecord = handoverRepository
                    .findByBookingIdAndHandoverType(booking.getId(), "PICKUP")
                    .orElse(null);

            if (pickupRecord != null && pickupRecord.getKmReading() != null) {
                KmOverageResult kmResult = calculateKmOverage(
                        booking, pickupRecord.getKmReading(), request.getKmReading());

                kmDriven = kmResult.kmDriven;
                kmAllowed = kmResult.kmAllowed;
                kmOverage = kmResult.kmOverage;
                kmOverageFee = kmResult.fee;
            }
        }

        BigDecimal extraFees = request.getExtraFees() != null ? request.getExtraFees() : BigDecimal.ZERO;

        HandoverRecord record = HandoverRecord.builder()
                .bookingId(request.getBookingId())
                .handoverType("RETURN")
                .kmReading(request.getKmReading())
                .fuelLevel(request.getFuelLevel())
                .exteriorNote(request.getExteriorNote())
                .interiorNote(request.getInteriorNote())
                .damages(request.getDamages())
                .extraFees(extraFees)
                .extraFeesNote(request.getExtraFeesNote())
                .actualReturnTime(actualReturnTime)
                .lateFee(lateFee)
                .lateMinutes(lateMinutes)
                .kmDriven(kmDriven)
                .kmAllowed(kmAllowed)
                .kmOverage(kmOverage)
                .kmOverageFee(kmOverageFee)
                .status(HandoverStatus.PENDING)
                .build();

        if (request.getSignature() != null && !request.getSignature().isBlank()) {
            if (booking.getOwnerId().equals(userId)) {
                record.setOwnerSignature(request.getSignature());
                record.setOwnerSignedAt(LocalDateTime.now());
            } else {
                record.setCustomerSignature(request.getSignature());
                record.setCustomerSignedAt(LocalDateTime.now());
            }
        }

        HandoverRecord saved = handoverRepository.save(record);
        saved.setRecordHash(generateHash(saved));
        saved = handoverRepository.save(saved);

        // Lưu ảnh upload (multipart) nếu có
        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (org.springframework.web.multipart.MultipartFile file : imageFiles) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = fileStorageService.storeFile(file, "handovers/" + userId);
                        imageRepository.save(HandoverImage.builder()
                                .handoverId(saved.getId())
                                .imageUrl(url)
                                .imageType("RETURN")
                                .build());
                    } catch (Exception e) {
                        log.warn("Failed to store handover return image: {}", e.getMessage());
                    }
                }
            }
        }

        // Lưu ảnh từ URL (nếu có từ JSON request)
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                if (url != null && !url.isBlank()) {
                    imageRepository.save(HandoverImage.builder()
                            .handoverId(saved.getId())
                            .imageUrl(url)
                            .imageType("RETURN")
                            .build());
                }
            }
        }

        BigDecimal totalExtra = kmOverageFee.add(lateFee).add(extraFees);

        // Thông báo
        try {
            Long recipientId = booking.getOwnerId().equals(userId)
                    ? booking.getCustomerId()
                    : booking.getOwnerId();
            notificationService.createNotification(
                    recipientId,
                    NotificationType.HANDOVER_RETURN_CREATED,
                    "Có biên bản nhận xe cần xác nhận",
                    String.format("Biên bản nhận xe cho đơn #%d đã được tạo (tổng phụ phí: %sđ). Vui lòng vào kiểm tra và ký.",
                            booking.getId(), formatMoney(totalExtra)),
                    saved.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("handover_id", saved.getId());
        data.put("booking_id", saved.getBookingId());
        data.put("handover_type", "return");
        data.put("km_reading", saved.getKmReading());
        data.put("overage_km", saved.getKmOverage());
        data.put("overage_km_fee", saved.getKmOverageFee());
        data.put("late_fee", saved.getLateFee());
        data.put("extra_fees", saved.getExtraFees());
        data.put("total_extra", totalExtra);
        data.put("record_hash", saved.getRecordHash());
        return data;
    }

    @Override
    @Transactional
    public void confirmHandover(Long id, Long userId, String signature) {
        log.info("confirmHandover: id={}, user={}", id, userId);

        HandoverRecord record = getEntityById(id);
        Booking booking = bookingRepository.findById(record.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        String role;
        if (booking.getCustomerId().equals(userId)) {
            role = "CUSTOMER";
        } else if (booking.getOwnerId().equals(userId)) {
            role = "OWNER";
        } else {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED, "Bạn không thuộc đơn này");
        }

        signHandover(id, userId, role, signature);
    }
}