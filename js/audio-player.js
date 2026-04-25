(function () {
  const audio = document.getElementById("project-audio");
  const button = document.getElementById("audio-toggle");
  const status = document.getElementById("audio-status");

  if (!audio || !button) return;

  const icon = button.querySelector(".audio-icon");
  const label = button.querySelector(".audio-label");
  const defaultLabel = "Écouter l'audio";
  const loadingAudioMessage = "Chargement de l'audio...";
  let resolvedAudioPath = "";

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function setIdle() {
    button.classList.remove("is-playing");
    button.setAttribute("aria-pressed", "false");
    if (icon) icon.textContent = "▶";
    if (label) label.textContent = defaultLabel;
  }

  function setPlaying() {
    button.classList.add("is-playing");
    button.setAttribute("aria-pressed", "true");
    if (icon) icon.textContent = "⏸";
    if (label) label.textContent = "Pause audio";
  }

  function setErrorState(message) {
    if (icon) icon.textContent = "!";
    if (label) label.textContent = "Audio indisponible";
    setStatus(message || "Impossible de lire le fichier audio.", true);
  }

  function getAudioCandidates() {
    const rawList =
      audio.dataset.audioCandidates ||
      "./assets/audio/apocalips-1.mp3,./assets/audio/eschatologie-audio.mp3";

    return rawList
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function resolveAudioPath() {
    if (resolvedAudioPath) return resolvedAudioPath;

    const candidates = getAudioCandidates();

    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, { method: "HEAD" });
        if (response.ok) {
          resolvedAudioPath = candidate;
          audio.src = candidate;
          audio.load();
          return resolvedAudioPath;
        }
      } catch (_) {
        // Ignore candidate resolution errors and continue to next one.
      }
    }

    return "";
  }

  button.addEventListener("click", async () => {
    if (audio.paused) {
      setStatus(loadingAudioMessage);

      const sourcePath = await resolveAudioPath();
      if (!sourcePath) {
        setErrorState(
          "Fichier audio introuvable. Ajoutez un MP3 dans assets/audio/."
        );
        return;
      }

      try {
        await audio.play();
      } catch (_) {
        setErrorState(
          "Lecture bloquée. Cliquez encore ou vérifiez le format audio."
        );
      }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    setPlaying();
    setStatus("Lecture en cours.");
  });
  audio.addEventListener("pause", () => {
    setIdle();
    setStatus("Audio en pause.");
  });
  audio.addEventListener("ended", () => {
    setIdle();
    setStatus("Lecture terminée.");
  });
  audio.addEventListener("error", () => {
    setIdle();
    setErrorState("Erreur de chargement audio. Vérifiez le fichier MP3.");
  });

  setIdle();
  resolveAudioPath().then((path) => {
    if (path) {
      setStatus("Audio prêt: " + path.replace("./", ""));
      return;
    }
    setStatus(
      "Aucun fichier audio détecté. Déposez un MP3 dans assets/audio/.",
      true
    );
  });
})();
