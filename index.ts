import express from "express";
import ejs from "ejs";

const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);
app.use(express.static("public"));


app.get("/", (req, res) => {
    res.render("index");
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


app.get("/detail", (req, res) => {
    res.render("detailedpokemon");
});

app.get("/comparison", (req, res) => {
    res.render("pokemoncomparison");
});

app.listen(app.get("port"), () => {
    console.log(`Server is running on port ${app.get("port")}`);
});