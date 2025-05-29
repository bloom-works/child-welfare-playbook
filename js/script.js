const navButton = document.querySelector("#nav-button");
const navMobileMenu = document.querySelector("#mobile-menu");

navButton.addEventListener("click", e => {
	e.currentTarget.toggleAttribute("aria-expanded");
	navMobileMenu.toggleAttribute("aria-hidden");
  navMobileMenu.toggleAttribute("hidden");
});