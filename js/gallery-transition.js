(function() {
  let touchStartX = null;
  let preloadTimer = null;

  function fitImage(slide) {
    const image = slide && slide.querySelector("img");
    if (!image) return;

    image.style.position = "absolute";
    image.style.inset = "0";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.maxWidth = "none";
    image.style.maxHeight = "none";
    image.style.objectFit = "contain";
    image.style.objectPosition = "center";
    image.style.display = "block";
  }

  function bindFallback(image) {
    if (!image || image.dataset.galleryFallbackBound === "true") return;
    image.dataset.galleryFallbackBound = "true";

    image.addEventListener("error", function() {
      const fallback = image.dataset.fallback;
      if (!fallback || image.dataset.galleryFallbackUsed === "true") return;
      image.dataset.galleryFallbackUsed = "true";
      image.src = fallback;
    });
  }

  function ensureImage(slide, priority) {
    const image = slide && slide.querySelector("img");
    if (!image) return;

    fitImage(slide);
    bindFallback(image);

    if (priority === "high") {
      image.loading = "eager";
      image.fetchPriority = "high";
    } else {
      image.loading = "lazy";
      image.fetchPriority = "low";
    }

    if (!image.getAttribute("src") && image.dataset.src) {
      image.src = image.dataset.src;
    }
  }

  function scheduleNext(slides, activeIndex) {
    if (preloadTimer !== null) {
      window.clearTimeout(preloadTimer);
      preloadTimer = null;
    }

    if (slides.length < 2) return;

    preloadTimer = window.setTimeout(function() {
      const nextIndex = (activeIndex + 1) % slides.length;
      ensureImage(slides[nextIndex], "low");
      preloadTimer = null;
    }, 120);
  }

  function getGalleryState() {
    const track = document.getElementById("articleGalleryTrack");
    if (!track) return null;

    const slides = Array.from(track.children);
    if (slides.length < 2) return null;

    slides.forEach(fitImage);

    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden && slide.style.display !== "none";
    });

    if (activeIndex < 0) activeIndex = 0;

    return { track: track, slides: slides, activeIndex: activeIndex };
  }

  function updateStatus(index, total) {
    const status = document.querySelector("#articleGallery .gallery-status");
    if (status) {
      status.textContent = index + 1 + " / " + total;
    }
  }

  function setVisibleSlide(slides, activeIndex) {
    ensureImage(slides[activeIndex], "high");

    slides.forEach(function(slide, index) {
      const isActive = index === activeIndex;
      slide.hidden = !isActive;
      slide.style.display = isActive ? "block" : "none";
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      fitImage(slide);
    });

    scheduleNext(slides, activeIndex);
  }

  function changeSlide(delta) {
    const state = getGalleryState();
    if (!state) return;

    const nextIndex =
      (state.activeIndex + delta + state.slides.length) % state.slides.length;

    ensureImage(state.slides[nextIndex], "high");
    setVisibleSlide(state.slides, nextIndex);
    updateStatus(nextIndex, state.slides.length);
  }

  function normalizeCurrentGallery() {
    const state = getGalleryState();
    if (!state) return;

    setVisibleSlide(state.slides, state.activeIndex);
    updateStatus(state.activeIndex, state.slides.length);
  }

  function preloadForControl(button) {
    const state = getGalleryState();
    if (!state || !button) return;

    const delta = button.id === "galleryPrevious" ? -1 : 1;
    const index =
      (state.activeIndex + delta + state.slides.length) % state.slides.length;
    ensureImage(state.slides[index], "low");
  }

  normalizeCurrentGallery();
  window.addEventListener("jazzing:gallery-rendered", normalizeCurrentGallery);

  document.addEventListener(
    "pointerover",
    function(event) {
      const button = event.target.closest("#galleryPrevious, #galleryNext");
      if (button) preloadForControl(button);
    },
    { passive: true }
  );

  document.addEventListener("focusin", function(event) {
    const button = event.target.closest("#galleryPrevious, #galleryNext");
    if (button) preloadForControl(button);
  });

  document.addEventListener(
    "click",
    function(event) {
      const button = event.target.closest("#galleryPrevious, #galleryNext");
      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      changeSlide(button.id === "galleryPrevious" ? -1 : 1);
    },
    true
  );

  document.addEventListener(
    "touchstart",
    function(event) {
      const track = event.target.closest("#articleGalleryTrack");
      if (!track || !event.touches.length) return;
      touchStartX = event.touches[0].clientX;
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "touchend",
    function(event) {
      const track = event.target.closest("#articleGalleryTrack");
      if (!track || touchStartX === null || !event.changedTouches.length) return;

      const distance = touchStartX - event.changedTouches[0].clientX;
      touchStartX = null;

      if (Math.abs(distance) < 40) return;

      event.stopImmediatePropagation();
      changeSlide(distance > 0 ? 1 : -1);
    },
    true
  );
})();
