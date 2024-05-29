let button = document.getElementsByClassName("noPresentPoke");
let container = document.getElementById("current_pokemon_menu_container");

for (let i = 0; i < button.length; i++) {
    button[i].addEventListener("click", (e) =>{
        e.preventDefault();
        container.style.display = "flex";
    });
}

window.onclick = function(event) {
    if (event.target == container) {
        container.style.display = "none";
    }
};