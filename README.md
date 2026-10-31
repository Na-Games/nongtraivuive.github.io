# Xóm Nông Trại — bộ hình PNG và game

Mở **index.html** bằng Chrome hoặc Edge để chơi. Giữ nguyên thư mục `assets` bên cạnh các tệp HTML/JS/CSS. Nếu đang mở bản cũ, tải lại trang để nhận mã và hình mới.

**Cập nhật 31/10/2026:** sửa màn hình tải đứng ở 0%; thanh tiến trình chạy ngay, ưu tiên ảnh chính và vào game sau tối đa khoảng 3 giây chờ ảnh. Ảnh phụ tải tiếp ở nền. Không còn chờ phông chữ từ mạng để khởi động.

- **Cài đặt → Chung → Chiều màn hình:** Dọc (mặc định), Ngang hoặc Tự động. Giao diện thích ứng với chiều thực tế. Khóa chiều màn hình tùy thuộc hỗ trợ của trình duyệt; có thể cần bật tự xoay hoặc vào toàn màn hình.
- **Cài đặt → Âm thanh & rung:** dùng chung cho nông trại và câu cá, có công tắc rung nông trại riêng. Tắt mức rung sẽ tắt cả hai khu vực. Rung phần cứng cần trình duyệt và điện thoại hỗ trợ.
- **Nút bản đồ cạnh nút câu cá:** đi nhanh giữa nông trại, đồi xanh, bờ biển và vườn cây trong map 32 × 32 ô. Giỏ quà trên đồi có thời gian chờ 5 phút.
- Bảng hạt giống luôn nằm trong màn hình; các nút, hồ sơ và giao diện ngang được thu gọn. Bộ nhân vật nhiều lớp dùng chung da, tóc, áo, mũ khi đứng, đi bộ, làm việc và câu cá.

Mở **thu-vien-anh.html** để duyệt toàn bộ bộ ảnh, xem nền trong suốt và tải từng PNG mà không cần vào game.

Mở **chuyen-dong.html** để xem trực tiếp sáu nhân vật và 12 loài vật, đổi hành động/tốc độ, tạm dừng hoặc xem từng khung.

**Câu cá mới:** Menu → Câu cá. Ba vùng nước mở theo số cá đã bắt; giữ/thả hoặc chạm để kéo, có cảnh báo sắp quẫy và trợ lực. Xem cân nặng, kỷ lục, sổ cá, rương và mục tiêu ngày. Chọn cần/mồi ngay tại hồ. Space/Enter điều khiển; Esc tạm dừng.

**Cài đặt → Âm thanh & rung:** chọn Tắt/Nhẹ/Vừa/Mạnh và thử rung trên thiết bị hỗ trợ. Có âm lượng riêng, tiếng nước, thuận tay trái, tăng tương phản, giảm chuyển động và tùy chỉnh độ khó/cách kéo. Phân tích và nguồn tham khảo: [docs/CAU-CA-VA-CAI-DAT.md](docs/CAU-CA-VA-CAI-DAT.md).

- **Menu → Thư viện PNG**: xem, tìm và tải từng hình; có nút trình diễn hiệu ứng.
- **Cửa hàng → Hạt giống**: danh mục cây mở rộng; khi gieo có ô tìm theo tên.
- **Cửa hàng → Cây lâu năm / Trang trí / Mô hình**: chọn hình, chạm đất trống để đặt. Chạm món đã đặt để thu hoạch nếu có quả hoặc thu hồi.
- **Avatar → Chỉnh nhân vật**: chọn một trong sáu nhân vật rồi phối màu da, tóc, áo và mũ trên cùng nhân vật. Thay đổi được lưu ngay.
- **Menu → Sổ cá**: xem các loài và số cá đã khám phá.

Bộ ảnh có **840 PNG trong 27 nhóm**: 478 hình tĩnh và 362 khung chuyển động, kèm ảnh đồi núi mới `mountain-ridge-v2.png`. Giữ đầy đủ atlas và PNG riêng đang dùng trong game, thư viện và trình diễn chuyển động. Nhân vật tùy chỉnh dùng bộ vẽ nhiều lớp trong `wardrobe.js` để không đổi hình khi phối đồ.

| Vị trí | Nội dung |
| --- | --- |
| `assets/*.png` | 16 bảng ảnh để dùng trong game |
| `assets/sprites/` | 478 PNG riêng, nền trong suốt |
| `assets/motion/` | 11 atlas chuyển động, ảnh riêng và manifest |
| `wardrobe.js`, `world.js`, `responsive.css` | Nhân vật đồng bộ, vùng khám phá và giao diện dọc/ngang |
| `assets/manifest.json` | Tọa độ và vùng nội dung từng hình |
| `docs/PHAN-TICH-VA-TICH-HOP.md` | Đối chiếu 66 ảnh của tài liệu, các thay đổi và phạm vi cơ chế |
| `docs/image-prompts.json` | Prompt tạo từng nhóm ảnh |
| `docs/verification/` | Kết quả kiểm tra và ảnh chụp game |
| `docs/CHUYEN-DONG.md` | Nguyên nhân chuyển động cứng, thay đổi và kiểm chứng |
| `docs/motion-prompts.json` | Prompt tạo bộ chuyển động bằng image_gen |

Game lưu tiến trình trong trình duyệt. Các tính năng bạn bè có sẵn vẫn hoạt động theo mô phỏng cục bộ. Các mô hình trang trí được ghi rõ trong cửa hàng; công trình có chuỗi sản xuất nằm ở mục Nhà máy và Chuồng.

Để kiểm tra lại bằng Node.js và Chrome trên máy này: `node tools/verify-game.mjs`, `node tools/verify-upgrade.mjs`, `node tools/verify-fishing.mjs`, `node tools/verify-local-file.mjs`.

Kiểm tra logic chuyển động: `node tools/test-motion.mjs`. Kiểm tra logic câu cá: `node tools/test-fishing.mjs`. Video xem trước: `docs/verification/chuyen-dong.webm`.

Đã dọn 107 tệp trung gian, giảm khoảng **63,08 MiB**: bản sao ảnh nguồn, ảnh tài liệu tham chiếu và ba bản game cũ trong `docs/`. Chi tiết ở `docs/cleanup-report.json`. Các script tạo lại ảnh cũ được giữ để tham khảo; muốn dùng lại cần cung cấp ảnh nguồn theo manifest nguồn. Chơi game, mở thư viện ảnh, chạy kiểm tra và đóng gói game không cần các bản nguồn đã dọn. `tools/package-game.ps1` đóng gói đủ mã và ảnh hiện dùng.
