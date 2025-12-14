export async function initHands(video, onHand) {
  await load("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
  await load("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 2,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  hands.onResults(res => {
    if (res.multiHandLandmarks?.[0]) {
      onHand(res.multiHandLandmarks[0]);
    }
  });

  const cam = new Camera(video, {
    onFrame: async () => await hands.send({ image: video })
  });
  cam.start();
}

function load(src) {
  return new Promise(r => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = r;
    document.head.appendChild(s);
  });
}
