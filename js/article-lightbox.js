(function() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlayDuration = reduceMotion ? 0 : 480;
  const imageFadeDuration = reduceMotion ? 0 : 300;
  let lightbox = null;
  let lightboxImage = null;
  let lightboxStatus = null;
  let lightboxPrevious = null;
  let lightboxNext = null;
  let galleryImages = [];
  let activeIndex = 0;
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
      '<figure class="article-lightbox__figure">' +
        '<img class="article-lightbox__image" alt="" />' +
        '<div class="article-lightbox__status" aria-live="polite"></div>' +
      '</figure>' +
      '<button class="article-lightbox__control article-lightbox__next" type="button">›</button>';

    document.body.appendChild(lightbox);
    lightboxImage = lightbox.querySelector(".article-lightbox__image");
    lightboxStatus = lightbox.querySelector(".article-lightbox__status");
    lightboxPrevious = lightbox.querySelector(".article-lightbox__previous");
    lightboxNext = lightbox.querySelector(".article-lightbox__next");
  }

  function updateLabels() {
    const copy = strings();

    lightbox.setAttribute("aria-label", copy.dialog);
    lightboxPrevious.setAttribute("aria-label", copy.previous);
    lightboxNext.setAttribute("aria-label", copy.next);
  }

  function swapImage(request) {
    if (request !== imageRequest || !galleryImages.length) return;

    const sourceImage = galleryImages[activeIndex];
    lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
    lightboxImage.alt = sourceImage.alt;
    lightboxStatus.textContent = activeIndex + 1 + " / " + galleryImages.length;

  }

  function prepareImage(sourceImage) {
    sourceImage.loading = "eager";

    function decode() {
      if (sourceImage.naturalWidth > 0 && typeof sourceImage.decode === "function") {
        return sourceImage.decode().catch(function() {});
      }

      return Promise.resolve();
    }

    if (sourceImage.complete) return decode();

    return new Promise(function(resolve) {
      function finish() {
        sourceImage.removeEventListener("load", finish);
        sourceImage.removeEventListener("error", finish);
        resolve();
      }

      sourceImage.addEventListener("load", finish, { once: true });
      sourceImage.addEventListener("error", finish, { once: true });
    }).then(decode);
  }

  function revealImage(request) {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        if (request === imageRequest) lightboxImage.classList.remove("is-changing");
      });
    });
  }

  function showImage(index, animate) {
    if (!galleryImages.length) return;

    activeIndex = (index + galleryImages.length) % galleryImages.length;
    const request = ++imageRequest;

    if (!animate || imageFadeDuration === 0 || !lightboxImage.getAttribute("src")) {
      lightboxImage.classList.remove("is-changing");
      swapImage(request);
      return;
    }

    prepareImage(galleryImages[activeIndex]).then(function() {
      if (request !== imageRequest) return;

      lightboxImage.classList.add("is-changing");
      window.setTimeout(function() {
        if (request !== imageRequest) return;
        swapImage(request);
        revealImage(request);
      }, imageFadeDuration);
    });
  }

  function syncArticleGallery() {
    const activeImage = galleryImages[activeIndex];
    const gallery = activeImage && activeImage.closest(".article-gallery");
    if (!gallery) return;

    const track = gallery.querySelector(".article-gallery-track");
    const slides = track ? Array.from(track.children) : [];

    slides.forEach(function(slide, index) {
      const isActive = index === activeIndex;
      if (typeof slide.getAnimations === "function") {
        slide.getAnimations().forEach(function(animation) {
          animation.cancel();
        });
      }
      slide.hidden = !isActive;
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    if (track) {
      track.classList.remove("gallery-fade-out");
      track.dataset.fadeBusy = "false";
    }

    const status = gallery.querySelector(".gallery-status");
    if (status) status.textContent = activeIndex + 1 + " / " + slides.length;
  }

  function openLightbox(sourceImage) {
    const gallery = sourceImage.closest(".article-gallery");
    if (!gallery) return;

    galleryImages = Array.from(gallery.querySelectorAll(".article-hero-image.has-photo img"));
    if (!galleryImages.length) return;

    createLightbox();
    updateLabels();
    window.clearTimeout(closeTimer);
    previousFocus = sourceImage;
    activeIndex = galleryImages.indexOf(sourceImage);
    if (activeIndex < 0) activeIndex = 0;
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
    lightboxImage.classList.remove("is-changing");
    lightbox.classList.remove("is-open");
    document.body.classList.remove("article-lightbox-open");

    const focusTarget = galleryImages[activeIndex] || previousFocus;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(function() {
      lightbox.hidden = true;
      lightboxImage.removeAttribute("src");
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
      showImage(activeIndex - 1, true);
    } else if (event.target.closest(".article-lightbox__next")) {
      showImage(activeIndex + 1, true);
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
      showImage(activeIndex - 1, true);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showImage(activeIndex + 1, true);
    }
  });

  document.addEventListener("touchstart", function(event) {
    if (!lightbox || lightbox.hidden || !event.target.closest(".article-lightbox__figure")) return;
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  document.addEventListener("touchend", function(event) {
    if (!lightbox || lightbox.hidden || touchStartX === null || !event.changedTouches.length) return;

    const distance = touchStartX - event.changedTouches[0].clientX;
    touchStartX = null;

    if (Math.abs(distance) < 40) return;
    showImage(activeIndex + (distance > 0 ? 1 : -1), true);
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
