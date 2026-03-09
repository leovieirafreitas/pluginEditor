use tauri::{AppHandle, Manager};
use std::fs;
use std::path::PathBuf;
#[cfg(windows)]
use winreg::enums::*;
#[cfg(windows)]
use winreg::RegKey;
use fs_extra::dir::{copy, CopyOptions};
#[cfg(windows)]
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

    // 2. Coletar destinos (Mac/Win)
    let mut final_paths = Vec::new();
    
    if cfg!(target_os = "windows") {
        if let Ok(pd) = std::env::var("ProgramData") {
            final_paths.push(PathBuf::from(pd).join("Blackmagic Design").join("DaVinci Resolve").join("Support").join("Workflow Integration Plugins"));
        }
    } else {
        // macOS: Caminhos possíveis
        let home = std::env::var("HOME").unwrap_or_default();
        
        // Caminho do Sistema (Exige privilégios, mas tentamos)
        final_paths.push(PathBuf::from("/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
        
        // Caminho do Usuário (O que o usuário mostrou no print)
        final_paths.push(PathBuf::from(&home).join("Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
        
        // Caminho App Store (Sandbox)
        final_paths.push(PathBuf::from(&home).join("Library/Containers/com.blackmagic-design.DaVinciResolve/Data/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
    }

    let src_davinci = get_resource_path(&app, "Davinci")?;
    
    // --- LÓGICA ROBUSTA PARA MAC ---
    let mut mac_node_found = PathBuf::new();
    #[cfg(target_os = "macos")]
    {
        // 1. Tentar caminhos fixos conhecidos
        let potential_nodes = vec![
            "/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Libraries/Fusion/Modules/Lua/WorkflowIntegration/WorkflowIntegration.node",
            "/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Frameworks/WorkflowIntegration.node",
            "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Workflow Integrations/Examples/SamplePlugin/WorkflowIntegration.node"
        ];
        for p in potential_nodes {
            let path = PathBuf::from(p);
            if path.exists() { mac_node_found = path; break; }
        }
        
        // 2. Tentar busca via Spotlight (mdfind) se não achou nos fixos
        if mac_node_found.as_os_str().is_empty() {
             if let Ok(output) = std::process::Command::new("mdfind").args(&["-name", "WorkflowIntegration.node"]).output() {
                 let s = String::from_utf8_lossy(&output.stdout);
                 if let Some(first_path) = s.lines().next() {
                     mac_node_found = PathBuf::from(first_path);
                 }
             }
        }
        
        if mac_node_found.as_os_str().is_empty() {
             return Err("ERRO: O DaVinci Resolve STUDIO não foi detectado. Esta integração exige a versão paga do DaVinci.".into());
        }
    }

    let mut success_count = 0;

    for base_path in final_paths {
        let dest = base_path.join("com.editormaster.premium.v1");
        
        // Limpeza total antes de começar
        if dest.exists() { fs::remove_dir_all(&dest).ok(); }
        
        if fs::create_dir_all(&dest).is_ok() {
            let mut options = CopyOptions::new();
            options.content_only = true;
            options.overwrite = true;
            
            if copy(&src_davinci, &dest, &options).is_ok() {
                // NO MAC: Precisamos DELETAR o arquivo de Windows que veio no pacote e colocar o do Mac
                #[cfg(target_os = "macos")]
                {
                    let node_file = dest.join("WorkflowIntegration.node");
                    if node_file.exists() { fs::remove_file(&node_file).ok(); }
                    
                    if !mac_node_found.as_os_str().is_empty() {
                        if fs::copy(&mac_node_found, &node_file).is_err() {
                            return Err("Erro ao copiar arquivo de integração do sistema. Verifique as permissões do DaVinci.".into());
                        }
                    } else {
                        return Err("Arquivo de integração nativo não encontrado no seu Mac.".into());
                    }
                }

                success_count += 1;

                // NPM INSTALL
                let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
                let arg = if cfg!(target_os = "windows") { "/C" } else { "-c" };
                
                let mut cmd = std::process::Command::new(shell);
                cmd.args(&[arg, "npm install --production --silent"]).current_dir(&dest);
                
                #[cfg(windows)]
                cmd.creation_flags(0x08000000);
                
                cmd.status().ok();
            }
        }
    }

    // --- INSTALAÇÃO DAS LEGENDAS (PRESETS) ---
    // Repetimos uma lógica similar para as legendas, focando no User Library para garantir que apareça
    if cfg!(target_os = "macos") {
        let home = std::env::var("HOME").unwrap_or_default();
        let preset_dest = PathBuf::from(&home).join("Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Templates/Edit/Titles/EditLab Pro");
        let src_legendas = src_davinci.join("Legendas").join("CaptionsVirais");
        
        if src_legendas.exists() {
            fs::create_dir_all(&preset_dest).ok();
            if let Ok(entries) = fs::read_dir(&src_legendas) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("setting") {
                        if let Some(name) = path.file_name() { fs::copy(&path, preset_dest.join(name)).ok(); }
                    }
                }
            }
        }
    } else {
        // Windows legas presets logic
        let programdata = std::env::var("ProgramData").unwrap_or_default();
        let appdata = std::env::var("AppData").unwrap_or_default();
        let paths = vec![
            PathBuf::from(programdata).join("Blackmagic Design/DaVinci Resolve/Support/Fusion/Templates/Edit/Titles/EditLab Pro"),
            PathBuf::from(appdata).join("Blackmagic Design/DaVinci Resolve/Support/Fusion/Templates/Edit/Titles/EditLab Pro")
        ];
        let src_legendas = src_davinci.join("Legendas").join("CaptionsVirais");
        for p in paths {
            fs::create_dir_all(&p).ok();
            if let Ok(entries) = fs::read_dir(&src_legendas) {
                for entry in entries.flatten() {
                    if entry.path().extension().and_then(|s| s.to_str()) == Some("setting") {
                        fs::copy(entry.path(), p.join(entry.file_name())).ok();
                    }
                }
            }
        }
    }

    if success_count > 0 {
        Ok("EditLab Pro instalado com sucesso".into())
    } else {
        Err("Não foi possível criar as pastas de instalação. Verifique as permissões.".into())
    }
}

#[tauri::command]
fn activate_premiere(app: AppHandle) -> Result<String, String> {
    // 1. Registro (Windows)
    #[cfg(target_os = "windows")]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        for v in 7..14 {
            let path = format!("Software\\Adobe\\CSXS.{}", v);
            if let Ok((key, _)) = hkcu.create_subkey(&path) { let _ = key.set_value("PlayerDebugMode", &"1".to_string()); }
        }
    }

    // 1. Debug Mode (macOS)
    #[cfg(target_os = "macos")]
    {
        for v in 7..14 {
            let cmd = format!("defaults write com.adobe.CSXS.{} PlayerDebugMode 1", v);
            std::process::Command::new("sh").args(&["-c", &cmd]).status().ok();
        }
    }

    // 2. Destinos
    let mut final_paths = Vec::new();
    if cfg!(target_os = "windows") {
        if let Ok(appdata) = std::env::var("AppData") {
            final_paths.push(PathBuf::from(appdata).join("Adobe").join("CEP").join("extensions"));
        }
    } else {
        let home = std::env::var("HOME").unwrap_or_default();
        final_paths.push(PathBuf::from("/Library/Application Support/Adobe/CEP/extensions"));
        final_paths.push(PathBuf::from(&home).join("Library/Application Support/Adobe/CEP/extensions"));
    }

    let src_root = get_resource_path(&app, "Premiere")?;
    let src = src_root.join("com.editormaster.premium.v1");
    let mut success = false;

    for base in final_paths {
        let dest = base.join("com.editormaster.premium.v1");
        if dest.exists() { fs::remove_dir_all(&dest).ok(); }
        if fs::create_dir_all(&dest).is_ok() {
            let mut options = CopyOptions::new();
            options.content_only = true;
            options.overwrite = true;
            if copy(&src, &dest, &options).is_ok() {
                success = true;
                let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
                let arg = if cfg!(target_os = "windows") { "/C" } else { "-c" };
                
                let mut cmd = std::process::Command::new(shell);
                cmd.args(&[arg, "npm install --production --silent"]).current_dir(&dest);
                
                #[cfg(windows)]
                cmd.creation_flags(0x08000000);
                
                cmd.status().ok();
            }
        }
    }

    if success {
        Ok("Adobe Premiere Pro instalado".into())
    } else {
        Err("Erro ao criar pastas do Premiere. Verifique permissões.".into())
    }
}

#[tauri::command]
fn deactivate_davinci() -> Result<String, String> {
    let mut final_paths = Vec::new();
    if cfg!(target_os = "windows") {
        if let Ok(pd) = std::env::var("ProgramData") {
            final_paths.push(PathBuf::from(pd).join("Blackmagic Design/DaVinci Resolve/Support/Workflow Integration Plugins"));
        }
    } else {
        let home = std::env::var("HOME").unwrap_or_default();
        final_paths.push(PathBuf::from("/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
        final_paths.push(PathBuf::from(&home).join("Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
        final_paths.push(PathBuf::from(&home).join("Library/Containers/com.blackmagic-design.DaVinciResolve/Data/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
    }

    for base in final_paths {
        let p = base.join("com.editormaster.premium.v1");
        if p.exists() { fs::remove_dir_all(&p).ok(); }
    }

    // Remover Presets (Mac/Win)
    if cfg!(target_os = "macos") {
        let home = std::env::var("HOME").unwrap_or_default();
        let p = PathBuf::from(&home).join("Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Templates/Edit/Titles/EditLab Pro");
        if p.exists() { fs::remove_dir_all(&p).ok(); }
    } else {
        let pd = std::env::var("ProgramData").unwrap_or_default();
        let ad = std::env::var("AppData").unwrap_or_default();
        let _ = fs::remove_dir_all(PathBuf::from(pd).join("Blackmagic Design/DaVinci Resolve/Support/Fusion/Templates/Edit/Titles/EditLab Pro"));
        let _ = fs::remove_dir_all(PathBuf::from(ad).join("Blackmagic Design/DaVinci Resolve/Support/Fusion/Templates/Edit/Titles/EditLab Pro"));
    }

    Ok("Integração DaVinci removida".into())
}

#[tauri::command]
fn deactivate_premiere() -> Result<String, String> {
    let mut final_paths = Vec::new();
    if cfg!(target_os = "windows") {
        if let Ok(ad) = std::env::var("AppData") {
            final_paths.push(PathBuf::from(ad).join("Adobe/CEP/extensions"));
        }
    } else {
        let home = std::env::var("HOME").unwrap_or_default();
        final_paths.push(PathBuf::from("/Library/Application Support/Adobe/CEP/extensions"));
        final_paths.push(PathBuf::from(&home).join("Library/Application Support/Adobe/CEP/extensions"));
    }

    for base in final_paths {
        let p = base.join("com.editormaster.premium.v1");
        if p.exists() { fs::remove_dir_all(&p).ok(); }
    }

    Ok("Integração Premiere removida".into())
}

#[tauri::command]
fn check_status() -> Result<(bool, bool), String> {
    let mut davinci = false;
    let mut premiere = false;

    // DaVinci Status
    let mut dv_paths = Vec::new();
    if cfg!(target_os = "windows") {
        if let Ok(pd) = std::env::var("ProgramData") { dv_paths.push(PathBuf::from(pd).join("Blackmagic Design/DaVinci Resolve/Support/Workflow Integration Plugins")); }
    } else {
        let home = std::env::var("HOME").unwrap_or_default();
        dv_paths.push(PathBuf::from("/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
        dv_paths.push(PathBuf::from(&home).join("Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
        dv_paths.push(PathBuf::from(&home).join("Library/Containers/com.blackmagic-design.DaVinciResolve/Data/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins"));
    }

    for p in dv_paths {
        if p.join("com.editormaster.premium.v1").exists() { davinci = true; break; }
    }

    // Premiere Status
    let mut pr_paths = Vec::new();
    if cfg!(target_os = "windows") {
        if let Ok(ad) = std::env::var("AppData") { pr_paths.push(PathBuf::from(ad).join("Adobe/CEP/extensions")); }
    } else {
        let home = std::env::var("HOME").unwrap_or_default();
        pr_paths.push(PathBuf::from("/Library/Application Support/Adobe/CEP/extensions"));
        pr_paths.push(PathBuf::from(&home).join("Library/Application Support/Adobe/CEP/extensions"));
    }

    for p in pr_paths {
        if p.join("com.editormaster.premium.v1").exists() { premiere = true; break; }
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
