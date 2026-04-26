const DASHBOARD_URLS = ["wonderblocks-v2.vercel.app", "localhost:3000"];

let selectedDest = "wonder-pop";

document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedDest = btn.dataset.dest;
  });
});

document.getElementById("captureBtn").addEventListener("click", async () => {
  const captureBtn = document.getElementById("captureBtn");
  captureBtn.disabled = true;
  captureBtn.textContent = "Capturando...";

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!isProductPage(activeTab.url)) {
      showResult(null, "Acesse uma página de produto Amazon ou Mercado Livre");
      return;
    }

    let dados;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["content-scripts/extractor.js"],
      });
      dados = results[0]?.result;
    } catch (e) {
      showResult(null, "Não foi possível acessar a página. Recarregue e tente novamente.");
      return;
    }

    if (!dados || !dados.nome) {
      showResult(null, "Não foi possível extrair os dados do produto.");
      return;
    }

    const dashboardTab = await findDashboardTab();
    if (!dashboardTab) {
      showResult(dados, null, "Abra o dashboard Wonderblocks antes de capturar");
      return;
    }

    try {
      await chrome.tabs.sendMessage(dashboardTab.id, {
        type: "WB_CAPTURE_V2",
        destino: selectedDest,
        dados,
      });
    } catch {
      // Content script não estava no tab (extensão carregada com tab já aberto).
      // Injeta o receiver e tenta novamente.
      await chrome.scripting.executeScript({
        target: { tabId: dashboardTab.id },
        files: ["content-scripts/receiver.js"],
      });
      await chrome.tabs.sendMessage(dashboardTab.id, {
        type: "WB_CAPTURE_V2",
        destino: selectedDest,
        dados,
      });
    }

    showResult(dados, "Capturado!");
  } catch (e) {
    showResult(null, "Erro inesperado: " + e.message);
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = "Capturar produto";
  }
});

function isProductPage(url) {
  if (!url) return false;
  return url.includes("amazon.com.br") || url.includes("mercadolivre.com.br");
}

async function findDashboardTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find((tab) => DASHBOARD_URLS.some((u) => tab.url?.includes(u))) || null;
}

function showResult(dados, successMsg, errorMsg) {
  const area = document.getElementById("resultArea");
  const img = document.getElementById("resultImg");
  const name = document.getElementById("resultName");
  const store = document.getElementById("resultStore");
  const badge = document.getElementById("resultBadge");

  area.classList.remove("hidden");

  if (dados) {
    img.src = dados.img_url || "";
    img.style.display = dados.img_url ? "block" : "none";
    name.textContent = dados.nome || "";
    store.textContent = dados.loja || "";
  } else {
    img.style.display = "none";
    name.textContent = "";
    store.textContent = "";
  }

  if (errorMsg) {
    badge.textContent = errorMsg;
    badge.className = "badge error";
  } else {
    badge.textContent = successMsg || "Capturado!";
    badge.className = "badge success";
  }
}
