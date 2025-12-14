export let currentMode = galaxy;

export function galaxy(p,t){
  p.rotation.y = t*0.1;
}

export function vortex(p,t){
  p.rotation.z = t*0.5;
}

export function explode(p){
  p.scale.set(2,2,2);
}

export function setMode(fn){
  currentMode = fn;
}
