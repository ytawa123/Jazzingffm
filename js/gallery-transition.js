(function() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeDuration = reduceMotion ? 0 : 360;
  let touchStartX = null;

  function normalizeIndex(index, total) {
    return ((index % total) + total) % total;
  }

  function getGalleryState() {
    const track = document.getElementById("articleGalleryTrack");
    if (!track) return null;

    const slides = Array.from(track.children);
    if (!slides.length) return null;

    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden;
    });

    if (activeIndex < 0) activeIndex = 0;

    return {
      track: track,
      slides: slides,
      activeIndex: activeIndex
    };
  }

  function updateStatus(index, total) {
    const status = document.querySelector("#articleGallery .gallery-status");
    if (status) status.textContent = index + 1 + " / " + total;
  }

  function prepareImage(slide) {
    const image = slide && slide.querySelector("img");
    if (!image) return Promise.resolve();

    image.loading = "eager";

    function reveal() {
      slide.classList.add("is-loaded");
    }

    function decode() {
      if (image.naturalWidth > 0 && typeof image.decode === "function") {
        return image.decode().catch(function() {}).then(reveal);
      }

      reveal();
      return Promise.resolve();
    }

    if (image.complete) return decode();

    return new Promise(function(resolve) {
      function finish() {
        image.removeEventListener("load", finish);
        image.removeEventListener("error", finish);
        resolve();
      }

      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
    }).then(decode);
  }

  function cancelAnimations(slide) {
    if (!slide || typeof slide.getAnimations !== "function") return;
    slide.getAnimations().forEach(function(animation) {
      animation.cancel();
    });
    slide.style.opacity = "";
  }

  function setVisibleSlide(state, index) {
    const targetIndex = normalizeIndex(index, state.slides.length);

    state.slides.forEach(function(slide, slideIndex) {
      cancelAnimations(slide);
      const isActive = slideIndex === targetIndex;
      slide.hidden = !isActive;
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    state.track.dataset.fadeBusy = "false";
    state.track.dataset.galleryTargetIndex = String(targetIndex);
    state.track.classList.remove("gallery-fade-out");
    updateStatus(targetIndex, state.slides.length);
  }

  function runRequestedTransition(animate) {
    const state = getGalleryState();
    if (!state || state.slides.length < 2) return;
    if (state.track.dataset.fadeBusy === "true") return;

    let requestedIndex = Number(state.track.dataset.galleryTargetIndex);
    if (!Number.isInteger(requestedIndex)) requestedIndex = state.activeIndex;
    requestedIndex = normalizeIndex(requestedIndex, state.slides.length);

    if (requestedIndex === state.activeIndex) {
      setVisibleSlide(state, state.activeIndex);
      return;
    }

    state.track.dataset.fadeBusy = "true";
    const outgoingSlide = state.slides[state.activeIndex];
    const incomingSlide = state.slides[requestedIndex];

    prepareImage(incomingSlide).then(function() {
      const freshState = getGalleryState();
      if (!freshState || freshState.track !== state.track || !state.track.contains(incomingSlide)) {
        state.track.dataset.fadeBusy = "false";
        return;
      }

      const latestRequested = normalizeIndex(
        Number.isInteger(Number(state.track.dataset.galleryTargetIndex))
          ? Number(state.track.dataset.galleryTargetIndex)
          : requestedIndex,
        freshState.slides.length
      );

      if (latestRequested !== requestedIndex) {
        state.track.dataset.fadeBusy = "false";
        runRequestedTransition(true);
        return;
      }

      if (!animate || fadeDuration === 0 || typeof outgoingSlide.animate !== "function") {
        setVisibleSlide(freshState, requestedIndex);
        return;
      }

      incomingSlide.hidden = false;
      incomingSlide.setAttribute("aria-hidden", "false");
      outgoingSlide.setAttribute("aria-hidden", "true");

      const outgoingAnimation = outgoingSlide.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        {
          duration: fadeDuration,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards"
        }
      );

      const incomingAnimation = incomingSlide.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        {
          duration: fadeDuration,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards"
        }
      );

      Promise.all([
        outgoingAnimation.finished.catch(function() {}),
        incomingAnimation.finished.catch(function() {})
      ]).then(function() {
        const finalState = getGalleryState();
        if (!finalState || finalState.track !== state.track) return;

        setVisibleSlide(finalState, requestedIndex);

        const queuedIndex = normalizeIndex(
          Number.isInteger(Number(state.track.dataset.galleryTargetIndex))
            ? Number(state.track.dataset.galleryTargetIndex)
            : requestedIndex,
          finalState.slides.length
        );

        if (queuedIndex !== requestedIndex) {
          runRequestedTransition(true);
        }
      });
    });
  }

  function showIndex(index, animate) {
    const state = getGalleryState();
    if (!state) return;

    const targetIndex = normalizeIndex(index, state.slides.length);
    state.track.dataset.galleryTargetIndex = String(targetIndex);

    if (state.slides.length < 2 || animate === false) {
      setVisibleSlide(state, targetIndex);
      return;
    }

    runRequestedTransition(true);
  }

  function changeSlide(delta) {
    const state = getGalleryState();
    if (!state || state.slides.length < 2) return;

    const queuedIndex = Number(state.track.dataset.galleryTargetIndex);
    const baseIndex = Number.isInteger(queuedIndex) ? queuedIndex : state.activeIndex;
    showIndex(baseIndex + delta, true);
  }

  function initializeTrack(track) {
    if (!track) return;

    const slides = Array.from(track.children);
    if (!slides.length) return;

    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden;
    });
    if (activeIndex < 0) activeIndex = 0;

    slides.forEach(function(slide, index) {
      const isActive = index === activeIndex;
      slide.hidden = !isActive;
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      prepareImage(slide);
    });

    track.dataset.fadeBusy = "false";
    track.dataset.galleryTargetIndex = String(activeIndex);
    updateStatus(activeIndex, slides.length);
  }

  const initialTrack = document.getElementById("articleGalleryTrack");
  if (initialTrack) {
    initializeTrack(initialTrack);
    new MutationObserver(function() {
      initializeTrack(initialTrack);
    }).observe(initialTrack, { childList: true });
  }

  window.JAZZING_GALLERY = {
    showIndex: function(index, options) {
      showIndex(index, !(options && options.animate === false));
    },
    getActiveIndex: function() {
      const state = getGalleryState();
      return state ? state.activeIndex : 0;
    }
  };

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
