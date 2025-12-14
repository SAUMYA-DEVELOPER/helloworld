export function detectGesture(landmarks) {
  const tips = [4,8,12,16,20];
  let open = 0;
  for (let i=1;i<5;i++) {
    if (landmarks[tips[i]].y < landmarks[tips[i]-2].y) open++;
  }

  if (open === 0) return "HEART";
  if (open === 2) return "FLOWER";
  if (open === 5) return "GALAXY";
  return null;
}
