package com.carrental.handover.repository;

import com.carrental.handover.entity.HandoverImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HandoverImageRepository extends JpaRepository<HandoverImage, Long> {

    List<HandoverImage> findByHandoverId(Long handoverId);
}