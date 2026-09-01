(function() {
  const buttonIds = ["latestButton", "latestButtonMobile"];

  function desiredLabel() {
    return document.documentElement.lang === "de" ? "mehr lesen ↗" : "read more ↗";
  }

  function updateLabels() {
    const label = desiredLabel();
    buttonIds.forEach(function(id) {
      const button = document.getElementById(id);
      if (button && button.textContent !== label) {
        button.textContent = label;
      }
    });
  }

  updateLabels();

  const observer = new MutationObserver(updateLabels);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["lang"]
  });
})();
