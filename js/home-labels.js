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
      description: "Portraits and conversations with musicians, artists and thought leaders shaping Frankfurt and the Rhine-Main cultural scene — jazz and beyond.",
      sameAs: ["https://www.instagram.com/jazzingffm/"]
    });
    document.head.appendChild(script);
  }

  function applySeo() {
    document.title = "JazzingFfm — Musicians, Artists & Culture in Frankfurt";
    ensureMeta("description", "Portraits and conversations with musicians, artists and thought leaders shaping Frankfurt and the Rhine-Main cultural scene — jazz and beyond.");
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
