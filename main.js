/* ---------- DOM ---------- */
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const debug = document.getElementById("gestureDebug");

/* ---------- THREE ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020416);

const cam = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 200);
cam.position.z = 16;

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* ---------- PARTICLES ---------- */
const COUNT = 40000;
const geo = new THREE.BufferGeometry();

const base = new Float32Array(COUNT*3);
const heart = new Float32Array(COUNT*3);
const saturn = new Float32Array(COUNT*3);
const cube = new Float32Array(COUNT*3);

for(let i=0;i<COUNT;i++){
  let i3=i*3;
  base[i3]=(Math.random()-0.5)*25;
  base[i3+1]=(Math.random()-0.5)*25;
  base[i3+2]=(Math.random()-0.5)*25;

  let t=Math.random()*Math.PI*2;
  heart[i3]=16*Math.sin(t)**3*0.25;
  heart[i3+1]=(13*Math.cos(t)-5*Math.cos(2*t))*0.25;
  heart[i3+2]=(Math.random()-0.5)*2;

  let a=Math.random()*Math.PI*2,r=4+Math.random()*2;
  saturn[i3]=Math.cos(a)*r;
  saturn[i3+1]=(Math.random()-0.5)*0.4;
  saturn[i3+2]=Math.sin(a)*r;

  cube[i3]=(Math.floor(Math.random()*5)-2)*2;
  cube[i3+1]=(Math.floor(Math.random()*5)-2)*2;
  cube[i3+2]=(Math.floor(Math.random()*5)-2)*2;
}

geo.setAttribute("position", new THREE.BufferAttribute(base,3));
geo.setAttribute("heart", new THREE.BufferAttribute(heart,3));
geo.setAttribute("saturn", new THREE.BufferAttribute(saturn,3));
geo.setAttribute("cube", new THREE.BufferAttribute(cube,3));

const mat = new THREE.ShaderMaterial({
  transparent:true,
  blending:THREE.AdditiveBlending,
  uniforms:{
    uMode:{value:0},
    uMix:{value:0},
    uHand:{value:new THREE.Vector3()}
  },
  vertexShader:`
    uniform float uMode,uMix;
    uniform vec3 uHand;
    attribute vec3 heart,saturn,cube;
    void main(){
      vec3 pos = position;
      vec3 target = heart;
      if(uMode>1.5) target=saturn;
      if(uMode>2.5) target=cube;
      pos = mix(pos,target,uMix);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
      gl_PointSize=2.5;
    }
  `,
  fragmentShader:`
    void main(){
      float d=length(gl_PointCoord-.5);
      if(d>.5) discard;
      gl_FragColor=vec4(1.,1.,1.,1.);
    }
  `
});

scene.add(new THREE.Points(geo,mat));

/* ---------- STATE ---------- */
let targetMode=0, targetMix=0;

/* ---------- MEDIAPIPE ---------- */
const hands=new Hands({
  locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({maxNumHands:2, modelComplexity:0});

hands.onResults(res=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!res.multiHandLandmarks?.length){
    targetMix*=0.95;
    debug.innerText="Idle";
    return;
  }

  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;

  const lm=res.multiHandLandmarks[0];
  const up=i=>lm[i].y<lm[i-2].y;
  const fingers=[up(8),up(12),up(16),up(20)];

  /* ---- PRIORITY ORDER ---- */

  // ✊ FIST
  if(fingers.every(v=>!v)){
    targetMode=0; targetMix=1;
    debug.innerText="✊ Fist";
    return;
  }

  // ✋ OPEN PALM
  if(fingers.every(v=>v)){
    targetMode=0; targetMix=0.3;
    debug.innerText="✋ Open";
    return;
  }

  // ✌️ PEACE
  if(fingers[0] && fingers[1] && !fingers[2] && !fingers[3]){
    targetMode=2; targetMix=1;
    debug.innerText="✌️ Saturn";
    return;
  }

  // ☝️ ONE FINGER
  if(fingers[0] && !fingers[1] && !fingers[2] && !fingers[3]){
    targetMode=3; targetMix=1;
    debug.innerText="☝️ Cube";
    return;
  }

  // ❤️ TWO-HAND HEART (LAST!)
  if(res.multiHandLandmarks.length===2){
    const A=res.multiHandLandmarks[0];
    const B=res.multiHandLandmarks[1];
    const ok =
      Math.hypot(A[4].x-B[4].x,A[4].y-B[4].y)<0.05 &&
      Math.hypot(A[8].x-B[8].x,A[8].y-B[8].y)<0.05 &&
      Math.hypot(A[0].x-B[0].x,A[0].y-B[0].y)<0.15;
    if(ok){
      targetMode=1; targetMix=1;
      debug.innerText="❤️ Heart";
      return;
    }
  }

  targetMix*=0.95;
});

/* ---------- START ---------- */
document.getElementById("startBtn").onclick=async()=>{
  const s=await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject=s;
  await video.play();
  (async function loop(){
    await hands.send({image:video});
    requestAnimationFrame(loop);
  })();
};

/* ---------- LOOP ---------- */
function animate(){
  requestAnimationFrame(animate);
  mat.uniforms.uMix.value += (targetMix-mat.uniforms.uMix.value)*0.08;
  mat.uniforms.uMode.value += (targetMode-mat.uniforms.uMode.value)*0.1;
  scene.rotation.y+=0.002;
  renderer.render(scene,cam);
}
animate();

addEventListener("resize",()=>{
  cam.aspect=innerWidth/innerHeight;
  cam.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
