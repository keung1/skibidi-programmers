import express from "express";
import ejs from "ejs";
import {Pokemon} from "./interfaces/interface";
import {User} from "./interfaces/interface";
import { addPokemon, connect, getPokemons, login, registerUser, setCurrentPokemon } from "./database";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "./session";
import { flashMiddleware } from "./middleware/flashMiddleware";
import { secureMiddleware } from "./middleware/secureMiddleware";
import { currentPokemonMiddleware } from "./middleware/currentPokemonMiddleware";

const app = express();

app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session);
app.use(flashMiddleware);
app.use(currentPokemonMiddleware);


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
        const password: string = req.body.password;
        try {
            let user: User | undefined =  await login(username, password);
            console.log(user);
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
    const password_signin: string = req.body.password_signin;
    console.log(username_signin);
    console.log(password_signin);
        try {
            await registerUser(username_signin, password_signin);
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


/*-------------------------- battle -------------------------- */
function calculateHealthPercentage(currentHp: number, maxHp: number): number {
    return Math.round((currentHp / maxHp) * 100);
}

function updatePokemonHealth(targetPokemon: any, damage: number): number {
    targetPokemon.hp = Math.max(0, targetPokemon.hp - damage);
    return calculateHealthPercentage(targetPokemon.hp, targetPokemon.maxHp);
}


app.get("/battle", (req: express.Request & { session: { currentPokemon?: Pokemon & { image?: string, level?: number, attack?: number, defense?: number, hp?: number, maxHp?: number }, opponentPokemon?: Pokemon & { image?: string, level?: number, attack?: number, defense?: number, hp?: number, maxHp?: number }, resultMessage?: string } }, res) => {
    let currentPokemon = req.session.currentPokemon;
    let opponentPokemon = req.session.opponentPokemon;

    let resultMessage: string = req.session.resultMessage || '';

    if (!currentPokemon || !opponentPokemon) {
        return res.render("battle", { currentPokemon: null, randomPokemon: null, resultMessage: "Er ontbreekt een Pokémon om mee te vechten." });
    }


    const randomIndex = Math.floor(Math.random() * pokemons.length);
    const randomPokemon = pokemons[randomIndex];
    const randomPokemonWithImage = {
        ...randomPokemon,
        image: randomPokemon.sprites.other["official-artwork"].front_default,
        level: randomPokemon.stats[0].base_stat,
        attack: randomPokemon.stats[1].base_stat,
        defense: randomPokemon.stats[2].base_stat,
        hp: randomPokemon.stats[0].base_stat,
        maxHp: randomPokemon.stats[0].base_stat
    };

    req.session.opponentPokemon = randomPokemonWithImage;

    if (currentPokemon.hp !== undefined && currentPokemon.maxHp !== undefined && randomPokemonWithImage.hp !== undefined && randomPokemonWithImage.maxHp !== undefined) {
        const currentPokemonHealth = calculateHealthPercentage(currentPokemon.hp, currentPokemon.maxHp);
        const randomPokemonHealth = calculateHealthPercentage(randomPokemonWithImage.hp, randomPokemonWithImage.maxHp);

        res.render("battle", { currentPokemon, randomPokemon: randomPokemonWithImage, resultMessage, currentPokemonHealth, randomPokemonHealth });
    } else {
        res.render("battle", { currentPokemon, randomPokemon: randomPokemonWithImage, resultMessage, currentPokemonHealth: 100, randomPokemonHealth: 100 });
    }
});






app.post("/search", async (req, res) => {
    try {
        const pokemonName = req.body.pokemonName.trim().toLowerCase();
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        
        if (!response.ok) {
            throw new Error('Pokemon not found');
        }

        const data = await response.json();

        const opponentPokemon = {
            name: data.name,
            image: data.sprites.other['official-artwork'].front_default,
            level: data.base_experience,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            hp: data.stats[0].base_stat,
            maxHp: data.stats[0].base_stat
        };

        (req.session as any).opponentPokemon = opponentPokemon;
        
        const ownRandomIndex = Math.floor(Math.random() * pokemons.length);
        const ownRandomPokemon = pokemons[ownRandomIndex];
        const ownRandomPokemonWithImage = {
            ...ownRandomPokemon,
            image: ownRandomPokemon.sprites.other['official-artwork'].front_default,
            level: ownRandomPokemon.stats[0].base_stat,
            attack: ownRandomPokemon.stats[1].base_stat,
            defense: ownRandomPokemon.stats[2].base_stat,
            hp: ownRandomPokemon.stats[0].base_stat,
            maxHp: ownRandomPokemon.stats[0].base_stat
        };

        const currentPokemonHealth = calculateHealthPercentage(ownRandomPokemonWithImage.hp, ownRandomPokemonWithImage.maxHp);
        const randomPokemonHealth = calculateHealthPercentage(opponentPokemon.hp, opponentPokemon.maxHp);


        res.render("battle", { currentPokemon: ownRandomPokemonWithImage, randomPokemon: opponentPokemon, currentPokemonHealth, randomPokemonHealth, resultMessage: '' });
    } catch (error) {
        console.error("Error:", (error as Error).message);
        res.render("battle", { currentPokemon: null, randomPokemon: null, currentPokemonHealth: 100, randomPokemonHealth: 100, resultMessage: (error as Error).message });
    }
});




app.post("/battle/attack", (req, res) => {
    const currentPokemon = (req.session as any).currentPokemon;
    let opponentPokemon = (req.session as any).opponentPokemon;
    let battlesLeft = (req.session as any).battlesLeft || 5; 
    let resultMessage = '';

    if (!currentPokemon || !opponentPokemon) {
        return res.render("battle", { currentPokemon: null, randomPokemon: null, resultMessage: "Er ontbreekt een Pokémon om mee te vechten." });
    }

    if (currentPokemon.hp === 0) {
        resultMessage = `${currentPokemon.name} is verslagen! ${opponentPokemon.name} wint!`;
    } else if (opponentPokemon.hp === 0) {
        resultMessage = `${opponentPokemon.name} is verslagen! ${currentPokemon.name} wint!`;
    } else {
        const currentPokemonPower = currentPokemon.attack + currentPokemon.level;
        const opponentPokemonPower = opponentPokemon.attack + opponentPokemon.level;

        const damageToOpponent = Math.max(0, Math.round((currentPokemonPower - opponentPokemon.defense) / 10));
        const damageToCurrent = Math.max(0, Math.round((opponentPokemonPower - currentPokemon.defense) / 10));

        if (damageToOpponent > damageToCurrent) {
            resultMessage = `${currentPokemon.name} heeft een goede aanval uitgevoerd!`;
            updatePokemonHealth(opponentPokemon, damageToOpponent);
        } else if (damageToOpponent < damageToCurrent) {
            resultMessage = `${opponentPokemon.name} heeft een goede aanval uitgevoerd!`;
            updatePokemonHealth(currentPokemon, damageToCurrent);
        } else {
            resultMessage = "Het is een gelijkspel!";
        }

        if (currentPokemon.hp === 0) {
            resultMessage = `${currentPokemon.name} is verslagen! ${opponentPokemon.name} wint!`;
        } else if (opponentPokemon.hp === 0) {
            resultMessage = `${opponentPokemon.name} is verslagen! ${currentPokemon.name} wint!`;
        }
    }
    

    const currentPokemonHealth = calculateHealthPercentage(currentPokemon.hp, currentPokemon.maxHp);
    const randomPokemonHealth = calculateHealthPercentage(opponentPokemon.hp, opponentPokemon.maxHp);

    battlesLeft--;
    
    (req.session as any).battlesLeft = battlesLeft;
    (req.session as any).opponentPokemon = opponentPokemon;

    res.render("battle", { currentPokemon, randomPokemon: opponentPokemon, resultMessage, currentPokemonHealth, randomPokemonHealth, battlesLeft });

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

let pokemon1 = {} as Pokemon
let pokemon2 = {} as Pokemon

app.get("/comparison", (req, res) => {

    

    for(let pokemonn of pokemons){
        if(pokemonn.name == "bulbasaur"){
         pokemon1 = pokemonn
        }
    }


    for(let pokemonn of pokemons){
        if(pokemonn.name == "charizard"){
         pokemon2 = pokemonn
        }
    }

      res.render('pokemoncomparison', { pokemon1: pokemon1, pokemon2: pokemon2 });
});



app.get("/filterpoke", (req, res) => {
    const queryParam = req.query.pokemon1;
    const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    
    if (typeof query !== 'string') {
      return res.redirect('/pokemoncomparison');
  }
      const filtered = pokemons.find(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );
    if (filtered !== undefined){
        pokemon1 = filtered;
    }
    res.render('pokemoncomparison', { pokemon1: pokemon1, query, pokemon2: pokemon2});
  });


  
  app.get("/filterpoke2", (req, res) => {

    const queryParam2 = req.query.pokemon2;
    const query = Array.isArray(queryParam2) ? queryParam2[0] : queryParam2;
    
    if (typeof query !== 'string') {
      return res.redirect('/pokemoncomparison');
  }

      const filtered2 = pokemons.find(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered2 !== undefined){
        pokemon2 = filtered2;
    }


    res.render('pokemoncomparison', { pokemon2: pokemon2, query, pokemon1: pokemon1});
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
    pokemonAnswer = randomPokemon();
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
let catchLevel: number = 0;
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
    let maxLevel: number = 10;
    catchLevel = Math.floor(Math.random() * (maxLevel - 1) + 1);
    spawn = pokemons.find(pokemon => pokemon.id == checkSpawn); 
    if (spawn != undefined) {
        spawn!.level = catchLevel;
        res.render("pokecatcher", {
            spawn: {
                name: spawn.name,
                sprite: spawn.sprites.front_default,
                type1: spawn.types[0].type.name,
                level: catchLevel,
                succes: check,
                succes2: false
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
let pokeballs: number = 3;
let spawnDEF: number | undefined = 0;
app.get("/catchMenu", (req, res) => {
    if (spawn != undefined) {
        res.render("pokecatcher", {
            spawn: {
                name: spawn.name,
                sprite: spawn.sprites.front_default,
                type1: spawn.types[0].type.name,
                level: catchLevel,
                succes: true,
                succes2: true,
                pokeballs: pokeballs
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

app.post("/catchMenu", async(req, res) => {
    let spawnBaseDEF: number | undefined = spawn?.stats[3].base_stat;
    let catchProbability: number = 0
    if (spawnBaseDEF != undefined) {
        spawnDEF = ((spawnBaseDEF * 2) * catchLevel) / 100;
        if (req.session.user?.current_pokemon) {
            let myBaseATT: number = req.session.user.current_pokemon.stats[1].base_stat; 
            let myATT: number = ((myBaseATT * 2) * catchLevel) / 100;
            catchProbability = (100 - spawnDEF + myATT)/100;
        } else {
            catchProbability = (100 - spawnDEF)/100
        }
    }
    let randNumb: number = Math.random() 
    if (randNumb < catchProbability) {    
        pokeballs = 3;
        req.session.user?.pokemon_collection?.push(spawn!);
        await addPokemon(req.session.user!, req.session.user?.pokemon_collection!)
        res.redirect("/safari");
    }
    else {
        pokeballs--
        if (pokeballs === 0) {
            pokeballs = 3;
            res.redirect("/safari");
        }
    }
});

app.post("/currentPokemon", async(req, res) => {
    let currentPokemonId: string = req.body.currentPokemon;
    let currentPokemon: Pokemon | undefined = req.session.user?.pokemon_collection?.find((pokemon) => {
        return pokemon.id == currentPokemonId;
    });
    console.log(currentPokemon);
    if(currentPokemon != undefined) {
        req.session.current = currentPokemon;
        await setCurrentPokemon(req.session.user!, currentPokemon);
    }
    res.redirect('back');
});

app.listen(app.get("port"), async () => {
    await connect();
    pokemons = await getPokemons(); 
    console.log(`Server is running on port ${app.get("port")}`);
});



