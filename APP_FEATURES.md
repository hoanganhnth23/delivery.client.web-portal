# Tài liệu Tính năng và Màn hình (App Features & Screens)

Tài liệu này liệt kê các phân hệ (modules), màn hình (screens) và các chức năng (functions) tương ứng của ứng dụng.

---

## 1. Phân hệ Khách hàng (Customer / Home Module)
Phân hệ dành cho người dùng cuối (End-users) để tìm kiếm và đặt món.

| Màn hình | Chức năng chính |
| :--- | :--- |
| **Trang chủ (HomePage)** | - Chọn vị trí giao hàng.<br>- Tìm kiếm nhà hàng và món ăn.<br>- Duyệt món theo danh mục (Burger, Pizza, Coffee, Healthy...).<br>- Theo dõi Flash Sale (giảm giá giờ vàng) với đồng hồ đếm ngược.<br>- Xem danh sách nhà hàng phổ biến gần đây. |
| **Giỏ hàng (Cart)** | - Quản lý danh sách món ăn đã chọn.<br>- Cập nhật số lượng, xóa món.<br>- Tính toán tổng tiền, phí giao hàng và giảm giá. |
| **Tìm kiếm (Search)** | - Tìm kiếm nâng cao với bộ lọc theo đánh giá, khoảng cách và giá. |

---

## 2. Phân hệ Nhà hàng (Restaurant / Merchant Module)
Phân hệ dành cho chủ cửa hàng quản lý hoạt động kinh doanh.

| Màn hình | Chức năng chính |
| :--- | :--- |
| **Bảng điều khiển (Dashboard)** | - Xem thống kê nhanh: Đơn hàng chờ, Doanh thu trong ngày, Tổng đơn.<br>- Quản lý trạng thái đóng/mở cửa của nhà hàng.<br>- Theo dõi nhanh các đơn hàng mới nhất. |
| **Quản lý Đơn hàng (Orders)** | - Tiếp nhận và xử lý đơn hàng theo quy trình: Chờ xác nhận -> Đang chuẩn bị -> Sẵn sàng -> Đang giao -> Đã giao.<br>- Xem chi tiết đơn hàng (Món ăn, thông tin khách hàng, ghi chú, địa chỉ).<br>- Hủy đơn hàng kèm lý do. |
| **Quản lý Thực đơn (Menu)** | - Thêm món ăn mới (Tên, mô tả, giá, hình ảnh).<br>- Chỉnh sửa hoặc xóa món ăn.<br>- Cập nhật trạng thái món ăn (Còn hàng / Hết hàng).<br>- Phân loại món ăn theo danh mục. |
| **Hồ sơ Nhà hàng (Profile)** | - Cập nhật thông tin cơ bản: Tên, số điện thoại, mô tả.<br>- Quản lý địa chỉ và vị trí trên bản đồ.<br>- Thiết lập giờ mở cửa/đóng cửa chi tiết cho từng ngày trong tuần. |

---

## 3. Phân hệ Livestream (Livestream Module)
Tính năng hỗ trợ bán hàng trực tiếp (Social Commerce).

| Màn hình | Chức năng chính |
| :--- | :--- |
| **Phát Livestream (Host Page)** | - Tạo phòng livestream với tiêu đề và mô tả.<br>- Xem trước camera và kiểm tra âm thanh.<br>- Bắt đầu và kết thúc phát sóng (Sử dụng Agora RTC). |
| **Quản lý Livestream** | - Danh sách tất cả các phiên live (Đã tạo, Đang phát, Đã kết thúc).<br>- Xem thống kê thời lượng và thời gian phát sóng.<br>- Truy cập nhanh vào các phòng đang hoạt động. |
| **Xem Livestream (Viewer)** | - Xem video livestream của nhà hàng theo thời gian thực.<br>- Xem số lượng người đang xem trực tuyến.<br>- Tương tác (Join/Leave) phiên livestream. hêm và ghim sản phẩm: Host có thể chọn món ăn từ thực đơn để hiển thị cho người xem.
Chat thời gian thực: Tích hợp khung chat real-time trong phòng live.
Tương tác: Thêm nút thả tim và các hiệu ứng tương tác cho người xem. |
 
---

## 4. Phân hệ Quản trị (Admin Module)
Dành cho người quản lý hệ thống (Super Admin).

| Màn hình | Chức năng chính |
| :--- | :--- |
| **Tổng quan Admin (Dashboard)** | - Thống kê toàn hệ thống: Tổng số nhà hàng, Người dùng, Doanh thu tổng.<br>- Theo dõi trạng thái hoạt động của các dịch vụ hệ thống. |
| **Phê duyệt Nhà hàng** | - Xem danh sách nhà hàng mới đăng ký.<br>- Duyệt hoặc từ chối yêu cầu tham gia hệ thống. |
| **Quản lý Danh mục (Categories)** | - Quản lý danh mục món ăn dùng chung cho toàn hệ thống. |
| **Hỗ trợ & Chat (Support)** | - Tiếp nhận và phản hồi các yêu cầu hỗ trợ từ người dùng và nhà hàng. |

---

## 5. Phân hệ Xác thực & Chat (Auth & Chat)

| Màn hình / Thành phần | Chức năng chính |
| :--- | :--- |
| **Đăng nhập / Đăng ký** | - Đăng nhập dành cho người dùng và chủ cửa hàng.<br>- Đăng ký tài khoản mới.<br>- Đăng nhập nhanh qua Google / Facebook. |
| **Đăng nhập Admin** | - Cổng đăng nhập riêng biệt đảm bảo bảo mật cho quản trị viên. |
| **Widget Chat** | - Nút chat trôi nổi hỗ trợ khách hàng nhanh trên mọi trang.<br>- Nhắn tin trực tiếp giữa khách hàng và nhà hàng/hỗ trợ. |
