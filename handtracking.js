export function initHands(callback) {
  const video = document.getElementById('video');

  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });

  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7
  });

  hands.onResults(res => {
    if (!res.multiHandLandmarks.length) return;

    const lm = res.multiHandLandmarks[0];
    const pinch = Math.abs(lm[4].x - lm[8].x);
    const spread = Math.abs(lm[0].y - lm[12].y);
    const hue = lm[8].x;

    callback({ pinch, spread, hue });
  });

  new Camera(video, {
    onFrame: async () => await hands.send({image: video}),
    width: 640,
    height: 480
  }).start();
}
