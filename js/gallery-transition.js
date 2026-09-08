(function() {
  let touchStartX = null;

  function fitImage(slide) {
    const image = slide && slide.querySelector("img");
    if (!image) return;

    image.style.position = "absolute";
    image.style.inset = "0";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.maxWidth = "none";
    image.style.maxHeight = "none";
    image.style.objectFit = "contain";
    image.style.objectPosition = "center";
    image.style.display = "block";
    image.loading = "eager";
  }

  function getGalleryState() {
    const track = document.getElementById("articleGalleryTrack");
    if (!track) return null;

    const slides = Array.from(track.children);
    if (slides.length < 2) return null;

    slides.forEach(fitImage);

    let activeIndex = slides.findIndex(function(slide) {
      return !slide.hidden && slide.style.display !== "none";
    });

    if (activeIndex < 0) activeIndex = 0;

    return { track: track, slides: slides, activeIndex: activeIndex };
  }

  function updateStatus(index, total) {
    const status = document.querySelector("#articleGallery .gallery-status");
    if (status) {
      status.textContent = index + 1 + " / " + total;
    }
  }

  function setVisibleSlide(slides, activeIndex) {
    slides.forEach(function(slide, index) {
      const isActive = index === activeIndex;
      slide.hidden = !isActive;
      slide.style.display = isActive ? "block" : "none";
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      fitImage(slide);
    });
  }

  function changeSlide(delta) {
    const state = getGalleryState();
    if (!state) return;

    const nextIndex =
      (state.activeIndex + delta + state.slides.length) % state.slides.length;

    setVisibleSlide(state.slides, nextIndex);
    updateStatus(nextIndex, state.slides.length);
  }

  function normalizeCurrentGallery() {
    const state = getGalleryState();
    if (!state) return;

    setVisibleSlide(state.slides, state.activeIndex);
    updateStatus(state.activeIndex, state.slides.length);
  }

  normalizeCurrentGallery();

  document.addEventListener(
    "click",
    function(event) {
      const button = event.target.closest("#galleryPrevious, #galleryNext");
      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      changeSlide(button.id === "galleryPrevious" ? -1 : 1);
    },
    true
  );

  document.addEventListener(
    "touchstart",
    function(event) {
      const track = event.target.closest("#articleGalleryTrack");
      if (!track || !event.touches.length) return;
      touchStartX = event.touches[0].clientX;
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "touchend",
    function(event) {
      const track = event.target.closest("#articleGalleryTrack");
      if (!track || touchStartX === null || !event.changedTouches.length) return;

      const distance = touchStartX - event.changedTouches[0].clientX;
      touchStartX = null;

      if (Math.abs(distance) < 40) return;

      event.stopImmediatePropagation();
      changeSlide(distance > 0 ? 1 : -1);
    },
    true
  );
})();
