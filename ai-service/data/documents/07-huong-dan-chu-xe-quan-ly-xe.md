# Hướng dẫn Chủ xe (Owner) Quản lý xe

## Bước 1: Truy cập trang Quản lý xe
1. Đăng nhập tài khoản Chủ xe (Role OWNER)
2. Bấm vào menu "Quản lý xe" trên thanh điều hướng
3. Xem danh sách toàn bộ xe hiện có và trạng thái của từng xe

## Bước 2: Thêm xe mới vào hệ thống
Chủ xe có 2 cách thêm xe:
- **Cách 1: Thêm thủ công từng xe**
  1. Bấm nút "Thêm xe mới"
  2. Điền đầy đủ thông tin: Biển số, Hãng xe, Model, Năm sản xuất, Số chỗ ngồi, Hộp số, Nhiên liệu, Giá thuê theo ngày, Địa chỉ nhận xe
  3. Tải lên hình ảnh ngoại thất và nội thất xe
  4. Bấm "Lưu thông tin xe"
- **Cách 2: Nhập hàng loạt qua file Excel**
  1. Chuẩn bị file định dạng `.xlsx` (Sheet đầu tiên, mã hóa UTF-8)
  2. File gồm chuẩn 11 cột từ A đến K theo đúng thứ tự:
     - Cột A: Biển số (duy nhất, không trùng)
     - Cột B: Hãng xe (Toyota, Ford, Kia, Honda...)
     - Cột C: Model xe
     - Cột D: Năm sản xuất
     - Cột E: Số chỗ ngồi
     - Cột F: Loại xe (Sedan, SUV, MPV...)
     - Cột G: Hộp số (Tự động / Số sàn)
     - Cột H: Nhiên liệu (Xăng / Dầu / Điện)
     - Cột I: Giá thuê 1 ngày (VNĐ)
     - Cột J: Địa chỉ nhận xe
     - Cột K: Mô tả chi tiết xe
  3. Bấm "Nhập file Excel", chọn file và xác nhận tải lên

## Bước 3: Chờ Admin kiểm duyệt xe
1. Xe sau khi thêm sẽ ở trạng thái "Chờ duyệt"
2. Quản trị viên (Admin) sẽ kiểm tra thông tin và hình ảnh xe
3. Nếu được duyệt: Xe chuyển sang trạng thái "Đã duyệt", xuất hiện trong Bộ sưu tập cho khách đặt thuê
4. Nếu bị từ chối: Chủ xe nhận thông báo lý do từ chối, chỉnh sửa lại thông tin và gửi duyệt lại

## Bước 4: Quản lý trạng thái và bảo trì xe
1. **Khóa xe**: Chủ xe có thể tạm khóa xe khi cần bảo dưỡng, sửa chữa (xe bị khóa sẽ ẩn khỏi Bộ sưu tập)
2. **Mở khóa xe**: Chuyển trạng thái xe về "Sẵn sàng" khi xe hoàn tất bảo dưỡng
3. **Xe đang được thuê**: Khi khách bắt đầu chuyến đi, xe tự động mang nhãn "Đang được thuê" và tạm ẩn khỏi danh sách tìm kiếm cho đến khi hoàn thành trả xe
