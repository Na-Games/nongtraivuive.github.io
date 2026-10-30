# Chuyển động nhân vật, vật nuôi và khu vườn

## Kết quả của lần nâng cấp này

Bổ sung **362 khung PNG trong suốt trong 11 bảng ảnh**, ghép với 478 hình có sẵn thành **840 PNG trong 27 nhóm**. Bộ chuyển động gồm sáu nhân vật, 12 loài vật và sáu loại hiệu ứng theo thời gian. Có 61 chu kỳ được khai báo trong `assets/motion/manifest.json`.

Mở `chuyen-dong.html` để xem chuyển động thật, tạm dừng, tiến một khung, đổi tốc độ và xem điểm đặt chân. Video quay trực tiếp từ Canvas được lưu tại `docs/verification/chuyen-dong.webm`. Trang `thu-vien-anh.html` cũng hiển thị các khung mới và cho tải từng PNG.

## Vì sao bản trước nhìn cứng

| Nguyên nhân được kiểm tra trong mã cũ | Sửa trong bản mới |
| --- | --- |
| Một PNG vật nuôi trượt trên mặt đất; chân không đổi tư thế | Chu kỳ tám bước cho từng loài, khung nghỉ và chớp mắt; bổ sung tư thế chuyển hướng của gà |
| Nhân vật chỉ bật qua lại hai ảnh bước | Chu kỳ 8–10 khung phía trước và phía sau, cùng tư thế nghỉ, cuốc và câu cá |
| Vừa đi đã đạt tốc độ cố định, dừng và lật hướng ngay | Tăng giảm tốc, hãm gần điểm đến, chuyển hướng qua khoảng trung gian và đưa chân về tư thế tiếp đất |
| Dùng thời gian chung để đổi chân, không xét quãng đường | Chu kỳ bước chân tăng theo quãng đường thực tế, giữ nhịp khi tăng hoặc giảm tốc |
| Từng khung được tự co giãn cho đầy ô vẽ | Dùng chung tỷ lệ, điểm gốc và hệ tọa độ cho cả nhân vật; không tự fit lại từng tư thế lúc phát |
| Toàn bộ PNG cây dịch sang hai bên | Chia thân và tán thành các dải biến dạng liên tục; độ lệch giảm về 0 tại gốc |
| Mỗi lần vẽ đều dựng lại toàn bộ nền cỏ và đường | Lưu nền tĩnh vào Canvas đệm; chỉ dựng lại khi camera, kích thước hoặc bộ ảnh thay đổi; ao vẫn vẽ riêng để có sóng |

## Bộ hình mới

| Nhóm | Khung | Nội dung |
| --- | ---: | --- |
| `anim-farmer-0` đến `anim-farmer-5` | 180 | Sáu nhân vật, mỗi người 30 tư thế; đi trước/sau, nghỉ, cuốc, câu cá |
| `anim-animals-0` | 38 | Gà, bò, vịt; gồm hai khung gà chuyển hướng được phát hiện khi kiểm tra nguồn |
| `anim-animals-1` | 36 | Chó, mèo, trâu |
| `anim-animals-2` | 36 | Heo, cừu, dê |
| `anim-animals-3` | 36 | Cò, bướm, ong |
| `anim-effects` | 36 | Bụi bước chân, nước bắn, vòng sóng, thu hoạch, gió lá và khói; mỗi loại sáu pha |

Không giả định thứ tự ảnh do AI tạo luôn đúng prompt. Từng bảng đã được xem lại: các nhân vật có số lượng tư thế nghỉ/câu khác nhau; một bảng gà có thêm hai khung; hiệu ứng có nhiều mảnh rời. Tệp `docs/motion-sources.json` ghi thứ tự khung thực tế, số hình mỗi hàng và cách gom mảnh hiệu ứng. Bộ đóng gói dùng thông tin này để tránh đưa ảnh đứng nghỉ hoặc cầm cuốc vào giữa chu kỳ đi/câu.

Các chu kỳ nghỉ có 2–4 khung, làm việc 4–5 khung và câu cá 2–8 khung tùy nhân vật, kèm chuyển động nhỏ liên tục. Đây là sprite vẽ tay do AI tạo và đã kiểm tra bố cục, không phải mô hình 3D có xương khớp. Sáu lựa chọn đều sử dụng bộ mới trong game. Bộ tự phối màu bằng Canvas vẫn được giữ như một lựa chọn riêng.

## Đóng gói và căn hình

- Bảng nhân vật dùng ô **384×384** để giữ độ nét và đủ chỗ cho nón, cuốc, cần và dây câu. Vật nuôi và hiệu ứng dùng ô **256×256**.
- Mỗi khung có đệm alpha tối thiểu **24 px ở bốn phía**. Các vùng nội dung của hai ô kề nhau cách ít nhất 48 px.
- Tỷ lệ được tính chung theo từng nhân vật/loài/loại hiệu ứng, không theo từng khung. Điểm đặt chân được căn riêng với các chi tiết mảnh như đầu cần hoặc lưỡi câu.
- Chiều cao cơ thể tham chiếu được lấy từ chu kỳ đi; cần câu lớn không làm cả nhân vật bị thu nhỏ khi chuyển sang hành động khác.
- `Motion.draw()` dùng nguyên ô khung với tỷ lệ và điểm gốc của clip. `Art.draw()` vẫn dùng cho biểu tượng tĩnh.
- Nguồn gốc nằm tại `assets/motion/source/`, atlas tại `assets/motion/`, ảnh riêng tại `assets/motion/sprites/`. Các hình tĩnh cũ vẫn có trong dự án.

Các prompt được lưu tại `docs/motion-prompts.json`. Công cụ tạo ảnh là **image_gen tích hợp**. Công cụ xử lý PNG chỉ thực hiện phân vùng alpha, cắt, căn và đóng gói.

## Chuyển động trong game

Mô phỏng chia thời gian thành các bước tối đa 1/120 giây rồi vẽ theo `requestAnimationFrame`. Độ dài bước không phụ thuộc số lần trình duyệt vẽ. Khi đi nhanh/chậm, quãng đường điều khiển pha bước chân. Khi dừng, pha được đưa về tiếp đất; khi đang quay lưng, nhân vật giữ hướng đó thay vì bật sang mặt trước.

Nhân vật tìm đường trên lưới, tránh ao, ruộng, nền công trình và đồ trang trí đã đặt. Tác vụ cuốc được chờ tới khi đi xong. Vật nuôi chọn điểm dạo mới sau khi đến nơi, có khoảng nghỉ, thay vì liên tục đổi đích giữa đường. Các loài trên nước và côn trùng có cách nhún và chuyển động cánh riêng. Mèo, trâu, cò và ong được đưa vào vòng chuyển động thực tế.

Bụi xuất hiện theo bước chân; vịt tạo gợn nước; thu hoạch phát chu kỳ lá/sao; công trình đang chạy có khói; gió lá xuất hiện thưa trong vườn; khi cá cắn có chu kỳ vòng sóng. Có giới hạn số hiệu ứng đồng thời. Phần Hiệu ứng trong cài đặt có lựa chọn gió và chuyển động nhẹ.

## Kiểm chứng

`node tools/test-motion.mjs` kiểm tra mô phỏng ở 30, 60 và 120 nhịp vẽ mỗi giây, tăng/giảm tốc, đến đúng đích, tìm đường và chuyển hướng. Ba cấu hình đến cùng vị trí và có cùng pha bước, với sai số trong ngưỡng kiểm tra.

`node tools/verify-game.mjs` kiểm tra tải bộ ảnh, đầy đủ clip cho sáu nhân vật và 12 loài, các khung đi thực sự cho hình vẽ khác nhau, gốc cây, nền đệm, thao tác game, lưu dữ liệu, bố cục điện thoại và trang xem chuyển động. Công cụ cũng quay video từ Canvas.

Trong kiểm tra cây mẫu, gốc lệch khoảng 0,04 px còn trọng tâm tán đổi khoảng 1,89 px giữa hai thời điểm. Kết quả này đo trên cây mẫu trong phép thử, không phải khẳng định mọi pixel của mọi cây có cùng độ dịch chuyển.

Kết quả hiện tại nằm trong `docs/motion-logic-report.json`, `docs/motion-validation.json` và `docs/verification/browser-report.json`. Nhịp vẽ đo được phụ thuộc thiết bị, trình duyệt, độ phân giải và chế độ đồ họa; mục tiêu của thay đổi là chuyển động nhất quán theo thời gian và giảm công việc vẽ thừa.
