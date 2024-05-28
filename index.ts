import express from "express";
import ejs from "ejs";
import {Pokemon} from "./interfaces/interface";
import {User} from "./interfaces/interface";
import { addPokemon, checkPokemons, connect, enhancePokemon, getPokemons, getUser, login, registerUser, removePokemon } from "./database";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "./session";
import { flashMiddleware } from "./middleware/flashMiddleware";
import { secureMiddleware } from "./middleware/secureMiddleware";
import { currentPokemonMiddleware } from "./middleware/currentPokemonMiddleware";
import { promisify } from "util";

const app = express();

app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session);
app.use(currentPokemonMiddleware);
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
    let user: User | null = await getUser(req.session.user!);
    res.render("home", {
        user: req.session.user,
        myPokemons: user?.pokemon_collection
    });
});


/*--------pokedex-------*/ 


app.get("/pokedex", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    res.render('pokedex', { pokemons,
        myPokemons: user?.pokemon_collection
     });
});

app.get("/filter", async(req, res) => {

    
    const queryParam = req.query.query;
    const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    let user: User | null = await getUser(req.session.user!);
    if (typeof query !== 'string') {
      return res.redirect('/pokedex');
  }
      const filtered = pokemons.filter(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );
    res.render('pokedex', { 
        pokemons: filtered,
        myPokemons: user?.pokemon_collection,
        query 
    });
  });


/*-------------------------- battle -------------------------- */
let randomPokemonInstance = {} as Pokemon;
let ownPokemon = {} as Pokemon | undefined;
let opponentPokemon: Pokemon;

app.get("/battle", (req, res) => {
    ownPokemon = req.session.current;
    let resultMessage = "";
    
        randomPokemonInstance = randomPokemon();
        opponentPokemon = randomPokemonInstance;
      
        opponentPokemon.level = randomPokemonInstance.stats[0].base_stat;
        opponentPokemon.attack = randomPokemonInstance.stats[1].base_stat;
        opponentPokemon.defense = randomPokemonInstance.stats[2].base_stat;
        opponentPokemon.hp = randomPokemonInstance.stats[0].base_stat;

        req.session.opponentPokemon = opponentPokemon;
        
    res.render("battle", { 
        ownPokemon,
        opponentPokemon,
        resultMessage
        });
});

// Hp = totale hp - attack + defence


app.get("/search", (req, res) => {
    const queryParam = req.query.query;
    const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;

    const ownPokemon = req.session.current;

    if (typeof query !== 'string') {
        return res.render('battle', { pokemons: [], query: '', ownPokemon, opponentPokemon: undefined });
    }

    const opponentPokemon = pokemons.find(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );

    const randomPokemonInstance = randomPokemon();
    if (opponentPokemon) {
        opponentPokemon.level = randomPokemonInstance.stats[0].base_stat;
        opponentPokemon.attack = randomPokemonInstance.stats[1].base_stat;
        opponentPokemon.defense = randomPokemonInstance.stats[2].base_stat;
        opponentPokemon.hp = randomPokemonInstance.stats[0].base_stat;

    }

    res.render('battle', { 
        pokemons, 
        query, 
        ownPokemon,
        opponentPokemon,

    });
});

app.post("/battle/attack", (req, res) => {
    ownPokemon = req.session.current;

    if (!ownPokemon || !opponentPokemon) {
        res.status(400).send("Pokémon-gegevens ontbreken in de sessie");
        return;
    }

    const damageToOpponent = (ownPokemon.level || 1) * (ownPokemon.attack / (opponentPokemon.defense || 1));
    const damageToPlayer = (opponentPokemon.level || 1) * (opponentPokemon.attack / (ownPokemon.defense || 1));


    opponentPokemon.hp -= damageToOpponent;
    ownPokemon.hp -= damageToPlayer;

    let resultMessage = '';
    if (ownPokemon.hp <= 0) {
        resultMessage = "Je Pokémon is verslagen! Het is tijd om te trainen en sterker terug te komen.";
    } else if (opponentPokemon.hp <= 0) {
        resultMessage = "Je hebt de tegenstander verslagen! Goed gedaan!";
    } else {
        resultMessage = "De strijd is voorbij, maar er is geen duidelijke winnaar. Blijf trainen en probeer het opnieuw!";
    }

    res.render("battle", {
        ownPokemon: ownPokemon, 
        opponentPokemon: opponentPokemon, 
        resultMessage: resultMessage 
    });
});














/*--------detail------ */


app.get("/detail/:id", async(req, res) => {
    
    let user: User | null = await getUser(req.session.user!);
    const id  = req.params.id;
    let pokemon ;
    for(let pokemonn of pokemons){
        if(pokemonn.id == id){
            pokemon = pokemonn
        }
    }

    res.render('detailed', {  pokemon , myPokemons: user?.pokemon_collection });   
  });

/*-------------------------- comparison -------------------------- */

let pokemon1 = {} as Pokemon
let pokemon2 = {} as Pokemon

app.get("/comparison", async(req, res) => {

    
    let user: User | null = await getUser(req.session.user!);

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

    
    for(let i = 0; i < 6; i++){
        if( pokemon1.stats[i].base_stat >  pokemon2.stats[i].base_stat ){
            classname = "more";
            clas = "less";
        }
        else if(pokemon1.stats[i].base_stat <  pokemon2.stats[i].base_stat){
            classname = "less";
            clas = "more";
        }
        else{
            classname = "even"
            clas = "even"
        }
    }

      res.render('pokemoncomparison', { pokemon1: pokemon1, pokemon2: pokemon2, classname : classname, clas : clas, myPokemons: user?.pokemon_collection });
});

let classname: string;

let clas : string;

app.get("/filterpoke", async(req, res) => {
    
    let user: User | null = await getUser(req.session.user!);
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
    for(let i = 0; i < 6; i++){
        if( pokemon1.stats[i].base_stat >  pokemon2.stats[i].base_stat ){
            classname = "more";
            clas = "less";
        }
        else if(pokemon1.stats[i].base_stat <  pokemon2.stats[i].base_stat){
            classname = "less";
            clas = "more";
        }
        else{
            classname = "even"
            clas = "even"
        }
        
    }
    res.render('pokemoncomparison', { pokemon1: pokemon1, query, pokemon2: pokemon2, classname: classname, clas : clas,
        myPokemons: user?.pokemon_collection});
  });

  
  app.get("/filterpoke2", async(req, res) => {

    let user: User | null = await getUser(req.session.user!);

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


    for(let i = 0; i < 6; i++){
        if( pokemon1.stats[i].base_stat >  pokemon2.stats[i].base_stat ){
            classname = "more";
            clas = "less";
        }
        else if(pokemon1.stats[i].base_stat <  pokemon2.stats[i].base_stat){
            classname = "less";
            clas = "more";
        }
        else{
            classname = "even"
            clas = "even"
        }
        
    }

    res.render('pokemoncomparison', { pokemon2: pokemon2, query, pokemon1: pokemon1, clas : clas, classname : classname, 
        myPokemons: user?.pokemon_collection});
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

app.get("/guesser", async(req, res) => {   
    let user: User | null = await getUser(req.session.user!);
    pokemonAnswer = randomPokemon();
    let oldCurrentPokemon = req.session.current;
    res.render("pokeguesser", {
        pokemonGuess: {
            name: pokemonAnswer.name,
            image: pokemonAnswer.sprites.other["official-artwork"].front_default,
            succes: false
        },
        myPokemons: user?.pokemon_collection,
        oldCurrent: oldCurrentPokemon
    });
});

app.post("/guesser", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    let guess: string = req.body.guess;
    let answer: boolean = false;
    let oldCurrentPokemon = {} as Pokemon | undefined;
    if (guess.toUpperCase() == pokemonAnswer.name.toUpperCase()) {
        let currentPokemon: Pokemon | undefined = req.session.current;
        if(currentPokemon) {
            if (Math.random() < 0.5) {
                currentPokemon!.stats[1].base_stat + 1;
            }
            else {
                currentPokemon!.stats[2].base_stat + 1
            }
            await enhancePokemon(user!, currentPokemon!);
            req.session.current = currentPokemon;
            answer = true;
        }
        else {
            answer = false;
            req.session.message = {type: "noCurrent", message: `je hebt juist geraden maar nog geen huidige pokemon gekozen`};
            console.log(req.session.message);
        }
        
    }
    req.session.save(function(err) {
        if(err) { 
            res.status(500);
        }
        else { res.redirect("/guesser");
        }
    });
});

/*-------------------------- pokecatcher -------------------------- */
let pokemonSpawns: Pokemon[] = [];
let catchLevel: number = 0;
app.get("/safari",secureMiddleware , async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    let check: boolean = false;
    //pokemonSpawns = [];
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
        },
        myPokemons: user?.pokemon_collection
    });

});

let spawn = {} as Pokemon | undefined;

app.get("/safari/:id",secureMiddleware , async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    if (req.params.id) {
        let checkSpawn: string = req.params.id;
        spawn = pokemons.find(pokemon => pokemon.id == checkSpawn); 
    }
    let maxLevel: number = 10;
    catchLevel = Math.floor(Math.random() * (maxLevel - 1) + 1);   
    let caught: boolean = await checkPokemons(req.session.user!, spawn!)
    if (spawn != undefined) {
        spawn!.level = catchLevel;
        res.render("pokecatcher", {
            spawn: {
                name: spawn.name,
                sprite: spawn.sprites.front_default,
                type1: spawn.types[0].type.name,
                level: catchLevel,
                succes: true,
                succes2: false,
                caught: caught
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
            },
            myPokemons: user?.pokemon_collection
        });
    };
});

app.post("/confirmationRelease", async(req, res) => {
    let yes: string = req.body.yes;
    let no: string = req.body.no;
    if (yes) {
        await removePokemon(req.session.user!, spawn!);
        if (res.locals.current.name == spawn!.name) {
            req.session.current = undefined;
        }
        req.session.save(function(err) {
            if(err) res.status(500);
            else res.redirect(`/safari/${spawn?.id}`);
        });
    } else {
        res.redirect(`/safari/${spawn?.id}`);
    }
});

let pokeballs: number = 3;
let spawnDEF: number | undefined = 0;
let succes: string = "none";
app.get("/catchMenu", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    if (spawn != undefined) {
        res.render("pokecatcher", {
            spawn: {
                name: spawn.name,
                sprite: spawn.sprites.front_default,
                type1: spawn.types[0].type.name,
                level: catchLevel,
                succes: false,
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
            },
            myPokemons: user?.pokemon_collection,
            succes: succes
        });
    };
});

app.post("/catchMenu", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    let spawnBaseDEF: number | undefined = spawn?.stats[3].base_stat;
    let catchProbability: number = 0;
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
        pokeballs--;
        user?.pokemon_collection?.push(spawn!);
        await addPokemon(req.session.user!, user?.pokemon_collection!);
        succes = "succes";
        res.redirect("/catchMenu");
    }
    else {
        pokeballs--;
        if (pokeballs === 0) {
            succes = "missed";
            res.redirect("/catchMenu");
        }
    }
});

app.post("/run", (req, res) => {
    succes = "none"
    pokeballs = 3;
    res.redirect("/safari");
})

app.post("/currentPokemon", async(req, res) => {
    let currentPokemonId: string = req.body.currentPokemon;
    if (currentPokemonId == "none") {
        req.session.current = undefined;
        req.session.save(function(err) {
            if(err) res.status(500);
            else res.redirect("back");
        });
    } else {
        let user: User | null = await getUser(req.session.user!);
        let currentPokemon: Pokemon | undefined = user!.pokemon_collection?.find((pokemon) => {
            return pokemon.id == currentPokemonId;
        });
        if(currentPokemon != undefined) {
            req.session.current = currentPokemon;
            
            console.log("-" + currentPokemon.name)
            console.log("=" + req.session.current.name)
        }
        req.session.save(function(err) {
            if(err) res.status(500);
            else res.redirect("back");
        });
    }
});

app.listen(app.get("port"), async () => {
    await connect();
    pokemons = await getPokemons(); 
    console.log(`Server is running on port ${app.get("port")}`);
});



