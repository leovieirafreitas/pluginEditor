// Adapter to make original Premiere code work with DaVinci Resolve Workflow Integration

window.showToast = function (msg, type) {
    console.log(`[TOAST ${type}]: ${msg}`);
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};

// Emulate CSInterface
window.CSInterface = function () {
    this.evalScript = function (script, callback) {
        console.log("Mock EvalScript:", script);

        let filePath = "";
        let title = "";

        // importLocalVideo("path", "title", true)
        if (script.includes("importLocalVideo")) {
            const match = script.match(/importLocalVideo\("([^"]+)", "([^"]+)", true\)/);
            if (match) {
                try {
                    filePath = decodeURIComponent(atob(match[1]));
                    title = decodeURIComponent(atob(match[2]));
                } catch (e) {
                    console.error("Base64 decode error", e);
                }
            }
        }
        // importLocalAudio("path", "title")
        else if (script.includes("importLocalAudio")) {
            const match = script.match(/importLocalAudio\("([^"]+)", "([^"]+)"\)/);
            if (match) {
                filePath = match[1];
                title = match[2];
            }
        }

        if (filePath && window.resolveAPI) {
            window.resolveAPI.importMedia(filePath).then(result => {
                if (callback) callback(result);
            }).catch(err => {
                if (callback) callback("ERROR: " + err.message);
            });
        }
    };
};

// Use what preload exposed on window
window.require = function (module) {
    const nodeAPI = window.nodeAPI || {};
    if (module === 'fs') return nodeAPI.fs;
    if (module === 'path') return nodeAPI.path;
    if (module === 'os') return nodeAPI.os;
    if (module === 'https') return nodeAPI.https;
    if (module === 'http') return nodeAPI.http;
    if (module === 'url') return { URL: nodeAPI.URL };
    return null;
};
