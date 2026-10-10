package com.carrental.booking.dto;

import com.carrental.booking.entity.BookingStatus;
import com.carrental.car.entity.RentalMode;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingResponse {

    Long id;
    Long customerId;
    Long carId;
    Long ownerId;

    String carName;
    String carPlate;
    String carThumbnail;
    String customerName;
    String customerPhone;
    String ownerName;
    String ownerPhone;

    LocalDateTime startDate;
    LocalDateTime endDate;
    LocalDateTime actualReturnDate;

    String pickupAddress;
    String returnAddress;

    RentalMode rentalMode;
    Long driverId;

    Long totalPrice;
    Long depositAmount;
    Long remainingAmount;

    BookingStatus status;

    // ★ % cọc đọc từ config
    Integer depositPercent;

    String customerNote;
    String ownerNote;
    String cancelReason;
    LocalDateTime cancelledAt;

    // ===== Refund fields =====
    @JsonProperty("refund_amount")
    Long refundAmount;

    @JsonProperty("refund_percent")
    Integer refundPercent;

    @JsonProperty("refund_policy")
    String refundPolicy;

    @JsonProperty("refund_required")
    Boolean refundRequired;

    // ===== Chi tiết phí =====
    BookingDetailResponse details;

    // ===== Phí phát sinh (từ handover RETURN) =====
    Long lateFee;
    Long kmOverageFee;
    Long extraFees;
    Long totalExtraFees;
    Integer lateMinutes;
    Integer kmDriven;
    Integer kmAllowed;
    Integer kmOverage;
    String extraFeesNote;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // ===== CONTRACT COMPATIBILITY GETTERS =====

    @JsonProperty("booking_id")
    public Long getBookingId() {
        return id;
    }

    @JsonProperty("booking_code")
    public String getBookingCode() {
        int year = (createdAt != null) ? createdAt.getYear() : 2026;
        long num = (id != null) ? id : 0L;
        return String.format("CR-%d-%04d", year, num);
    }

    @JsonProperty("status_name")
    public String getStatusName() {
        return status != null ? status.getDescription() : null;
    }

    @JsonProperty("contract_status")
    public String getContractStatus() {
        return status != null ? status.getContractCode() : null;
    }

    @JsonProperty("start_datetime")
    public LocalDateTime getStartDatetime() {
        return startDate;
    }

    @JsonProperty("end_datetime")
    public LocalDateTime getEndDatetime() {
        return endDate;
    }

    @JsonProperty("actual_return_at")
    public LocalDateTime getActualReturnAt() {
        return actualReturnDate;
    }

    @JsonProperty("pickup_location")
    public String getPickupLocation() {
        return pickupAddress;
    }

    @JsonProperty("dropoff_location")
    public String getDropoffLocation() {
        return returnAddress;
    }

    @JsonProperty("rental_type")
    public String getRentalType() {
        if (rentalMode == null) return null;
        return rentalMode == RentalMode.WITH_DRIVER ? "with_driver" : "self_drive";
    }

    @JsonProperty("payment_deadline")
    public LocalDateTime getPaymentDeadline() {
        return createdAt != null ? createdAt.plusHours(12) : null;
    }

    @JsonProperty("car")
    public Map<String, Object> getCar() {
        if (carId == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", carId);
        map.put("name", carName != null ? carName : "");
        map.put("plate_number", carPlate != null ? carPlate : "");
        if (carThumbnail != null) {
            map.put("thumbnail", carThumbnail);
        }
        return map;
    }

    @JsonProperty("customer")
    public Map<String, Object> getCustomer() {
        if (customerId == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", customerId);
        map.put("name", customerName != null ? customerName : "");
        if (customerPhone != null) {
            map.put("phone", customerPhone);
        }
        return map;
    }

    @JsonProperty("owner")
    public Map<String, Object> getOwner() {
        if (ownerId == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", ownerId);
        map.put("name", ownerName != null ? ownerName : "");
        if (ownerPhone != null) {
            map.put("phone", ownerPhone);
        }
        return map;
    }

    @JsonProperty("pricing_breakdown")
    public Map<String, Object> getPricingBreakdown() {
        Map<String, Object> map = new LinkedHashMap<>();
        long rentFee = (details != null && details.getRentalFee() != null) ? details.getRentalFee() : (totalPrice != null ? totalPrice : 0L);
        long drvFee = (details != null && details.getDriverFee() != null) ? details.getDriverFee() : 0L;
        long delFee = (details != null && details.getDeliveryFee() != null) ? details.getDeliveryFee() : 0L;
        long insFee = (details != null && details.getInsuranceFee() != null) ? details.getInsuranceFee() : 0L;
        long disc = (details != null && details.getDiscount() != null) ? details.getDiscount() : 0L;

        map.put("rental_fee", rentFee);
        map.put("driver_fee", drvFee);
        map.put("delivery_fee", delFee);
        map.put("insurance_fee", insFee);
        map.put("cleaning_fee", 0L);
        map.put("overage_km_fee", kmOverageFee != null ? kmOverageFee : 0L);
        map.put("discount", disc);
        map.put("total_price", totalPrice != null ? totalPrice : 0L);
        map.put("deposit_amount", depositAmount != null ? depositAmount : 0L);
        map.put("remaining_amount", remainingAmount != null ? remainingAmount : 0L);
        map.put("paid_amount", (status != null && status != BookingStatus.PENDING) ? depositAmount : 0L);
        map.put("subtotal", totalPrice != null ? totalPrice : 0L);
        return map;
    }
}