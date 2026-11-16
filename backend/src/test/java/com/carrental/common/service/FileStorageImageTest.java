package com.carrental.common.service;

import com.carrental.common.exception.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

/** FileStorageService.storeImage — chỉ nhận ảnh thật (Content-Type + đuôi file), tối đa 5MB. */
class FileStorageImageTest {

    private final FileStorageService storage = new FileStorageService();

    private static MockMultipartFile file(String name, String type, int size) {
        return new MockMultipartFile("file", name, type, new byte[size]);
    }

    @Test
    @DisplayName("IMG1 - Từ chối file giả Content-Type ảnh nhưng đuôi không phải ảnh (.html/.pdf/không đuôi)")
    void rejectsSpoofedExtension() {
        assertThrows(BadRequestException.class, () -> storage.storeImage(file("x.html", "image/png", 10), "test"));
        assertThrows(BadRequestException.class, () -> storage.storeImage(file("x.pdf", "image/jpeg", 10), "test"));
        assertThrows(BadRequestException.class, () -> storage.storeImage(file("noext", "image/png", 10), "test"));
    }

    @Test
    @DisplayName("IMG2 - Từ chối Content-Type không phải ảnh cho phép (pdf, svg) và Content-Type rỗng")
    void rejectsWrongType() {
        assertThrows(BadRequestException.class, () -> storage.storeImage(file("a.png", "application/pdf", 10), "test"));
        assertThrows(BadRequestException.class, () -> storage.storeImage(file("a.png", "image/svg+xml", 10), "test"));
        assertThrows(BadRequestException.class, () -> storage.storeImage(file("a.png", null, 10), "test"));
    }

    @Test
    @DisplayName("IMG3 - Từ chối file rỗng và file > 5MB")
    void rejectsEmptyAndTooLarge() {
        assertThrows(BadRequestException.class, () -> storage.storeImage(file("a.png", "image/png", 0), "test"));
        assertThrows(BadRequestException.class,
                () -> storage.storeImage(file("a.png", "image/png", 5 * 1024 * 1024 + 1), "test"));
    }

    @Test
    @DisplayName("IMG4 - Ảnh hợp lệ (đuôi viết HOA, Content-Type viết hoa) được lưu và trả URL /files/...")
    void acceptsValidImage() throws Exception {
        String url = storage.storeImage(file("Avatar.PNG", "IMAGE/PNG", 100), "test-img4");
        try {
            assertTrue(url.startsWith("/files/test-img4/") && url.endsWith(".png"), url);
        } finally {
            Path dir = Paths.get("uploads", "test-img4");
            Files.deleteIfExists(dir.resolve(url.substring(url.lastIndexOf('/') + 1)));
            Files.deleteIfExists(dir);
        }
    }
}
