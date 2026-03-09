const { invoke } = window.__TAURI__.core;

let davinciStatus, activateDavinciBtn, premiereStatus, activatePremiereBtn;

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "12px";
  toast.style.color = "white";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
  toast.style.zIndex = "1000";
  toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
  toast.style.backgroundColor = type === "success" ? "#2ecc71" : "#e74c3c";
  toast.style.transform = "translateY(100px)";
  toast.textContent = message;

  document.body.appendChild(toast);

  // Animação de entrada
  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function refreshStatus() {
  try {
    const [isDavinciInstalled, isPremiereInstalled] = await invoke("check_status");

    // UI DaVinci
    if (isDavinciInstalled) {
      davinciStatus.textContent = "Status: Ativado";
      activateDavinciBtn.textContent = "Desativar";
      activateDavinciBtn.className = "btn-deactivate";
    } else {
      davinciStatus.textContent = "Status: Pronto para Ativar";
      activateDavinciBtn.textContent = "Ativar Integração";
      activateDavinciBtn.className = "btn-activate";
    }

    // UI Premiere
    if (isPremiereInstalled) {
      premiereStatus.textContent = "Status: Ativado";
      activatePremiereBtn.textContent = "Desativar";
      activatePremiereBtn.className = "btn-deactivate";
    } else {
      premiereStatus.textContent = "Status: Pronto para Ativar";
      activatePremiereBtn.textContent = "Ativar Integração";
      activatePremiereBtn.className = "btn-activate";
    }
  } catch (err) {
    console.error("Erro ao checar status:", err);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  davinciStatus = document.querySelector("#davinci-status");
  activateDavinciBtn = document.querySelector("#activate-davinci");
  premiereStatus = document.querySelector("#premiere-status");
  activatePremiereBtn = document.querySelector("#activate-premiere");

  activateDavinciBtn.addEventListener("click", async () => {
    const isInstalled = activateDavinciBtn.classList.contains("btn-deactivate");
    const cmd = isInstalled ? "deactivate_davinci" : "activate_davinci";

    davinciStatus.textContent = isInstalled ? "Desativando..." : "Ativando...";

    try {
      const result = await invoke(cmd);
      showToast(result);
      await refreshStatus();
    } catch (err) {
      showToast("Erro: " + err, "error");
      await refreshStatus();
    }
  });

  activatePremiereBtn.addEventListener("click", async () => {
    const isInstalled = activatePremiereBtn.classList.contains("btn-deactivate");
    const cmd = isInstalled ? "deactivate_premiere" : "activate_premiere";

    premiereStatus.textContent = isInstalled ? "Desativando..." : "Ativando...";

    try {
      const result = await invoke(cmd);
      showToast(result);
      await refreshStatus();
    } catch (err) {
      showToast("Erro: " + err, "error");
      await refreshStatus();
    }
  });

  // Inicializa o status na abertura
  await refreshStatus();
});
