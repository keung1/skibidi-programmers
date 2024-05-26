import { MongoClient } from "mongodb";
import {Pokemon} from "./interfaces/interface";
import {User} from "./interfaces/interface"
import dotenv from "dotenv"
import { error } from "console";
import bcrypt from "bcrypt";

require('dotenv').config()

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
export const client = new MongoClient(MONGO_URI);
export const pokemonCollection = client.db("skibidi_programmers").collection<Pokemon>("pokemons");
export const userCollection = client.db("skibidi_programmers").collection<User>("users");

const saltRounds: number = 10;

async function exit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

async function seed() {
    if(await pokemonCollection.countDocuments() == 0) {
        for(let i = 1; i <= 151; i++) {
            let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
            let pokemon: Pokemon = await response.json();            
            await pokemonCollection.insertOne(pokemon);
        }
    }
}

export async function getPokemons() {
    return await pokemonCollection.find().toArray();
}

export async function registerUser(name: string, password: string) {
    let pokemonCollection: Pokemon[] = [];
    console.log(await bcrypt.hash(password, saltRounds));
    await userCollection.insertOne({
        name: name,
        password: await bcrypt.hash(password, saltRounds),
        pokemon_collection: pokemonCollection,
        current_pokemon: undefined
    })
}

export async function login(name: string, password: string) {
    if (name === "" || password === "") {
        throw new Error("username en paswoord mogen niet leeg zijn");
    }
        let result: User | null = await userCollection.findOne<User>({name: name});
        if (result) {
            console.log(await bcrypt.compare(password, result.password!));
            if (true) {
                return result;
            }
            else {
                throw new Error("foute inlog gegevens");
            }
        }
}

export async function addPokemon(user: User, pokemon: Pokemon[]) {
    await userCollection.updateOne({name: user.name}, {$set: { pokemon_collection: pokemon}} )
}

export async function getUser(user: User) {
    return await userCollection.findOne({name: user.name});
}

export async function checkPokemons(user: User, pokemon: Pokemon) {
    if (await userCollection.findOne({name: user.name, "pokemon_collection.name": pokemon.name})) {
        return true;
    } else {
        return false;
    }
}

export async function removePokemon(user: User, pokemon: Pokemon) {
    let currentUser: User | null = await userCollection.findOne({name: user.name});
    let currentPokemons: Pokemon[] | undefined = currentUser?.pokemon_collection;
    let removeIndex: number | undefined = currentPokemons?.findIndex((pokemons)=> {
        return pokemons.name == pokemon.name;
    });
    currentPokemons?.splice(removeIndex!, 1);
    await userCollection.updateOne({name: user.name}, {$set: {pokemon_collection: currentPokemons}})
}

export async function connect() {
    try {
        await client.connect();
        await seed();
        console.log("Connected to database");
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}