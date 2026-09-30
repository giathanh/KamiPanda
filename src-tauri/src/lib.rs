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

/// Folders first, then files, each sorted case-insensitively. Hidden entries and
/// `node_modules` are skipped; only Markdown files are listed.
fn read_tree(dir: &Path) -> std::io::Result<Vec<Entry>> {
    let mut entries: Vec<(bool, String, PathBuf)> = fs::read_dir(dir)?
        .filter_map(Result::ok)
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().into_owned();
            let path = e.path();
            let is_dir = path.is_dir();
            if name.starts_with('.') || name == "node_modules" || (!is_dir && !is_markdown(&path)) {
                return None;
            }
            Some((is_dir, name, path))
        })
        .collect();
    entries.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.to_lowercase().cmp(&b.1.to_lowercase())));

    entries
        .into_iter()
        .map(|(is_dir, name, path)| {
            let path_str = path.to_string_lossy().into_owned();
            Ok(if is_dir {
                Entry::Folder { name, children: read_tree(&path).unwrap_or_default(), path: path_str }
            } else {
                Entry::File { name, path: path_str }
            })
        })
        .collect()
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
        .invoke_handler(tauri::generate_handler![read_workspace, read_text, write_text, create_note, rename_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
