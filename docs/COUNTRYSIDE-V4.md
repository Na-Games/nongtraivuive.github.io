# Nông trại mở rộng · 02/11/2026

Các thay đổi đã tích hợp vào `index.html`:

- Sáu kiểu nhân vật có tỷ lệ mới, mắt lớn, má hồng, khăn cổ và túi áo. Các lựa chọn màu da, tóc, áo, mũ đã lưu tiếp tục được dùng ở nông trại, chân dung và màn câu cá.
- Nhịp bước có khớp gối, chuyển động vai, đầu và mũ; tư thế làm vườn, thả câu và kéo cần có chuyển động riêng.
- Mười hai loài vật có màu và khuôn mặt mới, chớp mắt, chuyển động đầu/đuôi, gặm cỏ hoặc mổ thức ăn theo loài. Mặt nước có gợn quanh vật nuôi đang bơi. Bản tương thích cũng dùng mô hình mới khi trình duyệt hỗ trợ WebGL.
- Bản đồ tăng từ 48×48 lên 64×64; bờ biển dời từ x=25 sang x=41 để mở rộng đất liền. Đường dạo nối cánh đồng phía Đông và thung lũng phía Nam; sông được kéo dài ra bờ biển mới. Số ô trồng, vị trí công trình và dữ liệu tiến độ hiện có được giữ nguyên.
- Bỏ lớp phủ/sương xanh ở biên. Thay nền ngoài bằng màu kem, thêm cây và hoa trên vùng đất mới.
- Tất cả công trình có bảng tên, cấp mở khóa hoặc trạng thái sản xuất. Nhãn được vẽ trên cảnh, tránh nhau khi đủ chỗ và bấm để mở đúng công trình. Công trình chưa xây có nền đất và cọc đánh dấu.
- Màn chọn quê có bản đồ Việt Nam theo phong cách tranh bản đồ: màu theo địa hình, đường đồng mức, mây, thuyền và la bàn. Giữ chức năng kéo/zoom, chọn tỉnh, xác nhận; tìm kiếm chấp nhận chữ không dấu.
- Câu cá có đường bay của phao, dây câu thay đổi độ võng, gợn nước, tia sáng, nước bắn lúc thả phao/cá quẫy và thông báo cá cắn. Giao diện đổi màu theo trạng thái. Hiệu ứng phụ tôn trọng tùy chọn giảm chuyển động và tắt hạt hiệu ứng.

## Dung lượng

1.109 ảnh PNG được nén lại không mất dữ liệu, giữ nguyên điểm ảnh và alpha. Tổng ảnh giảm từ 192.208.701 xuống 165.612.629 byte, tiết kiệm **25,36 MiB**. Không xóa các atlas, ảnh rời hay mask đang được dùng bởi game, thư viện ảnh hoặc chế độ tương thích.

`tools/optimize-png.mjs` có thể chạy lại với Node.js để nén các ảnh RGBA mới; công cụ chỉ ghi khi ảnh nhỏ hơn và giải mã đối chiếu từng điểm ảnh sau khi ghi.

## Chạy và kiểm tra

Chạy `node tools/serve-game.mjs`, mở `http://127.0.0.1:8788/`. Chơi qua HTTP/HTTPS để dùng bản đồ 3D đầy đủ. Bản mở trực tiếp bằng file vẫn có chế độ tương thích.

Các kiểm tra chính:

```text
node tools/verify-runtime-assets.mjs
node tools/test-motion.mjs
node tools/test-farming.mjs
node tools/test-fishing.mjs
node tools/verify-3d.mjs
node tools/verify-countryside.mjs
node tools/verify-fishing.mjs
```

Các bài kiểm tra trình duyệt dùng Chrome tại đường dẫn Windows trong script và lưu ảnh/báo cáo vào `docs/verification/` (không đưa vào Git). Khi thu nhỏ nhiều công trình vào một màn hình rất bé, kéo/zoom để xem bảng tên thoáng hơn.
