use tauri::{AppHandle, Manager};
use std::fs;
use std::path::PathBuf;
use winreg::enums::*;
use winreg::RegKey;
use fs_extra::dir::{copy, CopyOptions};

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
    // 1. Registro
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let reg_path = "Software\\Blackmagic Design\\DaVinci Resolve\\Preferences";
    let (key, _) = hkcu.create_subkey(reg_path).map_err(|e| e.to_string())?;
    key.set_value("EnableWorkflowIntegration", &1u32).map_err(|e| e.to_string())?;

    // 2. Caminho ProgramData (Base)
    let programdata = std::env::var("ProgramData").map_err(|_| "Erro ProgramData")?;
    let davinci_base = PathBuf::from(&programdata).join("Blackmagic Design").join("DaVinci Resolve");

    // --- INSTALAÇÃO DO PLUGIN ---
    let mut dest_plugin = davinci_base.clone();
    dest_plugin.push("Support");
    dest_plugin.push("Workflow Integration Plugins");
    dest_plugin.push("com.editormaster.premium.v1");

    let src_davinci = get_resource_path(&app, "Davinci")?;
    
    if dest_plugin.exists() { fs::remove_dir_all(&dest_plugin).ok(); }
    fs::create_dir_all(&dest_plugin).map_err(|e| e.to_string())?;
    
    let mut options = CopyOptions::new();
    options.content_only = true;
    options.overwrite = true;
    copy(&src_davinci, &dest_plugin, &options).map_err(|e| e.to_string())?;

    // --- INSTALAÇÃO DAS LEGENDAS (Presets de Fusion) ---
    let appdata = std::env::var("AppData").map_err(|_| "Erro AppData")?;
    let davinci_appdata_base = PathBuf::from(&appdata).join("Blackmagic Design").join("DaVinci Resolve");

    let preset_paths = vec![
        davinci_base.join("Support").join("Fusion").join("Templates").join("Edit").join("Titles").join("EditLab Pro"),
        davinci_appdata_base.join("Support").join("Fusion").join("Templates").join("Edit").join("Titles").join("EditLab Pro")
    ];

    let src_legendas = src_davinci.join("Legendas").join("CaptionsVirais");
    
    if src_legendas.exists() {
        for preset_dest in preset_paths {
            if !preset_dest.exists() {
                fs::create_dir_all(&preset_dest).map_err(|e| e.to_string())?;
            }

            let entries = fs::read_dir(&src_legendas).map_err(|e| e.to_string())?;
            for entry in entries {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("setting") {
                    let file_name = path.file_name().ok_or("Erro nome arquivo")?;
                    let dest_file = preset_dest.join(file_name);
                    fs::copy(&path, &dest_file).map_err(|e| e.to_string())?;
                }
            }
        }
    }

    Ok("EditLab Pro instalado".into())
}

#[tauri::command]
fn activate_premiere(app: AppHandle) -> Result<String, String> {
    // 1. Registro
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    for v in 7..14 {
        let path = format!("Software\\Adobe\\CSXS.{}", v);
        if let Ok((key, _)) = hkcu.create_subkey(&path) {
            let _ = key.set_value("PlayerDebugMode", &"1".to_string());
        }
    }

    // 2. Destino AppData
    let appdata = std::env::var("AppData").map_err(|_| "Erro AppData")?;
    let mut dest_plugin = PathBuf::from(appdata);
    dest_plugin.push("Adobe");
    dest_plugin.push("CEP");
    dest_plugin.push("extensions");
    dest_plugin.push("com.editormaster.premium.v1");

    // 3. Recursos
    let src_root = get_resource_path(&app, "Premiere")?;
    let src = src_root.join("com.editormaster.premium.v1");

    if !src.exists() {
        return Err(format!("Extensão Premiere não achada em: {:?}", src));
    }
    
    if dest_plugin.exists() { fs::remove_dir_all(&dest_plugin).ok(); }
    fs::create_dir_all(&dest_plugin).map_err(|e| e.to_string())?;
    
    let mut options = CopyOptions::new();
    options.content_only = true;
    options.overwrite = true;
    copy(&src, &dest_plugin, &options).map_err(|e| e.to_string())?;
    
    Ok("Adobe Premiere Pro instalado".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![activate_davinci, activate_premiere])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
