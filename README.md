# Xóm Nông Trại — bộ hình PNG và game

Mở **index.html** bằng Chrome hoặc Edge để chơi. Giữ nguyên thư mục `assets` bên cạnh các tệp HTML/JS/CSS. Nếu đang mở bản cũ, tải lại trang để nhận mã và hình mới.

Mở **thu-vien-anh.html** để duyệt toàn bộ bộ ảnh, xem nền trong suốt và tải từng PNG mà không cần vào game.

Mở **chuyen-dong.html** để xem trực tiếp sáu nhân vật và 12 loài vật, đổi hành động/tốc độ, tạm dừng hoặc xem từng khung.

**Câu cá mới:** Menu → Câu cá. Ba vùng nước mở theo số cá đã bắt; giữ/thả hoặc chạm để kéo, có cảnh báo sắp quẫy và trợ lực. Xem cân nặng, kỷ lục, sổ cá, rương và mục tiêu ngày. Chọn cần/mồi ngay tại hồ. Space/Enter điều khiển; Esc tạm dừng.

**Cài đặt → Âm thanh & rung:** chọn Tắt/Nhẹ/Vừa/Mạnh và thử rung trên thiết bị hỗ trợ. Có âm lượng riêng, tiếng nước, thuận tay trái, tăng tương phản, giảm chuyển động và tùy chỉnh độ khó/cách kéo. Phân tích và nguồn tham khảo: [docs/CAU-CA-VA-CAI-DAT.md](docs/CAU-CA-VA-CAI-DAT.md).

- **Menu → Thư viện PNG**: xem, tìm và tải từng hình; có nút trình diễn hiệu ứng.
- **Cửa hàng → Hạt giống**: danh mục cây mở rộng; khi gieo có ô tìm theo tên.
- **Cửa hàng → Cây lâu năm / Trang trí / Mô hình**: chọn hình, chạm đất trống để đặt. Chạm món đã đặt để thu hoạch nếu có quả hoặc thu hồi.
- **Avatar → Chỉnh nhân vật**: chọn một trong sáu nhân vật PNG hoặc dùng bộ tự phối màu.
- **Menu → Sổ cá**: xem các loài và số cá đã khám phá.

Bộ ảnh có **840 PNG trong 27 nhóm**: 478 hình tĩnh và 362 khung chuyển động. Mỗi hình đóng gói có khoảng đệm trong suốt tối thiểu 24 px ở mọi cạnh. Ảnh gốc và prompt được giữ để có thể phát triển tiếp.

| Vị trí | Nội dung |
| --- | --- |
| `assets/*.png` | 16 bảng ảnh để dùng trong game |
| `assets/sprites/` | 478 PNG riêng, nền trong suốt |
| `assets/source/` | Bảng ảnh gốc do image_gen tạo |
| `assets/motion/` | 11 atlas chuyển động, ảnh riêng, nguồn và manifest |
| `assets/manifest.json` | Tọa độ và vùng nội dung từng hình |
| `docs/PHAN-TICH-VA-TICH-HOP.md` | Đối chiếu 66 ảnh của tài liệu, các thay đổi và phạm vi cơ chế |
| `docs/image-prompts.json` | Prompt tạo từng nhóm ảnh |
| `docs/verification/` | Kết quả kiểm tra và ảnh chụp game |
| `docs/CHUYEN-DONG.md` | Nguyên nhân chuyển động cứng, thay đổi và kiểm chứng |
| `docs/motion-prompts.json` | Prompt tạo bộ chuyển động bằng image_gen |

Game lưu tiến trình trong trình duyệt. Các tính năng bạn bè có sẵn vẫn hoạt động theo mô phỏng cục bộ. Các mô hình trang trí được ghi rõ trong cửa hàng; công trình có chuỗi sản xuất nằm ở mục Nhà máy và Chuồng.

Để kiểm tra lại bằng Node.js và Chrome trên máy này: `node tools/verify-game.mjs`. Công cụ đóng gói ảnh: `node tools/build-assets.mjs` (đường dẫn đầu vào nằm trong `assets/sources.json`).

Kiểm tra logic chuyển động: `node tools/test-motion.mjs`. Đóng gói lại khung chuyển động: `node tools/build-motion.mjs`. Video xem trước: `docs/verification/chuyen-dong.webm`.

Gói ZIP gồm đầy đủ game, 840 PNG riêng, 27 atlas đã căn, video và tài liệu. Các bảng nguồn AI trung gian trong `assets/source/` và `assets/motion/source/` được giữ trong thư mục dự án và không lặp lại trong ZIP để giảm dung lượng; muốn đóng gói lại từ nguồn trên máy khác cần mang theo hai thư mục này.
