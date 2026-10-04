# Changelog

Lịch sử các bản phát hành của KamiPanda. Nội dung của mỗi phiên bản được dùng làm release notes trên GitHub và hiển thị trong hộp thoại cập nhật của app.

Đây là bản gốc (tiếng Việt). Bản dịch: [English](CHANGELOG.en.md) · [简体中文](CHANGELOG.zh.md) · [日本語](CHANGELOG.ja.md). Mỗi phiên bản phải có mục tương ứng trong cả 4 file; app hiển thị release notes theo ngôn ngữ người dùng chọn.

## [1.6.0] - 2026-10-04

### Thêm mới
- Cài đặt trên macOS qua Homebrew: `brew install --cask giathanh/tap/kamipanda`. App mở được ngay, không cần vào System Settings → Privacy & Security → Open Anyway.

## [1.5.0] - 2026-10-04

### Sửa lỗi
- Bảo mật: HTML trong ghi chú Markdown được làm sạch trước khi hiển thị ở bản xem trước và trong bảng, chặn script và mã độc nhúng trong file. Thuộc tính `style`, `id` và các thẻ form không còn được hiển thị.
- Mở thư mục có liên kết tượng trưng (symlink) trỏ vòng hoặc quá lớn / quá sâu không còn làm treo app; app báo lỗi thay vì quét vô hạn.

## [1.4.0] - 2026-10-03

### Thêm mới
- Đa ngôn ngữ: giao diện có tiếng Anh, tiếng Việt, tiếng Trung giản thể và tiếng Nhật. Chọn trong Settings → Giao diện → Ngôn ngữ (mặc định theo ngôn ngữ hệ thống). Release notes trong hộp thoại cập nhật cũng hiển thị theo ngôn ngữ đã chọn.
- Thu phóng: phóng to / thu nhỏ trình soạn thảo và bản xem trước (50% – 200%) bằng nút trên thanh trạng thái hoặc phím tắt ⌘+ / ⌘− / ⌘0.
- Tuỳ chỉnh trình soạn thảo trong Settings → Trình soạn thảo: cỡ chữ, phông chữ (có chân / không chân / đơn cách), giãn dòng và độ rộng nội dung, kèm đoạn văn mẫu để xem trước và nút đặt lại mặc định.

### Sửa lỗi
- Lỗi quyền truy cập khi mở app trên macOS.

## [1.3.0] - 2026-10-01

### Thêm mới
- Menu chuột phải trong cây file có icon cho từng mục (tự đổi màu theo giao diện sáng / tối của hệ thống).

### Sửa lỗi
- Các lệnh trong menu chuột phải (Mở, Tạo ghi chú, Đổi tên, Chuyển vào Thùng rác…) không thực hiện gì khi bấm.

## [1.2.0] - 2026-09-30

### Thêm mới
- Tự động lưu: ghi chú được lưu ngay sau khi bạn ngừng gõ, khi chuyển ghi chú hoặc rời khỏi app. Bật/tắt trong Settings → Editor (mặc định bật).
- Menu chuột phải trong cây file:
  - Trên ghi chú / thư mục: Mở, Tạo ghi chú mới, Tạo thư mục mới, Đổi tên, Hiện trong Finder / File Explorer, Sao chép đường dẫn, Chuyển vào Thùng rác.
  - Trên vùng trống: Tạo ghi chú mới, Tạo thư mục mới, Hiện thư mục trong Finder / File Explorer, Tải lại thư mục.

## [1.1.0] - 2026-09-30

### Thêm mới
- Tự động cập nhật: app kiểm tra bản mới khi khởi động và cho phép cài đặt, khởi động lại ngay trong app.
- Mục **Updates** trong Settings: xem phiên bản hiện tại và kiểm tra cập nhật thủ công.

## [1.0.0] - 2026-09-26

### Thêm mới
- Bảng (GFM table) hiển thị thành lưới chỉnh sửa trực tiếp trong chế độ Live, mọi thay đổi được ghi ngược lại vào Markdown.

## [0.1.0] - 2026-09-26

Bản phát hành đầu tiên.

### Thêm mới
- Soạn thảo Markdown với 3 chế độ Live, Source và Split.
- Workspace theo thư mục, cây file, tạo và đổi tên ghi chú.
- Settings: giao diện sáng / tối / theo hệ thống, màu nhấn và tinh chỉnh từng màu.
- Icon ứng dụng.
