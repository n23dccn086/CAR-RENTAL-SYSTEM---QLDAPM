package com.carrental.payment.repository;

import com.carrental.payment.entity.Payment;
import com.carrental.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findByBookingId(Long bookingId);

    List<Payment> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    org.springframework.data.domain.Page<Payment> findByCustomerIdOrderByCreatedAtDesc(
            Long customerId, org.springframework.data.domain.Pageable pageable);

    List<Payment> findByStatus(PaymentStatus status);

    Optional<Payment> findByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    long countByBookingIdAndStatus(Long bookingId, PaymentStatus status);
}