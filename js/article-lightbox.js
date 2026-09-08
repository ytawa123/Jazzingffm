(function() {
  let overlay = null;
  let stage = null;
  let lightboxImage = null;
  let previousButton = null;
  let nextButton = null;
  let closeButton = null;
  let status = null;
  let items = [];
  let activeIndex = 0;
  let previousBodyOverflow = "";
  let lastFocusedElement = null;

  function ensureLightbox() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "article-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-label", "Article photo viewer");

    overlay.innerHTML = `
      <button class="article-lightbox-close" type="button" aria-label="Close photo viewer">×</button>
      <button class="article-lightbox-control previous" type="button" aria-label="Previous photo">‹</button>
      <div class="article-lightbox-stage">
        <img class="article-lightbox-image" alt="" />
      </div>
      <button class="article-lightbox-control next" type="button" aria-label="Next photo">›</button>
      <div class="article-lightbox-status" aria-live="polite"></div>
    `;

    document.body.appendChild(overlay);

    stage = overlay.querySelector(".article-lightbox-stage");
    lightboxImage = overlay.querySelector(".article-lightbox-image");
    previousButton = overlay.querySelector(".article-lightbox-control.previous");
    nextButton = overlay.querySelector(".article-lightbox-control.next");
    closeButton = overlay.querySelector(".article-lightbox-close");
    status = overlay.querySelector(".article-lightbox-status");

    previousButton.addEventListener("click", function(event) {
      event.stopPropagation();
      move(-1);
    });

    nextButton.addEventListener("click", function(event) {
      event.stopPropagation();
      move(1);
    });

    closeButton.addEventListener("click", function(event) {
      event.stopPropagation();
      closeLightbox();
    });

    stage.addEventListener("click", function(event) {
      if (event.target === stage) {
        closeLightbox();
      }
    });

    overlay.addEventListener("click", function(event) {
      if (event.target === overlay) {
        closeLightbox();
      }
    });
  }

  function collectGalleryItems(track) {
    return Array.from(
      track.querySelectorAll(".article-hero-image.has-photo img")
    ).map(function(image) {
      return {
        element: image,
        src: image.currentSrc || image.src,
        alt: image.alt || ""
      };
    }).filter(function(item) {
      return Boolean(item.src);
    });
  }

  function preloadNeighbors() {
    if (items.length < 2) return;

    [
      (activeIndex - 1 + items.length) % items.length,
      (activeIndex + 1) % items.length
    ].forEach(function(index) {
      const preload = new Image();
      preload.src = items[index].src;
    });
  }

  function render() {
    if (!items.length) return;

    const item = items[activeIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    status.textContent = activeIndex + 1 + " / " + items.length;

    const hasMultiple = items.length > 1;
    previousButton.hidden = !hasMultiple;
    nextButton.hidden = !hasMultiple;

    preloadNeighbors();
  }

  function syncArticleGallery(delta) {
    const control = document.getElementById(
      delta < 0 ? "galleryPrevious" : "galleryNext"
    );

    if (control && !control.hidden) {
      control.click();
    }
  }

  function move(delta) {
    if (items.length < 2) return;

    syncArticleGallery(delta);
    activeIndex = (activeIndex + delta + items.length) % items.length;
    render();
  }

  function openLightbox(sourceImage) {
    const track = sourceImage.closest("#articleGalleryTrack");
    if (!track) return;

    const nextItems = collectGalleryItems(track);
    if (!nextItems.length) return;

    ensureLightbox();

    items = nextItems;
    activeIndex = Math.max(
      0,
      items.findIndex(function(item) {
        return item.element === sourceImage;
      })
    );

    render();

    lastFocusedElement = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    try {
      closeButton.focus({ preventScroll: true });
    } catch (error) {
      closeButton.focus();
    }
  }

  function closeLightbox() {
    if (!overlay || !overlay.classList.contains("is-open")) return;

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = previousBodyOverflow;

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      try {
        lastFocusedElement.focus({ preventScroll: true });
      } catch (error) {
        lastFocusedElement.focus();
      }
    }
  }

  document.addEventListener("click", function(event) {
    const sourceImage = event.target.closest(
      "#articleGalleryTrack .article-hero-image.has-photo img"
    );

    if (!sourceImage) return;
    openLightbox(sourceImage);
  });

  document.addEventListener("keydown", function(event) {
    if (!overlay || !overlay.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  });

  window.addEventListener("hashchange", closeLightbox);
  window.addEventListener("popstate", closeLightbox);
})();
