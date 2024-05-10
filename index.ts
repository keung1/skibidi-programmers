import express from "express";
import ejs from "ejs";
import {Pokemon} from "./interfaces/interface";
import { connect, getPokemons } from "./database";
import dotenv from "dotenv";

const app = express();

app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


let pokemons: Pokemon[] = [];


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/forgot", (req, res) => {
    res.render("forgot");
});

/*--------pokedex-------*/ 


app.get("/pokedex", async(req, res) => {
    res.render('pokedex', { pokemons });
});

app.get("/filter", (req, res) => {
    const queryParam = req.query.query;
    const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    
    if (typeof query !== 'string') {
      return res.redirect('/pokedex');
  }
      const filtered = pokemons.filter(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );
    res.render('pokedex', { pokemons: filtered, query });
  });



/*-----------------------battle-----------------------*/
app.get("/battle", (req, res) => {
    const randomIndex = Math.floor(Math.random() * pokemons.length);
    const randomPokemon = pokemons[randomIndex];
    
    const pokemonWithImage = {
        ...randomPokemon,
        image: randomPokemon.sprites.other["official-artwork"].front_default
    };

    res.render("battle", { randomPokemon: pokemonWithImage });
});

/*async function addImageToPokemon(pokemon: Pokemon): Promise<Pokemon> {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`);
        const pokemonData = await response.json();
        const officialArtworkUrl = pokemonData.sprites.other["official-artwork"].front_default;
        return { ...pokemon, image: officialArtworkUrl };
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        return pokemon;
    }
}

addImageToPokemon();

*/
app.get("/home", (req, res) => {
    res.render("home");
});

app.get("/myteam", (req,res) => {
    res.render("myteam");
});

/*--------detail------ */


app.get("/detail", (req, res) => {

    res.render('detailed', {pokemon:pokemons });
  });

app.get("/detail/:id", (req, res) => {
    const id  = "2";
    const pokemon = pokemons.find(obj => obj.id ===id);
    


    res.render('detailed', { pokemon : pokemon   });   
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
    return randomPokemon;
};

app.get("/restart", (req, res) => {
    pokemonAnswer = randomPokemon();
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
    let pokemonSpawns: Pokemon[] = [];
    for(let i = 0; i < 4; i++) {
        let spawn: Pokemon = randomPokemon();
        pokemonSpawns.push(spawn);
    }
    res.render("pokecatcher", {
        spawn1: {
            name: pokemonSpawns[0].name,
            sprite: pokemonSpawns[0].sprites.front_default,
            image: pokemonSpawns[0].sprites.other["official-artwork"].front_default,
        },
        spawn2: {
            name: pokemonSpawns[1].name,
            sprite: pokemonSpawns[1].sprites.front_default,
            image: pokemonSpawns[1].sprites.other["official-artwork"].front_default,
        },
        spawn3: {
            name: pokemonSpawns[2].name,
            sprite: pokemonSpawns[2].sprites.front_default,
            image: pokemonSpawns[2].sprites.other["official-artwork"].front_default,
        },
        spawn4: {
            name: pokemonSpawns[3].name,
            sprite: pokemonSpawns[3].sprites.front_default,
            image: pokemonSpawns[3].sprites.other["official-artwork"].front_default,
        },
    });

});

app.listen(app.get("port"), async () => {
/*
    for(let i = 1; i <= 151; i++) {
        let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
        let pokemon: Pokemon = await response.json();
        pokemons.push(pokemon);
    }
*/
    await connect();
    pokemons = await getPokemons(); 
    pokemonAnswer = randomPokemon();
    console.log(`Server is running on port ${app.get("port")}`);
});



/*----------------------------battle------------------------*/
