# Xóm Nông Trại — diorama 3D và cấp 200

Mở **index.html** để chơi. Xem thay đổi, cách chăm cây, cửa hàng mới, nguồn ảnh và kiểm tra tại [docs/DIORAMA-VA-CAP-200.md](docs/DIORAMA-VA-CAP-200.md).

Map WebGL và nhân vật 3D: chạy `node tools/serve-game.mjs`, rồi mở **http://127.0.0.1:8788/**, hoặc chơi trên hosting HTTP/HTTPS. Xem [hướng dẫn 3D](docs/FARM-3D.md). Mở trực tiếp bằng tệp vẫn chơi được bằng chế độ tương thích.

Cập nhật bản đồ Việt Nam, map 40×40, nhân vật có xem chuyển động, ba cảnh câu cá và thao tác chăm cây: [ghi chú thay đổi](docs/PLAYABILITY-REVISION.md), [ảnh mới và prompt](docs/playability-art.json).

- index.html: game
- thu-vien-anh.html: PNG gallery
- chuyen-dong.html: animation preview
- docs/DIORAMA-VA-CAP-200.md: features, controls, art sources and checks
- tools/package-game.ps1: standalone game archive

Progress is stored locally in your browser. Keep the assets directory beside the HTML, JS and CSS files.
