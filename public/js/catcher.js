import {removePokemon} from "../../database"

let pokeballButton = document.getElementsByClassName("pokeball_button_green");
let confirmationContainer = document.getElementById("container_confirmation_release")


for(let i = 0; i < pokeballButton.length; i++) {
    pokeballButton[i].addEventListener("click", () => {
        confirmationContainer.style.display = "flex";
    });
}

let yes = document.getElementById("yes");
let no = document.getElementById("no");

async function mongo() {
    await removePokemon()
}

yes.addEventListener("click", () => {
    mongo();
    confirmationContainer.style.display = "none";
})

no.addEventListener("click", () => {
    confirmationContainer.style.display = "none";
})