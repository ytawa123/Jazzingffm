    const ARTICLES = window.JAZZING_ARTICLES || [];
    const ARTICLE_BIOS = window.JAZZING_ARTICLE_BIOS || {};

    /*
      FILES NEEDED IN THE SAME FOLDER:
      index.html
      header.png
      logo.png
    */

    const I18N = {
      en: {
        nav: {
          home: "JazzingFfm",
          highlights: "Features",
          interviews: "Interviews",
          liveReviews: "Live reviews",
          contact: "Contact us"
        },
        home: {
          eyebrow: "About JazzingFfm",
          title: "Frankfurt am Main is jazzing.",
          text: "JazzingFfm captures local musicians beyond jazz, artists and thought leaders shaping Frankfurt’s culture. Documenting the real and the best from the scene today. Portraits in noir and interviews about music, life, and more.",
          latestEyebrow: "Latest Interview",
          latestButton: "read interview ↗"
        },
        pages: {
          highlights: {
            title: "Features",
            description: "Featured articles, essays and notes from the Frankfurt scene."
          },
          interviews: {
            title: "Interviews",
            description: "Conversations and portraits of musicians, artists, and thought leaders shaping the scene — jazz and beyond."
          },
          "live-reviews": {
            title: "Live reviews",
            description: "Notes from concerts, sessions and rooms where the music is happening."
          }
        },
        article: {
          by: "By",
          readMore: "read more ↗",
          noPosts: "No posts here yet.",
          bioTitle: "Musician bio",
          previousPhoto: "Previous photo",
          nextPhoto: "Next photo"
        },
        contact: {
          eyebrow: "Contact us",
          title: "Send sounds, stories, photos and questions.",
          text: "For interview requests, collaboration ideas, concert tips or corrections, contact JazzingFfm here:"
        },
        footer: {
          love: "MADE WITH LOVE IN FRANKFURT",
          support: "support JazzingFfm"
        }
      },

      de: {
        nav: {
          home: "JazzingFfm",
          highlights: "Features",
          interviews: "Interviews",
          liveReviews: "Live-Kritiken",
          contact: "Kontakt"
        },
        home: {
          eyebrow: "Über JazzingFfm",
          title: "Frankfurt am Main is jazzing.",
          text: "JazzingFfm porträtiert lokale Musiker:innen über den Jazz hinaus, Künstler:innen und Vordenker:innen, die Frankfurts Kultur prägen. Dokumentiert wird das Echte und Beste aus der Szene von heute. Porträts in Noir und Interviews über Musik, Leben und mehr.",
          latestEyebrow: "Neuestes Interview",
          latestButton: "Interview lesen ↗"
        },
        pages: {
          highlights: {
            title: "Features",
            description: "Ausgewählte Artikel, Essays und Notizen aus der Frankfurter Szene."
          },
          interviews: {
            title: "Interviews",
            description: "Gespräche mit und Porträts von Musiker, Künstler und Vordenker, die die Szene prägen – Jazz und darüber hinaus."
          },
          "live-reviews": {
            title: "Live-Kritiken",
            description: "Notizen von Konzerten, Sessions und Räumen, in denen Musik gerade passiert."
          }
        },
        article: {
          by: "Von",
          readMore: "mehr lesen ↗",
          noPosts: "Hier gibt es noch keine Beiträge.",
          bioTitle: "Biografie",
          previousPhoto: "Vorheriges Foto",
          nextPhoto: "Nächstes Foto"
        },
        contact: {
          eyebrow: "Kontakt",
          title: "Schick uns Sounds, Geschichten, Fotos und Fragen.",
          text: "Für Interview-Anfragen, Kooperationsideen, Konzerttipps oder Korrekturen erreichst du JazzingFfm hier:"
        },
        footer: {
          love: "MADE WITH LOVE IN FRANKFURT",
          support: "support JazzingFfm"
        }
      }
    };



    let currentLang = localStorage.getItem("jazzingffm-lang") || "en";

    const pages = {
      home: document.getElementById("page-home"),
      listing: document.getElementById("page-listing"),
      article: document.getElementById("page-article"),
      contact: document.getElementById("page-contact")
    };

    const navLinks = document.querySelectorAll(".nav-links a");
    const langButtons = document.querySelectorAll("[data-lang-button]");

    const homeEyebrow = document.getElementById("homeEyebrow");
    const homeTitle = document.getElementById("homeTitle");
    const homeText = document.getElementById("homeText");
    const featureImageFrame = document.getElementById("featureImageFrame");
    const featureImage = document.getElementById("featureImage");
    const featureImageText = document.getElementById("featureImageText");
    const latestImageLink = document.getElementById("latestImageLink");
    const latestEyebrow = document.getElementById("latestEyebrow");
    const latestMeta = document.getElementById("latestMeta");
    const latestTitle = document.getElementById("latestTitle");
    const latestText = document.getElementById("latestText");
    const latestButton = document.getElementById("latestButton");
    const latestButtonMobile = document.getElementById("latestButtonMobile");

    const listingTitle = document.getElementById("listingTitle");
    const listingDescription = document.getElementById("listingDescription");
    const articleGrid = document.getElementById("articleGrid");

    const articleCategory = document.getElementById("articleCategory");
    const articleTitle = document.getElementById("articleTitle");
    const articleByline = document.getElementById("articleByline");
    const articleGalleryTrack = document.getElementById("articleGalleryTrack");
    const galleryPrevious = document.getElementById("galleryPrevious");
    const galleryNext = document.getElementById("galleryNext");
    const articleCaption = document.getElementById("articleCaption");
    const articleBody = document.getElementById("articleBody");
    const articleBioTitle = document.getElementById("articleBioTitle");
    const articleBioText = document.getElementById("articleBioText");

    const contactEyebrow = document.getElementById("contactEyebrow");
    const contactTitle = document.getElementById("contactTitle");
    const contactText = document.getElementById("contactText");

    const footerLove = document.getElementById("footerLove");
    const supportLink = document.getElementById("supportLink");

    function t() {
      return I18N[currentLang];
    }

    function cleanRouteFromHash() {
      let hash = window.location.hash || "#/";

      if (hash === "#" || hash === "#/") {
        return "";
      }

      return hash
        .replace(/^#\/?/, "")
        .replace(/\/$/, "");
    }

    function hidePages() {
      Object.values(pages).forEach(function(page) {
        if (page) {
          page.classList.remove("active");
        }
      });
    }

    function scrollTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function getArticleBySlug(slug) {
      return ARTICLES.find(function(item) {
        return item.slug === slug;
      });
    }

    function getLatestArticle() {
      // ARTICLES stays ordered from newest to oldest; the first entry leads the homepage.
      return ARTICLES[0];
    }

    function renderHomeFeature() {
      const copy = t();
      const latestArticle = getLatestArticle();

      if (!latestArticle) {
        return;
      }

      const articleUrl = "#/article/" + latestArticle.slug;
      const featureTitle = latestArticle.title[currentLang].replace(/^[^|]+\|\s*/, "");
      const featuredPhoto =
        (Array.isArray(latestArticle.images) && latestArticle.images[0]) ||
        latestArticle.image;
      const hasPhoto = Boolean(featuredPhoto);

      featureImageText.textContent = latestArticle.imageLabel[currentLang];
      featureImageFrame.classList.toggle("has-photo", hasPhoto);
      featureImage.hidden = !hasPhoto;

      if (hasPhoto) {
        featureImage.onload = function() {
          featureImageFrame.classList.add("has-photo");
          featureImage.hidden = false;
        };
        featureImage.onerror = function() {
          featureImageFrame.classList.remove("has-photo");
          featureImage.hidden = true;
        };
        featureImage.src = featuredPhoto;
        featureImage.alt = latestArticle.caption[currentLang];
      } else {
        featureImage.removeAttribute("src");
        featureImage.alt = "";
      }

      latestImageLink.href = articleUrl;
      latestImageLink.setAttribute("aria-label", copy.home.latestButton);
      latestMeta.textContent = latestArticle.date[currentLang];
      latestTitle.textContent = featureTitle;
      latestText.textContent = latestArticle.excerpt[currentLang];
      latestButton.textContent = copy.home.latestButton;
      latestButton.href = articleUrl;
      latestButtonMobile.textContent = copy.home.latestButton;
      latestButtonMobile.href = articleUrl;
    }

    function getActiveRoute(route) {
      if (route === "") {
        return "home";
      }

      if (route === "contact") {
        return "contact";
      }

      if (
        route === "features" ||
        route === "highlights" ||
        route === "interviews" ||
        route === "live-reviews"
      ) {
        return route === "highlights" ? "features" : route;
      }

      if (route.startsWith("article/")) {
        const slug = route.split("/")[1];
        const article = getArticleBySlug(slug);

        if (!article) {
          return "interviews";
        }

        return article.category === "highlights" ? "features" : article.category;
      }

      return "interviews";
    }

    function setActiveNav(activeRoute) {
      navLinks.forEach(function(link) {
        const linkRoute = link.getAttribute("data-route");

        if (linkRoute === activeRoute) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    function setActiveLanguageButton() {
      langButtons.forEach(function(button) {
        if (button.getAttribute("data-lang-button") === currentLang) {
          button.classList.add("active");
        } else {
          button.classList.remove("active");
        }
      });
    }

    function localizeStaticText() {
      const copy = t();

      document.documentElement.lang = currentLang;

      navLinks.forEach(function(link) {
        const key = link.getAttribute("data-nav-key");
        link.textContent = copy.nav[key];
      });

      homeEyebrow.textContent = copy.home.eyebrow;
      homeTitle.textContent = copy.home.title;
      homeText.textContent = copy.home.text;
      latestEyebrow.textContent = copy.home.latestEyebrow;
      renderHomeFeature();

      contactEyebrow.textContent = copy.contact.eyebrow;
      contactTitle.textContent = copy.contact.title;
      contactText.textContent = copy.contact.text;

      footerLove.textContent = copy.footer.love;
      supportLink.textContent = copy.footer.support;

      setActiveLanguageButton();
    }

    function renderListing(category) {
      const copy = t();
      const info = copy.pages[category] || copy.pages.interviews;

      listingTitle.textContent = info.title;
      listingDescription.textContent = info.description;

      let posts;

      posts = ARTICLES.filter(function(article) {
        return article.category === category;
      });

      if (posts.length === 0) {
        articleGrid.innerHTML = `
          <div>
            <p style="font-size: 24px;">${copy.article.noPosts}</p>
          </div>
        `;
        return;
      }

      articleGrid.innerHTML = posts.map(function(article) {
        const cardImage =
          (Array.isArray(article.images) && article.images[0]) ||
          article.image ||
          "";

        return `
          <article class="article-card">
            <div>
              <div class="card-thumb${cardImage ? " has-photo" : ""}">
                ${cardImage ? `<img data-image-path="${cardImage}" alt="${article.cardTitle[currentLang]}">` : ""}
                <span class="card-thumb-label">${article.imageLabel[currentLang]}</span>
              </div>
              <div class="article-meta">${article.date[currentLang]}</div>
              <h2>${article.cardTitle[currentLang]}</h2>
              <p class="card-subtitle">${article.cardSubtitle[currentLang]}</p>
            </div>
            <a class="read-more" href="#/article/${article.slug}">${copy.article.readMore}</a>
          </article>
        `;
      }).join("");

      articleGrid.querySelectorAll(".card-thumb img").forEach(function(image) {
        const frame = image.closest(".card-thumb");

        image.addEventListener("error", function() {
          frame.classList.remove("has-photo");
          image.remove();
        });

        image.src = image.getAttribute("data-image-path");
      });
    }

    function renderArticleGallery(article, copy) {
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

      function showSlide(index) {
        if (isAnimating || slideCount < 1) {
          return;
        }

        const nextIndex = (index + slideCount) % slideCount;
        if (nextIndex === activeIndex) {
          return;
        }

        const currentSlide = slides[activeIndex];
        const nextSlide = slides[nextIndex];

        if (reduceMotion || typeof currentSlide.animate !== "function") {
          setVisibleSlide(nextIndex);
          return;
        }

        isAnimating = true;

        const fadeOut = currentSlide.animate(
          [
            { opacity: 1 },
            { opacity: 0 }
          ],
          {
            duration: 240,
            easing: "ease-in",
            fill: "forwards"
          }
        );

        fadeOut.finished.then(function() {
          currentSlide.hidden = true;
          currentSlide.setAttribute("aria-hidden", "true");

          activeIndex = nextIndex;
          nextSlide.hidden = false;
          nextSlide.setAttribute("aria-hidden", "false");

          const fadeIn = nextSlide.animate(
            [
              { opacity: 0 },
              { opacity: 1 }
            ],
            {
              duration: 320,
              easing: "ease-out",
              fill: "forwards"
            }
          );

          fadeIn.finished.then(function() {
            currentSlide.getAnimations().forEach(function(animation) {
              animation.cancel();
            });
            nextSlide.getAnimations().forEach(function(animation) {
              animation.cancel();
            });
            updateStatus();
            isAnimating = false;
          });
        });
      }

      galleryPrevious.onclick = function(event) {
        event.preventDefault();
        showSlide(activeIndex - 1);
      };

      galleryNext.onclick = function(event) {
        event.preventDefault();
        showSlide(activeIndex + 1);
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
          showSlide(activeIndex + 1);
        } else if (swipeDistance < -40) {
          showSlide(activeIndex - 1);
        }

        touchStartX = null;
      };

      setVisibleSlide(0);
    }

    function renderArticle(slug) {
      const copy = t();
      const article = getArticleBySlug(slug);

      if (!article) {
        renderListing("interviews");
        hidePages();
        pages.listing.classList.add("active");
        setActiveNav("interviews");
        return;
      }

      articleCategory.textContent = article.categoryLabel[currentLang];
      const articleCategoryRoute = article.category === "highlights" ? "features" : article.category;

      articleCategory.href = "#/" + articleCategoryRoute;

      articleTitle.textContent =
        article.cardTitle[currentLang] + " " + article.cardSubtitle[currentLang];
      articleByline.textContent = article.date[currentLang];
      renderArticleGallery(article, copy);
      articleCaption.textContent = article.caption[currentLang];
      articleBody.innerHTML = article.body[currentLang];

      const musicianName = article.cardTitle[currentLang];
      articleBody.querySelectorAll("p:not(.question)").forEach(function(paragraph) {
        const paragraphText = paragraph.textContent.trimStart();

        if (paragraphText.startsWith(musicianName + ":")) {
          paragraph.innerHTML = paragraph.innerHTML.replace(
            musicianName,
            "<strong>" + musicianName + "</strong>"
          );
        }
      });

      articleBioTitle.textContent = musicianName;
      articleBioText.textContent = ARTICLE_BIOS[article.slug][currentLang];
    }

    function router() {
      const route = cleanRouteFromHash();
      const activeRoute = getActiveRoute(route);

      localizeStaticText();
      hidePages();

      if (route === "") {
        pages.home.classList.add("active");
      } else if (route === "contact") {
        pages.contact.classList.add("active");
      } else if (route.startsWith("article/")) {
        const slug = route.split("/")[1];
        pages.article.classList.add("active");
        renderArticle(slug);
      } else if (
        route === "features" ||
        route === "highlights" ||
        route === "interviews" ||
        route === "live-reviews"
      ) {
        renderListing(route === "features" ? "highlights" : route);
        pages.listing.classList.add("active");
      } else {
        renderListing("interviews");
        pages.listing.classList.add("active");
      }

      setActiveNav(activeRoute);
      scrollTop();
    }

    langButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        currentLang = button.getAttribute("data-lang-button");
        localStorage.setItem("jazzingffm-lang", currentLang);
        router();
      });
    });

    window.addEventListener("hashchange", router);
    window.addEventListener("DOMContentLoaded", router);
