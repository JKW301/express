const fs = require('fs');
const path = require('path');

const videoExtensions = ['.mp4'];

function listVideos(directory, videos = [], seenDirs = new Set()) {
  const normPath = path.resolve(directory);
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
        stat = fs.lstatSync(fullPath);
      } catch (err) {
        console.error(`Erreur lors de l'accès à ${fullPath}:`, err.message);
        continue;
      }

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
