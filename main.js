/* ================= BASIC ================= */
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const debug = document.getElementById("gestureDebug");

/* ================= THREE ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020416);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 300);
camera.position.z = 22;

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* ================= PARTICLES ================= */
const COUNT = 45000;
const pos = new Float32Array(COUNT*3);
const vel = new Float32Array(COUNT*3);

const heart = new Float32Array(COUNT*3);
const flower = new Float32Array(COUNT*3);
const saturn = new Float32Array(COUNT*3);
const cloud = new Float32Array(COUNT*3);

for(let i=0;i<COUNT;i++){
  let i3=i*3;

  cloud[i3]=(Math.random()-0.5)*40;
  cloud[i3+1]=(Math.random()-0.5)*40;
  cloud[i3+2]=(Math.random()-0.5)*40;

  pos[i3]=cloud[i3];
  pos[i3+1]=cloud[i3+1];
  pos[i3+2]=cloud[i3+2];

  // ❤️ HEART
  let t=Math.random()*Math.PI*2;
  heart[i3]=16*Math.sin(t)**3*0.35;
  heart[i3+1]=(13*Math.cos(t)-5*Math.cos(2*t))*0.35;
  heart[i3+2]=(Math.random()-0.5)*3;

  // 🌸 FLOWER
  let r=Math.sin(5*t)*3;
  flower[i3]=Math.cos(t)*r;
  flower[i3+1]=Math.sin(t)*r;
  flower[i3+2]=(Math.random()-0.5)*3;

  // 🪐 SATURN (planet + rings)
  if(Math.random()<0.25){
    let u=Math.random()*Math.PI*2;
    let v=Math.random()*Math.PI;
    let pr=3;
    saturn[i3]=pr*Math.sin(v)*Math.cos(u);
    saturn[i3+1]=pr*Math.cos(v);
    saturn[i3+2]=pr*Math.sin(v)*Math.sin(u);
  } else {
    let a=Math.random()*Math.PI*2;
    let rr=6+Math.random()*2;
    saturn[i3]=Math.cos(a)*rr;
    saturn[i3+1]=(Math.random()-0.5)*0.6;
    saturn[i3+2]=Math.sin(a)*rr;
  }
}

const geo=new THREE.BufferGeometry();
geo.setAttribute("position",new THREE.BufferAttribute(pos,3));

const mat=new THREE.PointsMaterial({
  size:0.055,
  transparent:true,
  opacity:0.95,
  blending:THREE.AdditiveBlending,
  depthWrite:false,
  color:0xffffff
});

const points=new THREE.Points(geo,mat);
scene.add(points);

/* ================= HAND SKELETON ================= */
const CONNECTIONS=[
 [0,1],[1,2],[2,3],[3,4],
 [0,5],[5,6],[6,7],[7,8],
 [0,9],[9,10],[10,11],[11,12],
 [0,13],[13,14],[14,15],[15,16],
 [0,17],[17,18],[18,19],[19,20]
];

function drawHand(lm){
  ctx.strokeStyle="#00ffff";
  ctx.lineWidth=2;
  CONNECTIONS.forEach(([a,b])=>{
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
let targetColor=new THREE.Color(1,1,1);
let stable=null,hold=0;

/* ================= MEDIAPIPE ================= */
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

  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;

  const lm=res.multiHandLandmarks[0];
  drawHand(lm);

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
      target=heart; targetColor.set(1,0.3,0.5);
      debug.innerText="❤️ Heart";
    }
    if(detected==="flower"){
      target=flower; targetColor.set(0.8,0.4,1);
      debug.innerText="🌸 Flower";
    }
    if(detected==="saturn"){
      target=saturn; targetColor.set(0.2,0.9,1);
      debug.innerText="🪐 Saturn";
    }
    if(detected==="cloud"){
      target=cloud; targetColor.set(0.6,0.6,1);
      debug.innerText="✋ Free Space";
    }
  }
});

/* ================= START ================= */
document.getElementById("startBtn").onclick=async()=>{
  const s=await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject=s;
  await video.play();
  (async function loop(){
    await hands.send({image:video});
    requestAnimationFrame(loop);
  })();
};

/* ================= ANIMATE ================= */
function animate(){
  requestAnimationFrame(animate);

  mat.color.lerp(targetColor,0.05);

  for(let i=0;i<COUNT;i++){
    let i3=i*3;
    vel[i3]+=(target[i3]-pos[i3])*0.015;
    vel[i3+1]+=(target[i3+1]-pos[i3+1])*0.015;
    vel[i3+2]+=(target[i3+2]-pos[i3+2])*0.015;

    vel[i3]*=0.88;
    vel[i3+1]*=0.88;
    vel[i3+2]*=0.88;

    pos[i3]+=vel[i3];
    pos[i3+1]+=vel[i3+1];
    pos[i3+2]+=vel[i3+2];
  }

  geo.attributes.position.needsUpdate=true;
  scene.rotation.y+=0.0015;

  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
