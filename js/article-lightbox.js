(function() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlayDuration = reduceMotion ? 0 : 480;
  const imageFadeDuration = reduceMotion ? 0 : 360;
  let lightbox = null;
  let lightboxLayers = [];
  let lightboxPrevious = null;
  let lightboxNext = null;
  let galleryImages = [];
  let activeIndex = 0;
  let requestedIndex = 0;
  let activeLayerIndex = 0;
  let transitionBusy = false;
  let previousFocus = null;
  let touchStartX = null;
  let closeTimer = null;
  let imageRequest = 0;

  function strings() {
    const isGerman = document.documentElement.lang === "de";

    return isGerman
      ? {
          dialog: "Fotogalerie",
          open: "Foto in Originalgröße öffnen",
          previous: "Vorheriges Foto",
          next: "Nächstes Foto"
        }
      : {
          dialog: "Photo gallery",
          open: "Open photo at full size",
          previous: "Previous photo",
          next: "Next photo"
        };
  }

  function normalizeIndex(index) {
    return ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
  }

  function createLightbox() {
    if (lightbox) return;

    lightbox = document.createElement("div");
    lightbox.className = "article-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("tabindex", "-1");
    lightbox.innerHTML =
      '<button class="article-lightbox__control article-lightbox__previous" type="button">‹</button>' +
      '<div class="article-lightbox__stage">' +
        '<div class="article-lightbox__layer is-visible">' +
          '<figure class="article-lightbox__frame">' +
            '<img class="article-lightbox__image" alt="" />' +
            '<div class="article-lightbox__status" aria-live="polite"></div>' +
          '</figure>' +
        '</div>' +
        '<div class="article-lightbox__layer">' +
          '<figure class="article-lightbox__frame">' +
            '<img class="article-lightbox__image" alt="" />' +
            '<div class="article-lightbox__status" aria-hidden="true"></div>' +
          '</figure>' +
        '</div>' +
      '</div>' +
      '<button class="article-lightbox__control article-lightbox__next" type="button">›</button>';

    document.body.appendChild(lightbox);
    lightboxLayers = Array.from(lightbox.querySelectorAll(".article-lightbox__layer"));
    lightboxPrevious = lightbox.querySelector(".article-lightbox__previous");
    lightboxNext = lightbox.querySelector(".article-lightbox__next");
  }

  function updateLabels() {
    const copy = strings();

    lightbox.setAttribute("aria-label", copy.dialog);
    lightboxPrevious.setAttribute("aria-label", copy.previous);
    lightboxNext.setAttribute("aria-label", copy.next);
  }

  function layerImage(layer) {
    return layer.querySelector(".article-lightbox__image");
  }

  function layerStatus(layer) {
    return layer.querySelector(".article-lightbox__status");
  }

  function fillLayer(layer, index) {
    const sourceImage = galleryImages[index];
    const image = layerImage(layer);
    const status = layerStatus(layer);

    image.src = sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt;
    status.textContent = index + 1 + " / " + galleryImages.length;
  }

  function clearLayer(layer) {
    layer.classList.remove("is-visible");
    layerImage(layer).removeAttribute("src");
    layerImage(layer).alt = "";
    layerStatus(layer).textContent = "";
  }

  function setLiveStatus(layer) {
    lightboxLayers.forEach(function(candidate) {
      const status = layerStatus(candidate);
      const isActive = candidate === layer;
      status.setAttribute("aria-hidden", isActive ? "false" : "true");
      if (isActive) {
        status.setAttribute("aria-live", "polite");
      } else {
        status.removeAttribute("aria-live");
      }
    });
  }

  function prepareImage(image) {
    image.loading = "eager";

    function decode() {
      if (image.naturalWidth > 0 && typeof image.decode === "function") {
        return image.decode().catch(function() {});
      }
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

  function setImageImmediately(index) {
    lightboxLayers.forEach(clearLayer);
    activeIndex = normalizeIndex(index);
    requestedIndex = activeIndex;
    activeLayerIndex = 0;
    fillLayer(lightboxLayers[activeLayerIndex], activeIndex);
    lightboxLayers[activeLayerIndex].classList.add("is-visible");
    setLiveStatus(lightboxLayers[activeLayerIndex]);
    transitionBusy = false;
  }

  function runRequestedImage() {
    if (!galleryImages.length || transitionBusy) return;

    const nextIndex = normalizeIndex(requestedIndex);
    if (nextIndex === activeIndex) return;

    transitionBusy = true;
    const request = ++imageRequest;
    const outgoingLayer = lightboxLayers[activeLayerIndex];
    const incomingLayerIndex = activeLayerIndex === 0 ? 1 : 0;
    const incomingLayer = lightboxLayers[incomingLayerIndex];

    clearLayer(incomingLayer);
    fillLayer(incomingLayer, nextIndex);

    prepareImage(layerImage(incomingLayer)).then(function() {
      if (request !== imageRequest) return;

      if (normalizeIndex(requestedIndex) !== nextIndex) {
        clearLayer(incomingLayer);
        transitionBusy = false;
        runRequestedImage();
        return;
      }

      activeIndex = nextIndex;

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          if (request !== imageRequest) return;

          incomingLayer.classList.add("is-visible");
          outgoingLayer.classList.remove("is-visible");
          setLiveStatus(incomingLayer);

          window.setTimeout(function() {
            if (request !== imageRequest) return;

            clearLayer(outgoingLayer);
            activeLayerIndex = incomingLayerIndex;
            transitionBusy = false;

            if (normalizeIndex(requestedIndex) !== activeIndex) {
              runRequestedImage();
            }
          }, imageFadeDuration);
        });
      });
    });
  }

  function showImage(index, animate) {
    if (!galleryImages.length) return;

    requestedIndex = normalizeIndex(index);

    if (!animate || imageFadeDuration === 0) {
      imageRequest += 1;
      setImageImmediately(requestedIndex);
      return;
    }

    runRequestedImage();
  }

  function stepImage(delta) {
    if (!galleryImages.length) return;
    const baseIndex = transitionBusy ? requestedIndex : activeIndex;
    showImage(baseIndex + delta, true);
  }

  function syncArticleGallery() {
    if (!galleryImages.length) return;

    if (window.JAZZING_GALLERY && typeof window.JAZZING_GALLERY.showIndex === "function") {
      window.JAZZING_GALLERY.showIndex(activeIndex, { animate: false });
      return;
    }

    const activeImage = galleryImages[activeIndex];
    const gallery = activeImage && activeImage.closest(".article-gallery");
    if (!gallery) return;

    const track = gallery.querySelector(".article-gallery-track");
    const slides = track ? Array.from(track.children) : [];

    slides.forEach(function(slide, index) {
      if (typeof slide.getAnimations === "function") {
        slide.getAnimations().forEach(function(animation) {
          animation.cancel();
        });
      }
      const isActive = index === activeIndex;
      slide.hidden = !isActive;
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      slide.style.opacity = "";
    });

    if (track) {
      track.classList.remove("gallery-fade-out");
      track.dataset.fadeBusy = "false";
      track.dataset.galleryTargetIndex = String(activeIndex);
    }

    const status = gallery.querySelector(".gallery-status");
    if (status) status.textContent = activeIndex + 1 + " / " + slides.length;
  }

  function openLightbox(sourceImage) {
    const gallery = sourceImage.closest(".article-gallery");
    if (!gallery) return;

    galleryImages = Array.from(gallery.querySelectorAll(".article-hero-image.has-photo img"));
    if (!galleryImages.length) return;

    galleryImages.forEach(function(image) {
      prepareImage(image);
    });

    createLightbox();
    updateLabels();
    window.clearTimeout(closeTimer);
    previousFocus = sourceImage;
    activeIndex = galleryImages.indexOf(sourceImage);
    if (activeIndex < 0) activeIndex = 0;
    requestedIndex = activeIndex;
    showImage(activeIndex, false);
    lightbox.hidden = false;
    document.body.classList.add("article-lightbox-open");

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        lightbox.classList.add("is-open");
        lightboxPrevious.focus();
      });
    });
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;

    syncArticleGallery();
    imageRequest += 1;
    transitionBusy = false;
    requestedIndex = activeIndex;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("article-lightbox-open");

    const focusTarget = galleryImages[activeIndex] || previousFocus;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(function() {
      lightbox.hidden = true;
      lightboxLayers.forEach(clearLayer);
      if (focusTarget && document.contains(focusTarget)) focusTarget.focus();
    }, overlayDuration);
  }

  function decorateGalleryImages() {
    const copy = strings();

    document.querySelectorAll(".article-gallery .article-hero-image.has-photo img").forEach(function(image) {
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-label", copy.open);
    });
  }

  document.addEventListener("click", function(event) {
    const sourceImage = event.target.closest(".article-gallery .article-hero-image.has-photo img");

    if (sourceImage) {
      event.preventDefault();
      openLightbox(sourceImage);
      return;
    }

    if (!lightbox || lightbox.hidden) return;

    if (event.target.closest(".article-lightbox__previous")) {
      stepImage(-1);
    } else if (event.target.closest(".article-lightbox__next")) {
      stepImage(1);
    } else if (!event.target.closest(".article-lightbox__image")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", function(event) {
    const sourceImage = event.target.closest && event.target.closest(".article-gallery .article-hero-image.has-photo img");

    if (sourceImage && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openLightbox(sourceImage);
      return;
    }

    if (!lightbox || lightbox.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepImage(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepImage(1);
    }
  });

  document.addEventListener("touchstart", function(event) {
    if (!lightbox || lightbox.hidden || !event.target.closest(".article-lightbox__image")) return;
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  document.addEventListener("touchend", function(event) {
    if (!lightbox || lightbox.hidden || touchStartX === null || !event.changedTouches.length) return;

    const distance = touchStartX - event.changedTouches[0].clientX;
    touchStartX = null;

    if (Math.abs(distance) < 40) return;
    stepImage(distance > 0 ? 1 : -1);
  }, { passive: true });

  const gallery = document.getElementById("articleGallery");
  if (gallery) {
    new MutationObserver(decorateGalleryImages).observe(gallery, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true
    });
  }

  decorateGalleryImages();
})();
