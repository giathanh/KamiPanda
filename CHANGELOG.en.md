# Changelog

KamiPanda release history (English). The Vietnamese [CHANGELOG.md](CHANGELOG.md) is the source; each version here must match it.

## [1.6.0] - 2026-10-04

### Added
- Install on macOS with Homebrew: `brew install --cask giathanh/tap/kamipanda`. The app opens right away, without going to System Settings → Privacy & Security → Open Anyway.

## [1.5.0] - 2026-10-04

### Fixed
- Security: HTML in Markdown notes is now sanitized before it is shown in the preview and in tables, blocking scripts and malicious code embedded in files. `style` and `id` attributes and form elements are no longer rendered.
- Opening a folder that contains circular symbolic links (symlinks), or one that is too large or too deep, no longer freezes the app; it shows an error instead of scanning endlessly.

## [1.4.0] - 2026-10-03

### Added
- Multiple languages: the interface is available in English, Vietnamese, Simplified Chinese and Japanese. Choose one in Settings → Appearance → Language (follows the system language by default). Release notes in the update dialog also appear in the chosen language.
- Zoom: zoom the editor and preview in or out (50% – 200%) with the buttons in the status bar or the ⌘+ / ⌘− / ⌘0 shortcuts.
- Editor options in Settings → Editor: font size, font (serif / sans / mono), line spacing and content width, with a sample paragraph to preview and a button to restore the defaults.

### Fixed
- Permission error when opening the app on macOS.

## [1.3.0] - 2026-10-01

### Added
- Each item in the file tree's right-click menu has an icon (follows the system light / dark appearance).

### Fixed
- Commands in the right-click menu (Open, New note, Rename, Move to Trash…) did nothing when clicked.

## [1.2.0] - 2026-09-30

### Added
- Auto save: notes are saved shortly after you stop typing, when you switch notes, or when you leave the app. Toggle it in Settings → Editor (on by default).
- Right-click menu in the file tree:
  - On a note / folder: Open, New note, New folder, Rename, Reveal in Finder / File Explorer, Copy path, Move to Trash.
  - On empty space: New note, New folder, Reveal folder in Finder / File Explorer, Reload folder.

## [1.1.0] - 2026-09-30

### Added
- Automatic updates: the app checks for a new version on launch and can install it and restart right from the app.
- **Updates** section in Settings: see the current version and check for updates manually.

## [1.0.0] - 2026-09-26

### Added
- Tables (GFM) render as an editable grid in Live mode; every change is written back to the Markdown.

## [0.1.0] - 2026-09-26

First release.

### Added
- Markdown editing with three modes: Live, Source and Split.
- Folder-based workspace, file tree, creating and renaming notes.
- Settings: light / dark / system theme, accent color and per-color fine-tuning.
- App icon.
