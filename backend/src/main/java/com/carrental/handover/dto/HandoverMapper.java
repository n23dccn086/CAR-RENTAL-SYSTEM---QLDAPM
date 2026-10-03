package com.carrental.handover.dto;

import com.carrental.handover.entity.HandoverImage;
import com.carrental.handover.entity.HandoverRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface HandoverMapper {

    @Mapping(target = "images", ignore = true)
    HandoverResponse toResponse(HandoverRecord record);

    @Mapping(target = "images", source = "images")
    HandoverResponse toResponse(HandoverRecord record, List<HandoverImage> images);

    HandoverResponse.ImageResponse toImageResponse(HandoverImage image);

    List<HandoverResponse.ImageResponse> toImageResponseList(List<HandoverImage> images);
}