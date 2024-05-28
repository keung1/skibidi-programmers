

export interface Pokemon{
    defense: any;
    hp: number;
    attack: any;
    _id?: Object;
    id: string;
    name: string;
    height: number;
    weight: number;
    types: Types [];
    stats: Stats [];
    abilities: abilities[];
    species: species;
    capture: string;
    Evolutions: Evolution;
    sprites: Sprite;
    level?: number;
}

export interface species{
    name : string;
    url: pokemon_species;
}

export interface pokemon_species{
    evolution_chain : evolution_chain;
}

export interface evolution_chain{
    url : evo;
}

export interface evo{
    chain : chain;
}

export interface chain{
    evolves_to : evolves
    species : species;
}

export interface evolves{
    species : species;
}

export interface abilities{
    ability : ability;
    slot: string;
}

export interface ability{
    name: string;
}
export interface Types{
    type : Type;
}
export interface Type{
    name: string;
}
export interface Stats{
    base_stat: number;
    stat : Stat ;
}
export interface Stat{
    name :string;
}
export interface Evolution{
    name:string;
}

export interface Sprite {
    front_default: string,
    back_default: string,
    other: Other
}

export interface Other {
    'official-artwork': OfficialArt
}

export interface OfficialArt {
    front_default: string,
    front_shiny: string
}

export interface User {
    _id?: Object,
    name: string,
    password?: string,
    pokemon_collection?: Pokemon[],
    current_pokemon?: Pokemon
}

export interface FlashMessage {
    type: "error" | 'succes',
    message: string
}