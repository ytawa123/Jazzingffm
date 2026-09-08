(function() {
  const main = document.querySelector("main");

  if (!main || typeof main.animate !== "function") {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const preloadCache = new Map();
  let activeAnimation = null;
  let navigationToken = 0;
  let preparedHash = null;

  function cancelActiveAnimation() {
    if (activeAnimation) {
      activeAnimation.cancel();
      activeAnimation = null;
    }
  }

  function restoreVisiblePage() {
    cancelActiveAnimation();
    main.style.opacity = "1";
  }

  function animateOpacity(from, to, duration, easing, fill) {
    cancelActiveAnimation();

    if (reduceMotion || duration <= 0) {
      main.style.opacity = String(to);
      return Promise.resolve();
    }

    const animation = main.animate(
      [
        { opacity: from },
        { opacity: to }
      ],
      {
        duration: duration,
        easing: easing,
        fill: fill || "both"
      }
    );

    activeAnimation = animation;

    return animation.finished.then(function() {
      if (activeAnimation === animation) {
        main.style.opacity = String(to);
        animation.cancel();
        activeAnimation = null;
      }
    }).catch(function() {});
  }

  function firstImage(article) {
    if (!article) return null;
    if (Array.isArray(article.images) && article.images.length) return article.images[0];
    return article.image || null;
  }

  function routeImageUrls(targetHash) {
    const articles = window.JAZZING_ARTICLES || [];
    const route = (targetHash || "#/")
      .replace(/^#\/?/, "")
      .replace(/\/$/, "")
      .trim();

    if (!articles.length) return [];

    if (!route) {
      const url = firstImage(articles[0]);
      return url ? [url] : [];
    }

    if (route.startsWith("article/")) {
      const slug = route.split("/")[1];
      const article = articles.find(function(item) {
        return item.slug === slug;
      });
      const url = firstImage(article);
      return url ? [url] : [];
    }

    if (route === "interviews" || route === "features" || route === "highlights" || route === "live-reviews") {
      const category = route === "features" ? "highlights" : route;
      return articles
        .filter(function(article) {
          return article.category === category;
        })
        .map(firstImage)
        .filter(Boolean)
        .slice(0, 6);
    }

    return [];
  }

  function preloadImage(src) {
    if (!src) return Promise.resolve();

    let absoluteSrc;
    try {
      absoluteSrc = new URL(src, window.location.href).href;
    } catch (error) {
      absoluteSrc = src;
    }

    if (preloadCache.has(absoluteSrc)) {
      return preloadCache.get(absoluteSrc);
    }

    const promise = new Promise(function(resolve) {
      const image = new Image();
      let finished = false;

      function done() {
        if (finished) return;
        finished = true;
        resolve();
      }

      image.decoding = "async";
      image.loading = "eager";
      image.onload = function() {
        if (typeof image.decode === "function") {
          image.decode().catch(function() {}).then(done);
        } else {
          done();
        }
      };
      image.onerror = done;
      image.src = absoluteSrc;

      if (image.complete && image.naturalWidth > 0) {
        if (typeof image.decode === "function") {
          image.decode().catch(function() {}).then(done);
        } else {
          done();
        }
      }
    });

    preloadCache.set(absoluteSrc, promise);
    return promise;
  }

  function preloadTargetHash(targetHash) {
    const urls = routeImageUrls(targetHash);
    if (!urls.length) return Promise.resolve();

    const preload = Promise.allSettled(urls.map(preloadImage));
    const timeout = new Promise(function(resolve) {
      window.setTimeout(resolve, 180);
    });

    return Promise.race([preload, timeout]);
  }

  function instantScrollTop() {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);

    requestAnimationFrame(function() {
      root.style.scrollBehavior = previous;
    });
  }

  function revealNewPage(startOpacity) {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        animateOpacity(startOpacity, 1, reduceMotion ? 0 : 280, "cubic-bezier(0.22, 1, 0.36, 1)", "both");
      });
    });
  }

  function navigateHash(targetHash) {
    const token = ++navigationToken;

    preloadTargetHash(targetHash).then(function() {
      if (token !== navigationToken) return;

      return animateOpacity(1, 0.16, reduceMotion ? 0 : 140, "ease-out", "forwards").then(function() {
        if (token !== navigationToken) return;

        instantScrollTop();
        preparedHash = targetHash;
        window.location.hash = targetHash.slice(1);
      });
    });
  }

  function navigatePage(targetUrl) {
    ++navigationToken;

    animateOpacity(1, 0.3, reduceMotion ? 0 : 140, "ease-out", "forwards").then(function() {
      window.location.href = targetUrl;
    });
  }

  function shouldHandleLink(link) {
    if (!link || link.hasAttribute("download")) return false;
    if (link.target && link.target.toLowerCase() !== "_self") return false;

    const href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return false;
    }

    return true;
  }

  function getSameDocumentHash(link) {
    if (!shouldHandleLink(link)) return null;

    let targetUrl;
    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch (error) {
      return null;
    }

    if (targetUrl.origin !== window.location.origin) return null;

    const sameDocument =
      targetUrl.pathname === window.location.pathname &&
      targetUrl.search === window.location.search;

    if (!sameDocument || !targetUrl.hash || !targetUrl.hash.startsWith("#/")) {
      return null;
    }

    return targetUrl.hash;
  }

  document.addEventListener("pointerover", function(event) {
    const link = event.target.closest("a[href]");
    const targetHash = getSameDocumentHash(link);
    if (targetHash && targetHash !== window.location.hash) {
      preloadTargetHash(targetHash);
    }
  }, { passive: true });

  document.addEventListener("focusin", function(event) {
    const link = event.target.closest("a[href]");
    const targetHash = getSameDocumentHash(link);
    if (targetHash && targetHash !== window.location.hash) {
      preloadTargetHash(targetHash);
    }
  });

  document.addEventListener(
    "click",
    function(event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest("a[href]");
      if (!shouldHandleLink(link)) return;

      let targetUrl;
      try {
        targetUrl = new URL(link.href, window.location.href);
      } catch (error) {
        return;
      }

      if (targetUrl.origin !== window.location.origin) return;

      const sameDocument =
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search;

      if (sameDocument && targetUrl.hash && targetUrl.hash.startsWith("#/")) {
        if (targetUrl.hash === window.location.hash) return;
        event.preventDefault();
        navigateHash(targetUrl.hash);
        return;
      }

      if (sameDocument && targetUrl.hash && !targetUrl.hash.startsWith("#/")) {
        return;
      }

      const currentUrl = window.location.pathname + window.location.search + window.location.hash;
      const nextUrl = targetUrl.pathname + targetUrl.search + targetUrl.hash;
      if (currentUrl === nextUrl) return;

      event.preventDefault();
      navigatePage(targetUrl.href);
    },
    true
  );

  window.addEventListener("hashchange", function() {
    const wasPrepared = preparedHash === window.location.hash;
    preparedHash = null;
    restoreVisiblePage();
    main.style.opacity = wasPrepared ? "0.16" : "0.88";
    revealNewPage(wasPrepared ? 0.16 : 0.88);
  });

  window.addEventListener("pageshow", function(event) {
    if (!event.persisted) return;
    ++navigationToken;
    preparedHash = null;
    restoreVisiblePage();
  });
})();
