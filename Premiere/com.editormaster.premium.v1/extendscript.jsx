/**
 * ============================================================
 * EDITLAB PRO - extendscript.jsx
 * Native Layer: Video/Audio download and Premiere Pro import
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────────
// IMPORT VIDEO FROM URL (Legacy fallback or manual)
// ─────────────────────────────────────────────────────────────────
function importVideoFromURL(videoUrl, videoTitle) {
    try {
        if (!videoUrl || videoUrl === "") return "ERROR: URL do vídeo não fornecida";
        if (!videoTitle || videoTitle === "") videoTitle = "video_" + new Date().getTime();

        var tempFolder = Folder.temp.fsName;
        var safeTitle = videoTitle.replace(/[^a-zA-Z0-9_\-]/g, "_").substring(0, 80);
        var ts = new Date().getTime();
        var baseName = safeTitle + "_" + ts;
        var finalPath = tempFolder + "\\" + baseName + ".mp4";
        var tmpPath = tempFolder + "\\" + baseName + "_dl.mp4";
        var vbsPath = tempFolder + "\\" + baseName + ".vbs";
        var logPath = tempFolder + "\\" + baseName + "_log.txt";

        var vbs = new File(vbsPath);
        if (!vbs.open("w")) return "ERROR: Não foi possível criar VBScript temporário";

        vbs.writeln("On Error Resume Next");
        vbs.writeln("Set wsh = CreateObject(\"WScript.Shell\")");
        vbs.writeln("Set fso = CreateObject(\"Scripting.FileSystemObject\")");
        vbs.writeln("strURL  = \"" + videoUrl + "\"");
        vbs.writeln("strTmp  = \"" + tmpPath + "\"");
        vbs.writeln("strOut  = \"" + finalPath + "\"");
        vbs.writeln("strLog  = \"" + logPath + "\"");
        vbs.writeln("");
        vbs.writeln("Sub Log(m): On Error Resume Next");
        vbs.writeln("  Dim f: Set f = fso.OpenTextFile(strLog, 8, True)");
        vbs.writeln("  f.WriteLine Now & \" | \" & m: f.Close");
        vbs.writeln("End Sub");
        vbs.writeln("");
        vbs.writeln("Log \"Iniciando download: \" & strURL");
        vbs.writeln("cmd = \"cmd /c curl.exe -L -s --max-time 120 --connect-timeout 30 -o \"\"\" & strTmp & \"\"\" \"\"\" & strURL & \"\"\" 2>&1\"");
        vbs.writeln("rc = wsh.Run(cmd, 0, True)");
        vbs.writeln("Log \"cURL retornou: \" & rc");
        vbs.writeln("");
        vbs.writeln("If Not fso.FileExists(strTmp) Then: Log \"ERRO: arquivo nao criado\": WScript.Quit 1: End If");
        vbs.writeln("If fso.GetFile(strTmp).Size < 5120 Then: Log \"ERRO: arquivo corrompido\": WScript.Quit 2: End If");
        vbs.writeln("");
        vbs.writeln("' FFmpeg check if available");
        vbs.writeln("ffCheck = wsh.Run(\"cmd /c where ffmpeg.exe >nul 2>&1\", 0, True)");
        vbs.writeln("If ffCheck = 0 Then");
        vbs.writeln("  Log \"Convertendo com FFmpeg...\"");
        vbs.writeln("  ffCmd = \"cmd /c ffmpeg.exe -y -i \"\"\" & strTmp & \"\"\" -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 192k -movflags +faststart \"\"\" & strOut & \"\"\" 2>&1\"");
        vbs.writeln("  frc = wsh.Run(ffCmd, 0, True)");
        vbs.writeln("  Log \"FFmpeg retornou: \" & frc");
        vbs.writeln("  If Not fso.FileExists(strOut) Or fso.GetFile(strOut).Size < 5120 Then");
        vbs.writeln("    Log \"Conversao falhou, usando original\"");
        vbs.writeln("    fso.CopyFile strTmp, strOut");
        vbs.writeln("  End If");
        vbs.writeln("  fso.DeleteFile strTmp");
        vbs.writeln("Else");
        vbs.writeln("  Log \"FFmpeg nao encontrado, renomeando\"");
        vbs.writeln("  fso.CopyFile strTmp, strOut");
        vbs.writeln("  fso.DeleteFile strTmp");
        vbs.writeln("End If");
        vbs.writeln("");
        vbs.writeln("Log \"Concluido!\"");
        vbs.writeln("WScript.Quit 0");
        vbs.close();

        var ok = vbs.execute();
        if (!ok) return "ERROR: Falha ao executar script de download";

        // Wait for file
        var finalFile = new File(finalPath);
        var waited = 0;
        while (waited < 130) {
            $.sleep(500); waited += 0.5;
            finalFile = new File(finalPath);
            if (finalFile.exists && finalFile.length > 5120) { $.sleep(1000); break; }
        }

        finalFile = new File(finalPath);
        if (!finalFile.exists || finalFile.length < 5120) {
            cleanUp([vbs, new File(tmpPath), finalFile, new File(logPath)]);
            return "ERROR: Arquivo não gerado após " + waited + "s.";
        }

        if (!app.project.activeSequence) {
            cleanUp([vbs, finalFile, new File(logPath)]);
            return "ERROR: Nenhuma sequência aberta.";
        }

        var imported = app.project.importFiles([finalPath], true, app.project.rootItem, false);
        cleanUp([vbs, new File(logPath)]);

        if (!imported || imported.length === 0) {
            return "ERROR: Premiere não conseguiu importar o arquivo";
        }
        return "SUCCESS: " + videoTitle;
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}

// ─────────────────────────────────────────────────────────────────
// IMPORT LOCAL AUDIO (Downloaded via JS Node)
// ─────────────────────────────────────────────────────────────────
function importLocalAudio(filePath, audioTitle) {
    try {
        var f = new File(filePath);

        // 1. Check if file exists
        if (!f.exists) return "ERROR: Arquivo nao encontrado no caminho: " + filePath;

        // 2. Wait for file accessibility
        var isReady = false;
        for (var t = 0; t < 5; t++) {
            if (f.open("r")) {
                f.close();
                isReady = true;
                break;
            }
            $.sleep(500);
        }

        if (!isReady) return "ERROR: O arquivo existe mas o Premiere nao consegue acessa-lo.";

        var seq = app.project.activeSequence;
        if (!seq) return "ERROR: Abra uma timeline no Premiere antes de importar";

        // 3. Import safely with Retry Logic
        for (var r = 0; r < 3; r++) {
            try {
                var res = app.project.importFiles([f.fsName], true, app.project.rootItem, false);
                if (res !== false) break; // Sucesso (pode retornar true ou object)
            } catch (e) { }
            $.sleep(1000); // Wait 1s and retry
        }

        var item = null;

        // Fallback search
        if (!item) {
            var targetName = f.name;
            function searchProject(folder) {
                for (var i = 0; i < folder.children.numItems; i++) {
                    var child = folder.children[i];
                    if (child.type !== 2 && (child.name === targetName || child.name === targetName.replace(/\.[^.]+$/, ''))) return child;
                    if (child.type === 2) {
                        var found = searchProject(child);
                        if (found) return found;
                    }
                }
                return null;
            }
            item = searchProject(app.project.rootItem);
        }

        if (!item) return "ERROR: Premiere importou mas o item nao foi encontrado no projeto.";

        try { item.name = audioTitle; } catch (ne) { }

        // Get playhead position
        var timeSeconds = 0;
        try { timeSeconds = seq.getPlayerPosition().seconds; } catch (e) { timeSeconds = 0; }

        if (seq.audioTracks.numTracks === 0) {
            return "SUCCESS_POOL: Importado no Media Pool. Sem faixa de audio na sequencia.";
        }

        var track = seq.audioTracks[0];
        try {
            track.insertClip(item, timeSeconds);
            return "SUCCESS: " + audioTitle;
        } catch (e1) {
            try {
                track.insertClip(item, 0);
                return "SUCCESS: " + audioTitle;
            } catch (e2) {
                return "SUCCESS_POOL: No Media Pool. Erro ao inserir na timeline.";
            }
        }
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}

// ─────────────────────────────────────────────────────────────────
// BASE64 DECODE (necessário pois ExtendScript não tem atob nativo)
// NÃO pode ser declarada dentro de if/try — ES3 proíbe
// ─────────────────────────────────────────────────────────────────
function b64decode(str) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var out = '';
    var i = 0;
    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    while (i < str.length) {
        var enc1 = chars.indexOf(str.charAt(i++));
        var enc2 = chars.indexOf(str.charAt(i++));
        var enc3 = chars.indexOf(str.charAt(i++));
        var enc4 = chars.indexOf(str.charAt(i++));
        out += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
        if (enc3 !== 64 && enc3 !== -1) out += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
        if (enc4 !== 64 && enc4 !== -1) out += String.fromCharCode(((enc3 & 3) << 6) | enc4);
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────
// IMPORT LOCAL VIDEO (ClipCafe)
// ─────────────────────────────────────────────────────────────────
function importLocalVideo(filePath, videoTitle, isBase64) {
    try {
        // Decodifica base64 (evita erros de escape de chars especiais nos títulos)
        var realPath = filePath;
        var realTitle = videoTitle;
        if (isBase64) {
            try {
                realPath = decodeURIComponent(b64decode(filePath));
                realTitle = decodeURIComponent(b64decode(videoTitle));
            } catch (decErr) {
                realPath = filePath;
                realTitle = videoTitle;
            }
        }

        var f = new File(realPath);
        if (!f.exists) return "ERROR: Video nao encontrado: " + realPath;

        var isReady = false;
        for (var t = 0; t < 5; t++) {
            if (f.open("r")) { f.close(); isReady = true; break; }
            $.sleep(500);
        }
        if (!isReady) return "ERROR: Video bloqueado pelo sistema: " + f.name;

        // Importa para o projeto (independente de ter sequência ativa)
        for (var r2 = 0; r2 < 3; r2++) {
            try {
                app.project.importFiles([f.fsName], true, app.project.rootItem, false);
                break;
            } catch (eImp) { }
            $.sleep(1000);
        }

        // Busca o item importado no projeto (com limite de profundidade para evitar stack overflow)
        var targetName2 = f.name;
        var item = findProjectItem(app.project.rootItem, targetName2, 0);

        if (!item) return "ERROR: Falha ao localizar o video importado no projeto.";

        try { item.name = realTitle; } catch (ne) { }

        // Tenta inserir na timeline se houver sequência ativa
        var seq = null;
        try { seq = app.project.activeSequence; } catch (seqErr) { seq = null; }

        if (!seq) {
            return "SUCCESS_POOL: Video importado no Media Pool.";
        }

        var pos = null;
        var timeSeconds = 0;
        try { pos = seq.getPlayerPosition(); if (pos) timeSeconds = pos.seconds; } catch (pe) { timeSeconds = 0; }

        if (seq.videoTracks.numTracks > 0) {
            try {
                seq.videoTracks[0].insertClip(item, timeSeconds);
                return "SUCCESS: " + realTitle;
            } catch (e1) {
                try {
                    seq.videoTracks[0].insertClip(item, 0);
                    return "SUCCESS: " + realTitle;
                } catch (e2) {
                    return "SUCCESS_POOL: No Media Pool. Erro ao inserir: " + e2.toString();
                }
            }
        } else {
            return "SUCCESS_POOL: No Media Pool. Sem faixas de video.";
        }
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}

// ─────────────────────────────────────────────────────────────────
// Busca recursiva com limite de profundidade (evita stack overflow)
// DEVE ser top-level — não pode ser declarada dentro de outra função em ES3
// ─────────────────────────────────────────────────────────────────
function findProjectItem(folder, targetName, depth) {
    if (depth > 8) return null; // limite de profundidade
    for (var i = 0; i < folder.children.numItems; i++) {
        var child = folder.children[i];
        if (child.type !== 2) {
            if (child.name === targetName || child.name === targetName.replace(/\.[^.]+$/, '')) {
                return child;
            }
        } else {
            var found = findProjectItem(child, targetName, depth + 1);
            if (found) return found;
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────
function cleanUp(files) {
    for (var i = 0; i < files.length; i++) {
        try { if (files[i] && files[i].exists) files[i].remove(); } catch (e) { }
    }
}

function getActiveSequence() {
    try {
        var s = app.project.activeSequence;
        if (s) return "OK: " + s.name;
        return "ERROR: Sem sequência ativa";
    } catch (e) { return "ERROR: " + e.toString(); }
}
