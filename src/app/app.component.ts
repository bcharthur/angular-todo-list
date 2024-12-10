// src/app/app.component.ts
import { Component } from '@angular/core';
import { NavbarComponent } from './pages/navbar/navbar.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
})
export class AppComponent {}
