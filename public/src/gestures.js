import { setMode, vortex, galaxy } from './modes.js';

export function updateGestures(res){
  if(!res.multiHandLandmarks) return;

  const hands = res.multiHandLandmarks.length;

  if(hands === 2) setMode(vortex);
  if(hands === 1) setMode(galaxy);
}
