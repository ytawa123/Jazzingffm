(function() {
  const ARTICLES = window.JAZZING_ARTICLES || [];
  const BIOS = window.JAZZING_ARTICLE_BIOS || {};
  const article = ARTICLES[0];

  if (!article) return;

  const copy = {
    en: {
      nav: { home: "JazzingFfm.", interviews: "Interviews", features: "Features", contact: "Contact" },
      previousPhoto: "Previous photo",
      nextPhoto: "Next photo",
      footer: "MADE WITH LOVE IN FRANKFURT"
    },
    de: {
      nav: { home: "JazzingFfm.", interviews: "Interviews", features: "Features", contact: "Kontakt" },
      previousPhoto: "Vorheriges Foto",
      nextPhoto: "Nächstes Foto",
      footer: "MADE WITH LOVE IN FRANKFURT"
    }
  };

  let currentLang = localStorage.getItem("jazzingffm-lang") || "en";
  if (currentLang !== "en" && currentLang !== "de") currentLang = "en";

  const langButtons = document.querySelectorAll("[data-lang-button]");
  const articleCategory = document.getElementById("articleCategory");
  const articleTitle = document.getElementById("articleTitle");
  const articleByline = document.getElementById("articleByline");
  const articleCaption = document.getElementById("articleCaption");
  const articleBody = document.getElementById("articleBody");
  const articleBioTitle = document.getElementById("articleBioTitle");
  const articleBioText = document.getElementById("articleBioText");
  const galleryTrack = document.getElementById("articleGalleryTrack");
  const galleryPrevious = document.getElementById("galleryPrevious");
  const galleryNext = document.getElementById("galleryNext");
  const galleryStatus = document.getElementById("galleryStatus");
  const footerLove = document.getElementById("footerLove");

  function categoryRoute(category) {
    if (category === "highlights") return "features";
    return category;
  }

  function rootPath(path) {
    return path && path.charAt(0) === "/" ? path : "/" + path;
  }

  function setLanguageButtons() {
    langButtons.forEach(function(button) {
      button.classList.toggle("active", button.getAttribute("data-lang-button") === currentLang);
    });
  }

  function boldSpeakerNames() {
    const musicianName = article.cardTitle[currentLang];
    articleBody.querySelectorAll("p:not(.question)").forEach(function(paragraph) {
      const text = paragraph.textContent.trimStart();
      if (text.startsWith(musicianName + ":")) {
        paragraph.innerHTML = paragraph.innerHTML.replace(musicianName, "<strong>" + musicianName + "</strong>");
      }
    });
  }

  function renderGallery() {
    const images = Array.isArray(article.images) && article.images.length
      ? article.images
      : article.image ? [article.image] : [];

    galleryTrack.classList.add("gallery-loading-enabled");
    galleryTrack.innerHTML = "";

    if (!images.length) {
      const placeholder = document.createElement("div");
      placeholder.className = "article-hero-image";
      placeholder.textContent = article.imageLabel[currentLang];
      galleryTrack.appendChild(placeholder);
    } else {
      images.forEach(function(path, index) {
        const slide = document.createElement("div");
        const image = document.createElement("img");
        const isActive = index === 0;

        slide.className = "article-hero-image has-photo";
        slide.hidden = !isActive;
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        image.src = rootPath(path);
        image.alt = article.cardTitle[currentLang] + " — photo " + (index + 1) + " of " + images.length;
        image.loading = index === 0 ? "eager" : "lazy";
        image.addEventListener("load", function() {
          slide.classList.add("is-loaded");
        }, { once: true });
        image.addEventListener("error", function() {
          slide.classList.add("is-loaded");
        }, { once: true });
        if (image.complete && image.naturalWidth > 0) {
          slide.classList.add("is-loaded");
        }
        slide.appendChild(image);
        galleryTrack.appendChild(slide);
      });
    }

    const slides = Array.from(galleryTrack.children);
    const hasMultiple = slides.length > 1;

    galleryPrevious.hidden = !hasMultiple;
    galleryNext.hidden = !hasMultiple;
    galleryStatus.hidden = !hasMultiple;
    galleryStatus.textContent = hasMultiple ? "1 / " + slides.length : "";
    galleryTrack.dataset.fadeBusy = "false";
  }

  function localize() {
    const strings = copy[currentLang];
    const route = categoryRoute(article.category);

    document.documentElement.lang = currentLang;
    document.querySelector('[data-nav-key="home"]').textContent = strings.nav.home;
    document.querySelector('[data-nav-key="interviews"]').textContent = strings.nav.interviews;
    document.querySelector('[data-nav-key="features"]').textContent = strings.nav.features;
    document.querySelector('[data-nav-key="contact"]').textContent = strings.nav.contact;

    articleCategory.textContent = article.categoryLabel[currentLang];
    articleCategory.href = "/#/" + route;
    articleTitle.textContent = article.cardTitle[currentLang] + " " + article.cardSubtitle[currentLang];
    articleByline.textContent = article.date[currentLang];
    articleCaption.textContent = article.caption[currentLang];
    articleBody.innerHTML = article.body[currentLang];
    articleBioTitle.textContent = article.cardTitle[currentLang];
    articleBioText.textContent = BIOS[article.slug][currentLang];
    galleryPrevious.setAttribute("aria-label", strings.previousPhoto);
    galleryNext.setAttribute("aria-label", strings.nextPhoto);
    footerLove.textContent = strings.footer;

    boldSpeakerNames();
    renderGallery();
    setLanguageButtons();
  }

  function loadSharedScript(src, id) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    document.body.appendChild(script);
  }

  langButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      currentLang = button.getAttribute("data-lang-button");
      localStorage.setItem("jazzingffm-lang", currentLang);
      localize();
    });
  });

  localize();
  loadSharedScript("/js/gallery-transition.js?v=gallery32", "jazzing-gallery-transition");
  loadSharedScript("/js/site-transition.js?v=4", "jazzing-site-transition");
})();
