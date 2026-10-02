package com.carrental.driver.repository;

import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByPhone(String phone);

    boolean existsByPhone(String phone);

    List<Driver> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    List<Driver> findByOwnerIdAndStatusAndDeletedAtIsNull(Long ownerId, DriverStatus status);

    List<Driver> findByStatusAndDeletedAtIsNull(DriverStatus status);

    List<Driver> findByOwnerId(Long ownerId);
}