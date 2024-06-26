import dotenv from "dotenv";
import { FlashMessage, Pokemon } from "./interfaces/interface";
import { User } from "./interfaces/interface";
dotenv.config();

import session from "express-session";
import mongoDbSession from "connect-mongodb-session";
const MongoDBStore = mongoDbSession(session);

const mongoStore = new MongoDBStore({
    uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
    collection: "sessions",
    databaseName: "skibidi_programmers"
});

mongoStore.on("error", (error) => {
    console.error(error);
});

declare module 'express-session' {
    export interface SessionData {
        user?: User;
        message?: FlashMessage;
        current?: Pokemon;
    }
}

export default session({
    secret: process.env.SESSION_SECRET ?? "my-super-secret-secret",
    store: mongoStore,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 *7
    }
});