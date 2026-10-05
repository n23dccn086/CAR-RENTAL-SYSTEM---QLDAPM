package com.carrental.common.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/files")
@Slf4j
public class FileController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request) {
        try {
            String fullPath = (String) request.getAttribute(
                    HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
            String filePath = fullPath.replaceFirst("^/files/", "");

            log.info("Serving file: {}", filePath);

            Path targetPath = uploadDir.resolve(filePath).normalize();

            // Security: ngăn path traversal
            if (!targetPath.startsWith(uploadDir)) {
                log.warn("Path traversal attempt: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(targetPath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("File not found: {}", targetPath);
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(filePath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving file", e);
            return ResponseEntity.notFound().build();
        }
    }

    private String determineContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}