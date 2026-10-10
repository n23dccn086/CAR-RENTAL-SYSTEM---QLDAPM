# Quy trình Duyệt đơn và Giao nhận xe dành cho Chủ xe (Owner)

## Bước 1: Tiếp nhận và Duyệt đơn đặt xe
1. Chủ xe nhận thông báo chuông và vào mục "Đơn hàng"
2. Xem thông tin khách hàng, thời gian thuê, địa điểm nhận xe và tiền cọc khách đã thanh toán
3. Quyết định duyệt đơn:
   - **Bấm Duyệt đơn**: Đơn chuyển sang trạng thái "Đã duyệt", khách nhận được thông báo để chuẩn bị nhận xe
   - **Bấm Từ chối đơn**: Đơn bị hủy, hệ thống tự động hoàn trả 100% tiền cọc cho khách hàng
4. Đối với đơn có tài xế (`WITH_DRIVER`): Khách đã chọn tài xế lúc đặt, Owner duyệt đơn hệ thống sẽ gửi Magic Link cho tài xế xác nhận nhận cuốc

## Bước 2: Bàn giao xe cho khách (Biên bản Giao xe - Pickup)
1. Gặp khách hàng tại điểm hẹn đúng giờ hẹn
2. Kiểm tra giấy tờ gốc của khách (GPLX, CCCD đối với khách thuê tự lái)
3. Mở chức năng "Biên bản giao xe" trên giao diện đơn hàng:
   - Nhập số công-tơ-mét (Odometer) hiện tại của xe
   - Ghi nhận mức nhiên liệu trong bình (theo vạch xăng)
   - Chụp ảnh 4 góc ngoại quan xe và các vết xước cũ (nếu có)
4. Cả Chủ xe và Khách hàng cùng ký xác nhận điện tử vào Biên bản giao xe
5. Trao chìa khóa cho khách, đơn hàng chuyển sang trạng thái "Đang thuê"

## Bước 3: Nhận lại xe khi kết thúc chuyến (Biên bản Nhận xe - Return)
1. Gặp khách kiểm tra xe khi khách hoàn thành chuyến đi
2. Mở "Biên bản nhận xe" trên hệ thống:
   - Nhập số công-tơ-mét khi trả xe
   - Ghi nhận mức nhiên liệu thực tế lúc trả
   - Kiểm tra các va chạm, trầy xước mới phát sinh
3. Hệ thống tự động tính toán phụ phí:
   - **Phí vượt km**: Nếu số km vượt quá giới hạn theo ngày của dòng xe
   - **Phí quá giờ**: Nếu khách trả trễ so với giờ hẹn quy định
   - **Phí vệ sinh / xăng**: Nhập bổ sung nếu thiếu xăng hoặc xe quá bẩn
4. Chủ xe và Khách hàng ký xác nhận Biên bản nhận xe

## Bước 4: Hoàn tất đơn hàng và nhận thanh toán
1. Sau khi ký biên bản nhận xe, màn hình bên phía Khách hàng sẽ hiện nút thanh toán
2. Số tiền thanh toán cuối cùng bao gồm: `Số tiền thuê còn lại (sau trừ cọc) + Các phụ phí phát sinh`
3. Sau khi khách thanh toán thành công, đơn hàng chuyển sang trạng thái "Hoàn tất"
4. Xe tự động chuyển trạng thái về "Sẵn sàng" để tiếp tục phục vụ khách hàng tiếp theo
