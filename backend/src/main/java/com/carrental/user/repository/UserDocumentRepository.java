package com.carrental.user.repository;

import com.carrental.user.entity.UserDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDocumentRepository extends JpaRepository<UserDocument, Long> {

    List<UserDocument> findByUserId(Long userId);

    Optional<UserDocument> findByUserIdAndDocumentType(Long userId, String documentType);

    void deleteByUserId(Long userId);

    long countByUserId(Long userId);
}