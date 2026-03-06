const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const WorkflowIntegration = require('./WorkflowIntegration.node');

const PLUGIN_ID = 'com.editormaster.premium.v1';

let resolveObj = null;
let mainWindow = null;

async function initResolve() {
    try {
        const initialized = await WorkflowIntegration.Initialize(PLUGIN_ID);
        if (!initialized) return null;
        resolveObj = await WorkflowIntegration.GetResolve();
        return resolveObj;
    } catch (e) {
        console.error("Erro ao inicializar Resolve API:", e);
        return null;
    }
}

async function getPlayheadFrame(project, timeline) {
    try {
        const tc = await timeline.GetCurrentTimecode();
        let fpsStr = await project.GetSetting('timelineFrameRate');
        let fps = parseFloat(fpsStr) || 24;

        const parts = tc.split(/[:;]/).map(val => parseInt(val, 10));
        if (parts.length !== 4) return null;

        const [h, m, s, f] = parts;
        const totalFrames = ((h * 3600) + (m * 60) + s) * fps + f;
        return Math.round(totalFrames);
    } catch (e) {
        console.error("Erro ao calcular frame do playhead:", e);
        return null;
    }
}

async function importMediaToTimeline(event, filePath) {
    let cleanPath = path.resolve(filePath).replace(/\\\\/g, '\\');
    try {
        if (!fs.existsSync(cleanPath)) return `ERROR: Arquivo não encontrado: ${cleanPath}`;
        const resolve = await initResolve();
        if (!resolve) return "ERROR: Falha na conexão com a API do DaVinci.";
        const pm = await resolve.GetProjectManager();
        const project = await pm.GetCurrentProject();
        if (!project) return "ERROR: Nenhum projeto aberto.";
        const mp = await project.GetMediaPool();
        const importedClips = await mp.ImportMedia([cleanPath]);
        if (!importedClips || importedClips.length === 0) return "ERROR: DaVinci recusou a importação.";

        const timeline = await project.GetCurrentTimeline();
        if (timeline) {
            const playheadFrame = await getPlayheadFrame(project, timeline);
            if (playheadFrame !== null) {
                await mp.AppendToTimeline([{
                    mediaPoolItem: importedClips[0],
                    recordFrame: playheadFrame
                }]);
                return "SUCCESS: Importado no CURSOR!";
            }
            await mp.AppendToTimeline([importedClips[0]]);
            return "SUCCESS: Importado!";
        }
        return "SUCCESS: Importado para o Media Pool!";
    } catch (e) {
        return "ERROR: " + e.message;
    }
}

function registerHandlers() {
    ipcMain.handle('resolve:importMedia', importMediaToTimeline);
    ipcMain.handle('resolve:cleanup', async () => WorkflowIntegration.CleanUp());

    // Window controls
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });
    ipcMain.on('window-close', () => mainWindow.close());
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        backgroundColor: '#0a0a0a',
        title: 'EditLab Pro',
        icon: path.join(__dirname, 'logo_davinci.png'), // Ícone do app na barra de tarefas
        frame: false, // Remove a borda branca e ícones nativos do Windows
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    registerHandlers();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
