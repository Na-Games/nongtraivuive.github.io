# Chuyển động map 3D — bản 8, ngày 03/11/2026

Map giữ bộ nhân vật minh họa và toàn bộ màu sắc, tóc, áo, mũ hiện có. Chuyển động trên map chuyển từ ảnh đổi khung sang lưới có khớp trên GPU.

## Thay đổi

- `actor-rig.js`: mỗi người/con vật có một `SkinnedMesh`, ảnh tĩnh và trọng số khớp. Vẽ liên tục theo nhịp màn hình; không vẽ lại canvas rồi upload bitmap mỗi khung. Gối, khuỷu tay, thân, đầu và cánh chuyển động riêng; tư thế chuyển tiếp được làm dịu theo thời gian.
- Bước chân theo quãng đường thực; chạy có biên độ và nghiêng thân riêng; nhảy có độ cao trên điểm tiếp đất. Vật nuôi có nhịp chân, đầu, nhịp thở, bơi và cánh bay. Nhân vật/con vật ngoài khung nhìn không cập nhật tư thế.
- Dụng cụ đi theo khớp tay; nước tưới dùng các hạt được vẽ bằng instancing. Bóng tiếp đất của tất cả nhân vật gom trong một lần vẽ.
- `motion.js`: chia vật cản theo ô không gian, bỏ quét toàn bộ đồ trang trí mỗi bước. Giữ lưới tìm đường cho đến khi vật cản thay đổi; bỏ cơ chế dựng lại lưới sau mỗi 500 ms. Thêm/bớt đồ trang trí làm mất hiệu lực cache.
- `farm-3d.js`: chọn điểm trên mặt đất bằng tìm giao với hàm cao độ đã nội suy đúng các tam giác địa hình. Kéo/zoom không còn raycast toàn bộ lưới đất. Bóng nắng chỉ làm mới khi vùng phủ hoặc cảnh thay đổi.
- Tắt giữ drawing buffer WebGL liên tục. Khi mở bảng, chụp nền một lần để giữ hình mà không tiếp tục dựng map phía sau.
- Cài đặt → Hiệu ứng → **Tự cân bằng độ nét**: tự giảm độ phân giải map và bóng nắng khi khung hình chậm kéo dài. Chữ và nút không bị giảm nét; bóng tiếp đất được giữ. Có thể tắt tùy chọn này.
- Câu cá: nền cảnh dùng lớp nền riêng, không resample ảnh lớn vào canvas mỗi khung; đầu cần đi theo vị trí bàn tay đang chuyển động. Nhân vật và đầu gối quay về mặt nước.

PNG và các atlas trước đây vẫn phục vụ xuất ảnh, thư viện và các đường vẽ canvas. Tùy chỉnh không bị thay bằng mô hình người khác. Nhân vật vẫn là minh họa hai chiều có khớp đặt trong cảnh 3D, có hướng trái/phải.

## Đo kiểm

Đo bằng Chrome headless/SwiftShader, cảnh 24 con vật, 390×844, chất lượng thấp và tắt bóng nắng. Đây là chi phí xử lý các lô thao tác, **không phải số FPS trên điện thoại**.

| Lô xử lý | Trước | Sau |
| --- | ---: | ---: |
| 1.500 kiểm tra va chạm | 19,4 ms | 2,7 ms |
| 8 yêu cầu tìm đường | 53,8 ms | 3,7 ms |
| 60 bước cập nhật logic | 68,9 ms | 16,5 ms |
| 50 truy vấn chọn đất: raycast cũ / cách mới, cùng lượt đo | 298,5 ms | 8,6 ms |

Cập nhật khớp liên tục có đánh đổi CPU: lô 60 lần đồng bộ cảnh đo được khoảng 51 ms sau sửa, so với 23,9 ms của lượt cũ. Hai số này không bao gồm toàn bộ chi phí dựng hình và truyền bitmap cũ lên GPU. Số lần vẽ toàn cảnh trong mẫu đo gần tương đương (104/107); số tam giác tăng khoảng 10%. Không suy ra mức tăng FPS từ riêng các lô đo này.

Các kiểm tra riêng bao gồm: nhiều tư thế liên tiếp không bị lượng tử hóa thành 8 khung; texture ảnh không tăng phiên bản khi khớp chuyển động; trọng số khớp hợp lệ; đối chiếu 4.000 điểm va chạm với cách cũ; đối chiếu điểm chọn với raycast tam giác (sai lệch tối đa khoảng 0,000008 đơn vị trong 30 mẫu); đổi màu, giải phóng GPU, dụng cụ tưới, cánh bay, nhảy, bóng và câu cá.

- `tools/verify-smooth-motion.mjs`: kiểm tra chuyển động và GPU.
- `tools/benchmark-motion.mjs after`: đo lại hiệu năng; dữ liệu nằm trong `docs/verification/smooth-after.json`.
- Kiểm tra hồi quy bố cục, tùy chỉnh nhân vật, câu cá, logic trồng trọt và đường đi.
- Ảnh mẫu: `docs/verification/smooth-farm-watering.png`, `smooth-farm-hoeing.png`, `smooth-fishing.png`.

Nhấn **Ctrl + F5** để tải mã mới. Muốn xem đầy đủ chuyển động, tắt **Chuyển động nhẹ** trong Cài đặt → Hiệu ứng.
