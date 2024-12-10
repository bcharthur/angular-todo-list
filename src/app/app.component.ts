// src/app/app.component.ts
import { Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import {RouterOutlet} from '@angular/router';
import {TodoComponent} from './todo/todo.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
})
export class AppComponent {}
