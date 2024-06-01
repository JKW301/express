document.addEventListener('DOMContentLoaded', function() {
  var player = videojs('videoPlayer', {
    autoplay: false,
    controls: true,
    fluid: true,
  });

  player.width('100%');
  player.height('25vh');
});
