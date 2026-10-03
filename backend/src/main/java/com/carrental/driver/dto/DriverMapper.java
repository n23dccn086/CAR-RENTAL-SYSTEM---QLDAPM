package com.carrental.driver.dto;

import com.carrental.driver.entity.Driver;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

/**
 * MapStruct mapper: Driver (entity) ↔ Driver DTOs.
 * componentModel = SPRING → inject được vào service.
 */
@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface DriverMapper {

    // ===== Entity → Response =====

    @Mapping(target = "status",
             expression = "java(driver.getStatus() != null ? driver.getStatus().name() : null)")
    DriverResponse toResponse(Driver driver);

    List<DriverResponse> toResponseList(List<Driver> drivers);

    // ===== Request → Entity =====

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ownerId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "totalTrips", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Driver toEntity(DriverRequest request);
}