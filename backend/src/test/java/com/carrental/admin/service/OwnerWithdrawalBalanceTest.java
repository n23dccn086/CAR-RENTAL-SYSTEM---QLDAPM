package com.carrental.admin.service;

import com.carrental.admin.dto.CreateWithdrawalRequest;
import com.carrental.admin.repository.WithdrawalRepository;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Ví dụ trong báo lỗi: thu nhập 7.310.000đ, có 1 yêu cầu 500.000đ đang CHỜ DUYỆT, chưa có yêu cầu nào COMPLETED.
 * - "Đã rút" phải là 0đ (chỉ tính COMPLETED), không được hiện 500.000đ.
 * - "Đang chờ rút" là 500.000đ.
 * - "Số dư khả dụng" vẫn trừ khoản đang chờ: 6.810.000đ (để không rút trùng).
 * Lưu ý: test này mock repository nên KHÔNG kiểm tra câu JPQL (cần DB thật).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OwnerWithdrawalBalanceTest {

    static final long OWNER_ID = 2L;

    @Mock WithdrawalRepository withdrawalRepository;
    @Mock BookingRepository bookingRepository;
    @Mock ConfigHelper configHelper;

    @InjectMocks OwnerWithdrawalServiceImpl service;

    @BeforeEach
    void setUp() {
        Booking completed = new Booking();
        completed.setStatus(BookingStatus.COMPLETED);
        completed.setTotalPrice(7_310_000L);
        when(bookingRepository.findByOwnerIdOrderByCreatedAtDesc(OWNER_ID)).thenReturn(List.of(completed));

        when(configHelper.getOwnerShareRate()).thenReturn(BigDecimal.ONE);
        when(configHelper.getMinWithdrawal()).thenReturn(new BigDecimal("100000"));
        when(configHelper.getWithdrawalFee()).thenReturn(BigDecimal.ZERO);

        // 500.000đ đang chờ duyệt, chưa có gì COMPLETED
        when(withdrawalRepository.sumCompletedAmountByOwner(OWNER_ID)).thenReturn(BigDecimal.ZERO);
        when(withdrawalRepository.sumPendingAmountByOwner(OWNER_ID)).thenReturn(new BigDecimal("500000"));
        when(withdrawalRepository.sumReservedAmountByOwner(OWNER_ID)).thenReturn(new BigDecimal("500000"));
    }

    @Test
    @DisplayName("Yêu cầu đang chờ duyệt không được tính vào 'Đã rút'")
    void pendingWithdrawalNotCountedAsWithdrawn() {
        Map<String, Object> info = service.getBalanceInfo(OWNER_ID);

        assertEquals(0, new BigDecimal("0").compareTo((BigDecimal) info.get("totalWithdrawn")), "Đã rút");
        assertEquals(0, new BigDecimal("500000").compareTo((BigDecimal) info.get("pendingWithdrawal")), "Đang chờ rút");
        assertEquals(0, new BigDecimal("6810000").compareTo((BigDecimal) info.get("availableBalance")), "Số dư khả dụng");
    }

    @Test
    @DisplayName("Khoản đang chờ vẫn bị trừ khỏi số dư khi tạo yêu cầu mới (không rút trùng)")
    void pendingWithdrawalStillReservedOnCreate() {
        CreateWithdrawalRequest req = CreateWithdrawalRequest.builder()
                .amount(new BigDecimal("7000000"))
                .bankName("VCB").bankAccount("123").accountHolder("A")
                .build();

        assertThrows(BadRequestException.class, () -> service.createWithdrawal(OWNER_ID, req));
        verify(withdrawalRepository, never()).save(any());
    }
}
