package com.carrental.handover.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
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

    // ===== BẢNG PHÍ VƯỢT GIỜ (theo spec UC-C12) =====
    private static final long FREE_MINUTES = 15L;           // < 15p: miễn
    private static final long HOURLY_THRESHOLD = 60L;       // 15p-1h: 100k/h
    private static final long HALF_DAY_THRESHOLD = 240L;    // 1h-4h: 50% giá ngày
    private static final long FULL_DAY_THRESHOLD = 1440L;   // 4h-24h: 100% giá ngày

    // Timezone constants
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    // ===== CREATE =====

    @Override
    @Transactional
    public HandoverResponse createHandover(Long userId, HandoverRequest request) {
        log.info("User {} creating handover for booking {}, type {}",
                userId, request.getBookingId(), request.getHandoverType());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        // ===== CHECK QUYỀN: Chỉ OWNER tạo =====
        if (!booking.getOwnerId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Chỉ chủ xe mới có thể tạo biên bản");
        }

        // ===== CHECK TRẠNG THÁI BOOKING =====
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

        // ===== CHECK ĐÃ TỒN TẠI CHƯA =====
        if (handoverRepository.existsByBookingIdAndHandoverType(
                request.getBookingId(), type)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Biên bản loại này đã tồn tại cho đơn này");
        }

        // ===== VALIDATE KM =====
        if (request.getKmReading() == null || request.getKmReading() < 0) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Số km không hợp lệ");
        }

        // ===== VALIDATE FUEL LEVEL =====
        if (request.getFuelLevel() != null
                && (request.getFuelLevel() < 0 || request.getFuelLevel() > 100)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Mức xăng phải từ 0 đến 100");
        }

        // ===== UC-C12: TÍNH PHÍ VƯỢT GIỜ (chỉ RETURN) =====
        LocalDateTime actualReturnTime = null;
        BigDecimal lateFee = BigDecimal.ZERO;
        int lateMinutes = 0;

        if ("RETURN".equalsIgnoreCase(type)) {
            // Nếu owner không nhập → dùng thời điểm hiện tại
            actualReturnTime = request.getActualReturnTime() != null
                    ? request.getActualReturnTime()
                    : LocalDateTime.now();

            LateFeeResult result = calculateLateFee(booking, actualReturnTime);
            lateFee = result.fee;
            lateMinutes = result.minutesLate;

            log.info("Late fee calculated for booking {}: {} minutes late → {}đ",
                    booking.getId(), lateMinutes, lateFee);
        }

        // ===== TẠO RECORD =====
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
                .status(HandoverStatus.PENDING)
                .build();

        HandoverRecord saved = handoverRepository.save(record);
        log.info("Handover created: id={}, lateFee={}", saved.getId(), saved.getLateFee());

        // ===== LƯU ẢNH =====
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<HandoverImage> images = request.getImages().stream()
                    .map(img -> HandoverImage.builder()
                            .handoverId(saved.getId())
                            .imageUrl(img.getImageUrl())
                            .imageType(img.getImageType() != null ? img.getImageType() : "OTHER")
                            .note(img.getNote())
                            .build())
                    .toList();
            imageRepository.saveAll(images);
        }

        // ===== THÔNG BÁO CHO KHÁCH =====
        try {
            String typeLabel = "PICKUP".equals(type) ? "giao xe" : "nhận xe";
            String lateNote = lateFee.compareTo(BigDecimal.ZERO) > 0
                    ? String.format(" (có phí trả muộn %sđ)", formatMoney(lateFee))
                    : "";

            notificationService.createNotification(
                    booking.getCustomerId(),
                    NotificationType.SYSTEM,
                    "Có biên bản " + typeLabel + " cần ký",
                    String.format("Chủ xe đã tạo biên bản %s cho đơn #%d%s. Vui lòng vào ký xác nhận.",
                            typeLabel, booking.getId(), lateNote),
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
        return records.stream()
                .map(r -> buildResponse(r, userId))
                .toList();
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

        // ===== CHECK QUYỀN + GÁN CHỮ KÝ =====
        if ("OWNER".equalsIgnoreCase(role)) {
            if (!booking.getOwnerId().equals(userId)) {
                throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                        "Bạn không phải chủ xe của đơn này");
            }
            if (record.getOwnerSignature() != null) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Bạn đã ký rồi");
            }
            record.setOwnerSignature(signatureUrl);
            record.setOwnerSignedAt(LocalDateTime.now());

        } else if ("CUSTOMER".equalsIgnoreCase(role)) {
            if (!booking.getCustomerId().equals(userId)) {
                throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                        "Bạn không phải khách thuê của đơn này");
            }
            if (record.getCustomerSignature() != null) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Bạn đã ký rồi");
            }
            record.setCustomerSignature(signatureUrl);
            record.setCustomerSignedAt(LocalDateTime.now());

        } else {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Role không hợp lệ");
        }

        // ===== NẾU ĐỦ 2 CHỮ KÝ → HOÀN TẤT =====
        if (record.getOwnerSignature() != null && record.getCustomerSignature() != null) {
            record.setStatus(HandoverStatus.SIGNED);
            record.setRecordHash(generateHash(record));

            // ===== UPDATE BOOKING STATUS =====
            if ("PICKUP".equals(record.getHandoverType())) {
                booking.setStatus(BookingStatus.RENTED);
                log.info("Booking {} status updated to RENTED", booking.getId());
            } else if ("RETURN".equals(record.getHandoverType())) {
                booking.setStatus(BookingStatus.RETURNED);
                booking.setActualReturnDate(record.getActualReturnTime());

                long oldTotal = booking.getTotalPrice();
                long newTotal = oldTotal;
                StringBuilder feeLog = new StringBuilder();

                // ===== UC-C12: Cộng phí vượt giờ =====
                if (record.getLateFee() != null
                        && record.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
                    newTotal += record.getLateFee().longValue();
                    feeLog.append("+late:").append(record.getLateFee()).append(" ");
                }

                // ===== Cộng phí phát sinh (vệ sinh, xăng, ...) =====
                if (record.getExtraFees() != null
                        && record.getExtraFees().compareTo(BigDecimal.ZERO) > 0) {
                    newTotal += record.getExtraFees().longValue();
                    feeLog.append("+extra:").append(record.getExtraFees()).append(" ");
                }

                if (newTotal != oldTotal) {
                    booking.setTotalPrice(newTotal);
                    log.info("Booking {} total updated: {} → {} ({})",
                            booking.getId(), oldTotal, newTotal, feeLog.toString().trim());
                }

                log.info("Booking {} status updated to RETURNED, actualReturnDate={}",
                        booking.getId(), booking.getActualReturnDate());
            }
            bookingRepository.save(booking);

            // ===== THÔNG BÁO 2 BÊN =====
            try {
                String typeLabel = "PICKUP".equals(record.getHandoverType())
                        ? "giao xe" : "nhận xe";
                StringBuilder msgBuilder = new StringBuilder();
                msgBuilder.append(String.format("Biên bản %s đơn #%d đã được 2 bên ký.",
                        typeLabel, booking.getId()));

                if (record.getLateFee() != null
                        && record.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
                    msgBuilder.append(String.format(" Phí trả muộn: %sđ.",
                            formatMoney(record.getLateFee())));
                }
                if (record.getExtraFees() != null
                        && record.getExtraFees().compareTo(BigDecimal.ZERO) > 0) {
                    msgBuilder.append(String.format(" Phí phát sinh: %sđ.",
                            formatMoney(record.getExtraFees())));
                }

                String msg = msgBuilder.toString();

                notificationService.createNotification(
                        booking.getOwnerId(),
                        NotificationType.SYSTEM,
                        "Biên bản đã hoàn tất",
                        msg, record.getId()
                );
                notificationService.createNotification(
                        booking.getCustomerId(),
                        NotificationType.SYSTEM,
                        "Biên bản đã hoàn tất",
                        msg, record.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send notification: {}", e.getMessage());
            }
        } else {
            // ===== CHỈ 1 BÊN KÝ → THÔNG BÁO BÊN CÒN LẠI =====
            try {
                Long notifyUserId = "OWNER".equalsIgnoreCase(role)
                        ? booking.getCustomerId()
                        : booking.getOwnerId();

                notificationService.createNotification(
                        notifyUserId,
                        NotificationType.SYSTEM,
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

    // ===== UC-C12: HELPER TÍNH PHÍ VƯỢT GIỜ =====

    /**
     * Tính phí vượt giờ theo bảng 5 mức:
     *   <15 phút           → miễn
     *   15 phút - 1 giờ    → 100.000đ/giờ (config)
     *   1h - 4h            → 50% giá thuê 1 ngày
     *   4h - 24h           → 100% giá thuê 1 ngày
     *   > 24h              → giá thuê 1 ngày + 20% phạt
     *
     * FIX TIMEZONE: DB lưu UTC (PostgreSQL default), Java đọc LocalDateTime
     * → Convert endDate từ UTC sang VN trước khi so sánh với actualReturnTime.
     */
    private LateFeeResult calculateLateFee(Booking booking, LocalDateTime actualReturnTime) {
        if (actualReturnTime == null || booking.getEndDate() == null) {
            return new LateFeeResult(BigDecimal.ZERO, 0);
        }

        // ⚠️ FIX TIMEZONE: end_date trong DB lưu UTC → convert sang VN
        LocalDateTime endDateVN = booking.getEndDate()
                .atZone(ZoneOffset.UTC)
                .withZoneSameInstant(VN_ZONE)
                .toLocalDateTime();

        log.info("TZ FIX: endDate(raw/UTC)={}, endDate(VN)={}, actual={}",
                booking.getEndDate(), endDateVN, actualReturnTime);

        long minutesLate = Duration.between(endDateVN, actualReturnTime).toMinutes();
        if (minutesLate <= 0) {
            return new LateFeeResult(BigDecimal.ZERO, 0);
        }

        int minutes = (int) minutesLate;

        long pricePerDay = getPricePerDay(booking);
        BigDecimal feePerHour = configHelper.getLateFeePerHour();

        // ===== ÁP DỤNG BẢNG PHÍ =====

        // 1. < 15 phút: miễn
        if (minutes < FREE_MINUTES) {
            return new LateFeeResult(BigDecimal.ZERO, minutes);
        }

        // 2. 15 phút - 1 giờ: feePerHour
        if (minutes < HOURLY_THRESHOLD) {
            return new LateFeeResult(feePerHour, minutes);
        }

        // 3. 1h - 4h: 50% giá ngày
        if (minutes < HALF_DAY_THRESHOLD) {
            long fee = pricePerDay / 2;
            return new LateFeeResult(BigDecimal.valueOf(fee), minutes);
        }

        // 4. 4h - 24h: 100% giá ngày
        if (minutes < FULL_DAY_THRESHOLD) {
            return new LateFeeResult(BigDecimal.valueOf(pricePerDay), minutes);
        }

        // 5. > 24h: giá ngày + 20% phạt
        long fee = pricePerDay + (pricePerDay * 20 / 100);
        return new LateFeeResult(BigDecimal.valueOf(fee), minutes);
    }

    private long getPricePerDay(Booking booking) {
        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        if (car == null) {
            return 1_000_000L;
        }
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

        Booking booking = bookingRepository.findById(record.getBookingId()).orElse(null);
        if (booking != null) {
            response.setBookingStatus(booking.getStatus().name());

            // ===== NẾU LÀ RETURN, LẤY KM LÚC PICKUP =====
            if ("RETURN".equals(record.getHandoverType())) {
                handoverRepository.findByBookingIdAndHandoverType(
                        record.getBookingId(), "PICKUP"
                ).ifPresent(pickup -> {
                    response.setPickupKmReading(pickup.getKmReading());
                    if (pickup.getKmReading() != null && record.getKmReading() != null) {
                        response.setKmDriven(record.getKmReading() - pickup.getKmReading());
                    }
                });

                // ===== UC-C12: MÔ TẢ PHÍ VƯỢT GIỜ =====
                if (record.getLateMinutes() != null && record.getLateMinutes() > 0
                        && record.getLateFee() != null
                        && record.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
                    response.setLateFee(record.getLateFee());
                    response.setLateMinutes(record.getLateMinutes());
                    response.setActualReturnTime(record.getActualReturnTime());
                    response.setLateFeeBreakdown(buildLateFeeBreakdown(record));
                }
            }

            // ===== QUYỀN CỦA USER HIỆN TẠI =====
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

    // ===== INNER CLASS =====

    private record LateFeeResult(BigDecimal fee, int minutesLate) {}
}