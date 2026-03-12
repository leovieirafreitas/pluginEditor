/**
 * ============================================================
 * EDITLAB PRO - extendscript.jsx (After Effects Only)
 * Native Layer: Video/Audio download and AE import
 * ============================================================
 */

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

        // AE specific import
        var io = new ImportOptions(finalFile);
        var item = app.project.importFile(io);
        cleanUp([vbs, new File(logPath)]);

        if (!item) return "ERROR: After Effects não conseguiu importar o arquivo";

        try { item.name = videoTitle; } catch (e) { }

        var activeItem = app.project.activeItem;
        if (activeItem && (activeItem instanceof CompItem)) {
            var layer = activeItem.layers.add(item);
            if (layer) layer.startTime = activeItem.time;
            return "SUCCESS: " + videoTitle + " (Adicionado na agulha)";
        }

        return "SUCCESS: " + videoTitle + " (No Project Panel)";
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}

function importLocalAudio(filePath, audioTitle) {
    try {
        var f = new File(filePath);
        if (!f.exists) return "ERROR: Arquivo nao encontrado.";

        var io = new ImportOptions(f);
        var item = app.project.importFile(io);
        if (!item) return "ERROR: AE nao conseguiu importar o audio";

        try { item.name = audioTitle; } catch (e) { }

        var activeItem = app.project.activeItem;
        if (activeItem && (activeItem instanceof CompItem)) {
            var layer = activeItem.layers.add(item);
            if (layer) layer.startTime = activeItem.time;
            return "SUCCESS: " + audioTitle + " (Inserido na agulha)";
        }
        return "SUCCESS: " + audioTitle + " (Project Panel)";
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}

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

function importLocalVideo(filePath, videoTitle, isBase64) {
    try {
        var realPath = filePath;
        var realTitle = videoTitle;
        if (isBase64) {
            try {
                realPath = decodeURIComponent(b64decode(filePath));
                realTitle = decodeURIComponent(b64decode(videoTitle));
            } catch (decErr) { }
        }

        var f = new File(realPath);
        if (!f.exists) return "ERROR: Video nao encontrado.";

        var io = new ImportOptions(f);
        var item = app.project.importFile(io);
        if (!item) return "ERROR: AE nao conseguiu importar o video";

        try { item.name = realTitle; } catch (e) { }

        var activeItem = app.project.activeItem;
        if (activeItem && (activeItem instanceof CompItem)) {
            var layer = activeItem.layers.add(item);
            if (layer) layer.startTime = activeItem.time;
            return "SUCCESS: " + realTitle + " (Inserido na agulha)";
        }
        return "SUCCESS: " + realTitle + " (Project Panel)";
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}

function cleanUp(files) {
    for (var i = 0; i < files.length; i++) {
        try { if (files[i] && files[i].exists) files[i].remove(); } catch (e) { }
    }
}

/**
 * ============================================================
 * AEP IMPORT — Legendas / Captions nativa
 * Importa um projeto .aep de template do plugin.
 * Localiza a composição de legenda importada e aplica nela as cores/texto.
 *
 * @param {string} encodedPath - Caminho absoluto codificado (URI) para o .aep
 * @param {string} encodedText - Texto codificado (URI)
 * @param {number} fontSize    - Tamanho da fonte
 * @param {string} colorHex    - Cor em Hex sem '#'
 * ============================================================
 */
function importAEPToTimeline(encodedPath, encodedText, fontSize, colorHex) {
    try {
        var aepFullPath = decodeURIComponent(encodedPath);
        var legendText = decodeURIComponent(encodedText);

        var aepFile = new File(aepFullPath);
        if (!aepFile.exists) {
            return 'ERROR: Arquivo de template não encontrado no plugin: ' + aepFullPath;
        }

        var activeComp = app.project.activeItem;
        if (!activeComp || !(activeComp instanceof CompItem)) {
            return 'ERROR: Nenhuma composition ativa no After Effects. Crie ou abra uma primeiro.';
        }

        app.beginUndoGroup("EditLabPro - Inserir Legenda AEP");

        // 1) Importa o Projeto AEP — no AE, .aep é importado como um FolderItem
        var io = new ImportOptions(aepFile);
        var importedProjectFolder;
        try {
            importedProjectFolder = app.project.importFile(io);
        } catch (importErr) {
            app.endUndoGroup();
            return 'ERROR: Falha ao importar template .aep — ' + importErr.toString();
        }
        
        if (!importedProjectFolder || !(importedProjectFolder instanceof FolderItem)) {
            app.endUndoGroup();
            return 'ERROR: Falha, o AEP não foi importado como uma pasta.';
        }

        // 2) Procura a Composition principal da Legenda dentro da pasta
        // Vai iterar recursivamente pra achar a primeira CompItem
        var targetComp = null;
        function findComp(folder) {
            for (var i = 1; i <= folder.numItems; i++) {
                var item = folder.item(i);
                if (item instanceof CompItem) {
                    return item;
                } else if (item instanceof FolderItem) {
                    var found = findComp(item);
                    if (found) return found;
                }
            }
            return null;
        }
        targetComp = findComp(importedProjectFolder);

        if (!targetComp) {
            app.endUndoGroup();
            return 'ERROR: Nenhuma Composition encontrada dentro do AEP importado.';
        }

        // 3) Insere na Timeline (Agulha) da composition logada
        var newLayer = activeComp.layers.add(targetComp);
        newLayer.startTime = activeComp.time;

        // 4) Edita TODOS os TextLayers originais dentro da comp importada
        var textsFound = 0;
        for (var li = 1; li <= targetComp.numLayers; li++) {
            var lyr = targetComp.layers[li];
            if (lyr instanceof TextLayer) {
                try {
                    var tfProp = lyr.property('ADBE Text Properties').property('ADBE Text Document');
                    var td = tfProp.value;
                    var multiTexts = legendText.split('|||');
                    td.text = (textsFound < multiTexts.length) ? multiTexts[textsFound] : multiTexts[multiTexts.length - 1];
                    if (fontSize && fontSize > 0) td.fontSize = fontSize;

                    if (colorHex && colorHex.length >= 6) {
                        var r = parseInt(colorHex.substring(0, 2), 16) / 255;
                        var g = parseInt(colorHex.substring(2, 4), 16) / 255;
                        var b = parseInt(colorHex.substring(4, 6), 16) / 255;
                        td.fillColor = [r, g, b];
                    }
                    tfProp.setValue(td);
                    textsFound++;
                } catch (eTr) {}
            }
        }

        app.endUndoGroup();
        
        var details = (textsFound > 0) ? ' | Atualizadas ' + textsFound + ' camadas de texto.' : '';
        return 'SUCCESS: Template adicionado na timeline!' + details;
    } catch (e) {
        if (app) app.endUndoGroup();
        return 'ERROR: ' + e.toString();
    }
}

/**
 * ============================================================
 * GET AEP TEXT LAYERS COUNT
 * Abre o AEP temporariamente para contar as camadas de texto.
 * ============================================================
 */
function getAEPTextLayersCount(encodedPath) {
    try {
        var aepFullPath = decodeURIComponent(encodedPath);
        var aepFile = new File(aepFullPath);
        if (!aepFile.exists) return "ERROR: Arquivo não encontrado";

        // Importa como pasta
        var io = new ImportOptions(aepFile);
        var importedFolder = app.project.importFile(io);
        if (!importedFolder) return "0";

        // Acha a comp
        function findComp(folder) {
            for (var i = 1; i <= folder.numItems; i++) {
                var item = folder.item(i);
                if (item instanceof CompItem) return item;
                if (item instanceof FolderItem) {
                    var f = findComp(item);
                    if (f) return f;
                }
            }
            return null;
        }

        var comp = findComp(importedFolder);
        var count = 0;
        if (comp) {
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layers[j] instanceof TextLayer) count++;
            }
        }

        // Remove do projeto para não sujar
        importedFolder.remove();

        return count.toString();
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}
