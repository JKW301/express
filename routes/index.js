var express = require('express');
var router = express.Router();
const pool = require('../db');
const { listVideos } = require('../utils');
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
const fs = require('fs');
const path = require('path');

router.get('/', async function(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.render('index', { title: 'Liste des utilisateurs', users: result.rows });
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs :', err);
    next(err);
  }
});

router.get('/auth/login', function(req, res, next) {
  res.render('auth/login', { title: 'Se connecter' });
});

router.get('/auth/signup', function(req, res, next) {
  res.render('auth/signup', { title: 'S\'inscrire' });
});

router.post('/auth/signup', async function(req, res, next) {
  const { email, password } = req.body;

  console.log('Données reçues :', { email, password });

  try {
    const result = await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);
    console.log('Résultat de l\'insertion :', result);
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Erreur lors de l\'insertion :', err);
    next(err);
  }
});

router.post('/auth/login', function(req, res, next) {
  const { email, password } = req.body;

  if (email === 'test' && password === 'password') {
    res.redirect('/');
  } else {
    res.render('auth/login', { title: 'Se connecter', error: 'Nom d\'utilisateur ou mot de passe incorrect' });
  }
});

ffmpeg.setFfprobePath(ffprobe.path);

router.get('/videos', function(req, res, next) {
  const directory = '/home/debian/dwhelper';
  try {
    const videos = listVideos(directory);
    res.render('videos', { title: 'Liste des vidéos', videos: videos });
  } catch (err) {
    console.error('Erreur lors de la récupération des vidéos :', err);
    next(err);
  }
});

router.get('/video/:name', function(req, res, next) {
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

    res.render('video', { title: videoName, videoPath: `/video/stream/${videoName}`, videoInfo: videoInfo });
  });
});

router.get('/video/stream/:name', function(req, res, next) {
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

module.exports = router;
