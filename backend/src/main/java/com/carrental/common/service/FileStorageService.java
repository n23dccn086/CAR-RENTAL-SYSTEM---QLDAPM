package com.carrental.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
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

    /**
     * Lưu file — chấp nhận ảnh, PDF, Word.
     * @param file file upload
     * @param subDir thư mục con (vd: "disputes/1", "cars/2")
     * @return URL public (vd: /files/disputes/1/abc.pdf)
     */
    public String storeFile(MultipartFile file, String subDir) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File rỗng");
        }

        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename();
        String ext = getExtension(originalName);

        boolean isImage = contentType != null && contentType.startsWith("image/");
        boolean isPdf = "application/pdf".equals(contentType) || ".pdf".equals(ext);
        boolean isWord = ".doc".equals(ext) || ".docx".equals(ext);

        if (!isImage && !isPdf && !isWord) {
            throw new IOException("Chỉ chấp nhận file ảnh, PDF hoặc Word");
        }

        long maxSize = (isPdf || isWord) ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new IOException("File vượt quá giới hạn cho phép");
        }

        String filename = UUID.randomUUID().toString() + ext;

        Path targetDir = rootLocation.resolve(subDir);
        Files.createDirectories(targetDir);

        Path targetPath = targetDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Stored file: {}", targetPath);
        return "/files/" + subDir + "/" + filename;   // ← ĐỔI: /uploads/ → /files/
    }

    public void deleteFile(String fileUrl) {
        try {
            String relativePath = fileUrl.replaceFirst("^/files/", "");
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
        if (filename == null) return ".bin";
        int dot = filename.lastIndexOf(".");
        if (dot <= 0) return ".bin";
        String ext = filename.substring(dot).toLowerCase();
        if (List.of(".jpg", ".jpeg", ".png", ".gif", ".webp",
                ".pdf", ".doc", ".docx").contains(ext)) {
            return ext;
        }
        return ".bin";
    }
}