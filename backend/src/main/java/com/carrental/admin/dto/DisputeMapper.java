package com.carrental.admin.dto;

import com.carrental.admin.entity.Dispute;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DisputeMapper {

    private final UserRepository userRepository;

    public DisputeResponse toResponse(Dispute d) {
        if (d == null) return null;

        User raiser = d.getRaisedBy() != null
                ? userRepository.findById(d.getRaisedBy()).orElse(null)
                : null;
        User against = d.getAgainstUser() != null
                ? userRepository.findById(d.getAgainstUser()).orElse(null)
                : null;

        return DisputeResponse.builder()
                .id(d.getId())
                .disputeCode(d.getDisputeCode())
                .bookingId(d.getBookingId())
                .raisedBy(d.getRaisedBy())
                .raisedByName(raiser != null ? raiser.getName() : "(đã xóa)")
                .raisedByPhone(raiser != null ? raiser.getPhone() : null)
                .againstUser(d.getAgainstUser())
                .againstUserName(against != null ? against.getName() : "(đã xóa)")
                .againstUserPhone(against != null ? against.getPhone() : null)
                .category(d.getCategory())
                .description(d.getDescription())
                .evidence(d.getEvidence())
                .claimedAmount(d.getClaimedAmount())
                .status(d.getStatus())
                .resolution(d.getResolution())
                .resolvedAmount(d.getResolvedAmount())
                .resolvedBy(d.getResolvedBy())
                .resolvedAt(d.getResolvedAt())
                .deadlineAt(d.getDeadlineAt())
                .adminRequest(d.getAdminRequest())
                .evidenceHistory(d.getEvidenceHistory())
                .lastSubmittedAt(d.getLastSubmittedAt())
                .counterDescription(d.getCounterDescription())
                .counterEvidence(d.getCounterEvidence())
                .counterFiledAt(d.getCounterFiledAt())
                .counterDeadlineAt(d.getCounterDeadlineAt())
                .reviewDeadlineAt(d.getReviewDeadlineAt())
                .awaitingResponseFrom(d.getAwaitingResponseFrom())
                .contractUrl(d.getContractUrl())
                .contractGeneratedAt(d.getContractGeneratedAt())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    public List<DisputeResponse> toResponseList(List<Dispute> list) {
        if (list == null) return List.of();
        return list.stream().map(this::toResponse).toList();
    }
}