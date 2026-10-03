package com.carrental.handover.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.handover.dto.HandoverMapper;
import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverResponse;
import com.carrental.handover.entity.HandoverImage;
import com.carrental.handover.entity.HandoverRecord;
import com.carrental.handover.repository.HandoverImageRepository;
import com.carrental.handover.repository.HandoverRecordRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class HandoverServiceImpl implements HandoverService {

    HandoverRecordRepository handoverRepository;
    HandoverImageRepository imageRepository;
    HandoverMapper handoverMapper;

    @Override
    @Transactional
    public HandoverResponse createHandover(HandoverRequest request) {
        log.info("Create handover for booking: {}, type: {}",
                request.getBookingId(), request.getHandoverType());

        if (handoverRepository.existsByBookingIdAndHandoverType(
                request.getBookingId(), request.getHandoverType())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Biên bản loại này đã tồn tại cho đơn này");
        }

        HandoverRecord record = HandoverRecord.builder()
                .bookingId(request.getBookingId())
                .handoverType(request.getHandoverType())
                .kmReading(request.getKmReading())
                .fuelLevel(request.getFuelLevel())
                .exteriorNote(request.getExteriorNote())
                .interiorNote(request.getInteriorNote())
                .damages(request.getDamages())
                .extraFees(request.getExtraFees())
                .extraFeesNote(request.getExtraFeesNote())
                .build();

        HandoverRecord saved = handoverRepository.save(record);
        log.info("Handover created with id: {}", saved.getId());

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<HandoverImage> images = request.getImages().stream()
                    .map(img -> HandoverImage.builder()
                            .handoverId(saved.getId())
                            .imageUrl(img.getImageUrl())
                            .imageType(img.getImageType())
                            .note(img.getNote())
                            .build())
                    .toList();
            imageRepository.saveAll(images);
        }

        return buildResponse(saved);
    }

    @Override
    public HandoverResponse getHandoverById(Long id) {
        return buildResponse(getEntityById(id));
    }

    @Override
    public List<HandoverResponse> getHandoversByBooking(Long bookingId) {
        List<HandoverRecord> records = handoverRepository.findByBookingId(bookingId);
        return records.stream().map(this::buildResponse).toList();
    }

    @Override
    @Transactional
    public HandoverResponse signHandover(Long id, String role, String signature) {
        log.info("Sign handover {} by role: {}", id, role);

        HandoverRecord record = getEntityById(id);

        if ("OWNER".equalsIgnoreCase(role)) {
            record.setOwnerSignature(signature);
            record.setOwnerSignedAt(LocalDateTime.now());
        } else if ("CUSTOMER".equalsIgnoreCase(role)) {
            record.setCustomerSignature(signature);
            record.setCustomerSignedAt(LocalDateTime.now());
        } else {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Role không hợp lệ");
        }

        if (record.getOwnerSignature() != null && record.getCustomerSignature() != null) {
            record.setRecordHash(generateHash(record));
        }

        HandoverRecord updated = handoverRepository.save(record);
        return buildResponse(updated);
    }

    @Override
    @Transactional
    public List<HandoverResponse.ImageResponse> addImages(Long handoverId,
                                                          List<HandoverRequest.HandoverImageRequest> images) {
        getEntityById(handoverId);

        List<HandoverImage> entities = images.stream()
                .map(img -> HandoverImage.builder()
                        .handoverId(handoverId)
                        .imageUrl(img.getImageUrl())
                        .imageType(img.getImageType())
                        .note(img.getNote())
                        .build())
                .toList();

        List<HandoverImage> saved = imageRepository.saveAll(entities);
        return handoverMapper.toImageResponseList(saved);
    }

    private HandoverRecord getEntityById(Long id) {
        return handoverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.VALIDATION_ERROR,
                        "Không tìm thấy biên bản"));
    }

    private HandoverResponse buildResponse(HandoverRecord record) {
        List<HandoverImage> images = imageRepository.findByHandoverId(record.getId());
        return handoverMapper.toResponse(record, images);
    }

    private String generateHash(HandoverRecord record) {
        try {
            String raw = record.getId() + "|" + record.getBookingId() + "|"
                    + record.getHandoverType() + "|" + record.getOwnerSignature()
                    + "|" + record.getCustomerSignature();
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}