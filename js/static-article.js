(function() {
  const ARTICLES = window.JAZZING_ARTICLES || [];
  const BIOS = window.JAZZING_ARTICLE_BIOS || {};
  const article = ARTICLES[0];

  if (!article) return;

  const copy = {
    en: {
      nav: { home: "JazzingFfm.", interviews: "Interviews", features: "Features", contact: "Contact" },
      choosePhoto: "Choose photo",
      showPhoto: "Show photo",
      footer: "MADE WITH LOVE IN FRANKFURT",
      partner: "In cooperation with"
    },
    de: {
      nav: { home: "JazzingFfm.", interviews: "Interviews", features: "Features", contact: "Kontakt" },
      choosePhoto: "Foto auswählen",
      showPhoto: "Foto anzeigen",
      footer: "MADE WITH LOVE IN FRANKFURT",
      partner: "In Kooperation mit"
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
  const articleGallery = document.getElementById("articleGallery");
  const galleryTrack = document.getElementById("articleGalleryTrack");
  let galleryThumbnails = document.getElementById("articleGalleryThumbnails");
  const footerLove = document.getElementById("footerLove");
  const footerPartnerLabel = document.getElementById("footerPartnerLabel");

  function ensureThumbnailGallery() {
    if (!articleGallery || !galleryTrack) return;

    articleGallery.classList.add("article-gallery--thumbnails");
    articleGallery.dataset.galleryStyle = "thumbnails";

    let stage = articleGallery.querySelector(".article-gallery-stage");
    if (!stage) {
      stage = document.createElement("div");
      stage.className = "article-gallery-stage";
      articleGallery.insertBefore(stage, galleryTrack);
      stage.appendChild(galleryTrack);
    }

    if (!galleryThumbnails) {
      galleryThumbnails = document.createElement("div");
      galleryThumbnails.id = "articleGalleryThumbnails";
      galleryThumbnails.className = "article-gallery-thumbnails";
      galleryThumbnails.setAttribute("role", "group");
      stage.appendChild(galleryThumbnails);
    }

    articleGallery.querySelectorAll(".gallery-control, .gallery-status").forEach(function(control) {
      control.remove();
    });

    if (!document.querySelector('link[href*="thumbnail-gallery.css"]')) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "/css/thumbnail-gallery.css?v=3";
      document.head.appendChild(stylesheet);
    }
  }

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
    articleGallery.classList.toggle("has-multiple-images", hasMultiple);

    if (galleryThumbnails) {
      galleryThumbnails.innerHTML = "";
      galleryThumbnails.hidden = !hasMultiple;

      images.forEach(function(path, index) {
        const button = document.createElement("button");
        const thumbnail = document.createElement("img");
        const isActive = index === 0;

        button.type = "button";
        button.className = "gallery-thumbnail";
        button.dataset.galleryIndex = String(index);
        button.setAttribute("aria-label", copy[currentLang].showPhoto + " " + (index + 1));
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
        thumbnail.src = rootPath(path);
        thumbnail.alt = "";
        thumbnail.loading = index < 4 ? "eager" : "lazy";
        button.appendChild(thumbnail);
        galleryThumbnails.appendChild(button);
      });
    }

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
    if (galleryThumbnails) galleryThumbnails.setAttribute("aria-label", strings.choosePhoto);
    footerLove.textContent = strings.footer;
    footerPartnerLabel.textContent = strings.partner;

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

  ensureThumbnailGallery();
  localize();
  loadSharedScript("/js/thumbnail-gallery.js?v=2", "jazzing-thumbnail-gallery");
  loadSharedScript("/js/site-transition.js?v=4", "jazzing-site-transition");
})();
