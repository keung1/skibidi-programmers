import { Collection, MongoClient } from "mongodb";
import {Pokemon} from "./interfaces/interface";
import dotenv from "dotenv"

require('dotenv').config()

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
export const client = new MongoClient(MONGO_URI);
export const pokemonCollection: Collection<Pokemon> = client.db("skibidi_programmers").collection<Pokemon>("pokemons");

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
    //pokemonCollection.deleteMany();
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