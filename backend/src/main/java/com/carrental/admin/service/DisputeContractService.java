package com.carrental.admin.service;

import com.carrental.admin.entity.Dispute;

public interface DisputeContractService {

    /**
     * Generate PDF hợp đồng thanh toán tranh chấp.
     * Trả về URL file PDF.
     */
    String generateContract(Dispute dispute);
}