let greenPokeball = document.getElementsByClassName("pokeball_button_green");
let confirmation = document.getElementById("container_confirmation_release");

for(let i = 0; i < greenPokeball.length; i++) {
    greenPokeball[i].addEventListener("click", () => {
        confirmation.style.display = "flex";
    })
}