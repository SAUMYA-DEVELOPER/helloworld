import { initScene, render } from './scene.js';
import { initParticles, updateParticles } from './particles.js';
import { initHands } from './handTracking.js';
import { updateGestures } from './gestures.js';

const video = document.getElementById('cam');

initScene();
initParticles();

initHands(video, (handData) => {
  updateGestures(handData);
});

function loop(t){
  updateParticles(t * 0.001);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
