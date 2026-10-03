package com.carrental.admin.dto;

import com.carrental.admin.entity.Withdrawal;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface WithdrawalMapper {

    WithdrawalResponse toResponse(Withdrawal withdrawal);

    List<WithdrawalResponse> toResponseList(List<Withdrawal> withdrawals);
}