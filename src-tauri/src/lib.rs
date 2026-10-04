use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
enum Entry {
    File { name: String, path: String },
    Folder { name: String, path: String, children: Vec<Entry> },
}

fn is_markdown(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|e| e.to_str()).map(|e| e.to_ascii_lowercase()).as_deref(),
        Some("md" | "markdown")
    )
}

/// Folders first, then files; limits count entries before filtering.
fn read_tree(dir: &Path) -> std::io::Result<Vec<Entry>> {
    read_tree_bounded(dir, 64, 50_000)
}

fn read_tree_bounded(dir: &Path, max_depth: usize, mut remaining: usize) -> std::io::Result<Vec<Entry>> {
    fn walk(
        dir: &Path,
        depth: usize,
        max_depth: usize,
        remaining: &mut usize,
        ancestors: &mut std::collections::HashSet<PathBuf>,
    ) -> std::io::Result<Vec<Entry>> {
        if depth > max_depth {
            return Err(std::io::Error::other("Workspace directory depth limit exceeded"));
        }
        let canonical = fs::canonicalize(dir)?;
        if !ancestors.insert(canonical.clone()) {
            return Err(std::io::Error::other("Workspace contains a directory symlink cycle"));
        }
        let result = (|| {
            let children = match fs::read_dir(dir) {
                Ok(children) => children,
                Err(e) if depth > 0 && e.kind() == std::io::ErrorKind::PermissionDenied => return Ok(Vec::new()),
                Err(e) => return Err(e),
            };
            let mut entries = Vec::new();
            for child in children {
                *remaining = remaining.checked_sub(1).ok_or_else(|| {
                    std::io::Error::other("Workspace entry limit exceeded")
                })?;
                let child = child?;
                let name = child.file_name().to_string_lossy().into_owned();
                let path = child.path();
                let is_dir = path.is_dir();
                if name.starts_with('.') || name == "node_modules" || (!is_dir && !is_markdown(&path)) {
                    continue;
                }
                entries.push((is_dir, name, path));
            }
            entries.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.to_lowercase().cmp(&b.1.to_lowercase())));
            entries.into_iter().map(|(is_dir, name, path)| {
                let path_str = path.to_string_lossy().into_owned();
                Ok(if is_dir {
                    Entry::Folder { name, children: walk(&path, depth + 1, max_depth, remaining, ancestors)?, path: path_str }
                } else {
                    Entry::File { name, path: path_str }
                })
            }).collect()
        })();
        ancestors.remove(&canonical);
        result
    }
    walk(dir, 0, max_depth, &mut remaining, &mut std::collections::HashSet::new())
}

#[tauri::command]
fn read_workspace(root: String) -> Result<Vec<Entry>, String> {
    read_tree(Path::new(&root)).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_text(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_text(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

/// Creates `Untitled.md` (or `Untitled N.md` if taken) in `dir` and returns its path.
#[tauri::command]
fn create_note(dir: String, content: String) -> Result<String, String> {
    let dir = Path::new(&dir);
    for n in 1..1000 {
        let name = if n == 1 { "Untitled.md".to_string() } else { format!("Untitled {n}.md") };
        let path = dir.join(name);
        match fs::OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(_) => {
                fs::write(&path, &content).map_err(|e| e.to_string())?;
                return Ok(path.to_string_lossy().into_owned());
            }
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e.to_string()),
        }
    }
    Err("Too many untitled notes in this folder".into())
}

/// Creates `Untitled folder` (or `Untitled folder N` if taken) in `dir` and returns its path.
#[tauri::command]
fn create_folder(dir: String) -> Result<String, String> {
    let dir = Path::new(&dir);
    for n in 1..1000 {
        let name = if n == 1 { "Untitled folder".to_string() } else { format!("Untitled folder {n}") };
        let path = dir.join(name);
        match fs::create_dir(&path) {
            Ok(()) => return Ok(path.to_string_lossy().into_owned()),
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e.to_string()),
        }
    }
    Err("Too many untitled folders in this folder".into())
}

/// Moves a file or folder to the system trash so it can be restored.
#[tauri::command]
fn trash_path(path: String) -> Result<(), String> {
    trash::delete(&path).map_err(|e| e.to_string())
}

/// Renames `path` to `new_name` within the same folder and returns the new path.
#[tauri::command]
fn rename_path(path: String, new_name: String) -> Result<String, String> {
    let name = new_name.trim();
    if name.is_empty() || name == "." || name == ".." || name.contains(['/', '\\']) {
        return Err(format!("\"{name}\" is not a valid file name"));
    }
    let from = Path::new(&path);
    let to = from.with_file_name(name);
    if to == from {
        return Ok(path);
    }
    // Allow case-only renames, which on case-insensitive file systems see the target as existing.
    let case_only = from.file_name().map(|n| n.to_string_lossy().to_lowercase()) == Some(name.to_lowercase());
    if to.exists() && !case_only {
        return Err(format!("\"{name}\" already exists"));
    }
    fs::rename(from, &to).map_err(|e| e.to_string())?;
    Ok(to.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![read_workspace, read_text, write_text, create_note, create_folder, rename_path, trash_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod traversal_tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    static NEXT: AtomicUsize = AtomicUsize::new(0);
    struct Temp(PathBuf);
    impl Temp {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!("kamipanda-tree-{}-{}", std::process::id(), NEXT.fetch_add(1, Ordering::Relaxed)));
            fs::create_dir(&path).unwrap();
            Self(path)
        }
    }
    impl Drop for Temp { fn drop(&mut self) { let _ = fs::remove_dir_all(&self.0); } }
    fn error(dir: &Path, depth: usize, entries: usize) -> String {
        read_tree_bounded(dir, depth, entries).err().expect("must reject").to_string()
    }
    #[test]
    fn ordinary_tree_preserves_sorting_and_filtering() {
        let t = Temp::new();
        for name in ["z.md", "A.MARKDOWN", "ignore.txt", ".hidden.md"] { fs::write(t.0.join(name), "").unwrap(); }
        fs::create_dir(t.0.join("folder")).unwrap();
        let tree = read_tree(&t.0).unwrap();
        assert_eq!(tree.len(), 3);
        assert!(matches!(&tree[0], Entry::Folder { name, .. } if name == "folder"));
        assert!(matches!(&tree[1], Entry::File { name, .. } if name == "A.MARKDOWN"));
    }
    #[test]
    fn budgets_include_ignored_entries_and_all_siblings() {
        let t = Temp::new();
        fs::write(t.0.join(".ignored"), "").unwrap();
        fs::write(t.0.join("ignored.txt"), "").unwrap();
        assert!(error(&t.0, 8, 1).contains("entry limit"));
        for name in ["a", "b"] {
            fs::create_dir(t.0.join(name)).unwrap();
            fs::write(t.0.join(name).join("note.md"), "").unwrap();
        }
        assert!(error(&t.0, 8, 5).contains("entry limit"));
        assert!(read_tree_bounded(&t.0, 8, 6).is_ok());
        assert!(error(&t.0, 0, 100).contains("depth limit"));
    }
    #[cfg(unix)]
    #[test]
    fn rejects_self_and_parent_cycles_but_preserves_aliases() {
        use std::os::unix::fs::symlink;
        let t = Temp::new();
        symlink(&t.0, t.0.join("self")).unwrap();
        assert!(error(&t.0, 64, 100).contains("symlink cycle"));
        fs::remove_file(t.0.join("self")).unwrap();
        fs::create_dir(t.0.join("child")).unwrap();
        symlink(&t.0, t.0.join("child/parent")).unwrap();
        assert!(error(&t.0, 64, 100).contains("symlink cycle"));
        fs::remove_file(t.0.join("child/parent")).unwrap();
        fs::write(t.0.join("child/note.md"), "ok").unwrap();
        symlink(t.0.join("child"), t.0.join("alias")).unwrap();
        let entries = read_tree(&t.0).unwrap();
        assert_eq!(entries.len(), 2);
        for entry in entries { assert!(matches!(entry, Entry::Folder { children, .. } if children.len() == 1)); }
    }
}
