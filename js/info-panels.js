(function () {
  const showFeedback = window.showSiteFeedback || (() => {});
  const modal = document.getElementById("info-modal");
  const titleEl = document.getElementById("info-modal-title");
  const contentEl = document.getElementById("info-modal-content");
  const closeBtn = document.getElementById("info-modal-close");
  const panelButtons = document.querySelectorAll("[data-panel]");

  if (!modal || !titleEl || !contentEl || !closeBtn || !panelButtons.length) {
    return;
  }

  const panels = {
    flow: {
      title: "Informations importantes du flux de l'application",
      html: `
        <p>Ce visualiseur est conçu pour une consultation immersive de la ligne du temps prophétique.</p>
        <ul>
          <li>Navigation principale: zoom (molette/pinch), glisser libre, double-clic pour zoom rapide et touche <strong>0</strong> pour recentrer.</li>
          <li>Chargement image: priorité à <code>assets/images/image.png</code>, avec fallback automatique en cas d'échec.</li>
          <li>Lecture audio: bouton central inférieur avec lecture/pause, animation wave, et durée en temps réel.</li>
          <li>Compatibilité mobile: zone plein écran, adaptation à la safe area, et interactions tactiles optimisées.</li>
          <li>Statuts visuels: messages dédiés pour le chargement, lecture, pause, erreurs média et état du viewer.</li>
        </ul>
        <p>Objectif du flux: garder l'utilisateur concentré sur l'image tout en permettant un accompagnement audio contextuel.</p>
      `,
    },
    project: {
      title: "Description du projet",
      html: `
        <p><strong>Auteur:</strong> Clevenider Petit</p>
        <p><strong>Date du projet:</strong> 25/04/2026</p>
        <p>A Dieu seul soit la gloire, l'Auteur de toute sagesse, et a son Fils Jesus-Christ, qui accorde l'intelligence aux simples.</p>
        <p>Le present projet a ete elabore dans le but de presenter de facon ordonnee et pedagogique le cours d'Eschatologie dispense par le Doyen et Apotre Garry Blaise.</p>
        <p>Ce travail constitue une methodologie permettant a l'etudiant, par la grace de Dieu, de demontrer sa comprehension et sa maitrise des enseignements recus.</p>
        <p>La methode adoptee repose sur une organisation chronologique et textuelle de l'Eschatologie, appuyee par l'utilisation de l'intelligence artificielle pour generer des illustrations destinees a la realisation d'un audio explicative sur ce theme.</p>
      `,
    },
  };

  let lastTrigger = null;

  function openPanel(panelKey, triggerEl) {
    const panel = panels[panelKey];
    if (!panel) return;
    lastTrigger = triggerEl || null;
    titleEl.textContent = panel.title;
    contentEl.innerHTML = panel.html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    closeBtn.focus();
    showFeedback(panel.title);
  }

  function closePanel() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (lastTrigger) lastTrigger.focus();
  }

  panelButtons.forEach((btn) => {
    btn.addEventListener("click", () => openPanel(btn.dataset.panel, btn));
  });

  closeBtn.addEventListener("click", closePanel);
  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
      closePanel();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closePanel();
    }
  });
})();
