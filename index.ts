import express from "express";
import ejs from "ejs";
import {Pokemon} from "./interfaces/interface";

const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


let pokemons: Pokemon[] = [];


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/forgot", (req, res) => {
    res.render("forgot");
});

app.get("/pokedex", async(req, res) => {
        res.render('pokedex', { pokemons });
});

app.get("/battle", (req, res) => {
    res.render("battle");
});
app.get("/home", (req, res) => {
    res.render("home");
});

app.get("/myteam", (req,res) => {
    res.render("myteam");
});

app.get("/detail", (req, res) => {
    res.render("detailed");
});

app.get("/comparison", (req, res) => {
    res.render("pokemoncomparison");
});

/*-------------------------- pokeguesser -------------------------- */
let pokemonAnswer: Pokemon;

function randomPokemon() {
    let randomId: number = Math.floor(Math.random() * 151) + 1;
    let randomPokemon = {} as Pokemon;
    for(let i: number = 0; i < pokemons.length; i++) {
        if (i === randomId - 1) {
            randomPokemon = pokemons[i];
        };
    }; 
    pokemonAnswer = randomPokemon;
};

app.get("/restart", (req, res) => {
    randomPokemon();
    res.redirect("/guesser");
});

app.get("/guesser", (req, res) => {   
    let answer: boolean = false;
    res.render("pokeguesser", {
        pokemonGuess: {
            name: pokemonAnswer.name,
            image: pokemonAnswer.sprites.other["official-artwork"].front_default,
            succes: answer
        }
    });
});

app.post("/guesser", (req, res) => {
    let guess: string = req.body.guess;
    let answer: boolean = false;
    if (guess.toUpperCase() == pokemonAnswer.name.toUpperCase()) {
        answer = true;
    }
    res.render("pokeguesser", {
        pokemonGuess: {
            name: pokemonAnswer.name,
            image: pokemonAnswer.sprites.other["official-artwork"].front_default,
            succes: answer
        }
    });
});

/*-------------------------- pokecatcher -------------------------- */

app.get("/safari", (req, res) => {

    res.render("pokecatcher");

});

app.listen(app.get("port"), async () => {
    for(let i = 1; i <= 151; i++) {
        let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
        let pokemon: Pokemon = await response.json();
        pokemons.push(pokemon);
    }
    randomPokemon();
    console.log(`Server is running on port ${app.get("port")}`);
});