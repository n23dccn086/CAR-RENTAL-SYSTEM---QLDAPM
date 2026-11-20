package com.carrental.handover.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.RentalMode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.driver.entity.AssignmentStatus;
import com.carrental.driver.entity.DriverAssignment;
import com.carrental.driver.repository.DriverAssignmentRepository;
import com.carrental.handover.dto.HandoverPickupRequest;
import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverReturnRequest;
import com.carrental.handover.repository.HandoverRecordRepository;
import com.carrental.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Đơn có tài xế: chủ xe chỉ được tạo biên bản giao / nhận xe khi phân công MỚI NHẤT
 * là của đúng tài xế hiện tại và đã ACCEPTED.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HandoverDriverAcceptedTest {

    static final long BOOKING_ID = 400L;
    static final long OWNER_ID = 2L;
    static final long DRIVER_A = 11L;
    static final long DRIVER_B = 12L;

    @Mock BookingRepository bookingRepository;
    @Mock UserRepository userRepository;
    @Mock HandoverRecordRepository handoverRepository;
    @Mock DriverAssignmentRepository driverAssignmentRepository;

    @InjectMocks HandoverServiceImpl service;

    Booking booking;

    @BeforeEach
    void setUp() {
        booking = new Booking();
        booking.setId(BOOKING_ID);
        booking.setOwnerId(OWNER_ID);
        booking.setCustomerId(3L);
        booking.setRentalMode(RentalMode.WITH_DRIVER);
        booking.setDriverId(DRIVER_A);
        booking.setStatus(BookingStatus.APPROVED);
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
    }

    private static DriverAssignment assignment(long driverId, AssignmentStatus status) {
        DriverAssignment a = new DriverAssignment();
        a.setBookingId(BOOKING_ID);
        a.setDriverId(driverId);
        a.setStatus(status);
        return a;
    }

    /** Danh sách theo thứ tự mới nhất trước (giống findByBookingIdOrderByCreatedAtDesc). */
    private void givenAssignmentsNewestFirst(DriverAssignment... list) {
        when(driverAssignmentRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID)).thenReturn(List.of(list));
    }

    // ===== ensureDriverAccepted =====

    @Test
    @DisplayName("Tài xế hiện tại đã ACCEPTED → cho phép")
    void latestAcceptedBySameDriver_allowed() {
        givenAssignmentsNewestFirst(assignment(DRIVER_A, AssignmentStatus.ACCEPTED));
        assertDoesNotThrow(() -> service.ensureDriverAccepted(booking));
    }

    @ParameterizedTest(name = "Phân công mới nhất ở trạng thái {0} → chặn")
    @EnumSource(value = AssignmentStatus.class, names = {"PENDING", "REJECTED", "EXPIRED", "CANCELLED"})
    void latestNotAccepted_blocked(AssignmentStatus status) {
        givenAssignmentsNewestFirst(assignment(DRIVER_A, status));
        assertThrows(BadRequestException.class, () -> service.ensureDriverAccepted(booking));
    }

    @Test
    @DisplayName("Chưa có phân công nào nhưng đơn có driverId → chặn")
    void noAssignment_blocked() {
        givenAssignmentsNewestFirst();
        assertThrows(BadRequestException.class, () -> service.ensureDriverAccepted(booking));
    }

    @Test
    @DisplayName("Gán lại cùng tài xế: bản ACCEPTED cũ còn đó nhưng bản mới nhất PENDING → chặn")
    void reassignedSameDriver_oldAcceptedIgnored() {
        givenAssignmentsNewestFirst(
                assignment(DRIVER_A, AssignmentStatus.PENDING),
                assignment(DRIVER_A, AssignmentStatus.ACCEPTED));
        // existsByBookingIdAndDriverIdAndStatus(..., ACCEPTED) sẽ trả true cho trường hợp này → không được dùng
        when(driverAssignmentRepository.existsByBookingIdAndDriverIdAndStatus(BOOKING_ID, DRIVER_A, AssignmentStatus.ACCEPTED))
                .thenReturn(true);
        assertThrows(BadRequestException.class, () -> service.ensureDriverAccepted(booking));
    }

    @Test
    @DisplayName("Phân công mới nhất ACCEPTED nhưng của tài xế khác driverId của đơn → chặn")
    void latestAcceptedByOtherDriver_blocked() {
        givenAssignmentsNewestFirst(assignment(DRIVER_B, AssignmentStatus.ACCEPTED));
        assertThrows(BadRequestException.class, () -> service.ensureDriverAccepted(booking));
    }

    @Test
    @DisplayName("Đơn tự lái (không có driverId) → không kiểm tra tài xế")
    void noDriver_skipped() {
        booking.setRentalMode(RentalMode.SELF_DRIVE);
        booking.setDriverId(null);
        assertDoesNotThrow(() -> service.ensureDriverAccepted(booking));
        verifyNoInteractions(driverAssignmentRepository);
    }

    // ===== Đi qua đúng các API tạo biên bản =====

    @ParameterizedTest(name = "createHandover type={0} bị chặn khi tài xế chưa nhận đơn")
    @ValueSource(strings = {"PICKUP", "RETURN", "pickup"})
    void createHandover_blockedWhenDriverPending(String type) {
        booking.setStatus("RETURN".equalsIgnoreCase(type) ? BookingStatus.RENTED : BookingStatus.APPROVED);
        givenAssignmentsNewestFirst(assignment(DRIVER_A, AssignmentStatus.PENDING));

        HandoverRequest req = new HandoverRequest();
        req.setBookingId(BOOKING_ID);
        req.setHandoverType(type);
        req.setKmReading(1000);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.createHandover(OWNER_ID, req));
        assertTrue(ex.getMessage().contains("tài xế chưa xác nhận"), ex.getMessage());
        verify(handoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("createPickupHandover bị chặn khi tài xế chưa nhận đơn")
    void createPickupHandover_blockedWhenDriverPending() {
        givenAssignmentsNewestFirst(assignment(DRIVER_A, AssignmentStatus.PENDING));

        HandoverPickupRequest req = new HandoverPickupRequest();
        req.setBookingId(BOOKING_ID);
        req.setKmReading(1000);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createPickupHandover(OWNER_ID, req, List.of()));
        assertTrue(ex.getMessage().contains("tài xế chưa xác nhận"), ex.getMessage());
        verify(handoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("createReturnHandover (POST /handovers/return) bị chặn khi tài xế chưa nhận đơn")
    void createReturnHandover_blockedWhenDriverPending() {
        booking.setStatus(BookingStatus.RENTED);
        givenAssignmentsNewestFirst(assignment(DRIVER_A, AssignmentStatus.PENDING));

        HandoverReturnRequest req = new HandoverReturnRequest();
        req.setBookingId(BOOKING_ID);
        req.setKmReading(1500);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createReturnHandover(OWNER_ID, req, List.of()));
        assertTrue(ex.getMessage().contains("tài xế chưa xác nhận"), ex.getMessage());
        verify(handoverRepository, never()).save(any());
    }
}
