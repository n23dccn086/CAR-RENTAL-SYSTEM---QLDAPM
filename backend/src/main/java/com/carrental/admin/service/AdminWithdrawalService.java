package com.carrental.admin.service;

import com.carrental.admin.dto.WithdrawalResponse;

import java.util.List;

public interface AdminWithdrawalService {

    List<WithdrawalResponse> getAllWithdrawals();

    List<WithdrawalResponse> getWithdrawalsByStatus(String status);

    WithdrawalResponse getWithdrawalById(Long id);

    WithdrawalResponse approveWithdrawal(Long withdrawalId, Long adminId, String transactionId);

    WithdrawalResponse rejectWithdrawal(Long withdrawalId, Long adminId, String reason);

    long countPending();
}