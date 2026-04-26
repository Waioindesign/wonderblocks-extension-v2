if (!window.__wbReceiverActive) {
  window.__wbReceiverActive = true;

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "WB_CAPTURE_V2") return;

    window.dispatchEvent(
      new CustomEvent("wb-capture-v2", {
        detail: {
          destino: message.destino,
          dados: message.dados,
        },
      })
    );
  });
}
