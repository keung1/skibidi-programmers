import express from "express";
import ejs from "ejs";

const fetch = require('node-fetch');
const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);
app.use(express.static("public"));



app.get('/', async (req, res) => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100');
        const data = await response.json();
        const pokemonList = data.results;
        res.render('index', { pokemonList });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving Pokémon data');
    }
});



app.get("/", (req, res) => {
    res.render("index");
});

app.get("/forgot", (req, res) => {
    res.render("forgot");
});

app.get("/pokedex", (req, res) => {
    res.render("pokedex");
});

app.get("/battle", (req, res) => {
    res.render("battle");
});
app.get("/home", (req, res) => {
    res.render("home");
});

app.get("/myteam", (req,res) => {
    res.render("myteam")
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