import { initScene } from "./core/scene.js";
import { initRenderer } from "./core/renderer.js";
import { handleResize } from "./core/resize.js";
import { drawSkeleton } from "./core/skeletonDraw.js";
import { initParticles, updateParticles, setShape } from "./particles/particleSystem.js";
import { detectGesture } from "./gestures/gestureEngine.js";

const video = document.getElementById("video");
const skeletonCanvas = document.getElementById("skeleton");

const { scene, camera } = initScene();
const renderer = initRenderer();
initParticles(scene);

window.addEventListener("resize", () =>
  handleResize(renderer, camera)
);

const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults(res => {
  drawSkeleton(skeletonCanvas, res);
  const gesture = detectGesture(res);
  if (gesture) setShape(gesture);
});

const cam = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640,
  height: 480
});
cam.start();

function animate() {
  requestAnimationFrame(animate);
  updateParticles();
  renderer.render(scene, camera);
}
animate();
