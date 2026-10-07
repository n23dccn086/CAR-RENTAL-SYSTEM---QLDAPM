package com.carrental.admin.repository;

import com.carrental.admin.entity.OwnerRequestDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OwnerRequestDocumentRepository extends JpaRepository<OwnerRequestDocument, Long> {

    List<OwnerRequestDocument> findByRequestId(Long requestId);

    void deleteByRequestId(Long requestId);
}