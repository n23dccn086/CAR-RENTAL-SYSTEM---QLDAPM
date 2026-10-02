package com.carrental.payment.repository;

import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByPaymentId(Long paymentId);

    List<Refund> findByBookingId(Long bookingId);

    List<Refund> findByStatus(PaymentStatus status);
}