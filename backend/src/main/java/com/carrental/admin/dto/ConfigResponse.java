package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConfigResponse {

    Long id;
    String configKey;
    String configValue;
    String configType;
    String description;
    Long updatedBy;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}