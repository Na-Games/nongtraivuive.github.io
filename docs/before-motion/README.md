# Xóm Nông Trại — bộ hình PNG và game

Mở **index.html** bằng Chrome hoặc Edge để chơi. Giữ nguyên thư mục `assets` bên cạnh các tệp HTML/JS/CSS. Nếu đang mở bản cũ, tải lại trang để nhận mã và hình mới.

Mở **thu-vien-anh.html** để duyệt toàn bộ bộ ảnh, xem nền trong suốt và tải từng PNG mà không cần vào game.

- **Menu → Thư viện PNG**: xem, tìm và tải từng hình; có nút trình diễn hiệu ứng.
- **Cửa hàng → Hạt giống**: danh mục cây mở rộng; khi gieo có ô tìm theo tên.
- **Cửa hàng → Cây lâu năm / Trang trí / Mô hình**: chọn hình, chạm đất trống để đặt. Chạm món đã đặt để thu hoạch nếu có quả hoặc thu hồi.
- **Avatar → Chỉnh nhân vật**: chọn một trong sáu nhân vật PNG hoặc dùng bộ tự phối màu.
- **Menu → Sổ cá**: xem các loài và số cá đã khám phá.

Bộ ảnh có **478 hình trong 16 nhóm**, gồm atlas, PNG tách riêng và bản gốc. Mỗi hình đóng gói có khoảng đệm trong suốt tối thiểu 24 px ở mọi cạnh. Ảnh gốc và prompt được giữ để có thể phát triển tiếp.

| Vị trí | Nội dung |
| --- | --- |
| `assets/*.png` | 16 bảng ảnh để dùng trong game |
| `assets/sprites/` | 478 PNG riêng, nền trong suốt |
| `assets/source/` | Bảng ảnh gốc do image_gen tạo |
| `assets/manifest.json` | Tọa độ và vùng nội dung từng hình |
| `docs/PHAN-TICH-VA-TICH-HOP.md` | Đối chiếu 66 ảnh của tài liệu, các thay đổi và phạm vi cơ chế |
| `docs/image-prompts.json` | Prompt tạo từng nhóm ảnh |
| `docs/verification/` | Kết quả kiểm tra và ảnh chụp game |

Game lưu tiến trình trong trình duyệt. Các tính năng bạn bè có sẵn vẫn hoạt động theo mô phỏng cục bộ. Các mô hình trang trí được ghi rõ trong cửa hàng; công trình có chuỗi sản xuất nằm ở mục Nhà máy và Chuồng.

Để kiểm tra lại bằng Node.js và Chrome trên máy này: `node tools/verify-game.mjs`. Công cụ đóng gói ảnh: `node tools/build-assets.mjs` (đường dẫn đầu vào nằm trong `assets/sources.json`).
