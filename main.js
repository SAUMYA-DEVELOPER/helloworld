/* ================= DOM ================= */
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const debug = document.getElementById("gestureDebug");

/* ================= THREE ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020416);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 300);
camera.position.z = 22;

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
renderer.autoClear = false;
document.body.appendChild(renderer.domElement);

/* ================= PARTICLES ================= */
const COUNT = 38000;

const pos = new Float32Array(COUNT*3);
const vel = new Float32Array(COUNT*3);

const cloud = new Float32Array(COUNT*3);
const heart = new Float32Array(COUNT*3);
const flower = new Float32Array(COUNT*3);
const saturn = new Float32Array(COUNT*3);

/* -------- SHAPES -------- */
for(let i=0;i<COUNT;i++){
  const i3=i*3;

  // 🌌 CLOUD (tightened)
  cloud[i3]   = (Math.random()-0.5)*30;
  cloud[i3+1] = (Math.random()-0.5)*30;
  cloud[i3+2] = (Math.random()-0.5)*30;

  pos[i3]=cloud[i3];
  pos[i3+1]=cloud[i3+1];
  pos[i3+2]=cloud[i3+2];

  // ❤️ HEART
  const t=Math.random()*Math.PI*2;
  heart[i3]   = 16*Math.sin(t)**3 * 0.55;
  heart[i3+1] = (13*Math.cos(t)-5*Math.cos(2*t)) * 0.55;
  heart[i3+2] = (Math.random()-0.5)*3;

  // 🌸 FLOWER (clear petals)
  const r = Math.sin(5*t) * 4.2;
  flower[i3]   = Math.cos(t)*r;
  flower[i3+1] = Math.sin(t)*r;
  flower[i3+2] = (Math.random()-0.5)*3;

  // 🪐 SATURN (planet + rings)
  if(Math.random()<0.35){
    const u=Math.random()*Math.PI*2;
    const v=Math.random()*Math.PI;
    const pr=3.8;
    saturn[i3]   = pr*Math.sin(v)*Math.cos(u);
    saturn[i3+1] = pr*Math.cos(v);
    saturn[i3+2] = pr*Math.sin(v)*Math.sin(u);
  } else {
    const a=Math.random()*Math.PI*2;
    const rr=6.5+Math.random()*2.5;
    saturn[i3]   = Math.cos(a)*rr;
    saturn[i3+1] = (Math.random()-0.5)*0.6;
    saturn[i3+2] = Math.sin(a)*rr;
  }
}

const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(pos,3));

const mat = new THREE.PointsMaterial({
  size:0.065,
  transparent:true,
  opacity:0.95,
  blending:THREE.AdditiveBlending,
  depthWrite:false,
  color:0xffffff
});

scene.add(new THREE.Points(geo, mat));

/* ================= STATE ================= */
let target = cloud;
let targetColor = new THREE.Color(0.6,0.6,1);
let stable=null, hold=0;

/* ================= HAND TRACKING ================= */
const hands=new Hands({
  locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({maxNumHands:1,modelComplexity:0});

hands.onResults(res=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!res.multiHandLandmarks?.length){
    stable=null; hold=0;
    target=cloud;
    targetColor.set(0.6,0.6,1);
    debug.innerText="Idle";
    return;
  }

  const lm=res.multiHandLandmarks[0];
  const up=i=>lm[i].y<lm[i-2].y;
  const f=[up(8),up(12),up(16),up(20)];

  let detected=null;
  if(f.every(v=>!v)) detected="heart";
  else if(f[0]&&!f[1]&&!f[2]&&!f[3]) detected="flower";
  else if(f[0]&&f[1]&&!f[2]&&!f[3]) detected="saturn";
  else if(f.every(v=>v)) detected="cloud";

  if(detected===stable) hold++;
  else { stable=detected; hold=0; }

  if(hold>6){
    if(detected==="heart"){
      target=heart;
      targetColor.set(1,0.25,0.45); // ❤️ RED/PINK
      debug.innerText="❤️ Heart";
    }
    if(detected==="flower"){
      target=flower;
      targetColor.set(0.8,0.4,1); // 🌸 PURPLE
      debug.innerText="🌸 Flower";
    }
    if(detected==="saturn"){
      target=saturn;
      targetColor.set(0.2,0.9,1); // 🪐 CYAN
      debug.innerText="🪐 Saturn";
    }
    if(detected==="cloud"){
      target=cloud;
      targetColor.set(0.6,0.6,1);
      debug.innerText="✋ Space";
    }
  }
});

/* ================= START ================= */
document.getElementById("startBtn").onclick=async()=>{
  const s=await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject=s; await video.play();
  (async function loop(){
    await hands.send({image:video});
    requestAnimationFrame(loop);
  })();
};

/* ================= ANIMATE ================= */
function animate(){
  requestAnimationFrame(animate);

  mat.color.lerp(targetColor,0.08); // STRONG COLOR FIX

  for(let i=0;i<COUNT;i++){
    const i3=i*3;

    // STRONG attraction (KEY FIX)
    vel[i3]   += (target[i3]   - pos[i3])   * 0.03;
    vel[i3+1] += (target[i3+1] - pos[i3+1]) * 0.03;
    vel[i3+2] += (target[i3+2] - pos[i3+2]) * 0.03;

    vel[i3]*=0.82;
    vel[i3+1]*=0.82;
    vel[i3+2]*=0.82;

    pos[i3]+=vel[i3];
    pos[i3+1]+=vel[i3+1];
    pos[i3+2]+=vel[i3+2];
  }

  geo.attributes.position.needsUpdate=true;
  scene.rotation.y += (target===saturn ? 0.002 : 0.001);

  renderer.render(scene,camera);
}
animate();

/* ================= RESIZE ================= */
addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
