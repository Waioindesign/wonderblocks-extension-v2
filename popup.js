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
        func: () => {
          const isAmazon = location.href.includes("amazon.com.br");
          const isML = location.href.includes("mercadolivre.com.br");

          if (isAmazon) {
            const nome = document.getElementById("productTitle")?.innerText?.trim() || null;
            const img_url =
              document.getElementById("landingImage")?.src ||
              document.getElementById("imgBlkFront")?.src ||
              null;
            const fracao = document.querySelector(".a-price-whole")?.innerText?.replace(/\D/g, "");
            const centavos = document.querySelector(".a-price-fraction")?.innerText?.replace(/\D/g, "");
            const preco_final = fracao ? parseFloat(fracao + "." + (centavos || "00")) : null;
            const precoOrigEl = document.querySelector(".a-text-price .a-offscreen");
            const preco_original = precoOrigEl
              ? parseFloat(precoOrigEl.innerText.replace("R$", "").replace(".", "").replace(",", ".").trim())
              : null;
            return { nome, img_url, loja: "Amazon", preco_final, preco_original };
          }

          if (isML) {
            const nome = document.querySelector(".ui-pdp-title")?.innerText?.trim() || null;
            const img_url =
              document.querySelector(".ui-pdp-image.ui-pdp-gallery__figure__image")?.src ||
              document.querySelector(".ui-pdp-image")?.src ||
              null;
            const fracaoEl = document.querySelector(".andes-money-amount__fraction");
            const preco_final = fracaoEl
              ? parseFloat(fracaoEl.innerText.replace(/\./g, "").replace(",", "."))
              : null;
            const origEl = document.querySelector(
              ".ui-pdp-price__original-value .andes-money-amount__fraction"
            );
            const preco_original = origEl
              ? parseFloat(origEl.innerText.replace(/\./g, "").replace(",", "."))
              : null;
            return { nome, img_url, loja: "Mercado Livre", preco_final, preco_original };
          }

          return null;
        },
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

    await chrome.scripting.executeScript({
      target: { tabId: dashboardTab.id },
      func: (payload) => {
        window.postMessage(payload, "*");
      },
      args: [{ type: "WB_CAPTURE_V2", destino: selectedDest, dados }],
    });

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
