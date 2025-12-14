/* ========= DOM ========= */
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const debug = document.getElementById("gestureDebug");

/* ========= THREE ========= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 200);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* ========= PARTICLES ========= */
const COUNT = 25000;   // 🔴 simple & safe
const pos = new Float32Array(COUNT * 3);

const cloud = new Float32Array(COUNT * 3);
const heart = new Float32Array(COUNT * 3);
const flower = new Float32Array(COUNT * 3);
const saturn = new Float32Array(COUNT * 3);

/* ----- SHAPE GENERATION ----- */
for(let i=0;i<COUNT;i++){
  const i3 = i*3;

  // CLOUD (default)
  cloud[i3]   = (Math.random()-0.5)*25;
  cloud[i3+1] = (Math.random()-0.5)*25;
  cloud[i3+2] = (Math.random()-0.5)*25;

  pos[i3]   = cloud[i3];
  pos[i3+1] = cloud[i3+1];
  pos[i3+2] = cloud[i3+2];

  // HEART
  const t = Math.random()*Math.PI*2;
  heart[i3]   = 16*Math.sin(t)**3 * 0.5;
  heart[i3+1] = (13*Math.cos(t)-5*Math.cos(2*t)) * 0.5;
  heart[i3+2] = (Math.random()-0.5)*2;

  // FLOWER
  const r = Math.sin(5*t) * 4;
  flower[i3]   = Math.cos(t)*r;
  flower[i3+1] = Math.sin(t)*r;
  flower[i3+2] = (Math.random()-0.5)*2;

  // SATURN
  if(Math.random()<0.3){
    const u=Math.random()*Math.PI*2;
    const v=Math.random()*Math.PI;
    const pr=3.5;
    saturn[i3]   = pr*Math.sin(v)*Math.cos(u);
    saturn[i3+1] = pr*Math.cos(v);
    saturn[i3+2] = pr*Math.sin(v)*Math.sin(u);
  } else {
    const a=Math.random()*Math.PI*2;
    const rr=6+Math.random()*2;
    saturn[i3]   = Math.cos(a)*rr;
    saturn[i3+1] = (Math.random()-0.5)*0.5;
    saturn[i3+2] = Math.sin(a)*rr;
  }
}

/* ========= THREE OBJECT ========= */
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(pos,3));

const mat = new THREE.PointsMaterial({
  size:0.06,
  color:0xffffff,
  transparent:true,
  opacity:0.9
});

scene.add(new THREE.Points(geo, mat));

/* ========= STATE ========= */
let target = cloud;
let targetColor = new THREE.Color(0.6,0.6,1);

/* ========= MEDIAPIPE ========= */
const hands = new Hands({
  locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({ maxNumHands:1, modelComplexity:0 });

hands.onResults(res=>{
  if(!res.multiHandLandmarks?.length){
    target = cloud;
    targetColor.set(0.6,0.6,1);
    debug.innerText="Idle";
    return;
  }

  const lm = res.multiHandLandmarks[0];
  const up=i=>lm[i].y<lm[i-2].y;
  const f=[up(8),up(12),up(16),up(20)];

  if(f.every(v=>!v)){
    target=heart;
    targetColor.set(1,0.3,0.5);
    debug.innerText="❤️ Heart";
  }
  else if(f[0]&&!f[1]&&!f[2]&&!f[3]){
    target=flower;
    targetColor.set(0.8,0.4,1);
    debug.innerText="🌸 Flower";
  }
  else if(f[0]&&f[1]&&!f[2]&&!f[3]){
    target=saturn;
    targetColor.set(0.2,0.9,1);
    debug.innerText="🪐 Saturn";
  }
  else if(f.every(v=>v)){
    target=cloud;
    targetColor.set(0.6,0.6,1);
    debug.innerText="✋ Cloud";
  }
});

/* ========= START ========= */
document.getElementById("startBtn").onclick=async()=>{
  const s = await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject = s;
  await video.play();
  (async function loop(){
    await hands.send({image:video});
    requestAnimationFrame(loop);
  })();
};

/* ========= ANIMATE ========= */
function animate(){
  requestAnimationFrame(animate);

  mat.color.lerp(targetColor,0.1);

  for(let i=0;i<COUNT;i++){
    const i3=i*3;
    pos[i3]   += (target[i3]   - pos[i3])   * 0.05;
    pos[i3+1] += (target[i3+1] - pos[i3+1]) * 0.05;
    pos[i3+2] += (target[i3+2] - pos[i3+2]) * 0.05;
  }

  geo.attributes.position.needsUpdate = true;
  scene.rotation.y += 0.002;
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
