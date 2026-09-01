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
        slide.className = "article-hero-image has-photo";
        slide.hidden = index !== 0;
        image.src = rootPath(path);
        image.alt = article.cardTitle[currentLang] + " — photo " + (index + 1) + " of " + images.length;
        image.loading = index === 0 ? "eager" : "lazy";
        slide.appendChild(image);
        galleryTrack.appendChild(slide);
      });
    }

    const slides = Array.from(galleryTrack.children);
    let activeIndex = 0;
    const hasMultiple = slides.length > 1;

    galleryPrevious.hidden = !hasMultiple;
    galleryNext.hidden = !hasMultiple;
    galleryStatus.hidden = !hasMultiple;

    function show(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.hidden = slideIndex !== activeIndex;
      });
      galleryStatus.textContent = (activeIndex + 1) + " / " + slides.length;
    }

    galleryPrevious.onclick = function() { show(activeIndex - 1); };
    galleryNext.onclick = function() { show(activeIndex + 1); };
    show(0);
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

  langButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      currentLang = button.getAttribute("data-lang-button");
      localStorage.setItem("jazzingffm-lang", currentLang);
      localize();
    });
  });

  localize();
})();
