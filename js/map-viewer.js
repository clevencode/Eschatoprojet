(function () {
  "use strict";

  const container = document.getElementById("map-viewer");
  const image = document.getElementById("map-image");
  const showFeedback = window.showSiteFeedback || (() => {});
  const zoomInBtn = document.getElementById("map-zoom-in");
  const zoomOutBtn = document.getElementById("map-zoom-out");
  const resetBtn = document.getElementById("map-reset");

  if (!container || !image) return;
  const isFreePanEnabled = container.dataset.freePan !== "false";

  let scale = 1;
  let minScale = 1;
  let initialScale = 1;
  const maxScale = 16;
  const minScaleFactor = 0.35;
  const panOverscrollPx = 120;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  const activePointers = new Map();
  let pinchDistance = 0;
  let pinchCenterX = 0;
  let pinchCenterY = 0;
  let hasFittedOnce = false;
  const imageCandidates = [];
  let currentImageIndex = 0;
  const zoomFromCenter = true;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyTransform() {
    image.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  function constrainTranslation() {
    if (isFreePanEnabled) return;
    const containerRect = container.getBoundingClientRect();
    const scaledWidth = (image.naturalWidth || 1) * scale;
    const scaledHeight = (image.naturalHeight || 1) * scale;
    const maxX =
      Math.max(0, (scaledWidth - containerRect.width) / 2) + panOverscrollPx;
    const maxY =
      Math.max(0, (scaledHeight - containerRect.height) / 2) + panOverscrollPx;
    translateX = clamp(translateX, -maxX, maxX);
    translateY = clamp(translateY, -maxY, maxY);
  }

  function fitToScreen() {
    const containerRect = container.getBoundingClientRect();
    const naturalW = image.naturalWidth || 1;
    const naturalH = image.naturalHeight || 1;
    const fitScale = Math.min(
      containerRect.width / naturalW,
      containerRect.height / naturalH
    );
    const coverScale = Math.max(
      containerRect.width / naturalW,
      containerRect.height / naturalH
    );
    const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
    initialScale = isMobileViewport ? coverScale : fitScale;
    minScale = fitScale * minScaleFactor;
    if (!hasFittedOnce) {
      scale = initialScale;
      translateX = 0;
      translateY = 0;
      hasFittedOnce = true;
    } else {
      scale = Math.max(scale, minScale);
      constrainTranslation();
    }
    applyTransform();
  }

  function zoomAt(clientX, clientY, deltaScale) {
    const oldScale = scale;
    const nextScale = clamp(oldScale * deltaScale, minScale, maxScale);
    if (nextScale === oldScale) return;

    const rect = container.getBoundingClientRect();
    const pointX = clientX - rect.left - rect.width / 2;
    const pointY = clientY - rect.top - rect.height / 2;

    const ratio = nextScale / oldScale;
    translateX = pointX - (pointX - translateX) * ratio;
    translateY = pointY - (pointY - translateY) * ratio;
    scale = nextScale;
    constrainTranslation();
    applyTransform();
  }

  function zoomAtCenter(deltaScale) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomAt(centerX, centerY, deltaScale);
  }

  function resetView() {
    scale = Math.max(minScale, initialScale);
    translateX = 0;
    translateY = 0;
    applyTransform();
    showFeedback("Vue recentrée");
  }

  function getImageCandidates() {
    const raw = image.dataset.imageCandidates || image.getAttribute("src") || "";
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function loadImageByIndex(index) {
    if (index < 0 || index >= imageCandidates.length) {
      return;
    }
    currentImageIndex = index;
    image.setAttribute("src", imageCandidates[currentImageIndex]);
  }

  function getPointerDistance() {
    const pointers = Array.from(activePointers.values());
    if (pointers.length < 2) return 0;
    const dx = pointers[1].clientX - pointers[0].clientX;
    const dy = pointers[1].clientY - pointers[0].clientY;
    return Math.hypot(dx, dy);
  }

  function getPointerCenter() {
    const pointers = Array.from(activePointers.values());
    if (pointers.length < 2) return null;
    return {
      clientX: (pointers[0].clientX + pointers[1].clientX) / 2,
      clientY: (pointers[0].clientY + pointers[1].clientY) / 2,
    };
  }

  container.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    container.focus();
    activePointers.set(event.pointerId, event);
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    container.classList.add("is-dragging");
    container.setPointerCapture(event.pointerId);

    if (activePointers.size === 2) {
      pinchDistance = getPointerDistance();
      const center = getPointerCenter();
      if (center) {
        pinchCenterX = center.clientX;
        pinchCenterY = center.clientY;
      }
    }
  });

  container.addEventListener("pointermove", (event) => {
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, event);
    }

    if (activePointers.size === 2) {
      const currentDistance = getPointerDistance();
      if (pinchDistance > 0 && currentDistance > 0) {
        zoomAt(pinchCenterX, pinchCenterY, currentDistance / pinchDistance);
      }
      const center = getPointerCenter();
      if (center) {
        const dx = center.clientX - pinchCenterX;
        const dy = center.clientY - pinchCenterY;
        pinchCenterX = center.clientX;
        pinchCenterY = center.clientY;
        translateX += dx;
        translateY += dy;
        constrainTranslation();
        applyTransform();
      }
      pinchDistance = currentDistance;
      return;
    }

    if (!isDragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    translateX += dx;
    translateY += dy;
    constrainTranslation();
    applyTransform();
  });

  function stopDragging(event) {
    if (event) activePointers.delete(event.pointerId);
    if (activePointers.size < 2) pinchDistance = 0;
    if (activePointers.size === 0) isDragging = false;
    container.classList.remove("is-dragging");
  }

  container.addEventListener("pointerup", stopDragging);
  container.addEventListener("pointercancel", stopDragging);
  container.addEventListener("pointerleave", stopDragging);

  container.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const zoomX = zoomFromCenter ? centerX : event.clientX;
      const zoomY = zoomFromCenter ? centerY : event.clientY;
      zoomAt(zoomX, zoomY, zoomFactor);
    },
    { passive: false }
  );

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      zoomAtCenter(1.15);
      showFeedback("Zoom avant");
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      zoomAtCenter(0.87);
      showFeedback("Zoom arrière");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetView);
  }

  container.addEventListener("dblclick", (event) => {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const zoomX = zoomFromCenter ? centerX : event.clientX;
    const zoomY = zoomFromCenter ? centerY : event.clientY;
    if (scale > minScale * 1.2) {
      resetView();
      return;
    }
    zoomAt(zoomX, zoomY, 2);
  });

  container.addEventListener("keydown", (event) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomAt(centerX, centerY, 1.15);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomAt(centerX, centerY, 0.87);
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      resetView();
      return;
    }

    const panStep = 40;
    if (event.key === "ArrowLeft") translateX += panStep;
    else if (event.key === "ArrowRight") translateX -= panStep;
    else if (event.key === "ArrowUp") translateY += panStep;
    else if (event.key === "ArrowDown") translateY -= panStep;
    else return;

    event.preventDefault();
    constrainTranslation();
    applyTransform();
  });

  image.addEventListener("load", () => {
    fitToScreen();
  });
  image.addEventListener("error", () => {
    const nextIndex = currentImageIndex + 1;
    if (nextIndex < imageCandidates.length) {
      loadImageByIndex(nextIndex);
      showFeedback("Image de secours chargée");
      return;
    }
    showFeedback("Impossible de charger l'image", "error");
  });
  window.addEventListener("resize", fitToScreen);

  const initialSrc = image.getAttribute("src") || "";
  const parsedCandidates = getImageCandidates();

  if (initialSrc && !parsedCandidates.includes(initialSrc)) {
    imageCandidates.push(initialSrc);
  }
  imageCandidates.push(...parsedCandidates);

  if (imageCandidates.length === 0) {
    return;
  }

  const initialIndex = Math.max(imageCandidates.indexOf(initialSrc), 0);
  loadImageByIndex(initialIndex);

  if (image.complete && image.naturalWidth > 0) {
    fitToScreen();
  }
})();
