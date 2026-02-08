document.addEventListener("DOMContentLoaded", function() {
  var toggles = document.querySelectorAll(".children-tree-toggle");
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].setAttribute("aria-expanded", "false");
    toggles[i].addEventListener("click", function() {
      var expanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", expanded ? "false" : "true");
      this.closest(".children-tree-item").classList.toggle("expanded");
    });
  }
});
