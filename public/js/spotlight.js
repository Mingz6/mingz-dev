// Cursor spotlight effect — mouse-following radial gradient
(function () {
  if (!document.body) return;

  const spotlight = document.createElement("div");
  spotlight.id = "spotlight";
  spotlight.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(spotlight);

  let x = 0, y = 0;
  let visible = false;

  document.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!visible) {
      visible = true;
      spotlight.style.opacity = "1";
    }
    spotlight.style.background = document.documentElement.classList.contains("dark")
      ? `radial-gradient(600px circle at ${x}px ${y}px, rgba(99, 102, 241, 0.06), transparent 60%)`
      : `radial-gradient(600px circle at ${x}px ${y}px, rgba(99, 102, 241, 0.04), transparent 60%)`;
  });

  document.addEventListener("mouseleave", () => {
    visible = false;
    spotlight.style.opacity = "0";
  });
})();
