package com.carrental.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CounterEvidenceRequest {

    @NotBlank(message = "Vui lòng nhập nội dung phản bác")
    @Size(max = 2000, message = "Nội dung không quá 2000 ký tự")
    String description;

    /** Danh sách ảnh bằng chứng (JSON string) */
    String evidence;
}