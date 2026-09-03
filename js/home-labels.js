(function() {
  const buttonIds = ["latestButton", "latestButtonMobile"];

  function desiredLabel() {
    return document.documentElement.lang === "de" ? "mehr lesen ↗" : "read more ↗";
  }

  function articleUrlFromSlug(slug) {
    const articles = window.JAZZING_ARTICLES || [];
    const article = articles.find(function(item) { return item.slug === slug; });
    if (!article) return null;

    let section = article.category;
    if (section === "highlights") section = "features";
    return "/" + section + "/" + article.slug + "/";
  }

  function rewriteArticleLinks() {
    document.querySelectorAll('a[href^="#/article/"]').forEach(function(link) {
      const match = link.getAttribute("href").match(/^#\/article\/([^/?#]+)/);
      if (!match) return;
      const cleanUrl = articleUrlFromSlug(match[1]);
      if (cleanUrl) link.setAttribute("href", cleanUrl);
    });
  }

  function ensureMeta(name, content) {
    let tag = document.head.querySelector('meta[name="' + name + '"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  }

  function ensureCanonical(url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }

  function ensureStructuredData() {
    if (document.getElementById("jazzingffm-website-schema")) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "jazzingffm-website-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "JazzingFfm",
      url: "https://jazzingffm.de/",
      description: "JazzingFfm ist ein unabhängiges redaktionelles Projekt, das Musiker:innen, Künstler:innen und Vordenker:innen porträtiert, die die Kultur in Frankfurt und der Rhein-Main-Region prägen – im Jazz und darüber hinaus. Mit Porträts in Noir und Gesprächen über Musik, Leben und mehr dokumentiert JazzingFfm das Echte und Beste aus der Szene von heute.",
      sameAs: ["https://www.instagram.com/jazzingffm/"]
    });
    document.head.appendChild(script);
  }

  function applySeo() {
    document.title = "JazzingFfm – Frankfurt am Main is jazzing.";
    ensureMeta("description", "JazzingFfm ist ein unabhängiges redaktionelles Projekt, das Musiker:innen, Künstler:innen und Vordenker:innen porträtiert, die die Kultur in Frankfurt und der Rhein-Main-Region prägen – im Jazz und darüber hinaus. Mit Porträts in Noir und Gesprächen über Musik, Leben und mehr dokumentiert JazzingFfm das Echte und Beste aus der Szene von heute.");
    ensureMeta("robots", "index, follow");
    ensureCanonical("https://jazzingffm.de/");
    ensureStructuredData();
  }

  function updateLabels() {
    const label = desiredLabel();
    buttonIds.forEach(function(id) {
      const button = document.getElementById(id);
      if (button && button.textContent !== label) {
        button.textContent = label;
      }
    });
    rewriteArticleLinks();
  }

  applySeo();
  updateLabels();

  const observer = new MutationObserver(updateLabels);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["lang", "href"]
  });
})();
