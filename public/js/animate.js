function animate() {
  const animateElements = document.querySelectorAll('.animate')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const stagger = reduceMotion ? 0 : 150

  animateElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('show')
    }, index * stagger)
  });
}

document.addEventListener("DOMContentLoaded", animate)
document.addEventListener("astro:after-swap", animate)