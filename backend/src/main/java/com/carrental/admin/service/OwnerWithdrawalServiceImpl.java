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
    ConfigHelper configHelper;

    // ===== CREATE =====

    @Override
    @Transactional
    public WithdrawalResponse createWithdrawal(Long ownerId, CreateWithdrawalRequest request) {
        log.info("Owner {} creating withdrawal: amount={}", ownerId, request.getAmount());

        // ===== ĐỌC CONFIG TỪ DB =====
        BigDecimal minWithdrawal = configHelper.getMinWithdrawal();
        BigDecimal ownerShareRate = configHelper.getOwnerShareRate();
        BigDecimal withdrawalFee = configHelper.getWithdrawalFee();

        log.info("Config loaded: minWithdrawal={}, ownerShareRate={}, withdrawalFee={}",
                minWithdrawal, ownerShareRate, withdrawalFee);

        // 1. Validate số tiền
        if (request.getAmount().compareTo(minWithdrawal) < 0) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_MIN_AMOUNT,
                    "Số tiền rút tối thiểu là " +
                    String.format("%,d", minWithdrawal.longValue()) + "đ");
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

        // 3. Tính tổng thu nhập GỘP
        BigDecimal totalIncome = completedBookings.stream()
                .map(b -> BigDecimal.valueOf(b.getTotalPrice())
                        .multiply(ownerShareRate)
                        .setScale(0, RoundingMode.DOWN))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Tính số dư khả dụng
        BigDecimal totalWithdrawn = withdrawalRepository.sumWithdrawnAmountByOwner(ownerId);
        BigDecimal availableBalance = totalIncome.subtract(totalWithdrawn);
        if (availableBalance.compareTo(BigDecimal.ZERO) < 0) {
            availableBalance = BigDecimal.ZERO;
        }

        log.info("Owner {} balance: totalIncome={}, totalWithdrawn={}, available={}",
                ownerId, totalIncome, totalWithdrawn, availableBalance);

        // 5. Check số dư đủ
        if (request.getAmount().compareTo(availableBalance) > 0) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_INSUFFICIENT_BALANCE,
                    "Số dư khả dụng không đủ. Hiện có: " +
                    String.format("%,d", availableBalance.longValue()) + "đ");
        }

        // 6. Tính netAmount = amount - fee
        BigDecimal fee = withdrawalFee != null ? withdrawalFee : BigDecimal.ZERO;
        BigDecimal netAmount = request.getAmount().subtract(fee);

        if (netAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_MIN_AMOUNT,
                    "Số tiền thực nhận phải lớn hơn 0đ. Vui lòng rút thêm.");
        }

        // 7. Tạo Withdrawal
        Withdrawal withdrawal = Withdrawal.builder()
                .ownerId(ownerId)
                .amount(request.getAmount())
                .fee(fee)
                .netAmount(netAmount)
                .bankName(request.getBankName().trim())
                .bankAccount(request.getBankAccount().trim())
                .accountHolder(request.getAccountHolder().trim())
                .status("PENDING")
                .build();

        Withdrawal saved = withdrawalRepository.save(withdrawal);
        log.info("Withdrawal created: id={}, amount={}, fee={}, net={}",
                saved.getId(), saved.getAmount(), saved.getFee(), saved.getNetAmount());

        // 8. Thông báo cho Admin
        try {
            User owner = userRepository.findById(ownerId).orElse(null);
            String ownerName = owner != null ? owner.getName() : "Chủ xe #" + ownerId;

            List<User> admins = userRepository.findByRole(com.carrental.user.entity.Role.ADMIN);
            for (User admin : admins) {
                String feeNote = fee.compareTo(BigDecimal.ZERO) > 0
                        ? String.format(" (phí: %sđ, thực nhận: %sđ)",
                            String.format("%,d", fee.longValue()),
                            String.format("%,d", netAmount.longValue()))
                        : "";

                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.SYSTEM,
                        "Có yêu cầu rút tiền mới",
                        String.format("%s yêu cầu rút %sđ%s. Vui lòng vào duyệt.",
                                ownerName,
                                String.format("%,d", request.getAmount().longValue()),
                                feeNote),
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
        // ===== ĐỌC CONFIG TỪ DB =====
        BigDecimal ownerShareRate = configHelper.getOwnerShareRate();
        BigDecimal minWithdrawal = configHelper.getMinWithdrawal();
        BigDecimal withdrawalFee = configHelper.getWithdrawalFee();
        BigDecimal commissionRate = configHelper.getCommissionRate();

        // 1. Tính tổng thu nhập GỘP
        List<Booking> completedBookings = bookingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .toList();

        BigDecimal totalIncome = completedBookings.stream()
                .map(b -> BigDecimal.valueOf(b.getTotalPrice())
                        .multiply(ownerShareRate)
                        .setScale(0, RoundingMode.DOWN))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Tổng ĐÃ RÚT (PENDING + APPROVED + PROCESSING + COMPLETED)
        BigDecimal totalWithdrawn = withdrawalRepository.sumWithdrawnAmountByOwner(ownerId);

        // 3. Đang chờ rút
        BigDecimal pendingAmount = withdrawalRepository.sumPendingAmountByOwner(ownerId);

        // 4. Số dư khả dụng
        BigDecimal availableBalance = totalIncome.subtract(totalWithdrawn);
        if (availableBalance.compareTo(BigDecimal.ZERO) < 0) {
            availableBalance = BigDecimal.ZERO;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalIncome", totalIncome);
        result.put("totalWithdrawn", totalWithdrawn);
        result.put("pendingWithdrawal", pendingAmount);
        result.put("availableBalance", availableBalance);
        result.put("totalBookings", completedBookings.size());
        result.put("minWithdrawal", minWithdrawal);
        result.put("ownerShareRate", ownerShareRate);
        result.put("withdrawalFee", withdrawalFee);
        result.put("commissionRate", commissionRate);

        return result;
    }
}