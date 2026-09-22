(function() {
  let touchStartX = null;
  let preloadHandle = null;
  let preloadTimer = null;

  function ensureImageLoaded(slide, priority) {
    const image = slide && slide.querySelector("img");
    if (!image) return Promise.resolve();

    image.fetchPriority = priority === "high" ? "high" : "low";

    return new Promise(function(resolve) {
      let settled = false;

      function finish() {
        if (settled) return;
        settled = true;
        slide.classList.add("is-loaded");
        resolve();
      }

      if (image.getAttribute("src") && image.complete) {
        finish();
        return;
      }

      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });

      if (!image.getAttribute("src") && image.dataset.src) {
        image.loading = "eager";
        image.src = image.dataset.src;
      }
    });
  }

  function getGalleryState() {
    const track = document.getElementById("articleGalleryTrack");
    if (!track) return null;

    const slides = Array.from(track.children);
    if (!slides.length) return null;

    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden && slide.style.display !== "none";
    });

    if (activeIndex < 0) activeIndex = 0;

    return { slides: slides, activeIndex: activeIndex };
  }

  function updateStatus(index, total) {
    const status = document.querySelector("#articleGallery .gallery-status");
    if (status) {
      status.textContent = total > 1 ? index + 1 + " / " + total : "";
    }
  }

  function setVisibleSlide(slides, activeIndex) {
    slides.forEach(function(slide, index) {
      const isActive = index === activeIndex;
      slide.hidden = !isActive;
      slide.style.display = isActive ? "block" : "none";
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
  }

  function clearScheduledPreload() {
    if (preloadHandle !== null && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(preloadHandle);
    }
    if (preloadTimer !== null) {
      window.clearTimeout(preloadTimer);
    }
    preloadHandle = null;
    preloadTimer = null;
  }

  function scheduleNextPreload(slides, activeIndex) {
    if (slides.length < 2) return;
    clearScheduledPreload();

    const preload = function() {
      preloadHandle = null;
      preloadTimer = null;
      ensureImageLoaded(slides[(activeIndex + 1) % slides.length], "low");
    };

    if ("requestIdleCallback" in window) {
      preloadHandle = window.requestIdleCallback(preload, { timeout: 1200 });
    } else {
      preloadTimer = window.setTimeout(preload, 250);
    }
  }

  function changeSlide(delta) {
    const state = getGalleryState();
    if (!state || state.slides.length < 2) return;

    clearScheduledPreload();
    const nextIndex =
      (state.activeIndex + delta + state.slides.length) % state.slides.length;

    ensureImageLoaded(state.slides[nextIndex], "high").then(function() {
      setVisibleSlide(state.slides, nextIndex);
      updateStatus(nextIndex, state.slides.length);
      scheduleNextPreload(state.slides, nextIndex);
    });
  }

  function normalizeCurrentGallery() {
    const state = getGalleryState();
    if (!state) return;

    setVisibleSlide(state.slides, state.activeIndex);
    updateStatus(state.activeIndex, state.slides.length);
    ensureImageLoaded(state.slides[state.activeIndex], "high").then(function() {
      scheduleNextPreload(state.slides, state.activeIndex);
    });
  }

  normalizeCurrentGallery();

  const galleryTrack = document.getElementById("articleGalleryTrack");
  if (galleryTrack && "MutationObserver" in window) {
    new MutationObserver(function(mutations) {
      const changed = mutations.some(function(mutation) {
        return mutation.type === "childList";
      });
      if (changed) normalizeCurrentGallery();
    }).observe(galleryTrack, { childList: true });
  }

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
