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
- **Menu chuột phải** – tạo ghi chú / thư mục, đổi tên, hiện trong Finder / File Explorer, sao chép đường dẫn, chuyển vào Thùng rác ngay trên cây file.
- **Tự động lưu** – lưu ngay sau khi ngừng gõ, khi chuyển ghi chú hoặc rời app; tắt được trong Settings → Editor.
- **Focus mode** – ẩn toàn bộ giao diện phụ để tập trung viết.
- **Xuất HTML** – xuất tài liệu hiện tại thành file `.html`.
- **Tuỳ biến giao diện** – chế độ sáng / tối / theo hệ thống, chọn màu nhấn và tinh chỉnh từng màu trong Settings.
- Đếm số từ và thời gian đọc ước tính.
- **Tự động cập nhật** – app kiểm tra bản mới trên GitHub Releases khi khởi động; kiểm tra thủ công trong Settings → Updates.

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

### macOS (khuyên dùng: Homebrew)

```bash
brew install --cask giathanh/tap/kamipanda
```

Cài qua Homebrew thì mở app được ngay, không cần vào *System Settings → Privacy & Security → Open Anyway*. Các bản mới được app tự cập nhật.

Nếu tải file `.dmg` từ trang [Releases](https://github.com/giathanh/KamiPanda/releases), sau khi kéo app vào Applications hãy chạy lệnh dưới đây (hoặc bấm *Open Anyway* trong System Settings), vì app chưa được Apple notarize:

```bash
xattr -cr /Applications/KamiPanda.app
```

### Windows

Tải bản cài đặt (`.exe` hoặc `.msi`) tại trang [Releases](https://github.com/giathanh/KamiPanda/releases).

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

1. Thêm mục cho phiên bản mới vào đầu [CHANGELOG.md](CHANGELOG.md), ví dụ `## [1.2.0] - 2026-10-15`, và mục đã dịch tương ứng vào [CHANGELOG.en.md](CHANGELOG.en.md), [CHANGELOG.zh.md](CHANGELOG.zh.md), [CHANGELOG.ja.md](CHANGELOG.ja.md). Cả 4 ngôn ngữ được gộp thành release notes trên GitHub; hộp thoại cập nhật của app chỉ hiện phần theo ngôn ngữ đang chọn (mặc định tiếng Anh nếu không có). Workflow báo lỗi nếu file nào thiếu mục này.
2. Tăng `version` trong `package.json`, `src-tauri/tauri.conf.json` và `src-tauri/Cargo.toml`.
3. Commit, rồi push tag `v<version>` để GitHub Actions build cho macOS và Windows và tạo bản release nháp:

   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

4. Kiểm tra bản nháp trên GitHub rồi bấm **Publish release**. Chỉ bản đã publish mới được app tự động cập nhật.

Bản build cần khóa ký update: đặt secret `TAURI_SIGNING_PRIVATE_KEY` và `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` trên GitHub (khi build ở máy local, đặt hai biến môi trường cùng tên).

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
