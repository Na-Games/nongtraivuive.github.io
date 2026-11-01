# Bộ ảnh diorama, chăm cây và tiến trình cấp 200

Cập nhật 01/11/2026 theo tài liệu lỗi mới. Thực hiện trong mã nguồn game hiện có, giữ khóa lưu `xom_nong_trai_v2`.

Bản mới nhất đã bổ sung **map WebGL và nhân vật 3D dùng chung cấu hình**, xem [FARM-3D.md](FARM-3D.md). Bộ PNG bên dưới được giữ cho icon, cây/vật nuôi trong không gian 3D, thư viện và chế độ tương thích.

## Hình ảnh đã tích hợp

1.070 PNG riêng trong 37 nhóm: 704 hình tĩnh và 366 khung chuyển động. Có thêm 4 ảnh nền trong `assets/backgrounds/`. Ảnh được tạo bằng công cụ imagegen tích hợp theo phong cách các ảnh tham chiếu: mô hình làng quê 3D thu nhỏ, mái ngói, tre, gỗ, đá và vải chàm. Mỗi sprite có nền alpha trong suốt, khoảng đệm ít nhất 24 px; bảng ảnh nguồn không được dùng trực tiếp làm icon. Ảnh nền toàn cảnh được giữ kín nền.

- Tệp dùng khi chơi: `assets/*.png`, `assets/motion/*.png` và các PNG riêng trong `assets/sprites/`, `assets/motion/sprites/`.
- Tóc, áo và mũ: `assets/sprites/wardrobe-parts/`. Sáu nhân vật mới trong `assets/sprites/village-people/` có vóc dáng và khuôn mặt khác nhau, ghép tóc/mũ theo đầu trọc làm chuẩn, phân lớp chân để chuyển động. `wardrobe.js` ghép lớp phụ kiện và đổi màu có bộ nhớ đệm. Bộ khung chuyển động cũ vẫn có trong thư viện và trình diễn.
- Phong cảnh mới: `assets/sprites/scenery/`, gồm thác nước, rừng tre, thông, bờ biển, suối khoáng, sân làng, ruộng và đồi chè.
- Bộ prompt, thứ tự hình và thông số: `docs/diorama-prompts.json`. Các lần tạo lại đã được kiểm tra trước khi đóng gói; nhân vật tĩnh cuối cùng lấy từ khung chuyển động thay vì bảng nháp.
- Kiểm tra nền trong suốt, số hình và khoảng đệm: `docs/diorama-validation.json`. Script đóng gói từ nguồn: `tools/build-diorama.mjs`; đồng bộ nhân vật và mã tương thích: `tools/finalize-diorama.mjs`.

Các báo cáo và ảnh kiểm thử đã được dọn để giảm dung lượng; đường dẫn báo cáo trong hướng dẫn là vị trí xuất kết quả khi chạy lại công cụ, không phải tệp cần có để chơi game.

Đã dọn các bảng ảnh nguồn trung gian, ảnh/video kiểm thử và tài liệu cũ để giảm dung lượng. Game, thư viện PNG và trình diễn chuyển động vẫn dùng đủ bộ ảnh đã đóng gói. Muốn tạo lại atlas từ đầu cần tạo lại ảnh nguồn theo `docs/diorama-prompts.json`; chơi hoặc đóng gói game không cần ảnh nguồn này. Báo cáo kiểm thử có thể tạo lại bằng các lệnh dưới đây.

180 hình phẩm cấp mới trong `assets/sprites/elite-*`: 72 icon hạt/giống, 36 cây lâu năm, 36 món trang trí và 36 mô hình công trình. Sáu phẩm cấp có hình riêng: từ bao vải, giỏ tre, thùng gỗ đến chậu gốm, sơn son và khảm vàng. Các giống cao cấp giữ hình sinh trưởng của đúng loài; icon trong cửa hàng và kho dùng hình phẩm cấp riêng.

## Bản đồ, điều khiển và âm thanh

Bản đồ có thêm nhà trà, xưởng chàm, ruộng viền đá, cầu đá, đường rêu, dòng suối và guồng nước. 16 PNG cảnh mới ở `assets/sprites/village-landscape/`. Dùng kéo để di chuyển và thả để trượt theo quán tính; lăn chuột hoặc chụm ngón tay để zoom. Zoom nội suy quanh vị trí con trỏ. Nền có vùng đệm để không phải vẽ lại mỗi khung khi kéo nhẹ.

Âm thanh bản đồ được mở khóa ở lần chạm/phím đầu tiên. Tiếng gió, suối và chim dùng chung cài đặt âm lượng tổng; có công tắc và âm lượng môi trường riêng trong Cài đặt → Âm thanh & rung. Nút Thử âm thanh phát tín hiệu kiểm tra. Âm thanh dừng khi ẩn ứng dụng; chuyển sang câu cá sẽ thay môi trường nông trại bằng tiếng hồ câu, trở về vườn sẽ khôi phục âm thanh bản đồ.

Game tự yêu cầu toàn màn hình ở lần chạm đầu tiên và không còn nút toàn màn hình trong cài đặt. Trình duyệt không cho phép mở toàn màn hình trước thao tác người dùng; thiết bị không hỗ trợ API vẫn dùng toàn bộ khung nhìn khả dụng.

Tab trong cửa hàng/cài đặt được cuộn đến đúng mục đang chọn, giữ vị trí khi cập nhật và hỗ trợ phím mũi tên. Màu áo được áp dụng lên cả phần vải tối/sáng, mẫu áo mới được giới hạn trong lớp vải của nhân vật; tóc và mũ được căn theo đầu ở từng tư thế.

## Trồng và chăm cây

Chạm đất trống để gieo. Chạm ô đang trồng để mở màn hình chăm sóc. Có tưới nước miễn phí (-10% thời gian), nhổ cỏ miễn phí (-5%, +1 sản lượng), bón phân (-20%, +1 sản lượng) và thuốc tăng trưởng (-35%). Mỗi thao tác chỉ dùng một lần trong một vụ; phân và thuốc trừ đúng một lần. Cây chín không dùng thêm vật phẩm chăm sóc. Chạm cây chín để thu/hái; kho đầy sẽ giữ cây.

Thời gian còn lại hiển thị trên từng ô đang trồng và trong màn hình chăm sóc. Lúa mặc định 5 phút, ngô 7 phút; các cây khác lâu hơn, tối đa 12 giờ với giống cao cấp. Thời gian trồng đã tăng so với bản cũ. Tiến trình của vụ cũ được chuyển đổi theo tỷ lệ đã lớn, cây đã chín vẫn giữ chín. Menu → Ruộng & vườn xem toàn bộ ô đã mở. Thời gian dùng mốc thực tế nên cây tiếp tục lớn khi rời game.

Đã bỏ thanh Chọn / Gieo / Thu / Chăm / Hái theo yêu cầu mới. Chạm thẳng ô đang trồng để mở các nút chăm sóc dạng kính trong suốt; nút Chi tiết ô đất mở đầy đủ thông tin và tiến trình. Chạm ô trống để gieo, cây chín để thu. Thu hoạch có nông sản bật lên, hạt sáng và thông báo sản lượng.

60 ô đất: 30 ô ban đầu và 30 ô mở rộng ở phía nam bản đồ. Ô mở rộng yêu cầu cấp 20–194. Tự bổ sung ô mới khi tải bản lưu cũ. Đất và công trình nâng được đến cấp 20; từ cấp nâng thứ 5 cần thêm cấp người chơi tương ứng.

## Cửa hàng và cấp 200

11 mục: hạt giống, nhà máy, chuồng, ruộng/kho, câu cá, cây lâu năm, trang trí, mô hình, vật nuôi, vật phẩm và lộ trình cấp 200. Danh mục chính có tìm kiếm; thanh danh mục vuốt ngang trên điện thoại.

174 giống cây và 20 công trình sản xuất. Có 6 nhà máy mới ở cấp 40, 65, 90, 120, 160 và 200: xưởng dệt, tiệm bánh, xưởng quả, xưởng mía, xưởng hương thảo và nhà trà di sản. Các mốc giống/phẩm cấp gồm 40, 70, 100, 140, 180 và 200; giống có giá hạt, thời gian, giá bán và XP riêng. Cấp người chơi tối đa 200.

Mục vật nuôi bán gà, bò, vịt, heo, dê và cừu, yêu cầu chuồng phù hợp. Tối đa 5 con bổ sung mỗi loại, có mặt trên bản đồ và tăng sản lượng chuồng. Có thêm chó, mèo và hạc cảnh đi lại trong vườn; thú cảnh không yêu cầu chuồng sản xuất và không sinh sản phẩm. Mục vật phẩm bán phân hữu cơ và thuốc tăng trưởng dùng được ngay khi chăm cây.

## Làng quê

Menu hoặc bản đồ → Nhịp sống làng quê: khôi phục guồng nước, xưởng chàm và suối khoáng; làm bột, đơn hàng vải và trà mật ong. Nguyên liệu trừ lúc bắt đầu, hàng hoàn thành giữ lại nếu kho đầy. Tiến độ lưu khi rời game. Mục tiêu ngày và quà suối reset theo giờ Việt Nam, chống nhận hai lần.

## Kiểm tra

- `node tools/test-farming.mjs`: chăm cây, vật phẩm, vật nuôi, mở đất và cấp 200.
- `node tools/test-village.mjs`: xây dựng, chế tác, tiến độ ngoại tuyến và thưởng.
- `node tools/test-diorama.mjs`: tách hình, nền alpha, khoảng đệm và điểm neo chuyển động.
- Sau khi đóng gói chuyển động, chạy `node tools/finalize-diorama.mjs`, `node tools/build-fishing-rigs.mjs` và `node tools/build-wardrobe-masks.mjs`. Các lớp màu PNG cho phép thay màu cả khi mở bằng `file:` mà không đọc pixel trong trình duyệt.
- `node tools/verify-game.mjs`, `node tools/verify-upgrade.mjs`, `node tools/verify-fishing.mjs`, `node tools/verify-local-file.mjs`: chạy Chrome với giao diện và thao tác game. Báo cáo trong `docs/verification/`.
- `node tools/verify-map.mjs`: kiểm tra dạng sóng âm thanh thực, bật/tắt tiếng, chuyển cảnh, kéo/zoom, tab, đổi màu trang phục và chuyển đổi thời gian vụ cũ.
- `node tools/verify-document.mjs`: 20 kiểm tra bổ sung cho tài liệu mới, bao gồm 33 lựa chọn ngoại hình, tốc độ đổi trang phục, đường đi không xuyên vật cản, ba cầu qua suối, vùng chạm hình PNG, 5 chủ đề âm thanh và giao diện câu cá dọc/ngang.

## Các thay đổi theo tài liệu lỗi ngày 01/11

- Bản đồ chọn tỉnh dùng địa hình phù điêu, giữ nguyên tọa độ và vùng chọn. Địa hình là ảnh minh họa nghệ thuật, không phải dữ liệu cao độ địa lý.
- Khám phá nông trại dùng toàn cảnh làng quê mới. Nền cỏ và mặt hồ có chất liệu ảnh, biển mở rộng ra ngoài mép đông của khu đất, suối chạy xuống hết bản đồ, nước có gợn chuyển động.
- Ba cầu căn theo tâm dòng suối và hướng nối hai bờ. Nhãn Bờ biển / Câu cá và Vườn cây vẽ sau vật thể, đặt cao khỏi thuyền và tán cây.
- Vịt ao dùng 4 PNG bơi mới, thân nổi thấp, không lộ chân, có vệt sóng và bỏ bóng trên mặt đất. Vật nuôi trên bờ vẫn dùng dáng đi.
- Chạm hình dựa trên mặt nạ alpha đã tính sẵn trong `assets/hit-shapes.js`, xét đúng thứ tự che khuất. Không đọc pixel trong lúc chơi hoặc khi mở bằng `file:`.
- Người và vật nuôi đi theo đường tránh nhà, cây, đá, ao, suối; kiểm tra cả đoạn di chuyển, không chỉ điểm đến. Vịt nước chỉ bơi trong lòng ao.
- Cài đặt chuyển lên góc trên bên phải, bỏ nút chụp ảnh. Cụm cần/mồi/sổ cá/mục tiêu cùng hàng Cài đặt câu cá, thu gọn bảng điều khiển phía dưới.
- 5 chủ đề âm thanh tổng hợp bằng Web Audio: vườn sớm có chim, suối, biển theo nhịp sóng, mưa nhẹ và làng quê có giai điệu mộc. Không cần tải tệp nhạc lớn.
- Toàn màn hình tự yêu cầu khi chạm/phím đầu tiên; mở từ ứng dụng đã cài lên màn hình chính dùng manifest fullscreen. Không thể ép trình duyệt ẩn thanh địa chỉ trước thao tác người dùng trên mọi thiết bị. Có service worker nhỏ hỗ trợ ứng dụng cài đặt; không tải thêm bản sao bộ sprite vào cache.
- Prompt và đường dẫn 6 ảnh nguồn mới lưu ở `docs/document-art-prompts.json`; PNG đã tách/đóng gói dùng trong game ở `assets/backgrounds/`, `assets/village-people.png`, `assets/duck-swim.png` và các thư mục sprite tương ứng.

Kiểm tra Chrome mô phỏng kích thước điện thoại không thay thế thử nghiệm trên thiết bị thật. Cảm giác rung và khóa chiều màn hình còn tùy trình duyệt/điện thoại.
