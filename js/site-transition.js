(function() {
  const main = document.querySelector("main");

  if (!main) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let transitionTimer = null;
  let pendingHash = null;

  function revealNewPage() {
    window.clearTimeout(transitionTimer);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        main.classList.remove("route-fade-out");
        pendingHash = null;
      });
    });
  }

  document.addEventListener(
    "click",
    function(event) {
      if (reduceMotion || event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = event.target.closest('a[href^="#/"]');
      if (!link) {
        return;
      }

      const targetHash = link.getAttribute("href");
      if (!targetHash || targetHash === window.location.hash) {
        return;
      }

      event.preventDefault();
      pendingHash = targetHash;
      main.classList.add("route-fade-out");

      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(function() {
        window.location.hash = targetHash.slice(1);
      }, 105);
    },
    true
  );

  window.addEventListener("hashchange", function() {
    if (pendingHash) {
      revealNewPage();
      return;
    }

    // Browser back/forward: briefly dissolve the newly routed page in.
    if (!reduceMotion) {
      main.classList.add("route-fade-out");
      revealNewPage();
    }
  });
})();
