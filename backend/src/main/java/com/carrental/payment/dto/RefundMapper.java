package com.carrental.payment.dto;

import com.carrental.payment.entity.Refund;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RefundMapper {
    RefundResponse toResponse(Refund refund);
    List<RefundResponse> toResponseList(List<Refund> refunds);
}