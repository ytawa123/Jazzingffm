(function() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeDuration = reduceMotion ? 160 : 420;
  let touchStartX = null;

  function getGalleryState() {
    const track = document.getElementById("articleGalleryTrack");
    if (!track) {
      return null;
    }

    const slides = Array.from(track.children);
    if (slides.length < 2) {
      return null;
    }

    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden;
    });

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    return { track: track, slides: slides, activeIndex: activeIndex };
  }

  function updateStatus(index, total) {
    const status = document.querySelector("#articleGallery .gallery-status");
    if (status) {
      status.textContent = index + 1 + " / " + total;
    }
  }

  function changeSlide(delta) {
    const state = getGalleryState();
    if (!state || state.track.dataset.fadeBusy === "true") {
      return;
    }

    const nextIndex =
      (state.activeIndex + delta + state.slides.length) % state.slides.length;

    if (nextIndex === state.activeIndex) {
      return;
    }

    state.track.dataset.fadeBusy = "true";
    state.track.style.transitionDuration = fadeDuration + "ms";
    state.track.classList.add("gallery-fade-out");

    window.setTimeout(function() {
      state.slides.forEach(function(slide, index) {
        const isActive = index === nextIndex;
        slide.hidden = !isActive;
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      updateStatus(nextIndex, state.slides.length);

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          state.track.classList.remove("gallery-fade-out");

          window.setTimeout(function() {
            state.track.dataset.fadeBusy = "false";
          }, fadeDuration + 40);
        });
      });
    }, fadeDuration + 40);
  }

  document.addEventListener(
    "click",
    function(event) {
      const button = event.target.closest("#galleryPrevious, #galleryNext");
      if (!button) {
        return;
      }

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
      if (!track || !event.touches.length) {
        return;
      }

      touchStartX = event.touches[0].clientX;
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "touchend",
    function(event) {
      const track = event.target.closest("#articleGalleryTrack");
      if (!track || touchStartX === null || !event.changedTouches.length) {
        return;
      }

      const distance = touchStartX - event.changedTouches[0].clientX;
      touchStartX = null;

      if (Math.abs(distance) < 40) {
        return;
      }

      event.stopImmediatePropagation();
      changeSlide(distance > 0 ? 1 : -1);
    },
    true
  );
})();
