package com.carrental.dispute.dto;

import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Request DTO khi user bổ sung bằng chứng cho dispute.
 * User có thể:
 * - Sửa mô tả
 * - Thay đổi evidence (danh sách ảnh)
 * - Viết ghi chú thêm
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EvidenceRequest {

    /** Mô tả mới (nếu muốn sửa) */
    @Size(max = 2000, message = "Mô tả không quá 2000 ký tự")
    String description;

    /** Danh sách bằng chứng mới (JSON string) */
    String evidence;

    /** Ghi chú thêm của user */
    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    String userNote;
}