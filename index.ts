import express from "express";
import ejs from "ejs";
import {Pokemon} from "./interfaces/interface";
import {User} from "./interfaces/interface";
import { connect, getPokemons, login, registerUser } from "./database";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "./session";
import { register } from "module";
import { flashMiddleware } from "./middleware/flashMiddleware";
import { secureMiddleware } from "./middleware/secureMiddleware";
import { nextTick } from "process";

const app = express();

app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session);
app.use(flashMiddleware);


let pokemons: Pokemon[] = [];
const saltRounds: number = 10;

app.get("/", secureMiddleware, async(req, res) => {
    res.render("index", {
        loggedIn: true
    });
})

app.post("/logout", async(req, res) => {
    req.session.destroy(() =>{
        res.redirect("/");
    });
})

app.post("/", async (req, res, next) => {
    if (req.body.username) {
        const username: string = req.body.username;
        console.log(username);
        const password: string = req.body.password;
        console.log(password);
        try {
            let user: User | undefined =  await login(username, password);
            console.log(user)
            console.log("-")
            if (user) {
                delete user.password;
                req.session.user = user;
                req.session.message = {type: "succes", message: `Welkom ${user.name}`};
                res.redirect("/");
            }
        } catch (e: any) {
            req.session.message = {type: "error", message: `Login mislukt`};
            res.redirect("/");
        }
    }
    else {
        next();
    }
});

app.post("/", async (req, res) => {
    const username_signin: string = req.body.username_signin;
    const password_signin: string = (req.body.password_signin).toString();
        try {
            let hashedPassword: string = await bcrypt.hash(password_signin, saltRounds);
            console.log(await bcrypt.compare(password_signin, hashedPassword));
            console.log(hashedPassword);
            await registerUser(username_signin, hashedPassword);
            res.redirect("/");
        }
        catch {
            res.redirect("/");
        }
});


app.get("/forgot", (req, res) => {
    res.render("forgot");
});

/*--------home-----------*/
app.get("/home", secureMiddleware, async(req, res) => {
    res.render("home", {user: req.session.user});
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
app.get("/battle", async (req, res) => {
    try {
        const allPokemons = await getPokemons();

        const randomIndex = Math.floor(Math.random() * allPokemons.length);
        const randomPokemon = allPokemons[randomIndex];

        const pokemonWithImage = {
            ...randomPokemon,
            image: randomPokemon.sprites.other["official-artwork"].front_default
        };

        res.render("battle", { randomPokemon: pokemonWithImage });
    } catch (error) {
        console.error('Fout bij het ophalen van Pokémon voor de battle:', error);
        res.status(500).send('Er is een fout opgetreden bij het ophalen van Pokémon voor de battle');
    }
});


app.get('/random-pokemon', async (req, res) => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/');
        const data = await response.json();
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const randomPokemonUrl = data.results[randomIndex].url;

        const pokemonResponse = await fetch(randomPokemonUrl);
        const pokemonData = await pokemonResponse.json();

        

        res.json(randomPokemon);
    } catch (error) {
        console.error('Fout bij het ophalen van een willekeurige Pokémon:', error);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het ophalen van een willekeurige Pokémon' });
    }
});





app.get("/home", (req, res) => {
    res.render("home");
});

app.get("/myteam", (req,res) => {
    res.render("myteam");
});

/*--------detail------ */


app.get("/detail/:id", (req, res) => {
    const id  = req.params.id;
    let pokemon ;
    for(let pokemonn of pokemons){
        if(pokemonn.id == id){
            pokemon = pokemonn
        }
    }

    res.render('detailed', {  pokemon  });   
  });

/*-------------------------- comparison -------------------------- */


app.get("/comparison", (req, res) => {
    res.render("pokemoncomparison");
});


app.get("/comparison/filter", (req, res) => {
    const queryParam = req.query.pokemon1;
    const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    
    if (typeof query !== 'string') {
      return res.redirect('/pokemoncomparison');
  }
      const filtered = pokemons.find(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );
    res.render('pokemoncomparison', { pokemon: filtered, query });
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
let pokemonSpawns: Pokemon[] = [];
app.get("/safari",secureMiddleware , (req, res) => {
    let check: boolean = false;
    for(let i = 0; i < 4; i++) {
        let spawn: Pokemon = randomPokemon();
        pokemonSpawns.push(spawn);
    }
    res.render("pokecatcher", {
        spawn1: {
            id: pokemonSpawns[0].id,
            name: pokemonSpawns[0].name,
            sprite: pokemonSpawns[0].sprites.front_default,
            image: pokemonSpawns[0].sprites.other["official-artwork"].front_default,
        },
        spawn2: {
            id: pokemonSpawns[1].id,
            name: pokemonSpawns[1].name,
            sprite: pokemonSpawns[1].sprites.front_default,
            image: pokemonSpawns[1].sprites.other["official-artwork"].front_default,
        },
        spawn3: {
            id: pokemonSpawns[2].id,
            name: pokemonSpawns[2].name,
            sprite: pokemonSpawns[2].sprites.front_default,
            image: pokemonSpawns[2].sprites.other["official-artwork"].front_default,
        },
        spawn4: {
            id: pokemonSpawns[3].id,
            name: pokemonSpawns[3].name,
            sprite: pokemonSpawns[3].sprites.front_default,
            image: pokemonSpawns[3].sprites.other["official-artwork"].front_default,
        },
        spawn: {
            succes: check
        }
    });

});

let spawn = {} as Pokemon | undefined;

app.post("/safari",secureMiddleware , (req, res) => {
    let checkSpawn: string = req.body.spawn_check;
    let check: boolean = true;
    spawn = pokemons.find(pokemon => pokemon.id == checkSpawn); 
    if (spawn != undefined) {
        res.render("pokecatcher", {
            spawn: {
                name: spawn.name,
                sprite: spawn.sprites.front_default,
                type1: spawn.types[0].type.name,
                succes: check
            },
            spawn1: {
                id: pokemonSpawns[0].id,
                name: pokemonSpawns[0].name,
                sprite: pokemonSpawns[0].sprites.front_default,
                image: pokemonSpawns[0].sprites.other["official-artwork"].front_default,
            },
            spawn2: {
                id: pokemonSpawns[1].id,
                name: pokemonSpawns[1].name,
                sprite: pokemonSpawns[1].sprites.front_default,
                image: pokemonSpawns[1].sprites.other["official-artwork"].front_default,
            },
            spawn3: {
                id: pokemonSpawns[2].id,
                name: pokemonSpawns[2].name,
                sprite: pokemonSpawns[2].sprites.front_default,
                image: pokemonSpawns[2].sprites.other["official-artwork"].front_default,
            },
            spawn4: {
                id: pokemonSpawns[3].id,
                name: pokemonSpawns[3].name,
                sprite: pokemonSpawns[3].sprites.front_default,
                image: pokemonSpawns[3].sprites.other["official-artwork"].front_default,
            }
        });
    };
});

app.post("/trycatch", (req, res) => {

})

app.listen(app.get("port"), async () => {
    await connect();
    pokemons = await getPokemons(); 
    pokemonAnswer = randomPokemon();
    console.log(pokemonAnswer);
    console.log(`Server is running on port ${app.get("port")}`);
});



