const guessButton = document.getElementById("guess_button");
let guessPopup = document.getElementById("container_pokeguesser_image")


window.onclick = function(event) {
    if (event.target == guessPopup) {
        guessPopup.style.display = "none";
        location.reload();
    }
};


