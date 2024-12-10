import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoService, Todo } from '../todo.service';
import { trigger, style, animate, transition, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
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
export class TodoComponent implements OnInit {
  todos: Todo[] = [];
  newTodoTitle: string = '';

  constructor(private todoService: TodoService) {}

  ngOnInit() {
    this.loadTodos();
  }

  loadTodos() {
    this.todoService.getTodos().subscribe((data) => {
      this.todos = data;
    });
  }

  get pendingTodos(): Todo[] {
    return this.todos.filter((todo) => !todo.completed);
  }

  get completedTodos(): Todo[] {
    return this.todos.filter((todo) => todo.completed);
  }

  addTodo() {
    if (this.newTodoTitle.trim()) {
      const newTodo: Partial<Todo> = {
        title: this.newTodoTitle.trim(),
        completed: false,
      };
      this.todoService.addTodo(newTodo).subscribe((createdTodo) => {
        this.todos.push(createdTodo);
        this.newTodoTitle = '';
      });
    }
  }

  toggleCompletion(todo: Todo) {
    todo.completed = !todo.completed;
    this.todoService.updateTodo(todo).subscribe();
  }

  deleteTodo(id: number) {
    this.todoService.deleteTodo(id).subscribe(() => {
      this.todos = this.todos.filter((todo) => todo.id !== id);
    });
  }
}
