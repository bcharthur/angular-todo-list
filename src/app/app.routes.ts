// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { TodoComponent } from './todo/todo.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { PokemonComponent } from './pokemon/pokemon.component'; // Importer le composant
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: TodoComponent, canActivate: [AuthGuard] },
  { path: 'pokemon', component: PokemonComponent, canActivate: [AuthGuard] }, // Nouvelle route
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Rediriger les routes inconnues vers la page d'accueil
  { path: '**', redirectTo: '' },
];
