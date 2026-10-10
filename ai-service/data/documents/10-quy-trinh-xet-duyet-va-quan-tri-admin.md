# Quy trình Xét duyệt và Quản trị hệ thống dành cho Admin

## Bước 1: Xét duyệt Xe mới của Chủ xe
1. Truy cập mục "Duyệt xe" trên thanh điều hướng Admin
2. Lọc danh sách theo trạng thái: "Chờ duyệt", "Đã duyệt", "Từ chối"
3. Nhấp vào xe để kiểm tra tính hợp lệ:
   - Thông tin thông số kỹ thuật (Hãng, model, năm sản xuất, số chỗ, biển số xe)
   - Hình ảnh xe rõ ràng, không mờ nhòe, không vi phạm bản quyền
   - Mức giá thuê hợp lý với mặt bằng thị trường
4. Bấm "Duyệt xe" để xe xuất hiện trên Bộ sưu tập cho khách đặt thuê, hoặc bấm "Từ chối" kèm ghi chú lý do để chủ xe cập nhật lại

## Bước 2: Xét duyệt Hồ sơ Đăng ký Chủ xe (Owner Request)
1. Truy cập mục "Duyệt chủ xe" trên thanh điều hướng
2. Xem thông tin hồ sơ của khách hàng gửi yêu cầu nâng cấp tài khoản
3. Kiểm tra các giấy tờ tùy thân, giấy tờ sở hữu xe hoặc hợp đồng ủy quyền
4. Thực hiện quyết định:
   - **Chấp thuận**: Hệ thống tự động cập nhật Role tài khoản người dùng từ `CUSTOMER` lên `OWNER`. Người dùng nhận thông báo nâng quyền thành công và đăng nhập lại để cập nhật giao diện chủ xe
   - **Từ chối**: Nhập lý do từ chối gửi thông báo cho khách hàng để khách bổ sung hồ sơ nếu cần

## Bước 3: Xác minh Giấy tờ Người dùng (GPLX & CCCD)
1. Truy cập mục "Người dùng" -> Chọn tab "Chờ duyệt xác minh"
2. Kiểm tra bộ 5 ảnh của khách hàng:
   - Mặt trước và mặt sau Căn cước công dân (CCCD)
   - Mặt trước và mặt sau Giấy phép lái xe (GPLX hạng B1/B2 còn hạn)
   - Ảnh chân dung chính chủ cầm giấy tờ tùy thân
3. Nếu hợp lệ: Bấm "Xác minh thành công", cấp quyền cho người dùng được đặt thuê xe tự lái
4. Nếu không hợp lệ: Bấm "Từ chối" kèm mô tả lỗi (ảnh mờ, giấy tờ hết hạn...) để khách chụp lại

## Bước 4: Xét duyệt Yêu cầu Rút tiền
1. Truy cập mục "Duyệt rút tiền"
2. Kiểm tra thông tin số tài khoản nhận tiền và số dư của chủ xe
3. Thực hiện chuyển khoản giải ngân và bấm "Xác nhận đã chuyển tiền" để hoàn tất lệnh
