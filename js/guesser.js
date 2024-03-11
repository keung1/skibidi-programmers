//pikachu: https://greatcharacters.miraheze.org/wiki/File:Pikachu.png  https://www.clipartmax.com/middle/m2H7d3K9K9K9K9i8_a
//eevee: 
//mew : https://www.pokemon.com/nl/pokedex/mew
let imagesBlack = ['eeveeBlack.webp', 'pikachuBlack.webp', 'mewBlack.webp'];
let images = ['eevee.webp', 'pikachu.webp', 'mew.webp']
let randomIndex = Math.floor(Math.random() * images.length);
let randomBlackImage = imagesBlack[randomIndex];
let randomImage = images[randomIndex];
let imageBlackHTML = '<img src = "assets/images/' + randomBlackImage + '" alt = "pokemonToGuessBlack" id = "pokeguesser_black">'
let imageHTML = '<img src = "assets/images/' + randomImage + '" alt = "pokemonToGuess"  width="300" height="300">'



document.getElementsByClassName("pokeguesser_bg")[0].innerHTML = imageBlackHTML;
document.getElementsByClassName("pokeguesser_image")[0].innerHTML = '<p>Je hebt juist geraden!</p><br>' + imageHTML;

let input = document.getElementById("guess_input");
const guessButton = document.getElementById("guess_button");
let guessPopup = document.getElementById("container_pokeguesser_image")

guessButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (input.value == "eevee" && randomBlackImage == "eeveeBlack.webp") {
        guessPopup.style.display = "flex"
    }
    else if (input.value == "pikachu" && randomBlackImage == "pikachuBlack.webp") {
        guessPopup.style.display = "flex"
    }
    else if (input.value == "mew" && randomBlackImage == "mewBlack.webp"){
        guessPopup.style.display = "flex"
    }
});

window.onclick = function(event) {
    if (event.target == guessPopup) {
        guessPopup.style.display = "none";
        location.reload();
    }
};


