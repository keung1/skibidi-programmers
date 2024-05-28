import { NextFunction, Request, Response } from "express";


export function currentPokemonMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.current) {
        console.log(req.session.current.name);
        res.locals.current = req.session.current;
        console.log(res.locals.current.name);
    }
    else {
        res.locals.current = undefined;
    }
    next();
};