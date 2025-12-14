/* ---------- THREE ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const cam3D = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
cam3D.position.z = 6;

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* ---------- PARTICLES ---------- */
const COUNT = 25000;
const geometry = new THREE.BufferGeometry();
const pos = new Float32Array(COUNT * 3);
geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));

const material = new THREE.PointsMaterial({
  size: 0.035,
  color: 0x66ccff,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite:false
});

const points = new THREE.Points(geometry, material);
scene.add(points);

/* ---------- SHAPES ---------- */
const heart = genHeart();
const flower = genFlower();
const saturn = genSaturn();

let shapeBlend = -1; // IMPORTANT → no hand = no shape

function genHeart(){
  const a = new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    let t=Math.random()*Math.PI*2,s=0.04;
    a[i*3]=16*Math.sin(t)**3*s;
    a[i*3+1]=(13*Math.cos(t)-5*Math.cos(2*t))*s;
    a[i*3+2]=(Math.random()-0.5);
  }
  return a;
}
function genFlower(){
  const a = new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    let t=Math.random()*Math.PI*2;
    let r=Math.sin(5*t)*1.5+2;
    a[i*3]=Math.cos(t)*r;
    a[i*3+1]=Math.sin(t)*r;
    a[i*3+2]=(Math.random()-0.5);
  }
  return a;
}
function genSaturn(){
  const a = new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    let t=Math.random()*Math.PI*2;
    let r=2+Math.random()*1.5;
    a[i*3]=Math.cos(t)*r;
    a[i*3+1]=(Math.random()-0.5)*0.2;
    a[i*3+2]=Math.sin(t)*r;
  }
  return a;
}

/* ---------- HAND TRACKING ---------- */
const video = document.getElementById("video");
const canvas = document.getElementById("handPreview");
const ctx = canvas.getContext("2d");

const hands = new Hands({
  locateFile: f =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
});

hands.setOptions({
  maxNumHands:1,
  modelComplexity:1,
  minDetectionConfidence:0.7,
  minTrackingConfidence:0.7
});

hands.onResults(r=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!r.multiHandLandmarks.length){
    shapeBlend = -1;
    return;
  }

  const lm = r.multiHandLandmarks[0];
  drawConnectors(ctx,lm,HAND_CONNECTIONS,{color:"#00ffff"});
  drawLandmarks(ctx,lm,{color:"#fff",radius:2});

  const thumb = lm[4];
  const pinky = lm[20];
  const spread = Math.abs(thumb.x-pinky.x)+Math.abs(thumb.y-pinky.y);

  if(spread < 0.25) shapeBlend = 0;        // heart
  else if(spread < 0.45) shapeBlend = 0.5; // flower
  else shapeBlend = 1;                     // saturn
});

new Camera(video,{
  onFrame:async()=>await hands.send({image:video}),
  width:640,height:480
}).start();

/* ---------- LOOP ---------- */
function animate(){
  requestAnimationFrame(animate);

  for(let i=0;i<COUNT;i++){
    let i3=i*3;

    if(shapeBlend < 0){
      pos[i3]=pos[i3+1]=pos[i3+2]=9999;
      continue;
    }

    let a,b,t;
    if(shapeBlend < 0.5){
      a=heart; b=flower; t=shapeBlend*2;
    }else{
      a=flower; b=saturn; t=(shapeBlend-0.5)*2;
    }

    pos[i3]=THREE.MathUtils.lerp(a[i3],b[i3],t);
    pos[i3+1]=THREE.MathUtils.lerp(a[i3+1],b[i3+1],t);
    pos[i3+2]=THREE.MathUtils.lerp(a[i3+2],b[i3+2],t);
  }

  geometry.attributes.position.needsUpdate = true;
  points.rotation.y += 0.002;

  renderer.render(scene,cam3D);
}
animate();

/* ---------- RESIZE ---------- */
addEventListener("resize",()=>{
  cam3D.aspect=innerWidth/innerHeight;
  cam3D.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
