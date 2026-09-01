(function() {
  const main = document.querySelector("main");

  if (!main || typeof main.animate !== "function") {
    return;
  }

  let pendingHash = null;
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
      pendingHash = null;
    }).catch(function() {});
  }

  function navigateWithDissolve(targetHash) {
    cancelActiveAnimation();
    pendingHash = targetHash;

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

    activeAnimation.finished.then(function() {
      window.location.hash = targetHash.slice(1);
    }).catch(function() {
      window.location.hash = targetHash.slice(1);
    });
  }

  document.addEventListener(
    "click",
    function(event) {
      if (event.defaultPrevented || event.button !== 0) {
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
      navigateWithDissolve(targetHash);
    },
    true
  );

  window.addEventListener("hashchange", function() {
    // app.js registers its router before this file, so by the time this runs
    // the new page content has already been swapped in.
    fadeInNewPage();
  });
})();
