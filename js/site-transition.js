(function() {
  const main = document.querySelector("main");

  if (!main || typeof main.animate !== "function") {
    return;
  }

  const transitionKey = "jazzingffm-page-transition";
  let activeAnimation = null;

  function cancelActiveAnimation() {
    if (activeAnimation) {
      activeAnimation.cancel();
      activeAnimation = null;
    }
  }

  function fadeInNewPage() {
    cancelActiveAnimation();

    const desktop = window.matchMedia("(min-width: 769px)").matches;
    const duration = desktop ? 430 : 300;

    activeAnimation = main.animate(
      [
        { opacity: 0, filter: "blur(8px)", transform: "scale(0.997)" },
        { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }
      ],
      {
        duration: duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both"
      }
    );

    activeAnimation.finished.then(function() {
      if (activeAnimation) {
        activeAnimation.cancel();
        activeAnimation = null;
      }
    }).catch(function() {});
  }

  function fadeOutThen(callback) {
    cancelActiveAnimation();

    activeAnimation = main.animate(
      [
        { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
        { opacity: 0, filter: "blur(7px)", transform: "scale(0.998)" }
      ],
      {
        duration: 150,
        easing: "ease-in",
        fill: "forwards"
      }
    );

    activeAnimation.finished.then(callback).catch(callback);
  }

  function navigateHash(targetHash) {
    fadeOutThen(function() {
      window.location.hash = targetHash.slice(1);
    });
  }

  function navigatePage(targetUrl) {
    fadeOutThen(function() {
      try {
        sessionStorage.setItem(transitionKey, "1");
      } catch (error) {}
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

  document.addEventListener(
    "click",
    function(event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest("a[href]");
      if (!shouldHandleLink(link)) return;

      const href = link.getAttribute("href");
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
    fadeInNewPage();
  });

  try {
    if (sessionStorage.getItem(transitionKey) === "1") {
      sessionStorage.removeItem(transitionKey);
      fadeInNewPage();
    }
  } catch (error) {}
})();
