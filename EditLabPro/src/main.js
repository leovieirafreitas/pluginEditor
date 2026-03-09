const { invoke } = window.__TAURI__.core;

let davinciStatus;
let activateDavinciBtn;
let premiereStatus;
let activatePremiereBtn;

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "8px";
  toast.style.color = "white";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  toast.style.zIndex = "1000";
  toast.style.transition = "opacity 0.3s";
  toast.style.backgroundColor = type === "success" ? "#2ecc71" : "#e74c3c";
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.addEventListener("DOMContentLoaded", () => {
  davinciStatus = document.querySelector("#davinci-status");
  activateDavinciBtn = document.querySelector("#activate-davinci");
  premiereStatus = document.querySelector("#premiere-status");
  activatePremiereBtn = document.querySelector("#activate-premiere");

  activateDavinciBtn.addEventListener("click", async () => {
    davinciStatus.textContent = "Status: Ativando...";
    try {
      const result = await invoke("activate_davinci");
      davinciStatus.textContent = "Status: Ativado!";
      showToast(result);
    } catch (err) {
      davinciStatus.textContent = "Status: Erro na Ativação";
      console.error(err);
      showToast("Erro: " + err, "error");
    }
  });

  activatePremiereBtn.addEventListener("click", async () => {
    premiereStatus.textContent = "Status: Ativando...";
    try {
      const result = await invoke("activate_premiere");
      premiereStatus.textContent = "Status: Instalado!";
      showToast(result);
    } catch (err) {
      premiereStatus.textContent = "Status: Erro na Instalação";
      console.error(err);
      showToast("Erro: " + err, "error");
    }
  });

  davinciStatus.textContent = "Status: Pronto para Ativar";
  premiereStatus.textContent = "Status: Pronto para Ativar";
});
