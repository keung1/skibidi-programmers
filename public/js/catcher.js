let ditto = [100, 10, 100]
let myPokemon = [100, 20, 15]

let catchMenu = document.getElementById("container_pokevanger_menu");
let pokeballButton = document.getElementsByClassName("pokeball_button");
let popup_catch = document.getElementById("container_pokevanger_image");

    pokeballButton[0].addEventListener("click", (e) => {
            e.preventDefault();
            pokeballButton[0].style.backgroundColor = "green"
            catchMenu.style.display = "none";
            popup_catch.style.display = "flex";
        
        /*
        else if (pokeballButton[i].style.backgroundColor === "green") {
            e.preventDefault();
        }
        */
    });


let catchButton = document.getElementById("catch_button");
let runButton = document.getElementById("run_button");
let catchText = document.getElementById("catch_text");
let missText = document.getElementById("missed_text");
let amountBalls = document.getElementById("amount_balls");
let pokeballs = +(amountBalls).innerHTML

function catchPokemon(e) {
    e.preventDefault();
    let defense = ditto[2];
    let currentAttack = myPokemon[1];
    let chance = (100 - defense + currentAttack)/100
    let randNumb = Math.random() 
    if (randNumb < chance) {
        if (!(catchText.style.display === "block")) {
            pokeballs--;
            amountBalls.innerHTML = pokeballs;
        }
        missText.style.display = "none";
        catchText.style.display = "block";
        
    }
    else if (randNumb > chance && !(catchText.style.display === "block")) {
        missText.style.display = "block";
        pokeballs--;
        amountBalls.innerHTML = pokeballs;
        if (pokeballs === 0) {
            popup_catch.style.display = "none";
            missText.style.display = "none";
            pokeballs = 3 
            amountBalls.innerHTML = 3;
        }
    }
};

runButton.addEventListener("click", (e) => {
    popup_catch.style.display = "none";
})

catchButton.addEventListener("click", catchPokemon);



window.addEventListener("click", (e) => {
    if (e.target == catchMenu) {
        catchMenu.style.display = "none";
    }
    else if (e.target == popup_catch) {
        popup_catch.style.display = "none";
        catchText.style.display = "none";
        missText.style.display = "none";
        pokeballs = 3 
        amountBalls.innerHTML = 3;
    }
});