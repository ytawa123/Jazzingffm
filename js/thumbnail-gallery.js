(function() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeDuration = reduceMotion ? 120 : 320;

  function getGalleryState() {
    const gallery = document.querySelector('[data-gallery-style="thumbnails"]');
    const track = gallery && gallery.querySelector("#articleGalleryTrack");
    const thumbnails = gallery && gallery.querySelectorAll(".gallery-thumbnail");

    if (!gallery || !track || !thumbnails || !thumbnails.length) {
      return null;
    }

    const slides = Array.from(track.children);
    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden;
    });

    if (activeIndex < 0) activeIndex = 0;

    return {
      gallery: gallery,
      track: track,
      slides: slides,
      thumbnails: Array.from(thumbnails),
      activeIndex: activeIndex
    };
  }

  function prepareImage(slide) {
    const image = slide && slide.querySelector("img");

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

  function fitTrackToImage(track, slide) {
    const image = slide && slide.querySelector("img");

    if (!track || !image || !image.naturalWidth || !image.naturalHeight) return;

    const width = image.naturalWidth;
    const height = image.naturalHeight;

    track.style.setProperty("--gallery-image-ratio", width + " / " + height);
    track.dataset.imageOrientation = height > width ? "portrait" : "landscape";
  }

  function fitTrackToActiveImage(track) {
    const activeSlide = track && Array.from(track.children).find(function(slide) {
      return !slide.hidden;
    });

    fitTrackToImage(track, activeSlide);
  }

  function showSlide(nextIndex) {
    const state = getGalleryState();

    if (
      !state ||
      nextIndex === state.activeIndex ||
      !state.slides[nextIndex] ||
      state.track.dataset.fadeBusy === "true"
    ) {
      return;
    }

    state.track.dataset.fadeBusy = "true";
    state.track.style.transitionDuration = fadeDuration + "ms";
    state.track.classList.add("gallery-fade-out");

    window.setTimeout(function() {
      prepareImage(state.slides[nextIndex]).then(function() {
        fitTrackToImage(state.track, state.slides[nextIndex]);

        state.slides.forEach(function(slide, index) {
          const isActive = index === nextIndex;
          slide.hidden = !isActive;
          slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        });

        state.thumbnails.forEach(function(thumbnail, index) {
          thumbnail.setAttribute("aria-pressed", index === nextIndex ? "true" : "false");
        });

        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            state.track.classList.remove("gallery-fade-out");

            window.setTimeout(function() {
              state.track.dataset.fadeBusy = "false";
            }, fadeDuration + 40);
          });
        });
      });
    }, fadeDuration);
  }

  document.addEventListener("click", function(event) {
    const thumbnail = event.target.closest('[data-gallery-style="thumbnails"] .gallery-thumbnail');

    if (!thumbnail) return;

    event.preventDefault();
    showSlide(Number(thumbnail.dataset.galleryIndex));
  });

  document.addEventListener("load", function(event) {
    const image = event.target;

    if (!(image instanceof HTMLImageElement)) return;

    const slide = image.closest('[data-gallery-style="thumbnails"] .article-hero-image');
    const track = slide && slide.closest(".article-gallery-track");

    if (slide && track && !slide.hidden) fitTrackToImage(track, slide);
  }, true);

  const observedTrack = document.querySelector('[data-gallery-style="thumbnails"] .article-gallery-track');
  if (observedTrack) {
    new MutationObserver(function() {
      fitTrackToActiveImage(observedTrack);
    }).observe(observedTrack, {
      attributes: true,
      attributeFilter: ["hidden"],
      childList: true,
      subtree: true
    });
  }

  const initialState = getGalleryState();
  if (initialState) {
    prepareImage(initialState.slides[initialState.activeIndex]).then(function() {
      fitTrackToImage(initialState.track, initialState.slides[initialState.activeIndex]);
    });
  }
})();
