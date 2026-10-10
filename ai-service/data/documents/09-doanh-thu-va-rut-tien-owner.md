# Quy định Doanh thu và Rút tiền dành cho Chủ xe (Owner)

## Bước 1: Theo dõi Doanh thu và Số dư ví
1. Chủ xe truy cập mục "Doanh thu" trên thanh điều hướng
2. Xem các chỉ số tài chính quan trọng:
   - **Tổng thu nhập**: Tổng tiền cho thuê xe sau khi đã trích khấu trừ % hoa hồng cho nền tảng
   - **Số lượt thuê**: Tổng số lượt đơn hàng đã hoàn tất
   - **Số dư khả dụng**: Số tiền hiện có thể tạo lệnh rút về tài khoản ngân hàng
   - **Đang chờ rút**: Số tiền của các yêu cầu rút tiền đang chờ Quản trị viên (Admin) xét duyệt

## Bước 2: Tạo yêu cầu Rút tiền
1. Bấm nút "Yêu cầu rút tiền" hoặc chuyển sang trang "Rút tiền"
2. Điền thông tin nhận tiền:
   - Tên ngân hàng thụ hưởng
   - Số tài khoản ngân hàng
   - Tên chủ tài khoản (phải khớp với tên đăng ký chủ xe)
   - Số tiền muốn rút (phải nhỏ hơn hoặc bằng số dư khả dụng)
3. Xem phí rút tiền quy định của sàn:
   - `Số tiền thực nhận = Số tiền yêu cầu rút - Phí rút tiền nền tảng`
4. Bấm "Gửi yêu cầu rút tiền"

## Bước 3: Chờ Admin xét duyệt và Giải ngân
1. Yêu cầu rút tiền được chuyển đến hàng chờ duyệt của Admin với trạng thái "Chờ duyệt"
2. Admin kiểm tra tính hợp lệ của doanh thu và đối soát các chuyến đi
3. Khi Admin duyệt: Lệnh chuyển sang "Đã chuyển tiền", tiền được chuyển về tài khoản ngân hàng của Chủ xe trong vòng 24 giờ làm việc
4. Nếu Admin từ chối: Chủ xe nhận được thông báo kèm lý do từ chối, số tiền yêu cầu được hoàn trả lại vào Số dư khả dụng
