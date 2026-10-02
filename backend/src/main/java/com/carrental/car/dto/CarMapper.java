package com.carrental.car.dto;

import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.Named;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CarMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ownerId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "documents", ignore = true)
    Car toEntity(CarRequest request);

    @Mapping(target = "imageUrls", source = "images", qualifiedByName = "extractImageUrls")
    @Mapping(target = "imageCount", source = "images", qualifiedByName = "countImages")
    @Mapping(target = "documentCount", source = "documents", qualifiedByName = "countDocuments")
    CarResponse toResponse(Car car);

    List<CarResponse> toResponseList(List<Car> cars);

    @Named("extractImageUrls")
    default List<String> extractImageUrls(List<CarImage> images) {
        if (images == null) return List.of();
        return images.stream()
                .map(CarImage::getImageUrl)
                .collect(Collectors.toList());
    }

    @Named("countImages")
    default Integer countImages(List<CarImage> images) {
        return images == null ? 0 : images.size();
    }

    @Named("countDocuments")
    default Integer countDocuments(List<com.carrental.car.entity.CarDocument> documents) {
        return documents == null ? 0 : documents.size();
    }
}