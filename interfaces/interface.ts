

export interface Pokemon{
    id: string;
    name: string;
    height: number;
    weight: number;
    types: Type;
    Stats: Stat;
    abilities: Ability;
    species: string;
    capture: string;
    Evolutions: Evolution;
}


export interface Ability{
    name: string;
}
export interface Type{
    name: string;
}
export interface Stat{
    base_stat: number;
    Stat_name: string;
}
export interface Evolution{
    name:string;
}