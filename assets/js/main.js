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
