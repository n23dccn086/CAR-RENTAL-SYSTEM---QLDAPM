package com.carrental.car.service;

import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.*;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ExcelImportService {

    CarRepository carRepository;

    /**
     * Import xe từ file Excel.
     * Cột: Biển số | Hãng | Model | Năm | Số chỗ | Loại xe | Hộp số | Nhiên liệu | Giá/ngày | Địa chỉ | Mô tả
     *
     * @return ImportResult gồm: số thành công, số skip (trùng biển số), danh sách lỗi
     */
    @Transactional
    public ImportResult importCars(MultipartFile file, Long ownerId) {
        if (file.isEmpty()) {
            throw new BadRequestException(ErrorCode.FILE_EMPTY);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            throw new BadRequestException(ErrorCode.EXCEL_INVALID_FORMAT,
                    "Chỉ hỗ trợ file .xlsx");
        }

        int successCount = 0;
        int skipCount = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 2) {
                throw new BadRequestException(ErrorCode.EXCEL_EMPTY,
                        "File Excel không có dữ liệu");
            }

            // Bắt đầu từ row 1 (bỏ header)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String plate = getStringCell(row, 0);
                    if (plate == null || plate.isBlank()) {
                        // Bỏ qua dòng trống
                        continue;
                    }

                    // Skip nếu trùng biển số
                    if (carRepository.existsByPlate(plate)) {
                        skipCount++;
                        errors.add("Dòng " + (i + 1) + ": Biển số " + plate + " đã tồn tại → bỏ qua");
                        continue;
                    }

                    Car car = parseRow(row, ownerId);
                    carRepository.save(car);
                    successCount++;

                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + ": " + e.getMessage());
                    log.warn("Import error at row {}: {}", i + 1, e.getMessage());
                }
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Excel import failed", e);
            throw new BadRequestException(ErrorCode.EXCEL_INVALID_FORMAT,
                    "Không đọc được file Excel: " + e.getMessage());
        }

        log.info("Import done: success={}, skip={}, errors={}",
                successCount, skipCount, errors.size());

        return new ImportResult(successCount, skipCount, errors);
    }

    /**
     * Parse 1 row Excel → Car entity.
     */
    private Car parseRow(Row row, Long ownerId) {
        String plate = getStringCell(row, 0);
        String brand = getStringCell(row, 1);
        String model = getStringCell(row, 2);
        Integer year = getIntCell(row, 3);
        Integer seats = getIntCell(row, 4);
        String carTypeStr = getStringCell(row, 5);
        String transmissionStr = getStringCell(row, 6);
        String fuelTypeStr = getStringCell(row, 7);
        Long pricePerDay = getLongCell(row, 8);
        String address = getStringCell(row, 9);
        String description = getStringCell(row, 10);

        // Validate required
        if (plate == null || plate.isBlank()) throw new RuntimeException("Biển số trống");
        if (brand == null || brand.isBlank()) throw new RuntimeException("Hãng trống");
        if (model == null || model.isBlank()) throw new RuntimeException("Model trống");
        if (year == null || year < 1990 || year > 2100) throw new RuntimeException("Năm SX không hợp lệ");
        if (seats == null || seats < 2 || seats > 30) throw new RuntimeException("Số chỗ không hợp lệ (2-30)");
        if (pricePerDay == null || pricePerDay < 0) throw new RuntimeException("Giá thuê không hợp lệ");

        // Parse enum
        CarType carType;
        try {
            carType = CarType.valueOf(carTypeStr.toUpperCase().trim());
        } catch (Exception e) {
            throw new RuntimeException("Loại xe không hợp lệ: " + carTypeStr +
                    " (cho phép: SEDAN, SUV, MPV, HATCHBACK, PICKUP, VAN, LUXURY)");
        }

        Transmission transmission;
        try {
            transmission = Transmission.valueOf(transmissionStr.toUpperCase().trim());
        } catch (Exception e) {
            throw new RuntimeException("Hộp số không hợp lệ: " + transmissionStr +
                    " (cho phép: AUTOMATIC, MANUAL)");
        }

        FuelType fuelType;
        try {
            fuelType = FuelType.valueOf(fuelTypeStr.toUpperCase().trim());
        } catch (Exception e) {
            throw new RuntimeException("Nhiên liệu không hợp lệ: " + fuelTypeStr +
                    " (cho phép: GASOLINE, DIESEL, ELECTRIC, HYBRID)");
        }

        return Car.builder()
                .ownerId(ownerId)
                .plate(plate.trim())
                .brand(brand.trim())
                .model(model.trim())
                .year(year)
                .seats(seats)
                .carType(carType)
                .transmission(transmission)
                .fuelType(fuelType)
                .pricePerDay(pricePerDay)
                .address(address != null ? address.trim() : null)
                .description(description != null ? description.trim() : null)
                .status(CarStatus.PENDING)  // ← Chờ Admin duyệt
                .currentKm(0)
                .extraKmPrice(5000L)
                .deliveryFee(100000L)
                .cleaningFee(0L)
                .deliveryRadius(20)
                .rentalMode(RentalMode.SELF_DRIVE)
                .build();
    }

    // ===== CELL READERS =====

    private String getStringCell(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return null;

        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue();
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((long) cell.getNumericCellValue());
        }
        if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        }
        return null;
    }

    private Integer getIntCell(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (int) cell.getNumericCellValue();
            }
            String s = getStringCell(row, index);
            return s != null ? Integer.parseInt(s.trim()) : null;
        } catch (Exception e) {
            throw new RuntimeException("Cột " + (index + 1) + " phải là số nguyên");
        }
    }

    private Long getLongCell(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (long) cell.getNumericCellValue();
            }
            String s = getStringCell(row, index);
            return s != null ? Long.parseLong(s.trim()) : null;
        } catch (Exception e) {
            throw new RuntimeException("Cột " + (index + 1) + " phải là số");
        }
    }

    // ===== RESULT =====

    public record ImportResult(int successCount, int skipCount, List<String> errors) {}
}