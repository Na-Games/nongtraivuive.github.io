# Sửa theo tài liệu DOCX lần 2 — 04/11/2026

Các ảnh trong tài liệu đã được đối chiếu với game. Bản này tập trung vào các vấn đề còn thấy trong ảnh thực tế.

| Yêu cầu | Kết quả |
| --- | --- |
| Phân biệt chuồng/xưởng đã xong | Dấu sản phẩm riêng: trứng, sữa, mật ong… trên mái công trình. Hiện cả khi zoom xa và khi tắt hạt hiệu ứng; chạm dấu để thu. Xử lý cả trường hợp bộ đếm thời gian đã hết nhưng ticker chưa cập nhật `ready`. Dấu biến mất sau khi thu. |
| Chuyển động còn ngượng | Thêm chân, cổ chân và hướng bước theo đường di chuyển. Chân trụ giữ vị trí trong thế giới; chân bước nhấc lên rồi hạ xuống, phối hợp gối và bàn chân. Giảm biến dạng mảng chân vật nuôi. Giữ khớp GPU và mặc định chuyển động đầy đủ. |
| Nút ngang chỉ hai cột | Gom toàn bộ 10 nút công cụ/menu bên trái vào lưới 2 cột; nhóm sự kiện/xã hội bên phải cũng 2 cột. Canh hàng thẳng, giữ nhiệm vụ ở dưới; bố trí riêng cho điện thoại ngang thấp 320 px. |
| Người ngồi câu và nước | Bộ thân người ngồi câu thật, 6 người × 3 kiểu áo = 18 tư thế; 36 lớp màu da/áo, tổng 54 PNG alpha. Giữ tóc, mũ và màu đang chọn. Hai tay cầm cần; điểm cần theo tay. Phao luôn ở mặt nước, không chạy lên sàn khi kéo cá. Nước có cá bơi, cá nhảy, vịt ở hồ sen, vệt sóng ở biển, chim và ánh nước. |
| Chọn quê đẹp, nổi bật | Biển xanh đậm, đất vàng xanh ấm; thẻ tỉnh có hình và tên rõ; bộ lọc Bắc/Trung/Nam, tìm tên tỉnh và chọn trực tiếp trên bản đồ. |
| Dọn project | Bỏ script raster dự phòng V5 đã được thay thế, 15 ảnh rời chưa hoàn chỉnh của V5 và công cụ xuất cũ: 17 file, khoảng 193 KiB. Giữ `.runtime` và ảnh kiểm thử theo lựa chọn trước. Nén PNG mới không đổi pixel. |

## Mã và tài nguyên

- `visual-effects.js`: `FarmProducts` vẽ dấu sản phẩm và vùng chạm.
- `grounded-gait.js`, `actor-rig.js`: chân trụ/bước, gối, cổ chân và kiểm soát biến dạng.
- `document-v2.css`, `ui.js`: các nhóm nút và bản đồ chọn quê.
- `assets/seated/`: thân ngồi câu, các lớp màu và metadata điểm đầu/tay/ghế.
- `tools/pack-seated.mjs`: dựng tài nguyên từ ba ảnh nguồn trong `assets/seated/source/`.
- `docs/seated-art-prompts.json`: mô tả tạo ảnh nguồn bằng imagegen tích hợp. Ảnh nguồn được giữ để có thể dựng lại.

## Kiểm tra

`tools/verify-document-v2.mjs` kiểm tra dấu sản phẩm và thu đúng một lần, lưới hai cột ở 844×390, 667×375, 740×320 và 1440×900, các tùy chỉnh tư thế ngồi, phao không vào sàn, lọc tỉnh, chọn quê và điểm chân trụ.

`tools/verify-seated.mjs` kiểm tra 54 PNG có alpha thật, không chạm mép ảnh, và các điểm gắn đầu/tay/ghế hợp lệ. Tiếp tục kiểm tra hồi quy chuyển động, tùy chỉnh nhân vật, câu cá và chế độ mở trực tiếp bằng file.

Ảnh kiểm thử nằm trong `docs/verification/document-v2-*.png`. Game giữ phong cách nhân vật minh họa, không chuyển sang người thật. Phép kiểm tra trình duyệt trên máy tính không thay thế đo độ mượt trên điện thoại thực tế.

Nhấn **Ctrl + F5** để nhận mã và ảnh mới.

[Xem màn câu cá](verification/document-v2-fishing-river.png) · [Nút ngang hai cột](verification/document-v2-toolbar-844.png) · [Bản đồ chọn quê](verification/document-v2-homeland.png)
