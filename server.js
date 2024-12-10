require('dotenv').config(); // Charger les variables d'environnement

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Importer le middleware CORS
const bcrypt = require('bcrypt'); // Pour le hachage des mots de passe
const jwt = require('jsonwebtoken'); // Pour la génération de tokens

// Configuration de l'application Express
const app = express();
const port = process.env.PORT || 3000;

// Activer CORS pour toutes les requêtes
app.use(cors());

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Configuration de la connexion initiale à MySQL (sans base de données)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', // Remplacez par votre utilisateur MySQL
  password: process.env.DB_PASSWORD || '', // Remplacez par votre mot de passe MySQL
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
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      (err) => {
        if (err) {
          console.error('Erreur lors de la création de la base de données :', err.message);
          process.exit(1);
        }
        console.log(`Base de données "${process.env.DB_NAME}" vérifiée/créée`);

        // Sélectionner la base de données
        initialConnection.changeUser({ database: process.env.DB_NAME }, (err) => {
          if (err) {
            console.error('Erreur lors de la sélection de la base de données :', err.message);
            process.exit(1);
          }

          // Créer la table "users" si elle n'existe pas
          const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(50) NOT NULL UNIQUE,
              email VARCHAR(100) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
          initialConnection.query(createUsersTableQuery, (err) => {
            if (err) {
              console.error('Erreur lors de la création de la table "users" :', err.message);
              process.exit(1);
            }
            console.log('Table "users" vérifiée/créée');

            // Créer la table "task" si elle n'existe pas
            const createTaskTableQuery = `
              CREATE TABLE IF NOT EXISTS task (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              );
            `;
            initialConnection.query(createTaskTableQuery, (err) => {
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
        });
      }
    );
  });
};

// Configuration de la connexion à la base de données "db_angular"
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', // Remplacez par votre utilisateur MySQL
  password: process.env.DB_PASSWORD || '', // Remplacez par votre mot de passe MySQL
  database: process.env.DB_NAME || 'db_angular', // Nom de votre base de données
});

// Fonction pour démarrer le serveur Express
const startServer = () => {
  // Connexion à la base de données "db_angular"
  db.connect((err) => {
    if (err) {
      console.error('Erreur de connexion à MySQL :', err.message);
      process.exit(1); // Arrête le serveur si la connexion échoue
    }
    console.log(`Connecté à la base de données MySQL "${process.env.DB_NAME}"`);

    // Middleware pour vérifier le JWT
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) return res.sendStatus(401); // Unauthorized

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
      });
    };

    // Route d'inscription
    app.post('/register', async (req, res) => {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      try {
        // Vérifier si l'utilisateur existe déjà
        const userCheckQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
        db.query(userCheckQuery, [email, username], async (err, results) => {
          if (err) {
            console.error('Erreur lors de la vérification de l\'utilisateur :', err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
          }

          if (results.length > 0) {
            return res.status(400).json({ error: 'Utilisateur déjà existant' });
          }

          // Hacher le mot de passe
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insérer l'utilisateur dans la base de données
          const insertUserQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
          db.query(insertUserQuery, [username, email, hashedPassword], (err, result) => {
            if (err) {
              console.error('Erreur lors de l\'insertion de l\'utilisateur :', err.message);
              return res.status(500).json({ error: 'Erreur serveur' });
            }

            res.status(201).json({ message: 'Utilisateur créé avec succès' });
          });
        });
      } catch (error) {
        console.error('Erreur lors de l\'inscription :', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
      }
    });

    // Route de connexion
    app.post('/login', (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      // Rechercher l'utilisateur par email
      const findUserQuery = 'SELECT * FROM users WHERE email = ?';
      db.query(findUserQuery, [email], async (err, results) => {
        if (err) {
          console.error('Erreur lors de la recherche de l\'utilisateur :', err.message);
          return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length === 0) {
          return res.status(400).json({ error: 'Utilisateur non trouvé' });
        }

        const user = results[0];

        // Comparer le mot de passe
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return res.status(400).json({ error: 'Mot de passe incorrect' });
        }

        // Générer un token JWT
        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.json({ token });
      });
    });

    // Exemple de route protégée pour récupérer toutes les tâches
    app.get('/tasks', authenticateToken, (req, res) => {
      const query = 'SELECT * FROM task WHERE user_id = ?';
      db.query(query, [req.user.id], (err, results) => {
        if (err) {
          console.error('Erreur lors de la récupération des tâches :', err.message);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.json(results);
        }
      });
    });

    // Ajouter une tâche
    app.post('/tasks', authenticateToken, (req, res) => {
      const { title, completed } = req.body;
      const query = 'INSERT INTO task (title, completed, user_id) VALUES (?, ?, ?)';
      db.query(query, [title, completed || false, req.user.id], (err, result) => {
        if (err) {
          console.error('Erreur lors de l\'ajout de la tâche :', err.message);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.json({ id: result.insertId, title, completed });
        }
      });
    });

    // Mettre à jour une tâche
    app.put('/tasks/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { title, completed } = req.body;
      const query = 'UPDATE task SET title = ?, completed = ? WHERE id = ? AND user_id = ?';
      db.query(query, [title, completed, id, req.user.id], (err) => {
        if (err) {
          console.error('Erreur lors de la mise à jour de la tâche :', err.message);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.json({ message: 'Tâche mise à jour avec succès' });
        }
      });
    });

    // Supprimer une tâche
    app.delete('/tasks/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const query = 'DELETE FROM task WHERE id = ? AND user_id = ?';
      db.query(query, [id, req.user.id], (err) => {
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
