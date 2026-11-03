Cập nhật bản 8: map hiện dùng [khớp GPU liên tục](SMOOTH-MOTION.md). Phần canvas và xuất PNG vẫn dùng bộ ảnh bên dưới.

# Bộ nhân vật minh họa · 02/11/2026

Bộ ảnh đang chạy dùng phong cách 3D hoạt hình mềm, chi tiết như mẫu người chơi gửi. Nhân vật trên map là sprite minh họa trong cảnh 3D; phần thân, tóc và mũ có cùng điểm ghép với chân dung, màn chỉnh sửa và câu cá.

- Sáu khuôn mặt riêng: An, Mây, Bình, Tư, Lan, Sóc.
- Bốn màu da, năm màu tóc, sáu màu áo, năm kiểu tóc, ba kiểu trang phục và bốn lựa chọn mũ: tổng cộng 43.200 tổ hợp.
- Mười tám thân người riêng cho sáu nhân vật × áo sơ mi/quần yếm/áo khoác. Ảnh thân không có tóc hoặc mũ vẽ sẵn, tránh chồng phụ kiện khi đổi lựa chọn.
- Mỗi thân có mặt nạ đổi màu da và quần áo riêng. Tóc được tô màu giữ lại sắc độ; nón lá, mũ rơm và khăn mỏ quạ là PNG riêng. Chọn không mũ sẽ bỏ hoàn toàn lớp mũ.
- Tóc, mũ, thân và khung chuyển động có nền alpha. Điểm đặt chân được giữ thống nhất. Bước đi, làm việc và kéo cần dùng cùng ảnh ghép với tùy chỉnh hiện tại.
- Mười hai loài vật sử dụng ảnh đã tách riêng, xử lý mép ảnh và cập nhật cả icon. Chuyển động chân, nhịp thân, lắc khi bay và gợn nước bám theo vị trí di chuyển thật.
- Lựa chọn được lưu theo cơ chế lưu game hiện có. Nút tải PNG và tải bộ chuyển động xuất đúng tổ hợp đang chọn.

Ảnh nguồn được tạo/chỉnh bằng **image_gen tích hợp**, dựa trên mẫu minh họa đã gửi. Các bản gốc nằm trong `assets/illustrated/source/`; ảnh dùng trong game, mặt nạ và thông số ghép nằm trong `assets/illustrated/`. `tools/pack-illustrated.mjs` tách từng hình theo thành phần alpha, loại điểm màu rời, chuẩn hóa khung và tạo mặt nạ; không dùng lưới cắt làm mất mũ, tay hoặc chân.

Chạy game qua `node tools/serve-game.mjs`, mở `http://127.0.0.1:8788/`. Xem sáu nhân vật và vật nuôi tại `chuyen-dong.html`. Các ảnh là minh họa có hai hướng nhìn trái/phải; chúng quay theo camera bằng sprite trong map 3D.

Kiểm tra: `node tools/verify-illustrated.mjs` kiểm tra từng lựa chọn trên cả sáu nhân vật bằng pixel thực, alpha, bước đi, map, câu cá và lưu/tải lại. `node tools/verify-fishing.mjs` kiểm tra vòng chơi câu cá.
