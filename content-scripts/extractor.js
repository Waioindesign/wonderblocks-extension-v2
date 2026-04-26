(function () {
  const url = location.href;

  function parsePrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^\d,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  if (url.includes("amazon.com.br")) {
    const wholeEl = document.querySelector(".a-price-whole");
    const fracEl = document.querySelector(".a-price-fraction");
    let preco_final = null;
    if (wholeEl) {
      const whole = wholeEl.innerText.replace(/\D/g, "");
      const frac = fracEl ? fracEl.innerText.replace(/\D/g, "").padEnd(2, "0") : "00";
      preco_final = parseFloat(`${whole}.${frac}`);
    }

    const origEl = document.querySelector(".a-text-price .a-offscreen");
    const preco_original = origEl ? parsePrice(origEl.innerText) : null;

    return {
      nome: document.getElementById("productTitle")?.innerText?.trim() || null,
      img_url:
        document.getElementById("landingImage")?.src ||
        document.getElementById("imgBlkFront")?.src ||
        null,
      preco_final: isNaN(preco_final) ? null : preco_final,
      preco_original,
      loja: "Amazon",
    };
  }

  if (url.includes("mercadolivre.com.br")) {
    const fracEls = document.querySelectorAll(".andes-money-amount__fraction");
    const preco_final = fracEls[0] ? parsePrice(fracEls[0].innerText) : null;

    const origFracEl = document.querySelector(
      ".ui-pdp-price__original-value .andes-money-amount__fraction"
    );
    const preco_original = origFracEl ? parsePrice(origFracEl.innerText) : null;

    return {
      nome: document.querySelector(".ui-pdp-title")?.innerText?.trim() || null,
      img_url: document.querySelector(".ui-pdp-image")?.src || null,
      preco_final,
      preco_original,
      loja: "Mercado Livre",
    };
  }

  return null;
})();
