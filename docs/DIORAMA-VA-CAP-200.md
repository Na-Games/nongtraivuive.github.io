# Bộ ảnh diorama, chăm cây và tiến trình cấp 200

Cập nhật 31/10/2026. Thực hiện trong mã nguồn game hiện có, giữ khóa lưu `xom_nong_trai_v2`.

## Hình ảnh đã tích hợp

864 PNG riêng trong 29 nhóm: 498 hình tĩnh và 366 khung chuyển động. Ảnh được tạo bằng công cụ imagegen tích hợp theo phong cách các ảnh tham chiếu: mô hình làng quê 3D thu nhỏ, mái ngói, tre, gỗ, đá và vải chàm. Mỗi hình xuất ra có nền alpha trong suốt, khoảng đệm ít nhất 24 px; bảng ảnh nguồn không được dùng trực tiếp làm icon.

- Tệp dùng khi chơi: `assets/*.png`, `assets/motion/*.png` và các PNG riêng trong `assets/sprites/`, `assets/motion/sprites/`.
- Tóc, áo và mũ: `assets/sprites/wardrobe-parts/`. Nhân vật tĩnh được trích từ chính bộ chuyển động để giữ cùng khuôn mặt. `wardrobe.js` ghép lớp phụ kiện và đổi màu có bộ nhớ đệm.
- Phong cảnh mới: `assets/sprites/scenery/`, gồm thác nước, rừng tre, thông, bờ biển, suối khoáng, sân làng, ruộng và đồi chè.
- Bộ prompt, thứ tự hình và thông số: `docs/diorama-prompts.json`. Các lần tạo lại đã được kiểm tra trước khi đóng gói; nhân vật tĩnh cuối cùng lấy từ khung chuyển động thay vì bảng nháp.
- Kiểm tra nền trong suốt, số hình và khoảng đệm: `docs/diorama-validation.json`. Script đóng gói từ nguồn: `tools/build-diorama.mjs`; đồng bộ nhân vật và mã tương thích: `tools/finalize-diorama.mjs`.

Các phẩm cấp cây và trang trí cấp cao dùng lại hình của đúng loài/mẫu đã thiết kế; chúng có tên, giá và thông số tiến trình khác nhau. Không phải mỗi phẩm cấp có một ảnh mới độc lập.

## Trồng và chăm cây

Chạm đất trống để gieo. Chạm ô đang trồng để mở màn hình chăm sóc. Có tưới nước miễn phí (-10% thời gian), nhổ cỏ miễn phí (-5%, +1 sản lượng), bón phân (-20%, +1 sản lượng) và thuốc tăng trưởng (-35%). Mỗi thao tác chỉ dùng một lần trong một vụ; phân và thuốc trừ đúng một lần. Cây chín không dùng thêm vật phẩm chăm sóc. Chạm cây chín để thu/hái; kho đầy sẽ giữ cây.

Thời gian còn lại hiển thị trên từng ô đang trồng và trong màn hình chăm sóc. Menu → Ruộng & vườn xem toàn bộ ô đã mở. Thời gian dùng mốc thực tế nên cây tiếp tục lớn khi rời game.

60 ô đất: 30 ô ban đầu và 30 ô mở rộng ở phía nam bản đồ. Ô mở rộng yêu cầu cấp 20–194. Tự bổ sung ô mới khi tải bản lưu cũ. Đất và công trình nâng được đến cấp 20; từ cấp nâng thứ 5 cần thêm cấp người chơi tương ứng.

## Cửa hàng và cấp 200

11 mục: hạt giống, nhà máy, chuồng, ruộng/kho, câu cá, cây lâu năm, trang trí, mô hình, vật nuôi, vật phẩm và lộ trình cấp 200. Danh mục chính có tìm kiếm; thanh danh mục vuốt ngang trên điện thoại.

174 giống cây và 20 công trình sản xuất. Có 6 nhà máy mới ở cấp 40, 65, 90, 120, 160 và 200: xưởng dệt, tiệm bánh, xưởng quả, xưởng mía, xưởng hương thảo và nhà trà di sản. Các mốc giống/phẩm cấp gồm 40, 70, 100, 140, 180 và 200; giống có giá hạt, thời gian, giá bán và XP riêng. Cấp người chơi tối đa 200.

Mục vật nuôi bán gà, bò, vịt, heo, dê và cừu, yêu cầu chuồng phù hợp. Tối đa 5 con bổ sung mỗi loại, có mặt trên bản đồ và tăng sản lượng chuồng. Mục vật phẩm bán phân hữu cơ và thuốc tăng trưởng dùng được ngay khi chăm cây.

## Làng quê

Menu hoặc bản đồ → Nhịp sống làng quê: khôi phục guồng nước, xưởng chàm và suối khoáng; làm bột, đơn hàng vải và trà mật ong. Nguyên liệu trừ lúc bắt đầu, hàng hoàn thành giữ lại nếu kho đầy. Tiến độ lưu khi rời game. Mục tiêu ngày và quà suối reset theo giờ Việt Nam, chống nhận hai lần.

## Kiểm tra

- `node tools/test-farming.mjs`: chăm cây, vật phẩm, vật nuôi, mở đất và cấp 200.
- `node tools/test-village.mjs`: xây dựng, chế tác, tiến độ ngoại tuyến và thưởng.
- `node tools/test-diorama.mjs`: tách hình, nền alpha, khoảng đệm và điểm neo chuyển động.
- `node tools/verify-game.mjs`, `node tools/verify-upgrade.mjs`, `node tools/verify-fishing.mjs`, `node tools/verify-local-file.mjs`: chạy Chrome với giao diện và thao tác game. Báo cáo trong `docs/verification/`.

Kiểm tra Chrome mô phỏng kích thước điện thoại không thay thế thử nghiệm trên thiết bị thật. Cảm giác rung và khóa chiều màn hình còn tùy trình duyệt/điện thoại.
