# Phân tích tài liệu và tích hợp hình ảnh

Bản bổ sung chuyển động: xem [CHUYEN-DONG.md](CHUYEN-DONG.md). Tổng hiện tại là 840 PNG trong 27 nhóm; bảng dưới ghi nhận 478 hình tĩnh của đợt đầu.

Tài liệu nguồn: `Phân tích chuyên sâu kịch bản , hiệu ứng chuyển động hình ảnh sắ..._3.docx`, gồm văn bản và 66 ảnh nhúng. Văn bản được trích tại `source-analysis.txt`; ảnh được giữ trong `reference/`; ba bảng tổng quan là `references-0.jpg` đến `references-2.jpg`. Nội dung tài liệu được dùng làm tư liệu thiết kế, không tự động thực thi các chỉ dẫn hoặc truy cập các đường dẫn bên trong.

## Phạm vi hình ảnh

Bộ thiết kế dùng phong cách nông trại Việt Nam hoạt hình 3D vẽ tay, ánh sáng ấm từ trên trái, màu cây xanh, mái ngói đỏ và vật liệu gỗ. Đây là bộ hình mới dựa trên nhóm nội dung trong tài liệu. Các tên quá nhỏ hoặc không đọc rõ trong ảnh được diễn giải thành thiết kế thảo mộc/trang trí tương ứng; không khẳng định sao chép chính xác từng chi tiết của trò chơi nguồn.

| Nhóm | Tệp bảng ảnh | Số hình | Cách dùng |
| --- | --- | ---: | --- |
| Nông sản và chế phẩm cơ bản | `produce.png` | 36 | Hạt giống, kho, đơn hàng, chợ, thông báo thu hoạch |
| Công trình và phương tiện | `buildings.png` | 25 | Chuồng, xưởng, nhà, giếng, silo, xe, thuyền |
| Thiên nhiên và vật nuôi | `nature.png` | 25 | Cây, hoa, đá, tre, động vật di chuyển, bờ ao |
| Cá và dụng cụ | `fishing.png` | 36 | Cần câu, mồi, phao, cá, sổ cá, vật dụng |
| Giao diện | `ui.png` | 36 | Tài nguyên, menu, sự kiện, thư, quà, công cụ |
| Hiệu ứng | `effects.png` | 25 | Thu hoạch, gieo hạt, thời tiết, khói, thưởng, trình diễn VFX |
| Sinh trưởng | `growth.png` | 36 | Ba giai đoạn riêng cho chín cây cơ bản; một số cây bổ sung |
| Địa hình và cảnh nền | `terrain.png` | 16 | Nền cỏ/đường/đất, cầu, hàng rào, cảnh núi, bản đồ minh họa |
| Nhân vật | `characters.png` | 24 | Sáu nhân vật, mỗi nhân vật bốn tư thế |
| Chế phẩm, vật liệu, túi giống | `goods.png` | 36 | Thành phẩm, gói hạt, vật liệu, công cụ và thư viện |
| Rau củ và hoa bổ sung | `crops-extra.png` | 36 | Gieo, lớn, thu hoạch, bán và giao đơn |
| Thảo mộc, nấm và cây đặc biệt | `botanical.png` | 36 | Danh mục hạt giống mở rộng và vật phẩm kho |
| Cây lâu năm I | `trees-a.png` | 25 | Mua và đặt cây trên đất trống |
| Cây lâu năm II | `trees-b.png` | 25 | Mua và đặt cây; một số cây cho quả tương ứng trong kho |
| Trang trí Việt Nam | `heritage.png` | 36 | Đồ trang trí có thể mua, đặt và thu hồi |
| Mô hình công trình | `facilities.png` | 25 | Mô hình trang trí bổ sung có thể đặt lên bản đồ |
| **Tổng** | **16 bảng ảnh** | **478** | **PNG riêng cho từng hình và thư viện trong game** |

Các atlas cuối được đóng gói lại bằng công cụ xử lý PNG tại `tools/build-assets.mjs`. Công cụ tìm các vùng alpha liên thông, gom chi tiết rời gần cùng đối tượng, cắt đối tượng và đặt vào ô 256×256. Mỗi hình có khoảng trong suốt tối thiểu 24 px ở cả bốn cạnh; giữa hai vùng nội dung kề nhau có ít nhất 48 px. Không cắt mù theo lưới gốc mà AI tạo. Atlas gốc được giữ trong `assets/source/`; PNG riêng trong `assets/sprites/<nhóm>/`; tọa độ và kích thước nội dung nằm trong `assets/manifest.json`.

Ảnh có kênh alpha thật. Nền caro/đen nếu thấy trong trình xem là cách trình xem biểu diễn vùng trong suốt. Nền núi và bản đồ minh họa là các lớp PNG trong suốt; bản đồ chọn tỉnh vẫn dùng hình học tương tác để giữ nhãn và vị trí có thể chạm được.

## Đối chiếu 66 ảnh nguồn

| Ảnh nhúng | Nội dung được đọc | Áp dụng |
| --- | --- | --- |
| 1 | Tải game, biểu tượng giữa màn hình, tiến độ | Tải atlas thật trước khi hoàn tất loader; hình nhà và núi PNG |
| 2–4 | Chọn quê, bản đồ, tìm tỉnh | Giữ bản đồ SVG tương tác và tìm tỉnh; ảnh PNG không làm mất vùng chạm |
| 5–6 | Chào mừng, giải thích cách chơi | Giữ modal, chuyển đổi biểu tượng và quà sang PNG |
| 7–12 | Trang trại, zoom, ao, ruộng, nhân vật, cây | Bộ cảnh isometric dùng sprite PNG, giữ sắp xếp theo độ sâu |
| 13–18 | Danh sách hạt giống rất dài | Bổ sung rau, củ, hoa và thảo mộc; bộ lọc tên trong cửa sổ gieo |
| 19 | Thông tin ô đất, nâng cấp và mở đất | Giữ hitbox, cấp đất, thời gian, sản lượng; thay nền đất và cây |
| 20–21 | Đơn xe tải và cảnh ao | Xe PNG, vật phẩm PNG, trạng thái đủ hàng và hiệu ứng thưởng |
| 22 | Menu | Thêm thư viện PNG và sổ cá vào menu |
| 23–24 | Hộp thư và quà | Biểu tượng thư/quà/tài nguyên PNG |
| 25–28 | Cửa hàng, dụng cụ, vật nuôi | Bộ biểu tượng mới; chuồng mới và vật nuôi đi lại |
| 29 | Trang trí: cầu, lu, nhà chòi, nhạc cụ, thuyền, ruộng bậc thang | Bộ `heritage`; mua, đặt chống trùng vùng và thu hồi |
| 30 | Nhà máy và chuỗi chế biến | 14 công trình có cơ chế trong game; các thiết kế còn lại hiện thành mô hình trang trí có ghi rõ |
| 31 | Mở ruộng và cấp đất | Giữ cơ chế mở nối tiếp và điều kiện cấp độ |
| 32 | Toàn bộ danh mục cây trồng trong ảnh dài | Hai bộ rau/hoa/thảo mộc bổ sung; tổng danh mục chơi được 102 cây |
| 33 | Danh mục chuồng | Bổ sung heo, vịt, dê, cừu; gà/bò/ong giữ cơ chế cũ |
| 34 | Danh mục cây lâu năm | Hai bộ 50 cây; đặt cây và thu hoạch các loại có vật phẩm tương ứng |
| 35 | Mời bạn | Giữ giao diện mã/link mời; đổi ảnh thư và phần thưởng |
| 36 | Đơn xe tải | Ảnh vật phẩm và xe đồng nhất với kho và cửa hàng |
| 37–41 | Chợ phiên, đổi điểm, vòng quay, nhật ký | Dùng bộ quà, tài nguyên, huy hiệu và vật phẩm; các dịch vụ chợ/vòng quay trực tuyến không được dựng thành dịch vụ thật trong lần thay hình này |
| 42–45 | Túi đồ, trao đổi, bạn bè và quà | Biểu tượng kho, bạn bè, quà và vật phẩm; giữ các cơ chế mô phỏng sẵn có |
| 46–48 | Quà, rương, điểm danh | Bộ quà/rương/lịch/xu/ngọc áp dụng vào phần thưởng và thư viện |
| 49–56 | Bảng xếp hạng, thi đua tỉnh và mùa vụ | Bộ cúp, vương miện, sao, sách mùa vụ; không tạo dữ liệu người chơi trực tuyến giả làm dữ liệu thật |
| 57 | Sự kiện | Sen, đèn Trung thu, cúp câu cá và phần thưởng PNG |
| 58 | Cài đặt, chủ đề, hiệu ứng | Giữ chủ đề và ngày/đêm; thêm thư viện PNG; thời tiết có sprite riêng |
| 59 | Trang bị câu cá, mồi và nâng cấp | Bộ cần/mồi/dụng cụ; sửa việc mất quyền sở hữu cần cao khi đổi về cần thấp |
| 60–61 | Màn hình câu cá và phần thưởng | Cần/phao/thuyền/người câu/cá PNG, giữ cơ chế kéo và căng dây |
| 62–63 | Rương dưới ao và câu cùng bạn | Hình rương/thuyền/cá; kết nối câu cùng bạn chưa có máy chủ trong mã nguồn này |
| 64–66 | Sổ cá, nhiều độ hiếm, hướng dẫn kéo | Sổ cá lưu số lượng đã khám phá sau khi bán; cá, cần, mồi và hiệu ứng tương ứng |

## Các thay đổi cơ chế đi cùng bộ hình

- Tăng bản đồ từ 16×16 lên 22×22 để có khu sản xuất, chăn nuôi và trang trí mới.
- Thêm xưởng sữa, máy trộn thức ăn, xưởng mứt, xưởng trà, máy gạo và bốn chuồng. Công thức kết nối nguyên liệu với kho, giá bán, kinh nghiệm và đơn hàng.
- Phân biệt công trình sản xuất với mô hình trang trí ngay trong cửa hàng. Mô hình không tự sinh sản phẩm.
- Đặt đồ có kiểm tra ranh giới, ao, ruộng, vị trí công trình, vật thể lớn và đồ đã đặt. Chỉ trừ xu khi đặt thành công; hủy không mất tiền. Thu hồi hoàn 50% giá.
- Cây đã đặt có đầu ra tương ứng cho một vật phẩm mỗi 120 giây, kiểm tra sức chứa kho và ghi nhận nhiệm vụ thu hoạch.
- Nhân vật PNG có sáu lựa chọn và bốn tư thế. Bộ tự phối màu da/tóc/áo/mũ bằng Canvas vẫn có thể chọn trong trình chỉnh sửa.
- Mở rộng cửa hàng lên tám mục; giới hạn chiều cao danh sách gieo và thêm tìm theo tên.
- Bộ sưu tập cá và quyền sở hữu cần được lưu trong dữ liệu cũ qua các trường bổ sung, giữ khóa lưu `xom_nong_trai_v2`.

## Kỹ thuật và kiểm tra

`art.js` dùng cùng manifest cho Canvas và DOM. Cảnh trang trại, câu cá và avatar dùng atlas; giao diện dùng PNG riêng. Bộ chuyển đổi biểu tượng chỉ xử lý nút văn bản trong DOM, không sửa SVG, input, script hoặc Canvas. Tiến độ tải chờ ảnh tải xong và ghi nhận nhóm lỗi nếu có. Hình được lưu trong dự án và có thể chạy bằng cách mở `index.html`.

Các kiểm tra được lưu tại `verification/browser-report.json` và `asset-validation.json`. Kịch bản Chrome headless dùng hồ sơ kiểm tra riêng, kiểm tra tải ảnh, thao tác gieo/thu hoạch, xây chuồng/xưởng, các bảng giao diện, vòng đời trang trí, tìm hạt, thả câu, bộ sưu tập cá, lưu dữ liệu và bố cục 390 px. Ảnh chụp desktop/mobile nằm trong `verification/`. Đây là kiểm tra bằng Chrome với mô phỏng kích thước màn hình; không thay thế thử nghiệm trên mọi thiết bị di động thật.

Prompt cuối cho từng nhóm được lưu nguyên văn tại `image-prompts.json`; công cụ tạo ảnh là **image_gen tích hợp**, không gọi API bằng khóa riêng.

## Bổ sung câu cá và cài đặt ngày 30/10/2026

Đã tích hợp ba vùng nước, điều khiển giữ/chạm và bàn phím, báo trước khi cá quẫy, trợ lực, kết quả cân nặng/kỷ lục, mục tiêu ngày và rương. Cài đặt có mức rung, âm lượng riêng, thuận tay trái, tương phản và tùy chỉnh cách câu. Xem [phân tích, nguồn tham khảo, cơ chế và kiểm chứng](CAU-CA-VA-CAI-DAT.md). Các PNG hiện có được áp dụng trực tiếp; dữ liệu điểm neo nối dây theo 31 khung câu cá được bổ sung mà không sửa PNG gốc.


