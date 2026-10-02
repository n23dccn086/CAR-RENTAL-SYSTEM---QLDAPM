package com.carrental.user.dto;

import com.carrental.user.entity.Role;
import com.carrental.user.entity.VerificationStatus;
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
public class UserDto {

    Long id;
    String name;
    String phone;
    String email;
    Role role;
    VerificationStatus verificationStatus;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}