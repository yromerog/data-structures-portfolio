document.addEventListener("DOMContentLoaded", function () {
  var navLinks = document.querySelectorAll(".nav-link");
  var currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

  function markActive(link) {
    navLinks.forEach(function (el) {
      el.classList.remove("active");
    });
    link.classList.add("active");
  }

  navLinks.forEach(function (link) {
    var linkPath = link.pathname.replace(/\/+$/, "") || "/";
    var section = link.dataset.nav;

    var isCurrent =
      linkPath === currentPath ||
      (section === "blog" && currentPath.indexOf("/blog") === 0) ||
      (section === "projects" && currentPath.indexOf("/projects") === 0) ||
      (section === "home" && (currentPath === "" || currentPath === "/" || currentPath.indexOf("/index") === 0));

    if (isCurrent) {
      markActive(link);
    }

    // Give instant "solid" feedback the moment the user clicks, before the
    // browser navigates to the new page.
    link.addEventListener("click", function () {
      markActive(link);
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  try {
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } catch (e) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
});
