export function detectGesture(res) {
  if (!res.multiHandLandmarks) return null;

  const hands = res.multiHandLandmarks;
  if (hands.length === 1) {
    const h = hands[0];
    if (h[8].y < h[6].y) return "FLOWER";        // index up
    if (h[12].y < h[10].y) return "PLANET";     // middle
    if (h[16].y < h[14].y) return "DNA";        // ring
    if (h[20].y < h[18].y) return "HEART";      // pinky
    return "GALAXY";                             // fist
  }

  if (hands.length === 2) {
    const d =
      Math.abs(hands[0][0].x - hands[1][0].x);
    if (d > 0.4) return "EXPLODE";
    if (d < 0.15) return "CORE";
    return "VORTEX";
  }
}
