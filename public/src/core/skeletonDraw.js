export function drawSkeleton(canvas, results) {
  const ctx = canvas.getContext("2d");
  canvas.width = 240;
  canvas.height = 180;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if (!results.multiHandLandmarks) return;

  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;

  results.multiHandLandmarks.forEach(hand => {
    hand.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ff00ff";
      ctx.fill();
    });
  });
}
