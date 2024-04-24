import express from "express";
import ejs from "ejs";

const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);
app.use(express.static("public"));

app.get("/landing", (req, res) => {
    res.render("landing");
})

app.get("/forgot", (req, res) => {
    res.render("forgot");
})

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/pokedex", (req, res) => {
    res.render("pokedex");
});

app.get("/battle", (req, res) => {
    res.render("battle");
});

app.get("/guesser", (req, res) => {
    res.render("guesser");
})

app.get("/safari", (req, res) => {
    res.render("safari");
})

app.listen(app.get("port"), () => {
    console.log(`Server is running on port ${app.get("port")}`);
});