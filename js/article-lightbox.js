(function() {
  let lightbox = null;
  let lightboxImage = null;
  let lightboxStatus = null;
  let lightboxPrevious = null;
  let lightboxNext = null;
  let lightboxClose = null;
  let galleryImages = [];
  let activeIndex = 0;
  let previousFocus = null;
  let touchStartX = null;

  function strings() {
    const isGerman = document.documentElement.lang === "de";

    return isGerman
      ? {
          dialog: "Fotogalerie",
          open: "Foto in Originalgröße öffnen",
          previous: "Vorheriges Foto",
          next: "Nächstes Foto",
          close: "Galerie schließen"
        }
      : {
          dialog: "Photo gallery",
          open: "Open photo at full size",
          previous: "Previous photo",
          next: "Next photo",
          close: "Close gallery"
        };
  }

  function createLightbox() {
    if (lightbox) return;

    lightbox = document.createElement("div");
    lightbox.className = "article-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.innerHTML =
      '<button class="article-lightbox__control article-lightbox__close" type="button">×</button>' +
      '<button class="article-lightbox__control article-lightbox__previous" type="button">‹</button>' +
      '<figure class="article-lightbox__figure"><img class="article-lightbox__image" alt="" /></figure>' +
      '<button class="article-lightbox__control article-lightbox__next" type="button">›</button>' +
      '<div class="article-lightbox__status" aria-live="polite"></div>';

    document.body.appendChild(lightbox);
    lightboxImage = lightbox.querySelector(".article-lightbox__image");
    lightboxStatus = lightbox.querySelector(".article-lightbox__status");
    lightboxPrevious = lightbox.querySelector(".article-lightbox__previous");
    lightboxNext = lightbox.querySelector(".article-lightbox__next");
    lightboxClose = lightbox.querySelector(".article-lightbox__close");
  }

  function updateLabels() {
    const copy = strings();

    lightbox.setAttribute("aria-label", copy.dialog);
    lightboxPrevious.setAttribute("aria-label", copy.previous);
    lightboxNext.setAttribute("aria-label", copy.next);
    lightboxClose.setAttribute("aria-label", copy.close);
  }

  function showImage(index) {
    if (!galleryImages.length) return;

    activeIndex = (index + galleryImages.length) % galleryImages.length;
    const sourceImage = galleryImages[activeIndex];

    lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
    lightboxImage.alt = sourceImage.alt;
    lightboxStatus.textContent = activeIndex + 1 + " / " + galleryImages.length;
  }

  function openLightbox(sourceImage) {
    const gallery = sourceImage.closest('.article-gallery[data-photo-lightbox="true"]');
    if (!gallery) return;

    galleryImages = Array.from(gallery.querySelectorAll(".article-hero-image.has-photo img"));
    if (!galleryImages.length) return;

    createLightbox();
    updateLabels();
    previousFocus = sourceImage;
    activeIndex = galleryImages.indexOf(sourceImage);
    if (activeIndex < 0) activeIndex = 0;
    showImage(activeIndex);
    lightbox.hidden = false;
    document.body.classList.add("article-lightbox-open");
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;

    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.classList.remove("article-lightbox-open");

    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
  }

  function decorateGalleryImages() {
    const copy = strings();

    document.querySelectorAll('.article-gallery[data-photo-lightbox="true"] .article-hero-image.has-photo img').forEach(function(image) {
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-label", copy.open);
    });
  }

  document.addEventListener("click", function(event) {
    const sourceImage = event.target.closest('.article-gallery[data-photo-lightbox="true"] .article-hero-image.has-photo img');

    if (sourceImage) {
      event.preventDefault();
      openLightbox(sourceImage);
      return;
    }

    if (!lightbox || lightbox.hidden) return;

    if (event.target === lightbox || event.target === lightboxClose) {
      closeLightbox();
    } else if (event.target === lightboxPrevious) {
      showImage(activeIndex - 1);
    } else if (event.target === lightboxNext) {
      showImage(activeIndex + 1);
    }
  });

  document.addEventListener("keydown", function(event) {
    const sourceImage = event.target.closest && event.target.closest('.article-gallery[data-photo-lightbox="true"] .article-hero-image.has-photo img');

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
      showImage(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showImage(activeIndex + 1);
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
    showImage(activeIndex + (distance > 0 ? 1 : -1));
  }, { passive: true });

  const gallery = document.getElementById("articleGallery");
  if (gallery) {
    new MutationObserver(decorateGalleryImages).observe(gallery, {
      attributes: true,
      attributeFilter: ["data-photo-lightbox"],
      childList: true,
      subtree: true
    });
  }

  decorateGalleryImages();
})();
