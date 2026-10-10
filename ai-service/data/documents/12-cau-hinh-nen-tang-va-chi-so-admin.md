# Hướng dẫn Cấu hình Nền tảng và Chỉ số Quản trị dành cho Admin

## Bước 1: Theo dõi các Chỉ số Vận hành trên Admin Dashboard
Admin theo dõi hiệu quả kinh doanh của toàn sàn qua các chỉ số cốt lõi:
1. **Tổng doanh thu sàn**: Toàn bộ doanh số giao dịch tiền thuê xe phát sinh trên hệ thống
2. **Thực nhận nền tảng**: Doanh thu thực tế của sàn = `% hoa hồng quy định × Tổng doanh thu sàn`
3. **Tỉ lệ hủy đơn**: Phần trăm số đơn hàng bị khách hoặc chủ xe hủy so với tổng số đơn được tạo
4. **Chỉ số hài lòng khách hàng (CSAT tổng hợp)**:
   - $CSAT_{xe}$ = Điểm đánh giá trung bình chất lượng xe
   - $CSAT_{chủ xe}$ = Điểm đánh giá trung bình chất lượng phục vụ của chủ xe
   - $CSAT_{tổng}$ = $(CSAT_{xe} + CSAT_{chủ xe}) / 2$
5. **Hồ sơ chờ xử lý**: Tổng số xe chờ duyệt, đăng ký chủ xe chờ duyệt, yêu cầu rút tiền đang chờ xử lý kèm nút "Duyệt ngay"

## Bước 2: Thiết lập Cấu hình Phí Nền tảng (Platform Config)
Admin truy cập mục "Cấu hình" để điều chỉnh các tham số tài chính:
1. **Phần trăm hoa hồng nền tảng**: Tỉ lệ sàn thu trên mỗi đơn thuê xe hoàn thành (ví dụ: 10% - 15%)
2. **Phí rút tiền của chủ xe**: Mức phí cố định trừ trên mỗi lượt chủ xe rút tiền về ngân hàng
3. **Tỉ lệ tiền đặt cọc**: Tỉ lệ cọc mặc định khi khách tạo đơn (mặc định 30% tổng tiền thuê)

## Bước 3: Cấu hình Phí Vượt Kilomet (Chỉ áp dụng cho Xe tự lái)
Hệ thống cho phép cấu hình giới hạn km/ngày và đơn giá phạt khi đi vượt:
- **Sedan**: Giới hạn 300 km/ngày, phí vượt 5,000 đ/km
- **SUV**: Giới hạn 350 km/ngày, phí vượt 7,000 đ/km
- **MPV**: Giới hạn 400 km/ngày, phí vượt 8,000 đ/km
- **Xe sang / cao cấp**: Giới hạn 250 km/ngày, phí vượt 10,000 đ/km

## Bước 4: Cấu hình Phí Trả xe Quá giờ (Áp dụng cả Tự lái và Có tài xế)
Hệ thống hỗ trợ 5 bậc xử lý trễ hạn giao xe:
- **Dưới 15 phút**: Miễn phí linh động cho khách hàng
- **Từ 15 phút đến 1 giờ**: Tính phí trễ theo giờ (mặc định 100,000 đ/giờ)
- **Từ 1 giờ đến 4 giờ**: Phạt 50% đơn giá thuê 1 ngày của xe
- **Từ 4 giờ đến 24 giờ**: Phạt 100% đơn giá thuê 1 ngày của xe
- **Vượt quá 24 giờ**: Tính theo số ngày thực tế cộng thêm phí phạt vi phạm 20%
