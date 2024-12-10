// src/app/pokemon/pokemon.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService, Pokemon, Generation, Type } from '../pokemon.service';
import { trigger, style, animate, transition, query, stagger } from '@angular/animations';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(-10px)' }),
            stagger('100ms', animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))),
          ],
          { optional: true }
        ),
        query(
          ':leave',
          [
            animate(
              '300ms ease-in',
              style({ opacity: 0, transform: 'translateY(10px)', height: 0, margin: 0 })
            ),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class PokemonComponent implements OnInit {
  pokemons: Pokemon[] = [];
  isLoading: boolean = true;
  error: string = '';

  generations: Generation[] = [];
  types: Type[] = [];

  selectedGeneration: string = '';
  selectedType: string = '';

  // Pour la modal
  selectedPokemon: Pokemon | null = null;
  evolutionChain: any[] = [];
  isEvolutionLoading: boolean = false;
  evolutionError: string = '';

  constructor(private pokemonService: PokemonService) {}

  ngOnInit() {
    // Charger les types en premier pour remplir typeNameMap
    this.loadTypes().subscribe({
      next: (types) => {
        this.loadGenerations();
        this.loadPokemons();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des types', err);
        this.error = 'Erreur lors du chargement des types';
        this.isLoading = false;
      }
    });
  }

  // Charger les types disponibles
  loadTypes(): Observable<Type[]> {
    return this.pokemonService.getTypes().pipe(
      map(types => {
        this.types = types;
        return types;
      })
    );
  }

  // Charger les générations disponibles
  loadGenerations() {
    this.pokemonService.getGenerations().subscribe({
      next: (data) => {
        this.generations = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des générations', err);
      },
    });
  }

  // Charger les Pokémon par défaut (première génération)
  loadPokemons() {
    this.isLoading = true;
    this.error = '';
    this.pokemonService.getFirstGenerationPokemon().subscribe({
      next: (data) => {
        this.pokemons = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des Pokémon';
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  // Appliquer les filtres
  applyFilters() {
    this.isLoading = true;
    this.error = '';
    if (this.selectedGeneration && this.selectedType) {
      // Si les deux filtres sont sélectionnés, récupérer les Pokémon par génération puis filtrer par type
      this.pokemonService.getPokemonByGeneration(this.selectedGeneration).subscribe({
        next: (pokemons) => {
          this.pokemons = pokemons.filter(pokemon => pokemon.types.includes(this.capitalize(this.selectedType)));
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors du filtrage des Pokémon';
          console.error(err);
          this.isLoading = false;
        },
      });
    } else if (this.selectedGeneration) {
      // Filtrer uniquement par génération
      this.pokemonService.getPokemonByGeneration(this.selectedGeneration).subscribe({
        next: (pokemons) => {
          this.pokemons = pokemons;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors du filtrage des Pokémon';
          console.error(err);
          this.isLoading = false;
        },
      });
    } else if (this.selectedType) {
      // Filtrer uniquement par type
      this.pokemonService.getPokemonByType(this.selectedType).subscribe({
        next: (pokemons) => {
          this.pokemons = pokemons;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors du filtrage des Pokémon';
          console.error(err);
          this.isLoading = false;
        },
      });
    } else {
      // Aucun filtre, charger les Pokémon par défaut
      this.loadPokemons();
    }
  }

  // Réinitialiser les filtres
  resetFilters() {
    this.selectedGeneration = '';
    this.selectedType = '';
    this.loadPokemons();
  }

  // Ouvrir la modal pour un Pokémon
  openModal(pokemon: Pokemon) {
    this.selectedPokemon = pokemon;
    this.evolutionChain = [];
    this.evolutionError = '';
    this.isEvolutionLoading = true;

    this.pokemonService.getEvolutionChain(pokemon.id).subscribe({
      next: (data) => {
        this.parseEvolutionChain(data.chain).subscribe({
          next: (evolutions) => {
            this.evolutionChain = evolutions;
            this.isEvolutionLoading = false;
          },
          error: (err) => {
            this.evolutionError = 'Erreur lors du chargement des évolutions';
            console.error(err);
            this.isEvolutionLoading = false;
          }
        });
      },
      error: (err) => {
        this.evolutionError = 'Erreur lors du chargement des évolutions';
        console.error(err);
        this.isEvolutionLoading = false;
      },
    });

    // Ouvrir la modal
    const modalElement = document.getElementById('evolutionModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Parser la chaîne d'évolution et extraire les IDs et noms français
  parseEvolutionChain(chain: any): Observable<any[]> {
    const evolutions: any[] = [];
    let current = chain;
    while (current) {
      const id = this.extractIdFromUrl(current.species.url);
      evolutions.push({
        name: this.capitalize(current.species.name),
        name_fr: '', // À remplir après récupération du nom français
        id: id,
      });
      current = current.evolves_to[0];
    }

    // Récupérer les noms français pour chaque évolution
    const requests = evolutions.map(evo =>
      this.pokemonService.getPokemonSpecies(evo.id).pipe(
        map(speciesDetails => {
          const frenchNameEntry = speciesDetails.names.find((n: any) => n.language.name === 'fr');
          evo.name_fr = frenchNameEntry ? this.capitalize(frenchNameEntry.name) : evo.name;
          return evo;
        })
      )
    );

    return forkJoin(requests);
  }

  // Méthode pour extraire l'ID du Pokémon depuis l'URL
  extractIdFromUrl(url: string): number {
    const urlParts = url.split('/').filter(part => part);
    const idStr = urlParts[urlParts.length - 1];
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      console.warn(`ID invalide extrait de l'URL: ${url}`);
      return -1; // Retourner un ID invalide
    }
    return id;
  }

  // Méthode pour capitaliser le premier caractère
  private capitalize(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
