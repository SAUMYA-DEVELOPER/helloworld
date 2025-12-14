import { initScene } from "./core/scene.js";
import { initParticles, setMode } from "./core/particleSystem.js";
import { initHands } from "./hand/handTracking.js";
import { detectGesture } from "./hand/gestureEngine.js";

const { scene, camera, renderer } = initScene();
initParticles(scene);

initHands(document.getElementById("cam"), (hand) => {
  const gesture = detectGesture(hand);
  if (gesture) setMode(gesture);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
