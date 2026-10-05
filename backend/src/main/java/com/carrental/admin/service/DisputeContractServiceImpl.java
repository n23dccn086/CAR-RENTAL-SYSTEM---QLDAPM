package com.carrental.admin.service;

import com.carrental.admin.entity.Dispute;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
import com.carrental.car.repository.CarRepository;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class DisputeContractServiceImpl implements DisputeContractService {

    final BookingRepository bookingRepository;
    final CarRepository carRepository;
    final UserRepository userRepository;

    @Value("${app.upload-dir:uploads}")
    String uploadDir;

    @Override
    public String generateContract(Dispute dispute) {
        log.info("Generating contract for dispute: {}", dispute.getDisputeCode());

        try {
            Path contractDir = Paths.get(uploadDir, "contracts");
            Files.createDirectories(contractDir);

            String filename = "HDTC-" + dispute.getDisputeCode() + "-" + UUID.randomUUID().toString().substring(0, 6) + ".pdf";
            Path contractPath = contractDir.resolve(filename);

            try (PDDocument document = new PDDocument()) {
                // ============================================
                // TRANG 1: NỘI DUNG CHÍNH
                // ============================================
                PDPage page1 = new PDPage();
                document.addPage(page1);

                PDType0Font font = loadUnicodeFont(document);

                PDPageContentStream content = new PDPageContentStream(document, page1);

                float yPosition = 750;
                float margin = 50;

                // ===== HEADER =====
                yPosition = writeLine(content, "HOP DONG THANH TOAN TRANH CHAP", font, 20, margin, yPosition, true);
                yPosition = writeLine(content, "MAISON CAR RENTAL", font, 14, margin, yPosition, true);
                yPosition -= 20;

                // ===== THONG TIN CHUNG =====
                yPosition = writeLine(content, "Ma hop dong: " + filename.replace(".pdf", ""), font, 11, margin, yPosition, false);
                yPosition = writeLine(content, "Ma tranh chap: " + dispute.getDisputeCode(), font, 11, margin, yPosition, false);
                yPosition = writeLine(content, "Ngay tao: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), font, 11, margin, yPosition, false);

                Booking booking = bookingRepository.findById(dispute.getBookingId()).orElse(null);
                if (booking != null) {
                    Car car = carRepository.findById(booking.getCarId()).orElse(null);
                    if (car != null) {
                        yPosition = writeLine(content, "Don hang: #" + booking.getId() + " - " + car.getBrand() + " " + car.getModel() + " (" + car.getPlate() + ")", font, 11, margin, yPosition, false);
                    }
                }
                yPosition -= 15;

                // ===== I. THONG TIN CAC BEN =====
                yPosition = writeLine(content, "I. THONG TIN CAC BEN", font, 14, margin, yPosition, false);
                yPosition -= 5;

                User raiser = userRepository.findById(dispute.getRaisedBy()).orElse(null);
                User against = userRepository.findById(dispute.getAgainstUser()).orElse(null);

                yPosition = writeLine(content, "BEN A (Nguoi khoi kien):", font, 12, margin, yPosition, false);
                if (raiser != null) {
                    yPosition = writeLine(content, "  Ho ten: " + raiser.getName(), font, 11, margin + 20, yPosition, false);
                    yPosition = writeLine(content, "  SDT: " + raiser.getPhone(), font, 11, margin + 20, yPosition, false);
                    yPosition = writeLine(content, "  Email: " + (raiser.getEmail() != null ? raiser.getEmail() : "-"), font, 11, margin + 20, yPosition, false);
                }
                yPosition -= 10;

                yPosition = writeLine(content, "BEN B (Nguoi bi kien):", font, 12, margin, yPosition, false);
                if (against != null) {
                    yPosition = writeLine(content, "  Ho ten: " + against.getName(), font, 11, margin + 20, yPosition, false);
                    yPosition = writeLine(content, "  SDT: " + against.getPhone(), font, 11, margin + 20, yPosition, false);
                    yPosition = writeLine(content, "  Email: " + (against.getEmail() != null ? against.getEmail() : "-"), font, 11, margin + 20, yPosition, false);
                }
                yPosition -= 15;

                // ===== II. NOI DUNG TRANH CHAP =====
                yPosition = writeLine(content, "II. NOI DUNG TRANH CHAP", font, 14, margin, yPosition, false);
                yPosition -= 5;

                yPosition = writeLine(content, "Danh muc: " + dispute.getCategory(), font, 11, margin, yPosition, false);
                yPosition = writeLine(content, "Mo ta (Ben A):", font, 11, margin, yPosition, false);
                yPosition = writeWrappedText(content, "  \"" + dispute.getDescription() + "\"", font, 10, margin + 10, yPosition);

                if (dispute.getClaimedAmount() != null) {
                    yPosition = writeLine(content, "Yeu cau: " + String.format("%,d", dispute.getClaimedAmount().longValue()) + "d", font, 11, margin, yPosition, false);
                }

                if (dispute.getCounterDescription() != null) {
                    yPosition -= 5;
                    yPosition = writeLine(content, "Phan hoi (Ben B):", font, 11, margin, yPosition, false);
                    yPosition = writeWrappedText(content, "  \"" + dispute.getCounterDescription() + "\"", font, 10, margin + 10, yPosition);
                }
                yPosition -= 15;

                // ===== III. KET QUA GIAI QUYET =====
                yPosition = writeLine(content, "III. KET QUA GIAI QUYET", font, 14, margin, yPosition, false);
                yPosition -= 5;

                if (dispute.getResolution() != null) {
                    yPosition = writeLine(content, "Ket luan cua Admin:", font, 11, margin, yPosition, false);
                    yPosition = writeWrappedText(content, dispute.getResolution(), font, 10, margin + 10, yPosition);
                }

                if (dispute.getResolvedAmount() != null) {
                    yPosition = writeLine(content, "So tien boi thuong: " + String.format("%,d", dispute.getResolvedAmount().longValue()) + "d", font, 12, margin, yPosition, false);
                }

                content.close();

                // ============================================
                // TRANG 2: CHỮ KÝ + FOOTER
                // ============================================
                PDPage page2 = new PDPage();
                document.addPage(page2);

                PDPageContentStream content2 = new PDPageContentStream(document, page2);

                float y2 = 700;

                // Tiêu đề
                y2 = writeLine(content2, "IV. XAC NHAN", font, 14, margin, y2, false);
                y2 -= 5;
                y2 = writeLine(content2, "Hai ben xac nhan da doc va dong y voi ket qua giai quyet.", font, 11, margin, y2, false);
                y2 -= 60;

                // Chữ ký
                content2.beginText();
                content2.setFont(font, 11);
                content2.newLineAtOffset(margin, y2);
                content2.showText("BEN A                              BEN B");
                content2.endText();
                y2 -= 20;

                content2.beginText();
                content2.setFont(font, 10);
                content2.newLineAtOffset(margin, y2);
                content2.showText("(Ky ten)                            (Ky ten)");
                content2.endText();
                y2 -= 60;

                content2.beginText();
                content2.setFont(font, 11);
                content2.newLineAtOffset(margin, y2);
                content2.showText((raiser != null ? raiser.getName() : "-") + "                    " + (against != null ? against.getName() : "-"));
                content2.endText();

                // ===== FOOTER TRANG 2 =====
                float footerY = 150;

                content2.beginText();
                content2.setFont(font, 10);
                content2.newLineAtOffset(margin, footerY);
                content2.showText("Ngay " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                content2.endText();

                footerY -= 15;
                content2.beginText();
                content2.setFont(font, 11);
                content2.newLineAtOffset(margin, footerY);
                content2.showText("MAISON CAR RENTAL");
                content2.endText();

                footerY -= 12;
                content2.beginText();
                content2.setFont(font, 9);
                content2.newLineAtOffset(margin, footerY);
                content2.showText("He thong quan ly cho thue xe");
                content2.endText();

                footerY -= 12;
                content2.beginText();
                content2.setFont(font, 9);
                content2.newLineAtOffset(margin, footerY);
                content2.showText("www.maison.vn | 1900-xxxx");
                content2.endText();

                content2.close();

                document.save(contractPath.toFile());
                log.info("Contract PDF generated: {}", contractPath);
            }

            return "/files/contracts/" + filename;

        } catch (Exception e) {
            log.error("Failed to generate contract PDF", e);
            throw new RuntimeException("Khong the tao hop dong PDF: " + e.getMessage(), e);
        }
    }

    private PDType0Font loadUnicodeFont(PDDocument document) throws IOException {
        String[] fontPaths = {
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/Arial.ttf",
                "C:/Windows/Fonts/segoeui.ttf",
                "C:/Windows/Fonts/tahoma.ttf",
                "C:/Windows/Fonts/times.ttf",
                "C:/Windows/Fonts/calibri.ttf",
        };

        for (String path : fontPaths) {
            File fontFile = new File(path);
            if (fontFile.exists()) {
                log.info("Using font: {}", path);
                return PDType0Font.load(document, fontFile);
            }
        }

        throw new IOException("Khong tim thay font ho tro Unicode");
    }

    private float writeLine(PDPageContentStream content, String text,
            PDType0Font font, float fontSize,
            float x, float y, boolean center) throws IOException {
        content.beginText();
        content.setFont(font, fontSize);

        if (center) {
            float textWidth = font.getStringWidth(text) / 1000 * fontSize;
            float pageWidth = 595;
            x = (pageWidth - textWidth) / 2;
        }

        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();

        return y - fontSize - 5;
    }

    private float writeWrappedText(PDPageContentStream content, String text,
            PDType0Font font, float fontSize,
            float x, float y) throws IOException {
        float maxWidth = 500;
        float lineHeight = fontSize + 3;
        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();

        for (String word : words) {
            String testLine = line.length() == 0 ? word : line + " " + word;
            float lineWidth = font.getStringWidth(testLine) / 1000 * fontSize;

            if (lineWidth > maxWidth && line.length() > 0) {
                content.beginText();
                content.setFont(font, fontSize);
                content.newLineAtOffset(x, y);
                content.showText(line.toString());
                content.endText();
                y -= lineHeight;
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(testLine);
            }
        }

        if (line.length() > 0) {
            content.beginText();
            content.setFont(font, fontSize);
            content.newLineAtOffset(x, y);
            content.showText(line.toString());
            content.endText();
            y -= lineHeight;
        }

        return y;
    }
}