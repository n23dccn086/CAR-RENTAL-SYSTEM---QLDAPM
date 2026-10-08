package com.carrental.car.service;

import com.carrental.car.entity.*;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.repository.DriverRepository;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ExcelImportService {

    CarRepository carRepository;
    DriverRepository driverRepository;

    // ============================================================
    // IMPORT CARS
    // ============================================================

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

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String plate = getStringCell(row, 0);
                    if (plate == null || plate.isBlank()) {
                        continue;
                    }

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
                    log.warn("Import car error at row {}: {}", i + 1, e.getMessage());
                }
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Excel import cars failed", e);
            throw new BadRequestException(ErrorCode.EXCEL_INVALID_FORMAT,
                    "Không đọc được file Excel: " + e.getMessage());
        }

        log.info("Import cars done: success={}, skip={}, errors={}",
                successCount, skipCount, errors.size());

        return new ImportResult(successCount, skipCount, errors);
    }

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

        if (plate == null || plate.isBlank()) throw new RuntimeException("Biển số trống");
        if (brand == null || brand.isBlank()) throw new RuntimeException("Hãng trống");
        if (model == null || model.isBlank()) throw new RuntimeException("Model trống");
        if (year == null || year < 1990 || year > 2100) throw new RuntimeException("Năm SX không hợp lệ");
        if (seats == null || seats < 2 || seats > 30) throw new RuntimeException("Số chỗ không hợp lệ (2-30)");
        if (pricePerDay == null || pricePerDay < 0) throw new RuntimeException("Giá thuê không hợp lệ");

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
                .status(CarStatus.PENDING)
                .currentKm(0)
                .extraKmPrice(5000L)
                .deliveryFee(100000L)
                .cleaningFee(0L)
                .deliveryRadius(20)
                .rentalMode(RentalMode.SELF_DRIVE)
                .build();
    }

    // ============================================================
    // ★ IMPORT DRIVERS (UC-O12)
    // ============================================================

    /**
     * Import tài xế từ file Excel.
     * Cột: Tên | SĐT | Email | CCCD | Số GPLX | Hạng GPLX | Ngày hết hạn GPLX | Ngày sinh | Địa chỉ | Kinh nghiệm
     */
    @Transactional
    public ImportResult importDrivers(MultipartFile file, Long ownerId) {
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

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String name = getStringCell(row, 0);
                    String phone = getStringCell(row, 1);

                    // Bỏ qua dòng trống hoàn toàn
                    if ((name == null || name.isBlank()) && (phone == null || phone.isBlank())) {
                        continue;
                    }

                    // Validate bắt buộc
                    if (name == null || name.isBlank()) {
                        errors.add("Dòng " + (i + 1) + ": Tên tài xế trống");
                        continue;
                    }
                    if (phone == null || phone.isBlank()) {
                        errors.add("Dòng " + (i + 1) + ": SĐT tài xế trống");
                        continue;
                    }

                    // Skip nếu trùng SĐT
                    if (driverRepository.existsByPhone(phone.trim())) {
                        skipCount++;
                        errors.add("Dòng " + (i + 1) + ": SĐT " + phone + " đã tồn tại → bỏ qua");
                        continue;
                    }

                    Driver driver = parseDriverRow(row, ownerId);
                    driverRepository.save(driver);
                    successCount++;

                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + ": " + e.getMessage());
                    log.warn("Import driver error at row {}: {}", i + 1, e.getMessage());
                }
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Excel import drivers failed", e);
            throw new BadRequestException(ErrorCode.EXCEL_INVALID_FORMAT,
                    "Không đọc được file Excel: " + e.getMessage());
        }

        log.info("Import drivers done: success={}, skip={}, errors={}",
                successCount, skipCount, errors.size());

        return new ImportResult(successCount, skipCount, errors);
    }

    private Driver parseDriverRow(Row row, Long ownerId) {
        String name = getStringCell(row, 0);
        String phone = getStringCell(row, 1);
        String email = getStringCell(row, 2);
        String cccd = getStringCell(row, 3);
        String licenseNumber = getStringCell(row, 4);
        String licenseClass = getStringCell(row, 5);
        String licenseExpiryStr = getStringCell(row, 6);
        String dateOfBirthStr = getStringCell(row, 7);
        String address = getStringCell(row, 8);
        Integer experienceYears = getIntCell(row, 9);

        // Validate
        if (name == null || name.trim().length() < 2) {
            throw new RuntimeException("Tên tài xế phải ≥ 2 ký tự");
        }
        if (phone == null || !phone.trim().matches("^[0-9]{10,11}$")) {
            throw new RuntimeException("SĐT phải 10-11 chữ số");
        }
        if (cccd != null && !cccd.isBlank() && !cccd.trim().matches("^[0-9]{12}$")) {
            throw new RuntimeException("CCCD phải 12 chữ số");
        }
        if (licenseNumber == null || licenseNumber.isBlank()) {
            throw new RuntimeException("Số GPLX không được trống");
        }
        if (licenseClass == null || licenseClass.isBlank()) {
            throw new RuntimeException("Hạng GPLX không được trống");
        }
        if (!licenseClass.trim().matches("^(B1|B2|C|D|E)$")) {
            throw new RuntimeException("Hạng GPLX phải là B1, B2, C, D hoặc E");
        }

        // Parse ngày
        LocalDate licenseExpiry = parseDate(licenseExpiryStr);
        LocalDate dateOfBirth = parseDate(dateOfBirthStr);

        if (dateOfBirth != null) {
            int age = LocalDate.now().getYear() - dateOfBirth.getYear();
            if (age < 18) {
                throw new RuntimeException("Tài xế phải đủ 18 tuổi");
            }
        }

        if (experienceYears == null) experienceYears = 0;
        if (experienceYears < 0 || experienceYears > 50) {
            throw new RuntimeException("Kinh nghiệm phải 0-50 năm");
        }

        return Driver.builder()
                .ownerId(ownerId)
                .name(name.trim())
                .phone(phone.trim())
                .email(email != null && !email.isBlank() ? email.trim() : null)
                .cccd(cccd != null && !cccd.isBlank() ? cccd.trim() : null)
                .licenseNumber(licenseNumber.trim())
                .licenseClass(licenseClass.trim())
                .licenseExpiry(licenseExpiry)
                .dateOfBirth(dateOfBirth)
                .address(address != null && !address.isBlank() ? address.trim() : null)
                .experienceYears(experienceYears)
                .status(DriverStatus.PENDING)
                .rating(0.0)
                .totalTrips(0)
                .build();
    }

    /**
     * Parse date từ Excel — hỗ trợ: dd/MM/yyyy, yyyy-MM-dd, dd-MM-yyyy
     */
    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        String v = value.trim();

        try {
            return LocalDate.parse(v, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception ignored) {}

        try {
            return LocalDate.parse(v);
        } catch (Exception ignored) {}

        try {
            return LocalDate.parse(v, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception ignored) {}

        throw new RuntimeException("Ngày không hợp lệ: " + value + " (dùng dd/MM/yyyy hoặc yyyy-MM-dd)");
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