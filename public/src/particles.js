import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { scene } from './scene.js';
import { vertexShader, fragmentShader } from './shaders.js';
import { currentMode } from './modes.js';

let points, uniforms;

export function initParticles(){
  const count = 80000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  const scale = new Float32Array(count);

  for(let i=0;i<count;i++){
    const r = Math.random()*5;
    const a = Math.random()*Math.PI*2;
    pos[i*3]   = Math.cos(a)*r;
    pos[i*3+1] = Math.sin(a)*r;
    pos[i*3+2] = (Math.random()-0.5)*5;
    scale[i] = Math.random()*2+1;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scale,1));

  uniforms = { uTime:{value:0} };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent:true,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });

  points = new THREE.Points(geo, mat);
  scene.add(points);
}

export function updateParticles(t){
  uniforms.uTime.value = t;
  currentMode(points, t);
}
