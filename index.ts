import express from "express";
import ejs from "ejs";
import {Pokemon} from "./interfaces/interface";
import {User} from "./interfaces/interface";
import { addPokemon, checkPokemons, connect/*, enhancePokemon*/, getPokemons, getUser, login, registerUser, removePokemon } from "./database";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "./session";
import { flashMiddleware } from "./middleware/flashMiddleware";
import { secureMiddleware } from "./middleware/secureMiddleware";
import { currentPokemonMiddleware } from "./middleware/currentPokemonMiddleware";
import { promisify } from "util";
import { exists } from "fs";

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
    let allPokemons: boolean = false;
    for (let pokemon of pokemons) {
        pokemon.owned = true;
    }
    res.render('pokedex', { pokemons,
        myPokemons: user?.pokemon_collection,
        allPokemons: allPokemons
    });
});

app.get("/myPokedex", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    let myPokemons: Pokemon[] | undefined = user!.pokemon_collection;
    let allPokemons: boolean = true;
    for (let pokemon of pokemons) {
        pokemon.owned = false;
    }
    if (myPokemons) {
        for(let i: number = 0; i < myPokemons.length; i++) {
            if (myPokemons[i].id == pokemons[parseInt(myPokemons[i].id) - 1].id) {
                pokemons[parseInt(myPokemons[i].id) - 1].owned = true;
            }
            else {
                pokemons[parseInt(myPokemons[i].id) - 1].owned = false;
            }
        }
    }
    res.render('pokedex', { pokemons,
        myPokemons: user?.pokemon_collection,
        allPokemons: allPokemons
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
        query,
        allPokemons: true
    });
});


/*-------------------------- battle -------------------------- */
let randomPokemonInstance = {} as Pokemon;
let ownPokemon = {} as Pokemon | undefined;

app.get("/battle", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    ownPokemon = req.session.current;
    let resultMessage = '';
    let randomLevel: number = 0;
    
    randomPokemonInstance = randomPokemon();
    let attack = randomPokemonInstance.stats[1].base_stat;
    let defense = randomPokemonInstance.stats[2].base_stat;
    let hp = randomPokemonInstance.stats[0].base_stat;


    if(ownPokemon){
        randomLevel = Math.floor(Math.random() * 10) + 1;
    }
        
        
    res.render("battle", { 
        ownPokemon,
        opponentPokemon: randomPokemonInstance,
        myPokemons: user?.pokemon_collection,
        resultMessage,
        randomLevel
        });
});


app.get("/search", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    const queryParam = req.query.query;
    const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    let resultMessage = '';
    let randomLevel: number = 0;

    
    const ownPokemon = req.session.current;

    if (typeof query !== 'string') {
        return res.render('battle', { pokemons: [], query: '', ownPokemon, opponentPokemon: randomPokemonInstance });
    }

    const searchedPokemon = pokemons.find(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );

    if (searchedPokemon !== undefined){
        randomPokemonInstance = searchedPokemon;
        let attack = randomPokemonInstance.stats[1].base_stat;
        let defense = randomPokemonInstance.stats[2].base_stat;
        let hp = randomPokemonInstance.stats[0].base_stat;
    }

    res.render('battle', { 
        pokemons, 
        query, 
        ownPokemon,
        opponentPokemon: randomPokemonInstance,
        myPokemons: user?.pokemon_collection,
        resultMessage,
        randomLevel
    });
});

app.post("/battle", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    ownPokemon = req.session.current;
    let randomLevel: number = 0;


    if (!ownPokemon || !randomPokemonInstance) {
        res.status(400).send("Pokémon-gegevens ontbreken in de sessie");
        return;
    }

    const damageToOpponent = Math.round((ownPokemon.stats[0].base_stat) * (ownPokemon.stats[1].base_stat / randomPokemonInstance.stats[2].base_stat));
    const damageToPlayer = Math.round((randomPokemonInstance.stats[0].base_stat) * (randomPokemonInstance.stats[1].base_stat / ownPokemon.stats[2].base_stat));

    randomPokemonInstance.stats[0].base_stat -= damageToOpponent;
    ownPokemon.stats[0].base_stat -= damageToPlayer;

    let resultMessage = '';
   if(randomPokemonInstance.stats[0].base_stat <= 0){
        randomPokemonInstance.stats[0].base_stat = 0;
        resultMessage = `${ownPokemon.name} heeft gewonnen!`;
   }else if( ownPokemon.stats[0].base_stat <= 0){
        ownPokemon.stats[0].base_stat = 0;
        resultMessage = `${randomPokemonInstance.name} heeft gewonnen!`;
   }else if(randomPokemonInstance.stats[0].base_stat <= 0 && ownPokemon.stats[0].base_stat <= 0){
        ownPokemon.stats[0].base_stat = 0;
        randomPokemonInstance.stats[0].base_stat = 0;
        resultMessage = `Niemand heeft gewonnen. Het is gelijk!`;
   }

    res.render("battle", {
        ownPokemon: ownPokemon, 
        opponentPokemon: randomPokemonInstance, 
        myPokemons: user?.pokemon_collection,
        resultMessage,
        randomLevel
        });
});

/*--------detail------ */

let evolutionChain: any[] = [];

let evo1 : Pokemon;
let evo2: Pokemon;
let evo3 : Pokemon;
let nummer3: boolean;

app.get("/detail/:id", async(req, res) => {
    
    let user: User | null = await getUser(req.session.user!);
    const id  = req.params.id;
    let pokemon ;
    for(let pokemonn of pokemons){
        if(pokemonn.id == id){
            pokemon = pokemonn


            const speciesResponse = await fetch(pokemon.species.url);
    const speciesData = await speciesResponse.json();

    // Fetch evolution chain data
    const evolutionResponse = await fetch(speciesData.evolution_chain.url);
    const evolutionData = await evolutionResponse.json();

    // Extract evolution chain
    
    let current = evolutionData.chain;
    while (current) {
      evolutionChain.push(current.species.name);
      current = current.evolves_to[0];
    }
        }
    }

    console.log(evolutionChain)

    for(let pokemon of pokemons){

        if(evolutionChain[0] == pokemon.name ){
            evo1 = pokemon;
        }
        if( evolutionChain[1] == pokemon.name ){
            evo2 = pokemon
        }
        
        if ( evolutionChain[2] == pokemon.name ){
            evo3 = pokemon
            nummer3 = true;
        }

    }
    
    res.render('detailed', { nummer3 : nummer3 , pokemon , myPokemons: user?.pokemon_collection, evolution : evolutionChain, evo1 : evo1, evo2 : evo2, evo3 : evo3});   
    evolutionChain = [];  
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

    
    
    if(pokemon1.stats[0].base_stat > pokemon2.stats[0].base_stat){
        hp1 = "more"
        hp2 = "less"
    }    
    else if(pokemon1.stats[0].base_stat < pokemon2.stats[0].base_stat){
        hp1 = "less"
        hp2 = "more"
    }
    else{
        hp1 = "even"
        hp2 = "even"
    }
   
    if(pokemon1.stats[1].base_stat > pokemon2.stats[1].base_stat){
        attack1 = "more"
        attack2 = "less"
    }    
    else if(pokemon1.stats[1].base_stat < pokemon2.stats[1].base_stat){
        attack1 = "less"
        attack2 = "more"
    }
    else{
        attack1 = "even"
        attack2 = "even"
    }

    if(pokemon1.stats[2].base_stat > pokemon2.stats[2].base_stat){
        defense1 = "more"
        defense2 = "less"
    }    
    else if(pokemon1.stats[2].base_stat < pokemon2.stats[2].base_stat){
        defense1 = "less"
        defense2 = "more"
    }
    else{
        defense1 = "even"
        defense2 = "even"
    }

    if(pokemon1.stats[3].base_stat > pokemon2.stats[3].base_stat){
        speciala1 = "more"
        speciala2 = "less"
    }    
    else if(pokemon1.stats[3].base_stat < pokemon2.stats[3].base_stat){
        speciala1 = "less"
        speciala2 = "more"
    }
    else{
        speciala1 = "even"
        speciala2 = "even"
    }

    if(pokemon1.stats[4].base_stat > pokemon2.stats[4].base_stat){
        speciald1 = "more"
        speciald2 = "less"
    }    
    else if(pokemon1.stats[4].base_stat < pokemon2.stats[4].base_stat){
        speciald1 = "less"
        speciald2 = "more"
    }
    else{
        speciald1 = "even"
        speciald2 = "even"
    }

    if(pokemon1.stats[5].base_stat > pokemon2.stats[5].base_stat){
        speed1 = "more"
        speed2 = "less"
    }    
    else if(pokemon1.stats[5].base_stat < pokemon2.stats[5].base_stat){
        speed1 = "less"
        speed2 = "more"
    }
    else{
        speed1 = "even"
        speed2 = "even"
    }

      res.render('pokemoncomparison', { pokemon1: pokemon1, pokemon2: pokemon2,  myPokemons: user?.pokemon_collection,
         hp1: hp1, hp2 : hp2, attack1 : attack1, attack2 : attack2, defense1 : defense1, defense2 : defense2, speciala1 : speciala1, speciald1 : speciald1, speciala2 : speciala2, speciald2 : speciald2,
         speed1 : speed1,speed2 : speed2 });
});

let hp1: string;
let attack1: string;
let defense1;
let speciala1;
let speciald1;
let speed1;

let hp2 : string;
let attack2: string;
let defense2;
let speciala2;
let speciald2;
let speed2;

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

    
    if(pokemon1.stats[0].base_stat > pokemon2.stats[0].base_stat){
        hp1 = "more"
        hp2 = "less"
    }    
    else if(pokemon1.stats[0].base_stat < pokemon2.stats[0].base_stat){
        hp1 = "less"
        hp2 = "more"
    }
    else{
        hp1 = "even"
        hp2 = "even"
    }
   
    if(pokemon1.stats[1].base_stat > pokemon2.stats[1].base_stat){
        attack1 = "more"
        attack2 = "less"
    }    
    else if(pokemon1.stats[1].base_stat < pokemon2.stats[1].base_stat){
        attack1 = "less"
        attack2 = "more"
    }
    else{
        attack1 = "even"
        attack2 = "even"
    }

    if(pokemon1.stats[2].base_stat > pokemon2.stats[2].base_stat){
        defense1 = "more"
        defense2 = "less"
    }    
    else if(pokemon1.stats[2].base_stat < pokemon2.stats[2].base_stat){
        defense1 = "less"
        defense2 = "more"
    }
    else{
        defense1 = "even"
        defense2 = "even"
    }

    if(pokemon1.stats[3].base_stat > pokemon2.stats[3].base_stat){
        speciala1 = "more"
        speciala2 = "less"
    }    
    else if(pokemon1.stats[3].base_stat < pokemon2.stats[3].base_stat){
        speciala1 = "less"
        speciala2 = "more"
    }
    else{
        speciala1 = "even"
        speciala2 = "even"
    }

    if(pokemon1.stats[4].base_stat > pokemon2.stats[4].base_stat){
        speciald1 = "more"
        speciald2 = "less"
    }    
    else if(pokemon1.stats[4].base_stat < pokemon2.stats[4].base_stat){
        speciald1 = "less"
        speciald2 = "more"
    }
    else{
        speciald1 = "even"
        speciald2 = "even"
    }

    if(pokemon1.stats[5].base_stat > pokemon2.stats[5].base_stat){
        speed1 = "more"
        speed2 = "less"
    }    
    else if(pokemon1.stats[5].base_stat < pokemon2.stats[5].base_stat){
        speed1 = "less"
        speed2 = "more"
    }
    else{
        speed1 = "even"
        speed2 = "even"
    }



    res.render('pokemoncomparison', { pokemon1: pokemon1, query, pokemon2: pokemon2, hp1: hp1, hp2 : hp2, attack1 : attack1, attack2 : attack2, defense1 : defense1, defense2 : defense2, speciala1 : speciala1, speciald1 : speciald1, speciala2 : speciala2, speciald2 : speciald2,
        speed1 : speed1,speed2 : speed2,
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

    
    if(pokemon1.stats[0].base_stat > pokemon2.stats[0].base_stat){
        hp1 = "more"
        hp2 = "less"
    }    
    else if(pokemon1.stats[0].base_stat < pokemon2.stats[0].base_stat){
        hp1 = "less"
        hp2 = "more"
    }
    else{
        hp1 = "even"
        hp2 = "even"
    }
   
    if(pokemon1.stats[1].base_stat > pokemon2.stats[1].base_stat){
        attack1 = "more"
        attack2 = "less"
    }    
    else if(pokemon1.stats[1].base_stat < pokemon2.stats[1].base_stat){
        attack1 = "less"
        attack2 = "more"
    }
    else{
        attack1 = "even"
        attack2 = "even"
    }

    if(pokemon1.stats[2].base_stat > pokemon2.stats[2].base_stat){
        defense1 = "more"
        defense2 = "less"
    }    
    else if(pokemon1.stats[2].base_stat < pokemon2.stats[2].base_stat){
        defense1 = "less"
        defense2 = "more"
    }
    else{
        defense1 = "even"
        defense2 = "even"
    }

    if(pokemon1.stats[3].base_stat > pokemon2.stats[3].base_stat){
        speciala1 = "more"
        speciala2 = "less"
    }    
    else if(pokemon1.stats[3].base_stat < pokemon2.stats[3].base_stat){
        speciala1 = "less"
        speciala2 = "more"
    }
    else{
        speciala1 = "even"
        speciala2 = "even"
    }

    if(pokemon1.stats[4].base_stat > pokemon2.stats[4].base_stat){
        speciald1 = "more"
        speciald2 = "less"
    }    
    else if(pokemon1.stats[4].base_stat < pokemon2.stats[4].base_stat){
        speciald1 = "less"
        speciald2 = "more"
    }
    else{
        speciald1 = "even"
        speciald2 = "even"
    }

    if(pokemon1.stats[5].base_stat > pokemon2.stats[5].base_stat){
        speed1 = "more"
        speed2 = "less"
    }    
    else if(pokemon1.stats[5].base_stat < pokemon2.stats[5].base_stat){
        speed1 = "less"
        speed2 = "more"
    }
    else{
        speed1 = "even"
        speed2 = "even"
    }



    res.render('pokemoncomparison', { pokemon2: pokemon2, query, pokemon1: pokemon1, hp1: hp1, hp2 : hp2,
        attack1 : attack1, attack2 : attack2, defense1 : defense1, defense2 : defense2, speciala1 : speciala1, speciald1 : speciald1, speciala2 : speciala2, speciald2 : speciald2,
        speed1 : speed1,speed2 : speed2,myPokemons: user?.pokemon_collection});
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

let raiseAtt: boolean = false;
let raiseDef: boolean = false;
let answer: boolean = false;
let oldCurrentPokemon = {} as Pokemon | undefined;
app.get("/restart", (req, res) => {
    pokemonAnswer = randomPokemon();
    raiseAtt = false;
    raiseDef = false;
    answer = false;
    res.redirect("/guesser");
});

app.get("/guesser", async(req, res) => {   
    let user: User | null = await getUser(req.session.user!);
    pokemonAnswer = randomPokemon();
    oldCurrentPokemon = req.session.current;
    res.render("pokeguesser", {
        pokemonGuess: {
            name: pokemonAnswer.name,
            image: pokemonAnswer.sprites.other["official-artwork"].front_default,
            succes: answer
        },
        myPokemons: user?.pokemon_collection,
        oldCurrent: oldCurrentPokemon,
        attack: raiseAtt,
        defense: raiseDef
    });
});

app.post("/guesser", async(req, res) => {
    let user: User | null = await getUser(req.session.user!);
    let guess: string = req.body.guess;
    if (guess.toUpperCase() == pokemonAnswer.name.toUpperCase()) {
        let currentPokemon: Pokemon | undefined = req.session.current;
        if(currentPokemon) {
            if (Math.random() < 0.5) {
                console.log(currentPokemon.stats[1].base_stat);
                let att: number = currentPokemon.stats[1].base_stat;
                currentPokemon.stats[1].base_stat = att + 1;
                console.log("+" + currentPokemon.stats[1].base_stat);
                raiseAtt = true;
            }
            else {
                console.log(currentPokemon.stats[2].base_stat);
                let def: number = currentPokemon.stats[2].base_stat;
                currentPokemon.stats[2].base_stat = def + 1;
                console.log("+" + currentPokemon.stats[2].base_stat);
                raiseDef = true;
            }
            
            /*await enhancePokemon(user!, currentPokemon!);
            req.session.current = currentPokemon;
            answer = true;*/
        }
        else {
            answer = false;
            req.session.message = {type: "noCurrent", message: `je hebt juist geraden maar nog geen huidige pokemon gekozen`};
        }
        
    }
    req.session.save(function(err) {
        if(err) { 
            res.status(500);
        }
        else { 
            res.render("pokeguesser", {
            pokemonGuess: {
                name: pokemonAnswer.name,
                image: pokemonAnswer.sprites.other["official-artwork"].front_default,
                succes: answer
            },
            myPokemons: user?.pokemon_collection,
            oldCurrent: oldCurrentPokemon,
            attack: raiseAtt,
            defense: raiseDef
        });
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
    if (req.session.current){
        catchLevel = Math.floor(Math.random() * (maxLevel - 1) + 1);  
    }
    else {
        catchLevel = Math.floor(Math.random() * (req.session.current!.level! - 1) + 1); 
    } 
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
    pokemonSpawns = [];
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



