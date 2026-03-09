use tauri::{AppHandle, Manager};
use std::fs;
use std::path::PathBuf;
use winreg::enums::*;
use winreg::RegKey;
use fs_extra::dir::{copy, CopyOptions};
use std::os::windows::process::CommandExt;

fn get_resource_path(app: &AppHandle, folder: &str) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    
    // Tentativa 1: Caminho com _up_/_up_ (Tauri 2 para recursos externos)
    let p1 = resource_dir.join("_up_").join("_up_").join(folder);
    if p1.exists() { return Ok(p1); }
    
    // Tentativa 2: Caminho direto
    let p2 = resource_dir.join(folder);
    if p2.exists() { return Ok(p2); }
    
    Err(format!("Recurso '{}' não achado. Verifique o bundle.", folder))
}

#[tauri::command]
fn activate_davinci(app: AppHandle) -> Result<String, String> {
    // 1. Registro (Apenas Windows)
    #[cfg(target_os = "windows")]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let reg_path = "Software\\Blackmagic Design\\DaVinci Resolve\\Preferences";
        let (key, _) = hkcu.create_subkey(reg_path).map_err(|e| e.to_string())?;
        key.set_value("EnableWorkflowIntegration", &1u32).map_err(|e| e.to_string())?;
    }

    // 2. Caminhos Base
    let davinci_base = if cfg!(target_os = "windows") {
        let programdata = std::env::var("ProgramData").map_err(|_| "Erro ProgramData")?;
        PathBuf::from(&programdata).join("Blackmagic Design").join("DaVinci Resolve")
    } else {
        let home = std::env::var("HOME").map_err(|_| "Erro HOME")?;
        PathBuf::from(&home).join("Library").join("Application Support").join("Blackmagic Design").join("DaVinci Resolve")
    };

    // --- INSTALAÇÃO DO PLUGIN ---
    let mut dest_plugin = davinci_base.clone();
    if cfg!(target_os = "windows") {
        dest_plugin.push("Support");
    }
    dest_plugin.push("Workflow Integration Plugins");
    dest_plugin.push("com.editormaster.premium.v1");

    let src_davinci = get_resource_path(&app, "Davinci")?;
    
    if dest_plugin.exists() { fs::remove_dir_all(&dest_plugin).ok(); }
    fs::create_dir_all(&dest_plugin).map_err(|e| e.to_string())?;
    
    let mut options = CopyOptions::new();
    options.content_only = true;
    options.overwrite = true;
    copy(&src_davinci, &dest_plugin, &options).map_err(|e| e.to_string())?;

    // --- NPM INSTALL ---
    let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let arg = if cfg!(target_os = "windows") { "/C" } else { "-c" };
    
    std::process::Command::new(shell)
        .args(&[arg, "npm install --production --silent"])
        .current_dir(&dest_plugin)
        .status()
        .ok();

    // --- INSTALAÇÃO DAS LEGENDAS ---
    let mut preset_paths = vec![
        davinci_base.join("Support").join("Fusion").join("Templates").join("Edit").join("Titles").join("EditLab Pro"),
        davinci_base.join("Fusion").join("Templates").join("Edit").join("Titles").join("EditLab Pro")
    ];

    #[cfg(target_os = "windows")]
    if let Ok(appdata) = std::env::var("AppData") {
        preset_paths.push(PathBuf::from(&appdata).join("Blackmagic Design").join("DaVinci Resolve").join("Support").join("Fusion").join("Templates").join("Edit").join("Titles").join("EditLab Pro"));
    }

    let src_legendas = src_davinci.join("Legendas").join("CaptionsVirais");
    if src_legendas.exists() {
        for preset_dest in preset_paths {
            if !preset_dest.exists() { fs::create_dir_all(&preset_dest).ok(); }
            if let Ok(entries) = fs::read_dir(&src_legendas) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("setting") {
                        if let Some(name) = path.file_name() {
                            fs::copy(&path, preset_dest.join(name)).ok();
                        }
                    }
                }
            }
        }
    }

    Ok("EditLab Pro instalado".into())
}

#[tauri::command]
fn activate_premiere(app: AppHandle) -> Result<String, String> {
    // 1. Registro (Windows)
    #[cfg(target_os = "windows")]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        for v in 7..14 {
            let path = format!("Software\\Adobe\\CSXS.{}", v);
            if let Ok((key, _)) = hkcu.create_subkey(&path) {
                let _ = key.set_value("PlayerDebugMode", &"1".to_string());
            }
        }
    }

    // 2. Destino
    let dest_plugin = if cfg!(target_os = "windows") {
        let appdata = std::env::var("AppData").map_err(|_| "Erro AppData")?;
        PathBuf::from(appdata).join("Adobe").join("CEP").join("extensions").join("com.editormaster.premium.v1")
    } else {
        let home = std::env::var("HOME").map_err(|_| "Erro HOME")?;
        PathBuf::from(&home).join("Library").join("Application Support").join("Adobe").join("CEP").join("extensions").join("com.editormaster.premium.v1")
    };

    let src_root = get_resource_path(&app, "Premiere")?;
    let src = src_root.join("com.editormaster.premium.v1");

    if dest_plugin.exists() { fs::remove_dir_all(&dest_plugin).ok(); }
    fs::create_dir_all(&dest_plugin).map_err(|e| e.to_string())?;
    
    let mut options = CopyOptions::new();
    options.content_only = true;
    options.overwrite = true;
    copy(&src, &dest_plugin, &options).map_err(|e| e.to_string())?;

    // --- NPM INSTALL ---
    let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let arg = if cfg!(target_os = "windows") { "/C" } else { "-c" };
    
    std::process::Command::new(shell)
        .args(&[arg, "npm install --production --silent"])
        .current_dir(&dest_plugin)
        .status()
        .ok();

    Ok("Adobe Premiere Pro instalado".into())
}

#[tauri::command]
fn deactivate_davinci() -> Result<String, String> {
    let programdata = std::env::var("ProgramData").map_err(|_| "Erro ProgramData")?;
    let davinci_base = PathBuf::from(&programdata).join("Blackmagic Design").join("DaVinci Resolve");
    
    // Remover Plugin
    let plugin_path = davinci_base.join("Support").join("Workflow Integration Plugins").join("com.editormaster.premium.v1");
    if plugin_path.exists() {
        fs::remove_dir_all(&plugin_path).map_err(|e| e.to_string())?;
    }

    // Remover Presets de Legenda
    let preset_path = davinci_base.join("Support").join("Fusion").join("Templates").join("Edit").join("Titles").join("EditLab Pro");
    if preset_path.exists() {
        fs::remove_dir_all(&preset_path).ok(); // ok() pois se falhar não é crítico
    }

    // Remover do AppData também
    if let Ok(appdata) = std::env::var("AppData") {
        let preset_appdata = PathBuf::from(&appdata).join("Blackmagic Design").join("DaVinci Resolve")
            .join("Support").join("Fusion").join("Templates").join("Edit").join("Titles").join("EditLab Pro");
        if preset_appdata.exists() {
            fs::remove_dir_all(&preset_appdata).ok();
        }
    }

    Ok("Integração DaVinci removida".into())
}

#[tauri::command]
fn deactivate_premiere() -> Result<String, String> {
    let appdata = std::env::var("AppData").map_err(|_| "Erro AppData")?;
    let dest_plugin = PathBuf::from(appdata).join("Adobe").join("CEP").join("extensions").join("com.editormaster.premium.v1");
    
    if dest_plugin.exists() {
        fs::remove_dir_all(&dest_plugin).map_err(|e| e.to_string())?;
    }

    Ok("Integração Premiere removida".into())
}

#[tauri::command]
fn check_status() -> Result<(bool, bool), String> {
    let mut davinci = false;
    let mut premiere = false;

    // Check DaVinci
    if let Ok(programdata) = std::env::var("ProgramData") {
        let p = PathBuf::from(programdata).join("Blackmagic Design").join("DaVinci Resolve").join("Support").join("Workflow Integration Plugins").join("com.editormaster.premium.v1");
        davinci = p.exists();
    }

    // Check Premiere
    if let Ok(appdata) = std::env::var("AppData") {
        let p = PathBuf::from(appdata).join("Adobe").join("CEP").join("extensions").join("com.editormaster.premium.v1");
        premiere = p.exists();
    }

    Ok((davinci, premiere))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            activate_davinci, 
            activate_premiere,
            deactivate_davinci,
            deactivate_premiere,
            check_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
