import { initParticles, updateParticles, setMode } from './particles.js';
import { initHands } from './handTracking.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

initParticles(scene);
initHands(onGesture);

function onGesture({ pinch, spread, hue, mode }) {
  updateParticles({ pinch, spread, hue });
  if (mode) setMode(mode);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
