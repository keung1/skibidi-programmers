let pokeballButton = document.getElementsByClassName("pokeball_button_green");
let confirmationContainer = document.getElementById("container_confirmation_release")

for(let i = 0; i < pokeballButton.length; i++) {
    pokeballButton[i].addEventListener(() => {
        confirmationContainer.style.display = "flex";
    });
}
