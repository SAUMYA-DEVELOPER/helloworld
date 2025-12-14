import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function initRenderer() {
  const r = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  r.setSize(window.innerWidth, window.innerHeight);
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.setClearColor(0x000010, 1);
  return r;
}
