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
    await userCollection.insertOne({
        name: name,
        password: password,
        pokemon_collection: pokemonCollection
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