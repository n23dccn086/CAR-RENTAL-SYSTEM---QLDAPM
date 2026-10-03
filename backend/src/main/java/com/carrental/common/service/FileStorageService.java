package com.carrental.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path rootLocation;

    public FileStorageService() {
        this.rootLocation = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
            log.info("Upload directory: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Không tạo được thư mục uploads", e);
        }
    }

    public String storeFile(MultipartFile file, String subDir) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File rỗng");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Chỉ chấp nhận file ảnh");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IOException("Ảnh vượt quá 5MB");
        }

        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString() + ext;

        Path targetDir = rootLocation.resolve(subDir);
        Files.createDirectories(targetDir);

        Path targetPath = targetDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Stored file: {}", targetPath);
        return "/uploads/" + subDir + "/" + filename;
    }

    public void deleteFile(String fileUrl) {
        try {
            String relativePath = fileUrl.replaceFirst("^/uploads/", "");
            Path path = rootLocation.resolve(relativePath).normalize();
            if (path.startsWith(rootLocation)) {
                Files.deleteIfExists(path);
                log.info("Deleted file: {}", path);
            }
        } catch (IOException e) {
            log.warn("Cannot delete file: {}", fileUrl, e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf(".");
        return dot > 0 ? filename.substring(dot).toLowerCase() : ".jpg";
    }
}