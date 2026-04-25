(function () {
  const feedbackEl = document.getElementById("site-feedback");
  if (!feedbackEl) return;

  let hideTimer = null;

  function showSiteFeedback(message, type = "info", durationMs = 1700) {
    if (!message) return;

    feedbackEl.textContent = message;
    feedbackEl.classList.remove("is-error", "is-success");
    if (type === "error") feedbackEl.classList.add("is-error");
    if (type === "success") feedbackEl.classList.add("is-success");
    feedbackEl.classList.add("is-visible");

    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      feedbackEl.classList.remove("is-visible");
    }, durationMs);
  }

  window.showSiteFeedback = showSiteFeedback;
})();
