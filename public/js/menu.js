let menuButton = document.getElementById("nav_menu_button");
let menu = document.getElementById("container_nav_menu");

menuButton.addEventListener("click", (e) => {
    e.preventDefault();
    menu.style.display = "flex";
});

window.onclick = function(event) {
    if (event.target == menu) {
        menu.style.display = "none";
    }
};