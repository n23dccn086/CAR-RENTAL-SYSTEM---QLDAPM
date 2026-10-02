package com.carrental.car.repository;

import com.carrental.car.entity.CarDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarDocumentRepository extends JpaRepository<CarDocument, Long> {

    List<CarDocument> findByCarId(Long carId);

    Optional<CarDocument> findByCarIdAndDocumentType(Long carId, String documentType);

    void deleteByCarId(Long carId);

    long countByCarId(Long carId);
}