// src/app/pokemon.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

export interface Pokemon {
  name: string;        // Nom en anglais
  name_fr: string;     // Nom en français
  image: string;
  id: number;
  types: string[];     // Noms des types en français
}

export interface Generation {
  name: string;
  url: string;
}

export interface Type {
  name: string;        // Nom en anglais
  name_fr: string;     // Nom en français
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private apiUrl = 'https://pokeapi.co/api/v2';
  private typeNameMap: Map<string, string> = new Map(); // Déclaration de typeNameMap

  constructor(private http: HttpClient) {}

  // Récupère les détails de l'espèce d'un Pokémon
  getPokemonSpecies(pokemonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pokemon-species/${pokemonId}/`);
  }

  // Récupère les types avec leurs noms en français et remplit typeNameMap
  getTypes(): Observable<Type[]> {
    return this.http.get<{ results: Type[] }>(`${this.apiUrl}/type/`).pipe(
      switchMap(response => {
        const typeRequests = response.results.map(type =>
          this.http.get<any>(type.url).pipe(
            map(typeDetails => {
              const frenchNameEntry = typeDetails.names.find((n: any) => n.language.name === 'fr');
              const name_fr = frenchNameEntry ? this.capitalize(frenchNameEntry.name) : type.name;
              // Remplir la map avec le nom anglais en minuscules
              this.typeNameMap.set(type.name.toLowerCase(), this.capitalize(name_fr));
              // console.log(`Type ajouté à la map: ${type.name.toLowerCase()} -> ${this.capitalize(name_fr)}`);
              // Retourner l'objet Type avec name_fr
              return {
                name: this.capitalize(type.name),
                name_fr: this.capitalize(name_fr),
                url: type.url
              };
            })
          )
        );
        return forkJoin(typeRequests);
      }),
      map(types => types)
    );
  }

  // Récupère les Pokémon de la première génération avec noms en anglais et français
  getFirstGenerationPokemon(): Observable<Pokemon[]> {
    return this.http.get<{ pokemon_species: Array<{ name: string; url: string }> }>(
      `${this.apiUrl}/generation/1/`
    ).pipe(
      map(response =>
        response.pokemon_species.map(species => {
          // Extraire l'ID du Pokémon depuis l'URL
          const urlParts = species.url.split('/').filter(part => part);
          const id = parseInt(urlParts[urlParts.length - 1], 10);
          const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
          return {
            name: this.capitalize(species.name),
            name_fr: '', // À remplir après récupération du nom français
            image,
            id,
            types: [] as string[], // Types seront ajoutés séparément
          };
        })
      ),
      switchMap(pokemons => {
        // Pour chaque Pokémon, récupérer les types et le nom français
        const requests = pokemons.map(pokemon =>
          forkJoin({
            types: this.http.get<any>(`${this.apiUrl}/pokemon/${pokemon.id}`).pipe(
              map(pokeDetails => pokeDetails.types.map((typeInfo: any) => {
                const typeName = typeInfo.type.name.toLowerCase();
                const typeNameFr = this.typeNameMap.get(typeName) || this.capitalize(typeInfo.type.name);
                return typeNameFr;
              }))
            ),
            species: this.getPokemonSpecies(pokemon.id).pipe(
              map(speciesDetails => {
                const frenchNameEntry = speciesDetails.names.find((n: any) => n.language.name === 'fr');
                return frenchNameEntry ? this.capitalize(frenchNameEntry.name) : pokemon.name;
              })
            )
          }).pipe(
            map(({ types, species }) => {
              pokemon.types = types;
              pokemon.name_fr = species;
              return pokemon;
            })
          )
        );
        return forkJoin(requests);
      })
    );
  }

  // Récupère toutes les générations
  getGenerations(): Observable<Generation[]> {
    return this.http.get<{ results: Generation[] }>(`${this.apiUrl}/generation/`).pipe(
      map(response => response.results)
    );
  }

  // Récupère les Pokémon par génération avec noms en français
  getPokemonByGeneration(generation: string): Observable<Pokemon[]> {
    return this.http.get<{ pokemon_species: Array<{ name: string; url: string }> }>(
      `${this.apiUrl}/generation/${generation}/`
    ).pipe(
      map(response =>
        response.pokemon_species.map(species => {
          const urlParts = species.url.split('/').filter(part => part);
          const id = parseInt(urlParts[urlParts.length - 1], 10);
          const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
          return {
            name: this.capitalize(species.name),
            name_fr: '',
            image,
            id,
            types: [] as string[],
          };
        })
      ),
      switchMap(pokemons => {
        const requests = pokemons.map(pokemon =>
          forkJoin({
            types: this.http.get<any>(`${this.apiUrl}/pokemon/${pokemon.id}`).pipe(
              map(pokeDetails => pokeDetails.types.map((typeInfo: any) => {
                const typeName = typeInfo.type.name.toLowerCase();
                const typeNameFr = this.typeNameMap.get(typeName) || this.capitalize(typeInfo.type.name);
                return typeNameFr;
              }))
            ),
            species: this.getPokemonSpecies(pokemon.id).pipe(
              map(speciesDetails => {
                const frenchNameEntry = speciesDetails.names.find((n: any) => n.language.name === 'fr');
                return frenchNameEntry ? this.capitalize(frenchNameEntry.name) : pokemon.name;
              })
            )
          }).pipe(
            map(({ types, species }) => {
              pokemon.types = types;
              pokemon.name_fr = species;
              return pokemon;
            })
          )
        );
        return forkJoin(requests);
      })
    );
  }

  // Récupère les Pokémon par type avec noms en français
  getPokemonByType(type: string): Observable<Pokemon[]> {
    console.log(`Fetching Pokémon de type: ${type}`);
    return this.http.get<{ pokemon: Array<{ pokemon: { name: string; url: string } }> }>(
      `${this.apiUrl}/type/${type}/` // 'type' est déjà en minuscules grâce au sélecteur corrigé
    ).pipe(
      map(response =>
        response.pokemon.map(p => {
          const urlParts = p.pokemon.url.split('/').filter(part => part);
          const idStr = urlParts[urlParts.length - 1];
          const id = parseInt(idStr, 10);
          if (isNaN(id)) {
            console.warn(`ID invalide extrait de l'URL: ${p.pokemon.url}`);
            return null; // Ou gérer différemment
          }
          const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
          return {
            name: this.capitalize(p.pokemon.name),
            name_fr: '',
            image,
            id,
            types: [] as string[],
          };
        }).filter(pokemon => pokemon !== null) // Filtrer les entrées invalides
      ),
      switchMap(pokemons => {
        // Filtrer les Pokémon avec des IDs valides (par exemple, ID < 10000)
        const validPokemons = pokemons.filter(pokemon => pokemon.id < 10000);
        if (validPokemons.length !== pokemons.length) {
          // console.warn(`Certains Pokémon ont des IDs invalides et seront ignorés.`);
        }
        const requests = validPokemons.map(pokemon =>
          forkJoin({
            types: this.http.get<any>(`${this.apiUrl}/pokemon/${pokemon.id}`).pipe(
              map(pokeDetails => pokeDetails.types.map((typeInfo: any) => {
                const typeName = typeInfo.type.name.toLowerCase();
                const typeNameFr = this.typeNameMap.get(typeName) || this.capitalize(typeInfo.type.name);
                return typeNameFr;
              }))
            ),
            species: this.getPokemonSpecies(pokemon.id).pipe(
              map(speciesDetails => {
                const frenchNameEntry = speciesDetails.names.find((n: any) => n.language.name === 'fr');
                return frenchNameEntry ? this.capitalize(frenchNameEntry.name) : pokemon.name;
              })
            )
          }).pipe(
            map(({ types, species }) => {
              pokemon.types = types;
              pokemon.name_fr = species;
              return pokemon;
            }),
            // Gérer les erreurs individuelles des requêtes Pokémon
            // afin qu'une erreur ne bloque pas toutes les autres
            // Vous pouvez utiliser catchError ici si nécessaire
          )
        );
        return forkJoin(requests);
      })
    );
  }

  // Récupère la chaîne d'évolution d'un Pokémon
  getEvolutionChain(pokemonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pokemon-species/${pokemonId}/`).pipe(
      switchMap(species => this.http.get<any>(species.evolution_chain.url))
    );
  }

  // Méthode pour capitaliser le premier caractère
  private capitalize(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
