/* ================= DOM ================= */
const video=document.getElementById("video");
const canvas=document.getElementById("overlay");
const ctx=canvas.getContext("2d");
const debug=document.getElementById("gestureDebug");

/* ================= DEVICE OPT ================= */
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const BASE_COUNT = isMobile ? 26000 : 42000;

/* ================= THREE ================= */
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x020416);

const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,500);
camera.position.z=26;

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.autoClear = false; // TRAILS
document.body.appendChild(renderer.domElement);

/* ================= STARFIELD ================= */
const STAR_COUNT = isMobile ? 3000 : 6000;
const starGeo=new THREE.BufferGeometry();
const starPos=new Float32Array(STAR_COUNT*3);
for(let i=0;i<STAR_COUNT;i++){
  let i3=i*3;
  starPos[i3]=(Math.random()-0.5)*400;
  starPos[i3+1]=(Math.random()-0.5)*400;
  starPos[i3+2]=(Math.random()-0.5)*400;
}
starGeo.setAttribute("position",new THREE.BufferAttribute(starPos,3));
scene.add(new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({size:0.6,color:0x88aaff})
));

/* ================= PARTICLES ================= */
const COUNT=BASE_COUNT;
const pos=new Float32Array(COUNT*3);
const vel=new Float32Array(COUNT*3);

const cloud=new Float32Array(COUNT*3);
const heart=new Float32Array(COUNT*3);
const flower=new Float32Array(COUNT*3);
const saturn=new Float32Array(COUNT*3);

for(let i=0;i<COUNT;i++){
  let i3=i*3;

  cloud[i3]=(Math.random()-0.5)*70;
  cloud[i3+1]=(Math.random()-0.5)*70;
  cloud[i3+2]=(Math.random()-0.5)*70;

  pos[i3]=cloud[i3]; pos[i3+1]=cloud[i3+1]; pos[i3+2]=cloud[i3+2];

  // ❤️ HEART
  let t=Math.random()*Math.PI*2;
  heart[i3]=16*Math.sin(t)**3*0.45;
  heart[i3+1]=(13*Math.cos(t)-5*Math.cos(2*t))*0.45;
  heart[i3+2]=(Math.random()-0.5)*4;

  // 🌸 FLOWER
  let r=Math.sin(5*t)*3.8;
  flower[i3]=Math.cos(t)*r;
  flower[i3+1]=Math.sin(t)*r;
  flower[i3+2]=(Math.random()-0.5)*4;

  // 🪐 SATURN (planet + rings)
  if(Math.random()<0.3){
    let u=Math.random()*Math.PI*2,v=Math.random()*Math.PI,pr=3.6;
    saturn[i3]=pr*Math.sin(v)*Math.cos(u);
    saturn[i3+1]=pr*Math.cos(v);
    saturn[i3+2]=pr*Math.sin(v)*Math.sin(u);
  }else{
    let a=Math.random()*Math.PI*2, rr=7+Math.random()*3;
    saturn[i3]=Math.cos(a)*rr;
    saturn[i3+1]=(Math.random()-0.5)*0.8;
    saturn[i3+2]=Math.sin(a)*rr;
  }
}

const geo=new THREE.BufferGeometry();
geo.setAttribute("position",new THREE.BufferAttribute(pos,3));

const mat=new THREE.PointsMaterial({
  size:isMobile?0.05:0.06,
  transparent:true,
  opacity:0.95,
  blending:THREE.AdditiveBlending,
  depthWrite:false,
  color:0xffffff
});
scene.add(new THREE.Points(geo,mat));

/* ================= HAND SKELETON ================= */
const CONN=[
 [0,1],[1,2],[2,3],[3,4],
 [0,5],[5,6],[6,7],[7,8],
 [0,9],[9,10],[10,11],[11,12],
 [0,13],[13,14],[14,15],[15,16],
 [0,17],[17,18],[18,19],[19,20]
];
function drawHand(lm){
  ctx.strokeStyle="#00ffff"; ctx.lineWidth=2;
  CONN.forEach(([a,b])=>{
    ctx.beginPath();
    ctx.moveTo(lm[a].x*canvas.width,lm[a].y*canvas.height);
    ctx.lineTo(lm[b].x*canvas.width,lm[b].y*canvas.height);
    ctx.stroke();
  });
  lm.forEach(p=>{
    ctx.fillStyle="#ff66aa";
    ctx.beginPath();
    ctx.arc(p.x*canvas.width,p.y*canvas.height,3,0,Math.PI*2);
    ctx.fill();
  });
}

/* ================= STATE ================= */
let target=cloud;
let targetColor=new THREE.Color(0.6,0.6,1);
let stable=null, hold=0;
let handForce=new THREE.Vector3();

/* ================= AUDIO (SOUND-REACTIVE) ================= */
let analyser, audioData;
async function initAudio(){
  const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  const ctxA = new (window.AudioContext||window.webkitAudioContext)();
  const src = ctxA.createMediaStreamSource(stream);
  analyser = ctxA.createAnalyser();
  analyser.fftSize = 256;
  audioData = new Uint8Array(analyser.frequencyBinCount);
  src.connect(analyser);
}

/* ================= MEDIAPIPE ================= */
const hands=new Hands({
  locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({maxNumHands:1,modelComplexity:0});

hands.onResults(res=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!res.multiHandLandmarks?.length){
    stable=null; hold=0;
    target=cloud; targetColor.set(0.6,0.6,1);
    debug.innerText="Idle";
    return;
  }

  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;

  const lm=res.multiHandLandmarks[0];
  drawHand(lm);

  // hand gravity
  handForce.set((lm[9].x-0.5)*90,(-lm[9].y+0.5)*90,0);

  // pinch zoom
  const pinch=Math.hypot(lm[4].x-lm[8].x,lm[4].y-lm[8].y);
  const zTarget = pinch<0.05 ? 16 : 26;
  camera.position.z += (zTarget-camera.position.z)*0.05;

  const up=i=>lm[i].y<lm[i-2].y;
  const f=[up(8),up(12),up(16),up(20)];

  let detected=null;
  if(f.every(v=>!v)) detected="heart";
  else if(f[0]&&!f[1]&&!f[2]&&!f[3]) detected="flower";
  else if(f[0]&&f[1]&&!f[2]&&!f[3]) detected="saturn";
  else if(f.every(v=>v)) detected="cloud";

  if(detected===stable) hold++; else {stable=detected; hold=0;}
  if(hold>7){
    if(detected==="heart"){ target=heart; targetColor.set(1,0.3,0.5); debug.innerText="❤️ Heart"; }
    if(detected==="flower"){ target=flower; targetColor.set(0.8,0.4,1); debug.innerText="🌸 Flower"; }
    if(detected==="saturn"){ target=saturn; targetColor.set(0.2,0.9,1); debug.innerText="🪐 Saturn"; }
    if(detected==="cloud"){ target=cloud; targetColor.set(0.6,0.6,1); debug.innerText="✋ Space"; }
  }
});

/* ================= START ================= */
document.getElementById("startBtn").onclick=async()=>{
  const s=await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject=s; await video.play();
  await initAudio(); // mic
  (async function loop(){
    await hands.send({image:video});
    requestAnimationFrame(loop);
  })();
};

/* ================= ANIMATE ================= */
function animate(){
  requestAnimationFrame(animate);

  // TRAILS: fade previous frame
  renderer.setClearColor(0x020416, 0.12);
  renderer.clear();

  // SOUND REACTIVE
  let amp=0;
  if(analyser){
    analyser.getByteFrequencyData(audioData);
    amp = audioData.reduce((a,b)=>a+b,0)/audioData.length/255;
  }

  mat.color.lerp(targetColor,0.04);
  mat.size = (isMobile?0.05:0.06) * (1 + amp*0.8);

  for(let i=0;i<COUNT;i++){
    let i3=i*3;

    // morph force
    vel[i3]   += (target[i3]   - pos[i3])   * 0.014;
    vel[i3+1] += (target[i3+1] - pos[i3+1]) * 0.014;
    vel[i3+2] += (target[i3+2] - pos[i3+2]) * 0.014;

    // hand gravity
    vel[i3]   += (handForce.x-pos[i3]) * 0.0006;
    vel[i3+1] += (handForce.y-pos[i3+1]) * 0.0006;

    // audio pulse
    vel[i3+2] += amp * 0.02;

    vel[i3]*=0.88; vel[i3+1]*=0.88; vel[i3+2]*=0.88;
    pos[i3]+=vel[i3]; pos[i3+1]+=vel[i3+1]; pos[i3+2]+=vel[i3+2];
  }

  geo.attributes.position.needsUpdate=true;
  scene.rotation.y += (target===saturn?0.002:0.001);
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
