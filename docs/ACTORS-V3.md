# Nhân vật, vật nuôi và map mở rộng

Bản cập nhật này dùng chung mô hình nhân vật cho nông trại, HUD, màn chỉnh sửa, hồ sơ và câu cá. Không thay khóa lưu game hoặc thứ tự 60 ô ruộng.

- **Nhân vật được dựng lại:** khuôn mặt có hàm và má, mắt/mi/lông mày, nụ cười; tóc có mảng liền và các lọn tóc; trang phục có cổ áo, nẹp, túi, khuy, chi tiết vải; bàn tay có ngón. Tóc, da, áo và mũ vẫn nhận cấu hình đã lưu. Chuyển màu da cập nhật cả chi tiết tai/má.
- **Hoạt ảnh:** chân có khớp hông/gối; tay có vai/khuỷu; bước chân theo quãng đường thực tế. Có nhịp thở, chớp mắt, nghiêng thân, làm vườn, vung cần và quay tay khi kéo cá. Đầu cần và dây câu lấy vị trí từ bàn tay đang chuyển động, không dùng tọa độ cố định của hình cũ.
- **Vật nuôi:** thay các tấm PNG trượt trên map WebGL bằng mô hình có chân, đầu/cổ, đuôi hoặc cánh. Bò/trâu/lợn/dê/cừu/chó/mèo dùng nhịp bốn chân; gia cầm dùng hai chân; vịt bơi có thân nổi và chân chìm; hạc lội nước; ong/bướm đập cánh. Hướng thân được nội suy theo thời gian. Tọa độ vẫn lấy từ hệ thống đường đi có kiểm tra vật cản.
- **Icon:** thay toàn bộ 36 icon trong atlas giao diện `assets/ui.png`; từng PNG riêng nằm tại `assets/sprites/ui/`. Các mã cũ được giữ để tất cả màn hình nhận hình mới, bao gồm cửa hàng và câu cá.
- **Hiệu ứng:** thay 18 khung bụi bước chân, nước và tia thưởng trong `assets/motion/anim-effects.png`; từng PNG tại `assets/motion/sprites/anim-effects/`. Các khung cùng hiệu ứng dùng chung điểm đặt, giữ kích thước khi phát và có khoảng đệm trong suốt. Hiệu ứng trên map đặt theo độ cao mặt đất/mặt nước thật.
- **Map:** tăng từ 40×40 lên 48×48, thêm đồng cỏ/đường dạo phía Nam. Phía xa có cây mờ và lớp sương mềm theo biên, phần trung tâm giữ độ nét. Đây là dấu hiệu vùng đất chưa khai phá; chưa thêm chức năng mua vùng ngoài biên.
- **Chăm cây:** nút còn 46px, cụm rộng 202px thay cho 256px; khoảng cách sát hơn theo cung tròn. Vật phẩm còn lại hiển thị bằng huy hiệu nhỏ. Thông tin đầy đủ trong màn chi tiết ô đất.

Ảnh được tạo bằng Imagegen tích hợp, kiểm tra alpha và tách từng icon/khung trước khi áp dụng. [Prompt và nguồn ảnh](actors-v3-art.json). Nhân vật và vật nuôi là hình học 3D có khớp, không dùng PNG ảnh người để giả chuyển động trên map WebGL. Thiết bị không hỗ trợ WebGL vẫn có bộ PNG dự phòng hiện có.

Chạy `node tools/serve-game.mjs`, mở `http://127.0.0.1:8788/` để chơi 3D. Tải lại trang để nhận script và atlas mới.

Kiểm tra bằng `node tools/verify-3d.mjs`, `node tools/test-motion.mjs`, `node tools/test-farming.mjs`, `node tools/test-fishing.mjs`, `node tools/verify-runtime-assets.mjs`. Hiệu năng thực tế tùy thiết bị; có thể giảm Độ nét cao/Bóng đổ trong Cài đặt.

Đã qua 32 kiểm tra trình duyệt, 14 tình huống trồng cây, 29 tình huống câu cá, 17 tình huống làng; kiểm tra chuyển động nhất quán tại 30/60/120 bước mỗi giây và đường đi không cắt qua vật cản. Kiểm tra tách atlas xác nhận alpha, hình rời, khoảng đệm, tỷ lệ/điểm đặt chung cho hoạt ảnh. Màn chỉnh sửa gộp các lựa chọn trong cùng khung hình và lưu ảnh thumbnail vào bộ nhớ đệm để giảm khựng khi đổi nhanh nhiều mục.
