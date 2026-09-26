<p align="center">
  <img src="docs/icon/kamipanda-icon-1024.png" alt="KamiPanda" width="128" />
</p>

<h1 align="center">KamiPanda</h1>

<p align="center">
  Trình soạn thảo Markdown desktop gọn nhẹ, chỉnh sửa trực tiếp (live preview) trên các file trong máy bạn.
</p>

---

## Tính năng

- **Workspace theo thư mục** – mở một thư mục bất kỳ, duyệt cây file Markdown (`.md`, `.markdown`); file ẩn và `node_modules` được bỏ qua.
- **3 chế độ soạn thảo** – *Live* (xem trước ngay trong editor), *Source* (Markdown thuần) và *Split* (editor + bản xem trước HTML song song).
- **Thanh định dạng** – in đậm, in nghiêng, gạch ngang, code, liên kết, tiêu đề và chèn nhanh các khối nội dung.
- **Outline** – danh sách tiêu đề của tài liệu, bấm để nhảy tới dòng tương ứng.
- **Quản lý ghi chú** – tạo ghi chú mới (`Untitled.md`), đổi tên trực tiếp trên cây file (F2 hoặc double-click vào tên file).
- **Focus mode** – ẩn toàn bộ giao diện phụ để tập trung viết.
- **Xuất HTML** – xuất tài liệu hiện tại thành file `.html`.
- **Tuỳ biến giao diện** – chế độ sáng / tối / theo hệ thống, chọn màu nhấn và tinh chỉnh từng màu trong Settings.
- Đếm số từ và thời gian đọc ước tính.

## Phím tắt

| Phím tắt | Chức năng |
| --- | --- |
| `⌘/Ctrl + O` | Mở thư mục |
| `⌘/Ctrl + S` | Lưu file |
| `⌘/Ctrl + B` | In đậm |
| `⌘/Ctrl + I` | In nghiêng |
| `⌘/Ctrl + E` | Inline code |
| `⌘/Ctrl + Shift + X` | Gạch ngang |
| `⌘/Ctrl + K` | Chèn liên kết |
| `⌘/Ctrl + Shift + F` | Bật/tắt Focus mode |
| `⌘/Ctrl + ,` | Mở Settings |
| `Esc` | Đóng Settings / thoát Focus mode |

## Cài đặt

Tải bản cài đặt cho macOS (Universal) hoặc Windows tại trang [Releases](https://github.com/giathanh/KamiPanda/releases).

## Phát triển

### Yêu cầu

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Các [yêu cầu hệ thống của Tauri](https://tauri.app/start/prerequisites/) cho hệ điều hành của bạn

### Chạy ở chế độ dev

```bash
npm install
npm run tauri dev
```

### Build bản cài đặt

```bash
npm run tauri build
```

File cài đặt sẽ nằm trong `src-tauri/target/release/bundle/`.

### Phát hành

Push một tag dạng `v*` (ví dụ `v0.1.0`) để GitHub Actions build cho macOS và Windows và tạo một bản release nháp:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Công nghệ

- [Tauri 2](https://tauri.app/) (Rust) – ứng dụng desktop, đọc/ghi file
- [Vue 3](https://vuejs.org/) + TypeScript + [Vite](https://vite.dev/) – giao diện
- [CodeMirror 6](https://codemirror.net/) – editor Markdown
- [marked](https://marked.js.org/) – render Markdown sang HTML

## Cấu trúc thư mục

```
src/
  components/   Các component Vue (editor, cây file, toolbar, settings)
  data/         State của workspace và settings
  editor/       Extension CodeMirror (live preview, định dạng, theme)
  theme/        Sinh bảng màu từ màu nhấn
  styles/       CSS theme
src-tauri/      Backend Rust (các lệnh đọc/ghi/đổi tên file)
docs/           Bản thiết kế và icon
```

## Khuyến nghị IDE

[VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
