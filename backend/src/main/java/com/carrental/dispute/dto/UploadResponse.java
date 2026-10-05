package com.carrental.dispute.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UploadResponse {
    String url;          // /uploads/disputes/{id}/abc.jpg
    String filename;     // abc.jpg
    Long size;           // bytes
    String contentType;  // image/jpeg
}