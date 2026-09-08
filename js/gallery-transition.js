(function() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeDuration = reduceMotion ? 0 : 320;
  let touchStartX = null;
  let requestedIndex = null;
  let transitionId = 0;
  let transitionBusy = false;

  function getGalleryState() {
    const track = document.getElementById("articleGalleryTrack");
    if (!track) return null;

    const slides = Array.from(track.children);
    if (!slides.length) return null;

    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden;
    });

    if (activeIndex < 0) activeIndex = 0;
    return { track: track, slides: slides, activeIndex: activeIndex };
  }

  function normalizeIndex(index, total) {
    return (index + total) % total;
  }

  function updateStatus(index, total) {
    const status = document.querySelector("#articleGallery .gallery-status");
    if (status) status.textContent = index + 1 + " / " + total;
  }

  function prepareImage(slide) {
    const image = slide.querySelector("img");
    if (!image) return Promise.resolve();

    image.loading = "eager";

    function reveal() {
      slide.classList.add("is-loaded");
    }

    if (image.complete) {
      if (image.naturalWidth > 0 && typeof image.decode === "function") {
        return image.decode().catch(function() {}).then(reveal);
      }

      reveal();
      return Promise.resolve();
    }

    return new Promise(function(resolve) {
      function finish() {
        image.removeEventListener("load", finish);
        image.removeEventListener("error", finish);
        reveal();
        resolve();
      }

      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
    });
  }

  function cancelSlideAnimations(slides) {
    slides.forEach(function(slide) {
      if (typeof slide.getAnimations === "function") {
        slide.getAnimations().forEach(function(animation) {
          animation.cancel();
        });
      }

      slide.style.removeProperty("opacity");
    });
  }

  function setVisibleImmediately(index) {
    const state = getGalleryState();
    if (!state) return;

    const targetIndex = normalizeIndex(index, state.slides.length);
    transitionId += 1;
    transitionBusy = false;
    requestedIndex = targetIndex;
    cancelSlideAnimations(state.slides);

    state.slides.forEach(function(slide, slideIndex) {
      const isActive = slideIndex === targetIndex;
      slide.hidden = !isActive;
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    state.track.dataset.fadeBusy = "false";
    state.track.classList.remove("gallery-fade-out");
    updateStatus(targetIndex, state.slides.length);
    prepareImage(state.slides[targetIndex]);
  }

  function runTransition(targetIndex) {
    const state = getGalleryState();
    if (!state) return;

    const normalizedTarget = normalizeIndex(targetIndex, state.slides.length);
    if (normalizedTarget === state.activeIndex || fadeDuration === 0) {
      setVisibleImmediately(normalizedTarget);
      return;
    }

    transitionBusy = true;
    state.track.dataset.fadeBusy = "true";
    const currentSlide = state.slides[state.activeIndex];
    const nextSlide = state.slides[normalizedTarget];
    const currentTransition = ++transitionId;

    prepareImage(nextSlide).then(function() {
      if (currentTransition !== transitionId) return;

      if (requestedIndex !== normalizedTarget) {
        transitionBusy = false;
        state.track.dataset.fadeBusy = "false";
        runTransition(requestedIndex);
        return;
      }

      nextSlide.hidden = false;
      nextSlide.setAttribute("aria-hidden", "false");
      nextSlide.style.opacity = "0";
      currentSlide.style.opacity = "1";

      if (typeof currentSlide.animate !== "function" || typeof nextSlide.animate !== "function") {
        setVisibleImmediately(normalizedTarget);
        return;
      }

      const timing = {
        duration: fadeDuration,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards"
      };
      const fadeOut = currentSlide.animate([{ opacity: 1 }, { opacity: 0 }], timing);
      const fadeIn = nextSlide.animate([{ opacity: 0 }, { opacity: 1 }], timing);

      Promise.all([
        fadeOut.finished.catch(function() {}),
        fadeIn.finished.catch(function() {})
      ]).then(function() {
        if (currentTransition !== transitionId) return;

        cancelSlideAnimations(state.slides);
        state.slides.forEach(function(slide, slideIndex) {
          const isActive = slideIndex === normalizedTarget;
          slide.hidden = !isActive;
          slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        });

        updateStatus(normalizedTarget, state.slides.length);
        transitionBusy = false;
        state.track.dataset.fadeBusy = "false";

        if (requestedIndex !== normalizedTarget) runTransition(requestedIndex);
      });
    });
  }

  function selectImage(index, options) {
    const state = getGalleryState();
    if (!state) return;

    requestedIndex = normalizeIndex(index, state.slides.length);
    if (options && options.animate === false) {
      setVisibleImmediately(requestedIndex);
      return;
    }

    if (!transitionBusy) runTransition(requestedIndex);
  }

  function navigate(delta) {
    const state = getGalleryState();
    if (!state || state.slides.length < 2) return;

    const baseIndex = transitionBusy && requestedIndex !== null
      ? requestedIndex
      : state.activeIndex;
    selectImage(baseIndex + delta, { animate: true });
  }

  window.JAZZING_GALLERY = {
    select: selectImage
  };

  const initialState = getGalleryState();
  if (initialState) {
    requestedIndex = initialState.activeIndex;
    prepareImage(initialState.slides[initialState.activeIndex]);
  }

  document.addEventListener(
    "click",
    function(event) {
      const button = event.target.closest("#galleryPrevious, #galleryNext");
      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(button.id === "galleryPrevious" ? -1 : 1);
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
      navigate(distance > 0 ? 1 : -1);
    },
    true
  );
})();
