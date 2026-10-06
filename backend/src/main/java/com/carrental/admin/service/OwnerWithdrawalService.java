package com.carrental.admin.service;

import com.carrental.admin.dto.CreateWithdrawalRequest;
import com.carrental.admin.dto.WithdrawalResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface OwnerWithdrawalService {

    /** Owner tạo yêu cầu rút tiền */
    WithdrawalResponse createWithdrawal(Long ownerId, CreateWithdrawalRequest request);

    /** Owner xem lịch sử rút tiền của mình */
    List<WithdrawalResponse> getMyWithdrawals(Long ownerId);

    /** Owner xem số dư khả dụng */
    Map<String, Object> getBalanceInfo(Long ownerId);
}