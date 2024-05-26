let pokeballButton = document.getElementsByClassName("pokeball_button_green");
let confirmationContainer = document.getElementById("container_confirmation_release")


for(let i = 0; i < pokeballButton.length; i++) {
    pokeballButton[i].addEventListener("click", () => {
        confirmationContainer.style.display = "flex";
    });
}

let no = document.getElementById("no");

no.addEventListener("click", () => {
    confirmationContainer.style.display = "none";
})