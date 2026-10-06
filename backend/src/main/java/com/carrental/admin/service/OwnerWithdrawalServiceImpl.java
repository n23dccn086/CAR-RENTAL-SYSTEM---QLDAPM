package com.carrental.admin.service;

import com.carrental.admin.dto.CreateWithdrawalRequest;
import com.carrental.admin.dto.WithdrawalMapper;
import com.carrental.admin.dto.WithdrawalResponse;
import com.carrental.admin.entity.Withdrawal;
import com.carrental.admin.repository.WithdrawalRepository;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OwnerWithdrawalServiceImpl implements OwnerWithdrawalService {

    WithdrawalRepository withdrawalRepository;
    BookingRepository bookingRepository;
    UserRepository userRepository;
    WithdrawalMapper withdrawalMapper;
    NotificationService notificationService;

    // Tỷ lệ hoa hồng nền tảng = 15% → owner nhận 85%
    static final BigDecimal OWNER_SHARE_RATE = new BigDecimal("0.85");
    static final BigDecimal MIN_WITHDRAWAL = new BigDecimal("100000");

    // ===== CREATE =====

    @Override
    @Transactional
    public WithdrawalResponse createWithdrawal(Long ownerId, CreateWithdrawalRequest request) {
        log.info("Owner {} creating withdrawal: amount={}", ownerId, request.getAmount());

        // 1. Validate số tiền
        if (request.getAmount().compareTo(MIN_WITHDRAWAL) < 0) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_MIN_AMOUNT,
                    "Số tiền rút tối thiểu là 100.000đ");
        }

        // 2. Check owner có ít nhất 1 booking COMPLETED
        List<Booking> completedBookings = bookingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .toList();

        if (completedBookings.isEmpty()) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_INSUFFICIENT_BALANCE,
                    "Bạn chưa có đơn hàng hoàn tất nào để rút tiền");
        }

        // 3. Tính số dư khả dụng
        BigDecimal totalIncome = completedBookings.stream()
                .map(b -> BigDecimal.valueOf(b.getTotalPrice())
                        .multiply(OWNER_SHARE_RATE)
                        .setScale(0, RoundingMode.DOWN))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingAmount = withdrawalRepository.sumPendingAmountByOwner(ownerId);
        BigDecimal availableBalance = totalIncome.subtract(pendingAmount);

        log.info("Owner {} balance: totalIncome={}, pending={}, available={}",
                ownerId, totalIncome, pendingAmount, availableBalance);

        // 4. Check số dư đủ
        if (request.getAmount().compareTo(availableBalance) > 0) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_INSUFFICIENT_BALANCE,
                    "Số dư khả dụng không đủ. Hiện có: " + availableBalance + "đ");
        }

        // 5. Tạo Withdrawal
        Withdrawal withdrawal = Withdrawal.builder()
                .ownerId(ownerId)
                .amount(request.getAmount())
                .bankName(request.getBankName().trim())
                .bankAccount(request.getBankAccount().trim())
                .accountHolder(request.getAccountHolder().trim())
                .status("PENDING")
                .build();

        Withdrawal saved = withdrawalRepository.save(withdrawal);
        log.info("Withdrawal created: id={}", saved.getId());

        // 6. Thông báo cho Admin
        try {
            User owner = userRepository.findById(ownerId).orElse(null);
            String ownerName = owner != null ? owner.getName() : "Chủ xe #" + ownerId;

            // Notify tất cả admin (nếu có nhiều admin, gửi cho admin đầu tiên hoặc tất cả)
            List<User> admins = userRepository.findByRole(com.carrental.user.entity.Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.SYSTEM,
                        "Có yêu cầu rút tiền mới",
                        String.format("%s yêu cầu rút %sđ. Vui lòng vào duyệt.",
                                ownerName,
                                String.format("%,d", request.getAmount().longValue())),
                        saved.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        return withdrawalMapper.toResponse(saved);
    }

    // ===== READ =====

    @Override
    public List<WithdrawalResponse> getMyWithdrawals(Long ownerId) {
        List<Withdrawal> list = withdrawalRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        return withdrawalMapper.toResponseList(list);
    }

    @Override
    public Map<String, Object> getBalanceInfo(Long ownerId) {
        // 1. Tính tổng thu nhập từ các booking COMPLETED
        List<Booking> completedBookings = bookingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .toList();

        BigDecimal totalIncome = completedBookings.stream()
                .map(b -> BigDecimal.valueOf(b.getTotalPrice())
                        .multiply(OWNER_SHARE_RATE)
                        .setScale(0, RoundingMode.DOWN))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Tính số đã rút (PENDING + COMPLETED)
        BigDecimal pendingAmount = withdrawalRepository.sumPendingAmountByOwner(ownerId);

        // 3. Tính số dư khả dụng
        BigDecimal availableBalance = totalIncome.subtract(pendingAmount);
        if (availableBalance.compareTo(BigDecimal.ZERO) < 0) {
            availableBalance = BigDecimal.ZERO;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalIncome", totalIncome);
        result.put("pendingWithdrawal", pendingAmount);
        result.put("availableBalance", availableBalance);
        result.put("totalBookings", completedBookings.size());
        result.put("minWithdrawal", MIN_WITHDRAWAL);

        return result;
    }
}