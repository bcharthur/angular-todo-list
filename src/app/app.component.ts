import { Component } from '@angular/core';
import { TodoComponent } from './todo/todo.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [TodoComponent, RouterOutlet],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'todolist-app';
}
