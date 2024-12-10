# TodolistApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.4.

## Prerequisites

Before running the project, ensure the following tools are installed on your machine:

- [Node.js](https://nodejs.org/) (version 16 or later)
- [Angular CLI](https://angular.io/cli) (version 15 or later)
- [MySQL](https://www.mysql.com/)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/todolist-app.git
   cd todolist-app
   ```
2. Install dependencies:
   ```bash
    npm install
   ```

3. Set up the MySQL database:
  - Create a database named db_angular.
  - Run the following SQL script to create the task table:

   ```bash
    CREATE DATABASE IF NOT EXISTS db_angular;

USE db_angular;

CREATE TABLE IF NOT EXISTS task (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

   ```

4. Update database connection details in server.js if necessary.

## Development server

To start both the Angular and Node.js servers simultaneously, run:

```bash
npm run start
```
