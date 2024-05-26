import { NextFunction, Request, Response } from "express";


export function currentPokemonMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.current) {
        res.locals.current = req.session.current;
    }
    else {
        res.locals.current = undefined;
    }
    next();
};