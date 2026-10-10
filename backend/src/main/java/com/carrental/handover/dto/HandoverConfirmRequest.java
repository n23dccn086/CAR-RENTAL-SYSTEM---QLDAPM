package com.carrental.handover.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Request DTO cho Contract 6.3: POST /handovers/:id/confirm
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HandoverConfirmRequest {

    @NotBlank(message = "Chữ ký không được để trống")
    @JsonAlias({"signature", "signatureUrl", "signature_url"})
    String signature;
}
