# Quy trình Giải quyết Tranh chấp và Khiếu nại dành cho Admin

## Bước 1: Tiếp nhận Đơn tranh chấp
1. Khi có sự cố chuyến đi (hư hại xe, thái độ phục vụ, tranh chấp tiền cọc, phụ phí), Khách hàng hoặc Chủ xe tạo đơn tranh chấp
2. Bên khởi kiện điền thông tin mô tả sự cố, số tiền yêu cầu bồi thường và tải lên các tệp chứng cứ (hình ảnh, video, hóa đơn)
3. Đơn xuất hiện trong mục "Tranh chấp" của Admin với trạng thái "Đang mở"

## Bước 2: Thời hạn Phản bác của Bên bị khiếu nại (48 giờ)
1. Hệ thống tự động gửi thông báo cho bên bị kiện
2. Bên bị kiện có thời hạn tối đa 48 giờ để:
   - **Đồng ý thỏa thuận bồi thường**
   - **Phản bác khiếu nại** và tải lên bằng chứng đối chứng
3. Nếu sau 48 giờ bên bị kiện không có phản hồi: Hệ thống xem như bên bị kiện đã đồng ý với nội dung khiếu nại và chuyển Admin duyệt phán quyết

## Bước 3: Đánh giá và Yêu cầu Bổ sung Chứng cứ (24 giờ)
1. Admin xem xét hồ sơ, biên bản giao nhận xe và đối soát bằng chứng của cả 2 bên
2. Nếu chưa đủ thông tin để kết luận:
   - Admin bấm nút "Yêu cầu xem xét lại / Bổ sung chứng cứ" cho 1 hoặc cả 2 bên
   - Bên nhận yêu cầu có thời hạn 24 giờ để cập nhật thêm hình ảnh/chứng cứ
3. Nếu quá 24 giờ không bổ sung: Hệ thống khóa quyền cập nhật, Admin tiếp tục phân xử dựa trên những bằng chứng hiện có (bên không hợp tác sẽ chịu bất lợi trong phán quyết)

## Bước 4: Ban hành Phán quyết và Tạo Biên bản Hợp đồng Tranh chấp
1. Admin đưa ra quyết định xử lý:
   - Chấp nhận toàn phần hoặc một phần yêu cầu bồi thường
   - Quyết định số tiền hoàn trả cho khách hoặc đền bù cho chủ xe
2. Hệ thống tự động tạo file PDF Biên bản giải quyết tranh chấp (hợp đồng tranh chấp) kèm toàn bộ chữ ký điện tử và bằng chứng đính kèm
3. Các bên có thể tải file PDF về làm căn cứ pháp lý để thực hiện thủ tục bồi thường
4. Trạng thái tranh chấp chuyển sang "Đã giải quyết"
