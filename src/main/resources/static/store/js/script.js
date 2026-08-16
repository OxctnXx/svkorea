const body = document.body;
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const dots = Array.from(document.querySelectorAll("[data-slide-dot]"));
const prevButton = document.querySelector("[data-slide-prev]");
const nextButton = document.querySelector("[data-slide-next]");
const searchToggle = document.querySelector("[data-search-toggle]");
const searchBar = document.querySelector("[data-search-bar]");
const searchInput = document.querySelector("#store-search");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

let activeSlide = 0;

const setSlide = (index) => {
  if (!slides.length) {
    return;
  }

  activeSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === activeSlide);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === activeSlide);
  });
};

prevButton?.addEventListener("click", () => {
  setSlide(activeSlide - 1);
});

nextButton?.addEventListener("click", () => {
  setSlide(activeSlide + 1);
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    setSlide(Number(dot.dataset.slideDot));
  });
});

searchToggle?.addEventListener("click", () => {
  const isOpen = searchBar.classList.toggle("is-open");

  if (isOpen) {
    searchInput?.focus();
  }
});

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu.classList.toggle("is-open", !isOpen);
  body.classList.toggle("menu-open", !isOpen);
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    menuToggle?.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    body.classList.remove("menu-open");
  }
});

setSlide(0);
