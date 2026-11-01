# Map chơi và nhân vật 3D

Cập nhật 01/11/2026 trong project hiện có. Dữ liệu `xom_nong_trai_v2`, 60 ô đất, cửa hàng, sản xuất và tiến trình cũ được giữ nguyên.

## Map đang chơi

`farm-3d.js` dựng cảnh bằng WebGL / Three.js, có địa hình cao thấp, ruộng bậc thang, nhà với mái ngói và khung gỗ, cầu cong, dòng suối ra biển, thác nước và guồng nước quay. Nhà, đất, đá, cầu và nhân vật là hình học 3D. Cây, nông sản, một số vật nuôi và đồ trang trí sử dụng PNG trong suốt đặt trong không gian 3D để giữ chi tiết của bộ ảnh hiện có.

Vùng chọn ô đất, nhà và cây được tính bằng raycast, kèm kiểm tra mặt nạ alpha cho PNG. Nhãn thu hoạch có vùng chạm riêng. Vị trí tương tác theo bề mặt địa hình, kể cả khi xoay camera. Chuyển động nhân vật tiếp tục dùng đường đi tránh vật cản.

Tán cây trồng nhô sang ô bên cạnh không chiếm vùng chạm của ô đất đó; nút thu hoạch nổi vẫn chỉ đúng cây tương ứng. Nhà và vật cản vẫn được xét theo độ sâu, không chạm xuyên qua công trình.

- Kéo một ngón/chuột trái: di chuyển góc nhìn; thả để trượt theo quán tính.
- Chụm hai ngón hoặc lăn chuột: thu phóng quanh vị trí thao tác.
- Kéo chuột phải hoặc Shift + kéo: xoay góc nhìn; kéo dọc thay độ nghiêng trong giới hạn dễ nhìn. Chụm hai ngón ưu tiên zoom/pan, tránh vô tình xoay.
- Nút ↶ / ↻: xoay trái/phải 30 độ. Nút ⌂: về góc nhìn ban đầu. Nút ◎: trở về vị trí nhân vật.
- Chạm đất trống để gieo, cây đang lớn để chăm, cây chín để thu.

Các phần hình học tĩnh được gộp theo vật liệu, chất liệu có mipmap và lọc anisotropic. Bóng đổ cập nhật theo nhịp riêng, nền tạm giữ khi mở bảng để dành tài nguyên cho giao diện và chỉnh nhân vật. Cài đặt Độ nét cao, Bóng đổ và Chuyển động nhẹ vẫn áp dụng.

## Nhân vật

`avatar-3d.js` là bộ mô hình chung cho nhân vật trong vườn, HUD, hồ sơ, câu cá và trình chỉnh sửa. Sáu mẫu có tỷ lệ cơ thể khác nhau. Các lựa chọn không còn dùng mặt nạ màu hoặc tọa độ PNG ước lượng trong chế độ 3D.

- Màu da, tóc, áo được gán trực tiếp vào đúng nhóm vật liệu. Đổi màu giữ nguyên hình học để giảm khựng.
- Tóc ngắn, mái, tết, dài và xoăn có cấu trúc hình học riêng.
- Sơ mi, quần yếm và áo khoác có bộ phận khác nhau; yếm có dây, túi và khóa, áo khoác có cổ và đai.
- Nón lá, mũ rơm và khăn gắn với phần đầu; quay hoặc đi bộ không làm phụ kiện lệch đầu.
- Các nút tóc/áo/mũ hiển thị ảnh chụp từ chính mô hình 3D. Khi sửa, nhân vật trên map cũng được cập nhật dù bảng chỉnh sửa còn mở.
- Tùy chọn lưu bằng cùng cấu trúc `S.av`; tải lại game vẫn giữ ngoại hình.

## Chạy game

WebGL có texture hoạt động khi chơi qua địa chỉ HTTP/HTTPS, bao gồm hosting hiện tại của game. Có thể kiểm tra tại máy bằng:

```text
node tools/serve-game.mjs
```

Mở `http://127.0.0.1:8788/`. Khi mở trực tiếp bằng `file:`, map dùng chế độ PNG tương thích vì trình duyệt hạn chế texture WebGL từ tệp cục bộ. Nếu thiết bị không tạo được WebGL, renderer cũ vẫn giữ các chức năng game.

## Ảnh và thư viện

- `assets/backgrounds/farm-surfaces.png`: atlas 8 chất liệu tạo bằng Imagegen tích hợp, dùng trực tiếp trên mô hình 3D.
- Prompt và cách chia atlas: `docs/farm-3d-art.json`.
- Thư viện cục bộ: `assets/vendor/three-0.160.1.min.js`, không cần CDN khi chơi.
- Giấy phép MIT: `assets/vendor/THREE-LICENSE.txt`.

Kiểm tra trình duyệt: `node tools/verify-3d.mjs`. Chrome kiểm tra camera, vùng chọn theo địa hình, đổi màu/kiểu tóc/áo/mũ, đồng bộ nhân vật và các thao tác trồng cây. Kiểm tra trên máy mô phỏng không thay thế đo hiệu năng trên từng điện thoại thật.

Kết quả kiểm tra lần cập nhật này: 18 trường hợp 3D đạt, 14 kiểm tra chăm cây/tiến trình đạt, 17 tình huống làng quê đạt và 2 kiểm tra chế độ mở tệp trực tiếp đạt. Đã kiểm tra mỗi màu da/tóc/áo và mỗi kiểu tóc/áo/mũ tạo ra ảnh thực khác nhau; nhân vật trong vườn khớp cấu hình khi bảng chỉnh sửa còn mở và sau khi tải lại.
