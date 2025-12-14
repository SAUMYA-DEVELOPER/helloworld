/* ================= DOM ================= */
const video=document.getElementById("video");
const canvas=document.getElementById("overlay");
const ctx=canvas.getContext("2d");
const debug=document.getElementById("gestureDebug");

/* ================= THREE ================= */
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x020416);

const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,200);
camera.position.z=16;

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

/* ================= PARTICLES ================= */
const COUNT=35000;
const geo=new THREE.BufferGeometry();

const pos=new Float32Array(COUNT*3);
const vel=new Float32Array(COUNT*3);

const heart=new Float32Array(COUNT*3);
const saturn=new Float32Array(COUNT*3);
const cube=new Float32Array(COUNT*3);

/* shapes */
for(let i=0;i<COUNT;i++){
  let i3=i*3;

  pos[i3]=(Math.random()-0.5)*25;
  pos[i3+1]=(Math.random()-0.5)*25;
  pos[i3+2]=(Math.random()-0.5)*25;

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

geo.setAttribute("position",new THREE.BufferAttribute(pos,3));

const mat=new THREE.PointsMaterial({
  color:0x66ccff,
  size:0.05,
  transparent:true,
  opacity:0.9,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});

scene.add(new THREE.Points(geo,mat));

/* ================= HAND SKELETON ================= */
const HAND_CONNECTIONS=[
 [0,1],[1,2],[2,3],[3,4],
 [0,5],[5,6],[6,7],[7,8],
 [0,9],[9,10],[10,11],[11,12],
 [0,13],[13,14],[14,15],[15,16],
 [0,17],[17,18],[18,19],[19,20]
];

function drawSkeleton(lm){
  ctx.strokeStyle="#00ffff";
  ctx.lineWidth=2;
  HAND_CONNECTIONS.forEach(([a,b])=>{
    ctx.beginPath();
    ctx.moveTo(lm[a].x*canvas.width,lm[a].y*canvas.height);
    ctx.lineTo(lm[b].x*canvas.width,lm[b].y*canvas.height);
    ctx.stroke();
  });
  lm.forEach(p=>{
    ctx.fillStyle="#ff3366";
    ctx.beginPath();
    ctx.arc(p.x*canvas.width,p.y*canvas.height,3,0,Math.PI*2);
    ctx.fill();
  });
}

/* ================= STATE ================= */
let targetMode=0; // 0 heart | 1 saturn | 2 cube
let stableGesture=null;
let hold=0;

/* ================= MEDIAPIPE ================= */
const hands=new Hands({
  locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({maxNumHands:2,modelComplexity:0});

hands.onResults(res=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!res.multiHandLandmarks?.length){
    hold=0;
    stableGesture=null;
    debug.innerText="Idle";
    return;
  }

  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;

  const lm=res.multiHandLandmarks[0];
  drawSkeleton(lm);

  const up=i=>lm[i].y<lm[i-2].y;
  const f=[up(8),up(12),up(16),up(20)];

  let detected=null;

  if(f.every(v=>!v)) detected=0;            // fist → heart
  else if(f[0]&&f[1]&&!f[2]&&!f[3]) detected=1; // peace → saturn
  else if(f[0]&&!f[1]&&!f[2]&&!f[3]) detected=2; // one finger → cube

  if(detected===stableGesture){
    hold++;
  }else{
    hold=0;
    stableGesture=detected;
  }

  if(hold>6 && detected!==null){
    targetMode=detected;
    debug.innerText=["❤️ Heart","🪐 Saturn","⬛ Cube"][targetMode];
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

  for(let i=0;i<COUNT;i++){
    let i3=i*3;
    let tx,ty,tz;

    if(targetMode===0){
      tx=heart[i3]; ty=heart[i3+1]; tz=heart[i3+2];
    }else if(targetMode===1){
      tx=saturn[i3]; ty=saturn[i3+1]; tz=saturn[i3+2];
    }else{
      tx=cube[i3]; ty=cube[i3+1]; tz=cube[i3+2];
    }

    vel[i3]+=(tx-pos[i3])*0.02;
    vel[i3+1]+=(ty-pos[i3+1])*0.02;
    vel[i3+2]+=(tz-pos[i3+2])*0.02;

    vel[i3]*=0.85;
    vel[i3+1]*=0.85;
    vel[i3+2]*=0.85;

    pos[i3]+=vel[i3];
    pos[i3+1]+=vel[i3+1];
    pos[i3+2]+=vel[i3+2];
  }

  geo.attributes.position.needsUpdate=true;
  scene.rotation.y+=0.002;

  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
