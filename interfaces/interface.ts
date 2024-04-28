

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
    sprites: Sprite
    sprites: Sprite;
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

export interface Sprite {
    front_default: string,
    back_default: string
    other: Other
}

export interface Other {
    'official-artwork': OfficialArt
}

export interface OfficialArt {
    front_default: string,
    front_shiny: string
}



export interface Sprite {
    front_default: string,
    back_default: string
    other: Other
}

export interface Other {
    'official-artwork': OfficialArt
}

export interface OfficialArt {
    front_default: string,
    front_shiny: string
}