from pathlib import Path

js_path = Path("js/app.js")
js = js_path.read_text()
start = js.index("    function renderArticleGallery(article, copy) {")
end = js.index("    function renderArticle(slug) {", start)
new_gallery = '''    function renderArticleGallery(article, copy) {
      const galleryImages =
        Array.isArray(article.images) && article.images.length
          ? article.images
          : article.image
            ? [article.image]
            : [];

      articleGalleryTrack.innerHTML = "";
      const galleryRoot = articleGalleryTrack.parentElement;
      let galleryStatus = galleryRoot.querySelector(".gallery-status");

      if (!galleryStatus) {
        galleryStatus = document.createElement("div");
        galleryStatus.className = "gallery-status";
        galleryStatus.setAttribute("aria-live", "polite");
        galleryRoot.appendChild(galleryStatus);
      }

      if (galleryImages.length) {
        galleryImages.forEach(function(imagePath, index) {
          const slide = document.createElement("div");
          const image = document.createElement("img");

          slide.className = "article-hero-image has-photo";
          slide.hidden = index !== 0;
          image.src = imagePath;
          image.alt =
            article.cardTitle[currentLang] +
            " — photo " +
            (index + 1) +
            " of " +
            galleryImages.length;
          image.loading = "eager";

          image.addEventListener("error", function() {
            slide.classList.remove("has-photo");
            slide.textContent =
              article.imageLabel[currentLang] + " (" + imagePath + ")";
            image.remove();
          });

          slide.appendChild(image);
          articleGalleryTrack.appendChild(slide);
        });
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "article-hero-image";
        placeholder.textContent = article.imageLabel[currentLang];
        articleGalleryTrack.appendChild(placeholder);
      }

      const slides = Array.from(articleGalleryTrack.children);
      const slideCount = slides.length;
      const hasMultiplePhotos = slideCount > 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let activeIndex = 0;
      let isAnimating = false;

      galleryPrevious.hidden = !hasMultiplePhotos;
      galleryNext.hidden = !hasMultiplePhotos;
      galleryStatus.hidden = !hasMultiplePhotos;
      galleryPrevious.setAttribute("aria-label", copy.article.previousPhoto);
      galleryNext.setAttribute("aria-label", copy.article.nextPhoto);

      function updateStatus() {
        galleryStatus.textContent = activeIndex + 1 + " / " + slideCount;
      }

      function setVisibleSlide(index) {
        activeIndex = (index + slideCount) % slideCount;
        slides.forEach(function(slide, slideIndex) {
          const isActive = slideIndex === activeIndex;
          slide.hidden = !isActive;
          slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        });
        updateStatus();
      }

      function showSlide(index, direction) {
        if (isAnimating || slideCount < 1) {
          return;
        }

        const nextIndex = (index + slideCount) % slideCount;
        if (nextIndex === activeIndex) {
          return;
        }

        const currentSlide = slides[activeIndex];
        const nextSlide = slides[nextIndex];
        const travelDirection = direction < 0 ? -1 : 1;

        if (reduceMotion || typeof currentSlide.animate !== "function") {
          setVisibleSlide(nextIndex);
          return;
        }

        isAnimating = true;
        nextSlide.hidden = false;
        nextSlide.setAttribute("aria-hidden", "false");

        const duration = 430;
        const easing = "cubic-bezier(0.22, 0.61, 0.36, 1)";
        const currentAnimation = currentSlide.animate(
          [
            { transform: "translateX(0%)" },
            { transform: "translateX(" + (-travelDirection * 100) + "%)" }
          ],
          { duration: duration, easing: easing }
        );
        const nextAnimation = nextSlide.animate(
          [
            { transform: "translateX(" + (travelDirection * 100) + "%)" },
            { transform: "translateX(0%)" }
          ],
          { duration: duration, easing: easing }
        );

        Promise.allSettled([currentAnimation.finished, nextAnimation.finished]).then(function() {
          activeIndex = nextIndex;
          slides.forEach(function(slide, slideIndex) {
            const isActive = slideIndex === activeIndex;
            slide.hidden = !isActive;
            slide.setAttribute("aria-hidden", isActive ? "false" : "true");
          });
          updateStatus();
          isAnimating = false;
        });
      }

      galleryPrevious.onclick = function(event) {
        event.preventDefault();
        showSlide(activeIndex - 1, -1);
      };

      galleryNext.onclick = function(event) {
        event.preventDefault();
        showSlide(activeIndex + 1, 1);
      };

      let touchStartX = null;

      articleGalleryTrack.ontouchstart = function(event) {
        touchStartX = event.touches[0].clientX;
      };

      articleGalleryTrack.ontouchend = function(event) {
        if (touchStartX === null || !hasMultiplePhotos) {
          touchStartX = null;
          return;
        }

        const swipeDistance = touchStartX - event.changedTouches[0].clientX;

        if (swipeDistance > 40) {
          showSlide(activeIndex + 1, 1);
        } else if (swipeDistance < -40) {
          showSlide(activeIndex - 1, -1);
        }

        touchStartX = null;
      };

      setVisibleSlide(0);
    }

'''
js = js[:start] + new_gallery + js[end:]
js_path.write_text(js)

css_path = Path("css/style.css")
css = css_path.read_text()
start = css.index("    .article-gallery-track {")
end = css.index("    .caption {", start)
new_css = '''    .article-gallery-track {
      aspect-ratio: 16 / 9;
      background: transparent;
      border: 1.5px solid var(--ink);
      display: block;
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .article-hero-image {
      align-items: center;
      background: transparent;
      color: var(--muted);
      display: grid;
      font-size: 16px;
      height: 100%;
      inset: 0;
      justify-items: center;
      overflow: hidden;
      padding: 24px;
      position: absolute;
      width: 100%;
    }

    .article-hero-image[hidden] {
      display: none;
    }

    .article-hero-image img {
      display: block;
      height: auto;
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      width: auto;
    }

    .article-hero-image.has-photo {
      padding: 0;
    }

    .gallery-control {
      background: transparent;
      border: 0;
      color: #fff;
      cursor: pointer;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 30px;
      line-height: 1;
      opacity: 0;
      padding: 10px;
      pointer-events: none;
      position: absolute;
      text-shadow: 0 1px 5px rgba(0, 0, 0, 0.85);
      top: 50%;
      transform: translateY(-50%);
      transition: opacity 0.16s ease;
      z-index: 2;
    }

    .article-gallery:hover .gallery-control,
    .article-gallery:focus-within .gallery-control {
      opacity: 1;
      pointer-events: auto;
    }

    .gallery-control:hover {
      color: #fff;
      opacity: 0.65;
    }

    .gallery-control.previous {
      left: 8px;
    }

    .gallery-control.next {
      right: 8px;
    }

    .gallery-control[hidden],
    .gallery-status[hidden] {
      display: none;
    }

    .gallery-status {
      background: rgba(5, 5, 5, 0.72);
      bottom: 12px;
      color: #fff;
      font-size: 13px;
      line-height: 1;
      padding: 6px 8px;
      pointer-events: none;
      position: absolute;
      right: 12px;
      z-index: 2;
    }

    @media (hover: none), (pointer: coarse) {
      .article-gallery .gallery-control {
        opacity: 1;
        pointer-events: auto;
      }
    }

'''
css = css[:start] + new_css + css[end:]
css = css.replace(
'''      .article-hero-image:not(.has-photo) {
        min-height: 380px;
      }''',
'''      .article-hero-image:not(.has-photo) {
        min-height: 0;
      }''',
1,
)
css_path.write_text(css)

index_path = Path("index.html")
index = index_path.read_text()
if "css/style.css?v=gallery27" not in index or "js/app.js?v=gallery27" not in index:
    raise SystemExit("Expected gallery27 cache keys not found")
index = index.replace("css/style.css?v=gallery27", "css/style.css?v=gallery28", 1)
index = index.replace("js/app.js?v=gallery27", "js/app.js?v=gallery28", 1)
index_path.write_text(index)
