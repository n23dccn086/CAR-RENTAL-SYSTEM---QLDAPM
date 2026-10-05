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
public class ReviewRequest {

    @NotBlank(message = "Vui lòng nhập nội dung bổ sung")
    @Size(max = 2000, message = "Nội dung không quá 2000 ký tự")
    String description;

    /** Danh sách ảnh bằng chứng bổ sung (JSON string) */
    String evidence;

    /** Ghi chú thêm */
    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    String userNote;
}