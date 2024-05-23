import { NextFunction, Request, Response } from "express";


export function currentPokemonMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.user?.pokemon_collection) {
        res.locals.myPokemons = req.session.user?.pokemon_collection
    }
    else {
        res.locals.myPokemons = undefined;
    }
    next();
};