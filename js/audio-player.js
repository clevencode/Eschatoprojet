(function () {
  const audio = document.getElementById("project-audio");
  const button = document.getElementById("audio-toggle");
  const timeLabel = document.getElementById("audio-time");
  const showFeedback = window.showSiteFeedback || (() => {});
  const progressFill = document.getElementById("audio-progress-fill");
  const AUDIO_PROGRESS_KEY = "eschatologie_audio_progress_v1";
  const MIN_SAVE_INTERVAL_MS = 1200;

  if (!audio || !button) return;

  const icon = button.querySelector(".audio-icon");
  const label = button.querySelector(".audio-label");
  const defaultLabel = "Écouter l'audio";
  let resolvedAudioPath = "";
  let lastSavedAt = 0;

  function saveAudioProgress() {
    if (!resolvedAudioPath) return;
    if (!Number.isFinite(audio.currentTime) || audio.currentTime < 0) return;

    const payload = {
      src: resolvedAudioPath,
      time: audio.currentTime,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(AUDIO_PROGRESS_KEY, JSON.stringify(payload));
    } catch (_) {
      // Ignore storage failures (private mode/quota/etc).
    }
  }

  function restoreAudioProgress() {
    try {
      const raw = localStorage.getItem(AUDIO_PROGRESS_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (!saved || saved.src !== resolvedAudioPath) return;

      const savedTime = Number(saved.time);
      if (!Number.isFinite(savedTime) || savedTime <= 0) return;

      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const maxSeek = duration > 1 ? Math.max(0, duration - 1) : savedTime;
      audio.currentTime = Math.min(savedTime, maxSeek);
      updateTimeLabel();
      showFeedback("Reprise audio restaurée");
    } catch (_) {
      // Ignore malformed storage payload.
    }
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function updateTimeLabel() {
    if (!timeLabel) return;
    const current = formatTime(audio.currentTime || 0);
    const total = formatTime(audio.duration || 0);
    timeLabel.textContent = `${current} / ${total}`;

    if (progressFill) {
      const duration = audio.duration || 0;
      const progress =
        duration > 0 ? Math.min(100, (audio.currentTime / duration) * 100) : 0;
      progressFill.style.width = `${progress}%`;
    }
  }

  function setIdle() {
    button.classList.remove("is-playing");
    button.setAttribute("aria-pressed", "false");
    if (icon) icon.textContent = "play_arrow";
    if (label) label.textContent = defaultLabel;
    updateTimeLabel();
  }

  function setPlaying() {
    button.classList.add("is-playing");
    button.setAttribute("aria-pressed", "true");
    if (icon) icon.textContent = "pause";
    if (label) label.textContent = "Pause audio";
    updateTimeLabel();
    showFeedback("Lecture audio en cours", "success");
  }

  function setErrorState(message) {
    if (icon) icon.textContent = "error";
    if (label) label.textContent = message || "Audio indisponible";
    updateTimeLabel();
    showFeedback(message || "Audio indisponible", "error");
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
      const sourcePath = await resolveAudioPath();
      if (!sourcePath) {
        setErrorState("Audio indisponible");
        return;
      }

      try {
        await audio.play();
      } catch (_) {
        setErrorState("Audio indisponible");
      }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    setPlaying();
  });
  audio.addEventListener("loadedmetadata", updateTimeLabel);
  audio.addEventListener("loadedmetadata", restoreAudioProgress);
  audio.addEventListener("timeupdate", updateTimeLabel);
  audio.addEventListener("timeupdate", () => {
    const now = Date.now();
    if (now - lastSavedAt < MIN_SAVE_INTERVAL_MS) return;
    lastSavedAt = now;
    saveAudioProgress();
  });
  audio.addEventListener("pause", () => {
    setIdle();
    saveAudioProgress();
    if (!audio.ended) showFeedback("Audio en pause");
  });
  audio.addEventListener("ended", () => {
    setIdle();
    updateTimeLabel();
    saveAudioProgress();
    showFeedback("Lecture terminée");
  });
  audio.addEventListener("error", () => {
    setIdle();
    setErrorState("Audio indisponible");
  });

  setIdle();
  updateTimeLabel();
  resolveAudioPath().then((path) => {
    if (!path) setErrorState("Audio indisponible");
  });

  window.addEventListener("beforeunload", saveAudioProgress);
})();
