# Cập nhật bản đồ và thao tác chơi

Các thay đổi áp dụng vào game hiện tại, giữ nguyên khóa lưu `xom_nong_trai_v2` và 60 ô đất đã có.

1. **Chọn quê:** thay đa giác vẽ tay bằng đường biên và đảo gần bờ của Natural Earth v5.1.2, tỷ lệ 1:50 triệu. Dùng đường SVG để zoom không vỡ; điều chỉnh tỷ lệ kinh độ ở vĩ tuyến 16,5° Bắc. Tên tỉnh xuất hiện khi phóng to hoặc chọn, giảm chữ đè nhau. Nhãn quần đảo ngoài khơi vẫn hiển thị riêng.
2. **Nhân vật:** chỉnh tỷ lệ đầu và khuôn mặt, ánh sáng, mắt, má và giày. Mô hình chung tiếp tục nhận đúng da/tóc/áo/mũ. Màn chỉnh sửa có xem đứng, đi bộ, làm vườn và xoay; hoạt ảnh dừng khi đóng màn. Biểu tượng chọn mẫu dùng cùng bộ dựng nhân vật.
3. **Map:** lưới tăng từ 32×32 lên 40×40, thêm đường dạo và vườn phương Nam. Đây là mở rộng không gian khám phá; không tự thêm ô ruộng hay đổi thứ tự 60 ô trong dữ liệu cũ. Bảng khám phá dẫn tới khu mới.
4. **Camera:** có xoay trái/phải từng 30°, chuyển góc êm và nút trở về góc ban đầu. Chụm hai ngón ưu tiên zoom/pan để tránh vô tình xoay. Chuột phải hoặc Shift+kéo vẫn xoay tự do, độ nghiêng giới hạn để dễ thao tác.
5. **Câu cá:** ba cảnh PNG riêng cho Ao Sen, Sông Quê và Vịnh Lam, mỗi cảnh có phiên bản ngang/dọc. Ảnh giữ đúng tỷ lệ, nhân vật đặt trên sàn câu. Chọn địa điểm đổi cả cảnh lẫn loài cá; ảnh xem trước cũng theo địa điểm.
6. **Kích thước:** mặc định nhân vật lớn hơn 25%; Cài đặt → Chung có thanh 80–180%, áp dụng ngay và lưu lại. Cùng hệ số dùng cho map 3D và chế độ 2D dự phòng.
7. **Hình trong cửa hàng:** dùng chung bộ chọn ảnh cây trưởng thành với ngoài vườn, giữ ảnh riêng của giống cấp cao. Công trình trong map dùng PNG đúng mã công trình thay vì một nhà 3D chung cho mọi loại; cách hiển thị này giữ mẫu nhà máy/chuồng khớp cửa hàng trong không gian 3D.
8. **Chuyển động:** rút gọn đoạn đường thẳng có kiểm tra vật cản, tái sử dụng lưới tìm đường trong khoảng ngắn, xoay nhân vật mềm hơn; vật nuôi WebGL dùng khung hoạt ảnh đi/đứng thay vì ảnh tĩnh trượt trên đất. Giảm chi phí bóng đổ.
9. **Chăm cây:** bốn nút 58px theo cung tròn, giữ thông tin vật phẩm và trạng thái đã dùng. Đất chưa mua có cỏ, hàng rào và khóa; đất trống có luống, đất đã gieo màu sẫm, đất nâng cấp có viền đá.

Ảnh mới và prompt bằng công cụ Imagegen tích hợp: [playability-art.json](playability-art.json). Bốn PNG ruộng riêng đã kiểm tra alpha, tách thành từng hình với khoảng đệm; ba nền câu cá là ảnh nền kín, không tách nền. Các tài nguyên cũ vẫn dùng bởi game, chế độ dự phòng hoặc thư viện được giữ lại, không xóa chỉ vì không xuất hiện ở map 3D.

Nguồn địa lý: [Natural Earth, dữ liệu v5.1.2](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson), public domain. Đây là đường bao tổng quan cho giao diện game, không phải bộ ranh giới hành chính tỉnh.

Chạy `node tools/serve-game.mjs`, mở `http://127.0.0.1:8788/` để dùng WebGL 3D. Mở trực tiếp file HTML vẫn có chế độ tương thích 2D.

Kiểm tra: `node tools/verify-3d.mjs`, `node tools/test-farming.mjs`, `node tools/test-motion.mjs`. Kiểm tra trình duyệt dùng hồ sơ tạm, không mở hồ sơ Chrome cá nhân.

Đã qua 29 kiểm tra trình duyệt, 14 tình huống trồng cây, 29 tình huống câu cá và 17 tình huống làng. Kiểm tra chuyển động ở 30/60/120 bước mỗi giây cho cùng quãng đường và chu kỳ bước chân; đường rút gọn không đi xuyên vật cản. Kiểm tra đường dẫn bao phủ 1.074 PNG, 38 tài nguyên HTML và cú pháp các tệp JavaScript chính. Đây không phải cam kết tốc độ khung hình cho mọi thiết bị.
