var express = require('express');
var router = express.Router();
const pool = require('../db');
const { listVideos } = require('../utils');
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
const fs = require('fs');
const path = require('path');

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

ffmpeg.setFfprobePath(ffprobe.path);

// Route pour lister les vidéos
router.get('/videos', function(req, res, next) {
  const directory = '/home/debian/';
  try {
    const videos = listVideos(directory);
    res.render('videos', { title: 'Liste des vidéos', videos: videos });
  } catch (err) {
    console.error('Erreur lors de la récupération des vidéos :', err);
    next(err);
  }
});

// Route pour diffuser une vidéo
router.get('/video/:name', function(req, res, next) {
  const videoName = req.params.name;
  const directory = '/home/debian/';
  const videoPath = listVideos(directory).find(video => path.basename(video) === videoName);

  if (!videoPath) {
    return next(new Error('Video not found'));
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Route pour afficher les détails de la vidéo
router.get('/video-info/:name', function(req, res, next) {
  const videoName = req.params.name;
  const directory = '/home/debian/';
  const videoPath = listVideos(directory).find(video => path.basename(video) === videoName);

  if (!videoPath) {
    return next(new Error('Video not found'));
  }

  ffmpeg.ffprobe(videoPath, function(err, metadata) {
    if (err) {
      return next(err);
    }

    const videoInfo = {
      filename: videoName,
      duration: metadata.format.duration,
      size: metadata.format.size,
      format: metadata.format.format_long_name,
      codec: metadata.streams[0].codec_name,
      width: metadata.streams[0].width,
      height: metadata.streams[0].height
    };

    // Utilisation du chemin relatif pour les vidéos
    res.render('video', { title: videoName, videoPath: `/video/${videoName}`, videoInfo: videoInfo });
  });
});
module.exports = router;