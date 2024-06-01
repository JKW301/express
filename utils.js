const fs = require('fs');
const path = require('path');

const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov'];

function listVideos(directory, videos = [], seenDirs = new Set()) {
  // Normaliser le chemin pour éviter les problèmes de comparaison
  const normPath = path.resolve(directory);

  // Éviter les boucles en vérifiant si le répertoire a déjà été traité
  if (seenDirs.has(normPath)) {
    return videos;
  }
  seenDirs.add(normPath);

  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      let stat;

      try {
        stat = fs.lstatSync(fullPath); // Utilisez lstatSync pour vérifier les liens symboliques
      } catch (err) {
        console.error(`Erreur lors de l'accès à ${fullPath}:`, err.message);
        continue;
      }

      // Si c'est un lien symbolique, l'ignorer
      if (stat.isSymbolicLink()) {
        continue;
      }

      if (stat.isDirectory()) {
        listVideos(fullPath, videos, seenDirs);
      } else if (videoExtensions.includes(path.extname(fullPath).toLowerCase())) {
        videos.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Erreur lors de l'accès au répertoire ${directory}:`, err.message);
  }

  return videos;
}

module.exports = { listVideos };
