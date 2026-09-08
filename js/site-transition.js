(function() {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FADE_OUT_MS = 480;
  const FADE_IN_MS = 640;
  const ENTRY_KEY = "jazzingffm-transition-entry";
  const CURTAIN_ID = "jazzingPageTransition";
  const preloadCache = new Map();

  let navigationToken = 0;
  let preparedHash = null;
  let navigating = false;

  function ensureCurtain() {
    let curtain = document.getElementById(CURTAIN_ID);
    if (curtain) return curtain;

    curtain = document.createElement("div");
    curtain.id = CURTAIN_ID;
    curtain.setAttribute("aria-hidden", "true");
    curtain.style.position = "fixed";
    curtain.style.inset = "0";
    curtain.style.zIndex = "2147483000";
    curtain.style.background = "#050505";
    curtain.style.opacity = root.classList.contains("jazzing-transition-entry") ? "1" : "0";
    curtain.style.pointerEvents = "none";
    curtain.style.transitionProperty = "opacity";
    curtain.style.transitionDuration = "0ms";
    curtain.style.transitionTimingFunction = "linear";
    curtain.style.willChange = "opacity";
    curtain.style.transform = "translateZ(0)";
    curtain.style.backfaceVisibility = "hidden";
    curtain.style.contain = "strict";

    document.body.appendChild(curtain);
    return curtain;
  }

  const curtain = ensureCurtain();

  function nextPaint(callback) {
    requestAnimationFrame(function() {
      requestAnimationFrame(callback);
    });
  }

  function forceCurtainOpacity(value) {
    curtain.style.transitionDuration = "0ms";
    curtain.style.transitionTimingFunction = "linear";
    curtain.style.opacity = String(value);
    void curtain.offsetWidth;
  }

  function fadeCurtainTo(value, duration, easing) {
    if (reduceMotion || duration <= 0) {
      forceCurtainOpacity(value);
      return Promise.resolve();
    }

    return new Promise(function(resolve) {
      let finished = false;
      let timeoutId = null;

      function finish() {
        if (finished) return;
        finished = true;
        curtain.removeEventListener("transitionend", onTransitionEnd);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        resolve();
      }

      function onTransitionEnd(event) {
        if (event.target === curtain && event.propertyName === "opacity") {
          finish();
        }
      }

      curtain.addEventListener("transitionend", onTransitionEnd);
      curtain.style.transitionDuration = duration + "ms";
      curtain.style.transitionTimingFunction = easing;

      requestAnimationFrame(function() {
        curtain.style.opacity = String(value);
      });

      timeoutId = window.setTimeout(finish, duration + 120);
    });
  }

  function coverPage() {
    curtain.style.pointerEvents = "auto";
    return fadeCurtainTo(1, FADE_OUT_MS, "cubic-bezier(0.4, 0, 0.2, 1)");
  }

  function revealPage() {
    return new Promise(function(resolve) {
      nextPaint(function() {
        fadeCurtainTo(0, FADE_IN_MS, "cubic-bezier(0.16, 1, 0.3, 1)").then(function() {
          curtain.style.pointerEvents = "none";
          navigating = false;
          resolve();
        });
      });
    });
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
      window.setTimeout(resolve, FADE_OUT_MS - 30);
    });

    return Promise.race([preload, timeout]);
  }

  function instantScrollTop() {
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);

    requestAnimationFrame(function() {
      root.style.scrollBehavior = previous;
    });
  }

  function markNextDocumentForFadeIn() {
    try {
      sessionStorage.setItem(ENTRY_KEY, "1");
    } catch (error) {}
  }

  function consumeDocumentFadeIn() {
    try {
      if (sessionStorage.getItem(ENTRY_KEY) !== "1") return false;
      sessionStorage.removeItem(ENTRY_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function navigateHash(targetHash) {
    if (navigating) return;
    navigating = true;

    const token = ++navigationToken;
    const preloadPromise = preloadTargetHash(targetHash);
    const coverPromise = coverPage();

    Promise.all([preloadPromise, coverPromise]).then(function() {
      if (token !== navigationToken) return;

      instantScrollTop();
      preparedHash = targetHash;
      window.location.hash = targetHash.slice(1);
    });
  }

  function navigatePage(targetUrl) {
    if (navigating) return;
    navigating = true;

    const token = ++navigationToken;

    coverPage().then(function() {
      if (token !== navigationToken) return;
      markNextDocumentForFadeIn();
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

    if (!wasPrepared) {
      ++navigationToken;
      navigating = true;
      curtain.style.pointerEvents = "auto";
      forceCurtainOpacity(1);
      instantScrollTop();
    }

    revealPage();
  });

  window.addEventListener("pageshow", function(event) {
    if (!event.persisted) return;
    ++navigationToken;
    preparedHash = null;
    navigating = false;
    root.classList.remove("jazzing-transition-entry");
    curtain.style.pointerEvents = "none";
    forceCurtainOpacity(0);
  });

  const storedEntry = consumeDocumentFadeIn();
  const shouldFadeIn = root.classList.contains("jazzing-transition-entry") || storedEntry;

  if (shouldFadeIn) {
    curtain.style.pointerEvents = "auto";
    forceCurtainOpacity(1);
    root.classList.remove("jazzing-transition-entry");
    revealPage();
  } else {
    root.classList.remove("jazzing-transition-entry");
    forceCurtainOpacity(0);
  }
})();
