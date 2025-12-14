/* ---------------- THREE SETUP ---------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera3D = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
camera3D.position.z = 6;

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* ---------------- PARTICLES ---------------- */
const COUNT = 30000;
let geometry = new THREE.BufferGeometry();
let positions = new Float32Array(COUNT * 3);
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

let material = new THREE.PointsMaterial({
  size: 0.04,
  color: 0x66ccff,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending
});

let points = new THREE.Points(geometry, material);
scene.add(points);

/* ---------------- SHAPES ---------------- */
const heart = generateHeart();
const saturn = generateSaturn();
const flower = generateFlower();

let shapeBlend = 0; // 0 heart, 0.5 flower, 1 saturn

function generateHeart(){
  let a = new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    let t = Math.random()*Math.PI*2;
    let s = 0.04;
    a[i*3] = 16*Math.pow(Math.sin(t),3)*s;
    a[i*3+1] = (13*Math.cos(t)-5*Math.cos(2*t))*s;
    a[i*3+2] = (Math.random()-0.5);
  }
  return a;
}

function generateSaturn(){
  let a = new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    let ang = Math.random()*Math.PI*2;
    let r = 2 + Math.random()*1.5;
    a[i*3] = Math.cos(ang)*r;
    a[i*3+1] = (Math.random()-0.5)*0.2;
    a[i*3+2] = Math.sin(ang)*r;
  }
  return a;
}

function generateFlower(){
  let a = new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    let t = Math.random()*Math.PI*2;
    let r = Math.sin(5*t)*1.5 + 2;
    a[i*3] = Math.cos(t)*r;
    a[i*3+1] = Math.sin(t)*r;
    a[i*3+2] = (Math.random()-0.5);
  }
  return a;
}

/* ---------------- HAND TRACKING ---------------- */
const video = document.getElementById("video");
const canvas2D = document.getElementById("handPreview");
const ctx = canvas2D.getContext("2d");

const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(res => {
  ctx.clearRect(0,0,canvas2D.width,canvas2D.height);

  if(res.multiHandLandmarks.length){
    const lm = res.multiHandLandmarks[0];

    drawConnectors(ctx, lm, HAND_CONNECTIONS, {color:'#0ff'});
    drawLandmarks(ctx, lm, {color:'#fff', radius:2});

    // gesture logic
    const thumb = lm[4];
    const index = lm[8];
    const pinky = lm[20];

    const spread =
      Math.abs(thumb.x - pinky.x) +
      Math.abs(thumb.y - pinky.y);

    if(spread < 0.25) shapeBlend = 0;        // fist → heart
    else if(spread < 0.45) shapeBlend = 0.5; // 2–3 fingers → flower
    else shapeBlend = 1;                     // open palm → saturn
  }
});

const cam = new Camera(video, {
  onFrame: async () => await hands.send({image: video}),
  width: 640,
  height: 480
});
cam.start();

/* ---------------- ANIMATION ---------------- */
function animate(){
  requestAnimationFrame(animate);

  const pos = geometry.attributes.position.array;

  for(let i=0;i<COUNT;i++){
    let i3 = i*3;

    let a,b;
    if(shapeBlend < 0.5){
      a = heart; b = flower;
      var t = shapeBlend*2;
    } else {
      a = flower; b = saturn;
      var t = (shapeBlend-0.5)*2;
    }

    pos[i3]   = THREE.MathUtils.lerp(a[i3],   b[i3],   t);
    pos[i3+1] = THREE.MathUtils.lerp(a[i3+1], b[i3+1], t);
    pos[i3+2] = THREE.MathUtils.lerp(a[i3+2], b[i3+2], t);
  }

  geometry.attributes.position.needsUpdate = true;
  points.rotation.y += 0.002;

  renderer.render(scene, camera3D);
}
animate();

/* ---------------- RESIZE ---------------- */
addEventListener('resize', ()=>{
  camera3D.aspect = innerWidth/innerHeight;
  camera3D.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
