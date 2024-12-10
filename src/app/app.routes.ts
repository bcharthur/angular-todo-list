// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TodoComponent } from './pages/todo/todo.component';
import { LoginComponent } from './pages/authentification/login/login.component';
import { RegisterComponent } from './pages/authentification/register/register.component';
import { PokemonComponent } from './pages/pokemon/pokemon.component'; // Importer le composant
import { AuthGuard } from './pages/authentification/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // Route par défaut
  { path: 'home', component: HomeComponent },
  { path: 'todolist', component: TodoComponent, canActivate: [AuthGuard] },
  { path: 'pokemon', component: PokemonComponent, canActivate: [AuthGuard] }, // Nouvelle route
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Rediriger les routes inconnues vers la page d'accueil
  { path: '**', redirectTo: '' },
];
