let points, geometry, material, mode = 'galaxy';

export function initParticles(scene) {
  geometry = new THREE.BufferGeometry();
  const count = 5000;
  const pos = new Float32Array(count * 3);

  for (let i=0;i<count;i++){
    pos[i*3] = (Math.random()-0.5)*5;
    pos[i*3+1] = (Math.random()-0.5)*5;
    pos[i*3+2] = (Math.random()-0.5)*5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(pos,3));
  material = new THREE.PointsMaterial({size:0.05,color:0xffffff});
  points = new THREE.Points(geometry, material);
  scene.add(points);
}

export function updateParticles({ pinch, spread, hue }) {
  points.scale.setScalar(1 + spread * 2);
  material.color.setHSL(hue, 1, 0.5);
}

export function setMode(m) {
  mode = m;
  // switch templates
  if (mode === 'flower') points.rotation.z += 0.5;
  if (mode === 'fireworks') points.scale.multiplyScalar(1.2);
}
