Bản sửa theo tài liệu ngày 03/11/2026: [chi tiết và cách bật tên cây](docs/DOCUMENT-FIXES-V7.md). Bộ chuyển động có 80 PNG cho mỗi nhân vật tùy chỉnh.

# Xóm Nông Trại — diorama 3D và cấp 200

Bộ nhân vật và vật nuôi minh họa theo mẫu người chơi, PNG nền trong suốt và 43.200 tổ hợp tùy chỉnh đã dùng chung trên map, chân dung và câu cá: [hướng dẫn bộ ảnh mới](docs/ILLUSTRATED-ACTORS.md).

Cập nhật 02/11/2026: nhân vật và 12 loài vật làm mới, hiệu ứng câu cá, nhãn công trình luôn hiện, nông trại 64×64 với đất liền rộng hơn, bản đồ chọn quê mới và ảnh PNG nhẹ hơn 25,36 MiB. Xem [chi tiết cập nhật](docs/COUNTRYSIDE-V4.md).

Mở **index.html** để chơi. Xem thay đổi, cách chăm cây, cửa hàng mới, nguồn ảnh và kiểm tra tại [docs/DIORAMA-VA-CAP-200.md](docs/DIORAMA-VA-CAP-200.md).

Map WebGL và nhân vật 3D: chạy `node tools/serve-game.mjs`, rồi mở **http://127.0.0.1:8788/**, hoặc chơi trên hosting HTTP/HTTPS. Xem [hướng dẫn 3D](docs/FARM-3D.md). Mở trực tiếp bằng tệp vẫn chơi được bằng chế độ tương thích.

Cập nhật bản đồ Việt Nam, map 40×40, nhân vật có xem chuyển động, ba cảnh câu cá và thao tác chăm cây: [ghi chú thay đổi](docs/PLAYABILITY-REVISION.md), [ảnh mới và prompt](docs/playability-art.json).

Bản nhân vật dựng lại, vật nuôi có khớp, 36 icon và 18 khung hiệu ứng mới, map 48×48 với biên sương: [cập nhật mới nhất](docs/ACTORS-V3.md), [prompt và nguồn ảnh](docs/actors-v3-art.json).

- index.html: game
- thu-vien-anh.html: PNG gallery
- chuyen-dong.html: animation preview
- docs/DIORAMA-VA-CAP-200.md: features, controls, art sources and checks
- tools/package-game.ps1: standalone game archive

Progress is stored locally in your browser. Keep the assets directory beside the HTML, JS and CSS files.
