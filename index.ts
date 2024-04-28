import express from "express";
import ejs from "ejs";
import {Pokemon} from "./interfaces/interface";

const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);
app.use(express.static("public"));

let Pokemons: Pokemon[] ;

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/forgot", (req, res) => {
    res.render("forgot");
});

app.get("/pokedex", async(req, res) => {
    try {
        
    for(let i=1; i <100; i++){
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
    
        const data = await response.json();
        Pokemons = data.results;
        res.render('pokedex', { Pokemons, i });
    }
    
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving Pokémon data');
    }

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
    res.render("detailedpokemon");
});

app.get("/comparison", (req, res) => {
    res.render("pokemoncomparison");
});

app.get("/guesser", (req, res) => {
    res.render("pokeguesser");
});

app.get("/safari", (req, res) => {
    res.render("pokecatcher");
});

app.listen(app.get("port"), () => {
    console.log(`Server is running on port ${app.get("port")}`);
});