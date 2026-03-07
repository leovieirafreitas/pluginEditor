const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// APIs do Resolve
window.resolveAPI = {
    importMedia: (filePath) => ipcRenderer.invoke('resolve:importMedia', filePath),
    applyCaption: (presetPath) => ipcRenderer.invoke('resolve:applyCaption', presetPath),
    cleanup: () => ipcRenderer.invoke('resolve:cleanup')
};

// Controle de Janela
window.windowControls = {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
};

// APIs do Node
window.nodeAPI = {
    fs: fs,
    path: path,
    os: os,
    https: https,
    http: http,
    URL: URL
};
