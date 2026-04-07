// 3D tilt effect for cards with .tilt-card class
(function () {
  function initTilt() {
    document.querySelectorAll(".tilt-card").forEach(function (card) {
      if (card.dataset.tiltInit) return;
      card.dataset.tiltInit = "1";

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -4;
        var rotateY = ((x - centerX) / centerX) * 4;
        card.style.transform =
          "perspective(800px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) scale3d(1.02, 1.02, 1.02)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
      });
    });
  }

  // Run on initial load
  initTilt();

  // Re-init after Astro view transitions
  document.addEventListener("astro:page-load", initTilt);
})();
