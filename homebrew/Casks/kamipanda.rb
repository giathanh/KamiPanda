cask "kamipanda" do
  version "1.5.0"
  sha256 "1bc1af61f559cba6f410635be9e1e2dd75c18fc138718a34a5c92179f021f6a6"

  url "https://github.com/giathanh/KamiPanda/releases/download/v#{version}/KamiPanda_#{version}_universal.dmg"
  name "KamiPanda"
  desc "Lightweight Markdown editor with live preview"
  homepage "https://github.com/giathanh/KamiPanda"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on :macos

  app "KamiPanda.app"

  # The app is ad-hoc signed, not notarized: drop the quarantine flag so
  # Gatekeeper does not ask for "Open Anyway" on first launch.
  postflight_steps do
    run "/usr/bin/xattr",
        args: ["-dr", "com.apple.quarantine", "{{appdir}}/KamiPanda.app"]
  end

  zap trash: [
    "~/Library/Application Support/com.giathanh.kamipanda",
    "~/Library/Caches/com.giathanh.kamipanda",
    "~/Library/Preferences/com.giathanh.kamipanda.plist",
    "~/Library/Saved Application State/com.giathanh.kamipanda.savedState",
    "~/Library/WebKit/com.giathanh.kamipanda",
  ]
end
