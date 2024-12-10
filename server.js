const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Importer le middleware CORS

// Configuration de l'application Express
const app = express();
const port = 3000;

// Activer CORS pour toutes les requêtes
app.use(cors());

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Configuration de la connexion initiale à MySQL (sans base de données)
const dbConfig = {
  host: 'localhost',
  user: 'root', // Remplacez par votre utilisateur MySQL
  password: '', // Remplacez par votre mot de passe MySQL
  multipleStatements: true, // Permet d'exécuter plusieurs requêtes à la fois
};

// Création d'une connexion à MySQL
const initialConnection = mysql.createConnection(dbConfig);

// Fonction pour initialiser la base de données et les tables
const initializeDatabase = () => {
  initialConnection.connect((err) => {
    if (err) {
      console.error('Erreur de connexion initiale à MySQL :', err.message);
      process.exit(1); // Arrête le serveur si la connexion échoue
    }
    console.log('Connecté à MySQL');

    // Créer la base de données si elle n'existe pas
    initialConnection.query(
      `CREATE DATABASE IF NOT EXISTS db_angular CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      (err) => {
        if (err) {
          console.error('Erreur lors de la création de la base de données :', err.message);
          process.exit(1);
        }
        console.log('Base de données "db_angular" vérifiée/créée');

        // Sélectionner la base de données
        initialConnection.changeUser({ database: 'db_angular' }, (err) => {
          if (err) {
            console.error('Erreur lors de la sélection de la base de données :', err.message);
            process.exit(1);
          }

          // Créer la table "task" si elle n'existe pas
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS task (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              completed BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
          initialConnection.query(createTableQuery, (err) => {
            if (err) {
              console.error('Erreur lors de la création de la table "task" :', err.message);
              process.exit(1);
            }
            console.log('Table "task" vérifiée/créée');

            // Fermer la connexion initiale
            initialConnection.end();

            // Démarrer le serveur Express après l'initialisation de la DB
            startServer();
          });
        });
      }
    );
  });
};

// Configuration de la connexion à la base de données "db_angular"
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Remplacez par votre utilisateur MySQL
  password: '', // Remplacez par votre mot de passe MySQL
  database: 'db_angular', // Nom de votre base de données
});

// Fonction pour démarrer le serveur Express
const startServer = () => {
  // Connexion à la base de données "db_angular"
  db.connect((err) => {
    if (err) {
      console.error('Erreur de connexion à MySQL :', err.message);
      process.exit(1); // Arrête le serveur si la connexion échoue
    }
    console.log('Connecté à la base de données MySQL "db_angular"');

    // Exemple de route pour récupérer toutes les tâches
    app.get('/tasks', (req, res) => {
      const query = 'SELECT * FROM task';
      db.query(query, (err, results) => {
        if (err) {
          console.error('Erreur lors de la récupération des tâches :', err.message);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.json(results);
        }
      });
    });

    // Ajouter une tâche
    app.post('/tasks', (req, res) => {
      const { title, completed } = req.body;
      const query = 'INSERT INTO task (title, completed) VALUES (?, ?)';
      db.query(query, [title, completed || false], (err, result) => {
        if (err) {
          console.error('Erreur lors de l\'ajout de la tâche :', err.message);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.json({ id: result.insertId, title, completed });
        }
      });
    });

    // Mettre à jour une tâche
    app.put('/tasks/:id', (req, res) => {
      const { id } = req.params;
      const { title, completed } = req.body;
      const query = 'UPDATE task SET title = ?, completed = ? WHERE id = ?';
      db.query(query, [title, completed, id], (err) => {
        if (err) {
          console.error('Erreur lors de la mise à jour de la tâche :', err.message);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.json({ message: 'Tâche mise à jour avec succès' });
        }
      });
    });

    // Supprimer une tâche
    app.delete('/tasks/:id', (req, res) => {
      const { id } = req.params;
      const query = 'DELETE FROM task WHERE id = ?';
      db.query(query, [id], (err) => {
        if (err) {
          console.error('Erreur lors de la suppression de la tâche :', err.message);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.json({ message: 'Tâche supprimée avec succès' });
        }
      });
    });

    // Lancement du serveur
    app.listen(port, () => {
      console.log(`Serveur démarré sur http://localhost:${port}`);
    });
  });
};

// Initialiser la base de données et démarrer le serveur
initializeDatabase();
