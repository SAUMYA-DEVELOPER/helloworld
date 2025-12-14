import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function initRenderer() {
  const r = new THREE.WebGLRenderer({ antialias: false });
  r.setSize(window.innerWidth, window.innerHeight);
  r.setPixelRatio(window.devicePixelRatio);
  r.setClearColor(0x000000, 1);
  document.body.appendChild(r.domElement);
  return r;
}
