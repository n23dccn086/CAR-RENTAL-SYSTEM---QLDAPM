package com.carrental.driver.dto;

import com.carrental.driver.entity.Driver;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

/**
 * MapStruct mapper: Driver (entity) ↔ DriverResponse (DTO).
 * componentModel = SPRING → inject được vào service.
 */
@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface DriverMapper {

    @Mapping(target = "status",
             expression = "java(driver.getStatus() != null ? driver.getStatus().name() : null)")
    DriverResponse toResponse(Driver driver);

    List<DriverResponse> toResponseList(List<Driver> drivers);
}