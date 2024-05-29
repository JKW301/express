var express = require('express');
var router = express.Router();
const pool = require('../db');


// Route to display all users
router.get('/', async function(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.render('index', { title: 'Liste des utilisateurs', users: result.rows });
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs :', err);
    next(err); // Pass the error to the error handling middleware
  }
});

// Affichage du formulaire de connexion
router.get('/auth/login', function(req, res, next) {
  res.render('auth/login', { title: 'Se connecter' });
});

// Route pour afficher le formulaire d'inscription
router.get('/auth/signup', function(req, res, next) {
  res.render('auth/signup', { title: 'S\'inscrire' });
});

// Route pour traiter la soumission du formulaire d'inscription
router.post('/auth/signup', async function(req, res, next) {
  const { email, password } = req.body;

  console.log('Données reçues :', { email, password }); // Ajoutez ce journal pour vérifier les données reçues

  // Logique pour ajouter un nouvel utilisateur dans la base de données
  try {
    const result = await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);
    console.log('Résultat de l\'insertion :', result); // Ajoutez ce journal pour vérifier le résultat de l'insertion
    res.redirect('/auth/login'); // Redirige vers la page de connexion après inscription
  } catch (err) {
    console.error('Erreur lors de l\'insertion :', err); // Ajoutez ce journal pour vérifier l'erreur
    next(err); // Passe l'erreur au middleware de gestion des erreurs
  }
});




// Traitement de la soumission du formulaire de connexion
router.post('/auth/login', function(req, res, next) {
  const { email, password } = req.body;

  // Remplacez cette partie par la logique réelle d'authentification
  if (email === 'test' && password === 'password') {
    res.redirect('/'); // Redirige vers la page d'accueil en cas de succès
  } else {
    res.render('auth/login', { title: 'Se connecter', error: 'Nom d\'utilisateur ou mot de passe incorrect' });
  }
});

module.exports = router;
