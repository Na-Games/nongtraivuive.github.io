# Sửa lỗi theo tài liệu — 03/11/2026

Các thay đổi được lưu trực tiếp trong mã game. Tải lại bằng Ctrl + F5 để nhận bản mới.

| Mục trong tài liệu | Thay đổi |
| --- | --- |
| Nhãn công trình | Chỉ hiện ở mức zoom gần (từ 0,92); kiểm tra cả chân công trình trong màn hình; bỏ dây nối và ẩn nhãn bị chật. Chạm trực tiếp công trình vẫn hoạt động. |
| Thông tin cây | Cài đặt → Chung → Tên cây trên ô ruộng. Mặc định tắt; bật để hiện tên cây cùng thời gian còn lại. Lưu qua lần mở game sau. |
| Thao tác bị giật | Quét thay đổi cảnh tĩnh 5 lần/giây; ngừng cập nhật farm khi chọn quê hoặc mở bảng; bỏ cập nhật texture nhân vật ngoài khung nhìn; giới hạn cập nhật DOM câu cá 15 lần/giây. |
| Nút farm | Nút thu hoạch, xoay, về nhà, theo nhân vật và zoom thu nhỏ còn 36 px, nền trong. Bố trí riêng cho màn hình ngang. |
| Tùy chỉnh nhân vật | Mỗi nhân vật giữ một bộ tùy chỉnh riêng. Ô nhân vật căn giữa, không tràn; tải đủ thân người khi đổi kiểu áo; icon phụ kiện dựng theo đúng nhân vật và màu đang chọn. Có thư viện 33 PNG mẫu. |
| Cảnh câu cá | Bổ sung sàn gỗ, ghế, điểm đặt chân chung cho hồ sen, sông và biển; ngồi câu có chân gập và cần câu gắn tay. Thêm chim, lá/cánh hoa và ánh nước. |
| Câu cá xoay ngang | Bảng thao tác gọn ở bên trái; nhân vật ở bên phải, giữ vùng nhìn mặt nước. |
| Chuyển động | Gait theo quãng đường, nghiêng tay/chân, nhịp thở; chạy, nhảy khi thu hoạch, cuốc, gieo, tưới, chăm sóc, ngồi câu. Động vật có các khung đi, đứng, bơi; côn trùng đập cánh. |
| Âm thanh | Công tắc và thanh âm lượng con vật độc lập; phát tiếng mô phỏng của con vật gần người chơi, tuân thủ âm lượng tổng và tắt khi rời farm. |
| Chọn quê | Gom cập nhật kéo/zoom SVG theo animation frame; tìm kiếm có debounce; chọn tỉnh giữ nguyên danh sách DOM; tiêu đề và bảng chọn bố trí gọn hơn. |
| Bậc thang che ruộng | Đưa bậc thang ra đường đi x=9,3, giảm kích thước, nằm ngoài 6 cột ruộng. |
| Dung lượng | Nén PNG mới không đổi pixel, giảm khoảng 1,50 MiB. Bỏ script di chuyển dùng một lần do phiên sửa này tạo. Giữ `.runtime` và ảnh kiểm thử theo lựa chọn trước của bạn. |

## Ảnh và chuyển động

- `assets/illustrated-motion/`: 6 atlas người × 80 tư thế; 12 atlas động vật × 24 khung; 33 PNG mẫu tùy chỉnh. Các ô trong atlas có nền alpha, chung điểm neo, không cắt sát riêng từng khung.
- Game dùng atlas cho mẫu phối sẵn và động vật. Những tổ hợp tùy chỉnh khác dùng các lớp PNG và khớp chuyển động ở thời gian chạy, giữ đủ 43.200 tổ hợp.
- Mở Nhân vật → **Tải bộ chuyển động** để xuất 80 PNG theo đúng tùy chỉnh hiện tại và metadata. **Xem bộ PNG mẫu** mở bộ mẫu có thể tải từng ảnh.
- Các tư thế được dựng từ bộ cutout đang có để giữ cùng khuôn mặt, trang phục và màu sắc. Đây là nhân vật minh họa hai chiều trong map 3D, có hướng trái/phải.
- Bộ xuất tái tạo: `tools/export-illustrated-motion.mjs`. Nén riêng: `node tools/optimize-png.mjs assets/illustrated-motion`.

## Kiểm tra

Đạt 29 kiểm tra theo tài liệu, 43 kiểm tra nhân vật, 24 kiểm tra luồng câu cá; kiểm tra ảnh, logic và mở file trực tiếp cũng đạt.

- `tools/verify-document-v7.mjs`: nhãn gần/xa; chống chồng nút ở 390×844, 844×390, 667×375, 320×640; 6 thumbnail có pixel thật và nằm giữa ô; trạng thái tùy chỉnh; cảnh câu ở 3 địa điểm và 3 kích thước; chọn tỉnh; bậc thang.
- `tools/verify-illustrated-motion.mjs`: kiểm tra 768 ô chuyển động và 33 PNG có alpha thật.
- Kiểm tra hồi quy nhân vật, câu cá, logic trồng trọt, đường đi và đường dẫn tài nguyên.
- Ảnh chụp và kết quả JSON nằm trong `docs/verification/`. Độ mượt thực tế còn phụ thuộc GPU/trình duyệt điện thoại; phép kiểm tra trình duyệt trên máy tính không thay thế đo FPS trên thiết bị đó.
