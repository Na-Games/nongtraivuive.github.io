# Bộ hình chi tiết theo ảnh mẫu — 05/11/2026

Bản hiện tại dùng bộ nhân vật và động vật minh họa 3D sắc nét trong `assets/illustrated/`, tương ứng phong cách ảnh người dùng gửi. Không dùng mô hình hình khối đơn giản làm hình mặc định trên map.

`reference-style.js` nối bộ hình này với map, màn hình chỉnh nhân vật và các API dựng hình. Có 6 nhân vật và 12 loài: bò, trâu, heo, dê, cừu, chó, mèo, gà, vịt, sếu, ong và bướm. Các icon động vật dùng đúng ảnh loài tương ứng; không dùng ảnh người cho nhãn động vật.

Các màu da, tóc, áo, kiểu tóc, áo sơ mi/quần yếm/áo khoác và bốn lựa chọn mũ được ghép từ ảnh nền trong suốt. Không cần xuất hàng chục nghìn file tổ hợp. Icon lựa chọn, ảnh đại diện và màn hình câu cá dùng chung ngoại hình đã chọn; câu cá giữ ảnh ngồi và điểm gắn cần câu riêng.

## Chuyển động

Ảnh được gắn lên lưới có khớp trên GPU, không upload bitmap theo từng khung hình. Tay, khuỷu, gối, bàn chân và đầu của người chuyển động liên tục. Nhịp bước theo quãng đường; chân chống giữ vị trí trên đất; điểm cuối vung chân trùng điểm đặt chân tiếp theo. Vị trí hạ chân được giữ cố định trong đoạn vung, đường đi có vận tốc bằng không khi tiếp đất; độ nâng chân giảm mềm ở hai đầu. Chuyển hướng có góc trung gian. Động vật có nhịp chân theo loài, vận tốc chuyển khớp liên tục giữa đoạn chống và đoạn vung chân, cử động đầu, nhịp thở, bơi và vỗ cánh. Các actor ngoài màn hình được bỏ qua để giảm công việc mỗi khung hình.

Đây là hình minh họa mang diện mạo 3D đặt trong map 3D; không phải mô hình giải phẫu đầy đủ có mặt sau được dựng lại từ ảnh. Bộ dựng hình khối trong `volume-actors.js` được giữ làm phương án riêng để không mất mã nguồn trước đó, nhưng không là mặc định.

## Xem và kiểm tra

- `docs/verification/reference-style-board.png`: bảng mẫu đúng bộ hình dùng trong game.
- `reference-style-map.png`, `reference-style-editor.png`, `reference-style-fishing.png` cùng thư mục: ảnh kiểm tra trực tiếp.
- `tools/verify-reference-style.mjs`: xác nhận ảnh nguồn, khớp chuyển động, chuyển hướng, nối nhịp chân, ngoại hình, PNG trong suốt, dụng cụ và câu cá.
- `tools/verify-smooth-motion.mjs`: kiểm tra hồi quy chuyển động, va chạm, chọn mặt đất, công cụ, bóng và mặc định.
- `tools/verify-illustrated.mjs`: kiểm tra các lựa chọn ngoại hình cho cả 6 nhân vật và lưu/tải lại.
- `tools/verify-document-v2.mjs`: bố cục, sản phẩm, tư thế câu cá và chân bám đất.

Không thêm thư viện hoặc bản sao ảnh vào runtime. Giữ nguyên thư mục công cụ tạm và ảnh kiểm thử theo lựa chọn trước đó của người dùng.
