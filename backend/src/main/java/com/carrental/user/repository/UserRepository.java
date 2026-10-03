package com.carrental.user.repository;

import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
import com.carrental.user.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    // ===== MỚI — Cho Admin quản lý user =====
    List<User> findByRole(Role role);

    List<User> findByVerificationStatus(VerificationStatus status);

    List<User> findByRoleAndVerificationStatus(Role role, VerificationStatus status);
}