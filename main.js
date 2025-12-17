// ================= DOM =================
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const gestureDebug = document.getElementById("gestureDebug");
const camContainer = document.getElementById("camContainer");

// ===== Progress UI =====
const progressBar = document.createElement("div");
progressBar.style.position = "fixed";
progressBar.style.bottom = "20px";
progressBar.style.right = "20px";
progressBar.style.width = "160px";
progressBar.style.height = "6px";
progressBar.style.border = "1px solid cyan";
progressBar.style.background = "rgba(0,0,0,0.6)";
progressBar.style.zIndex = "20";

const progressFill = document.createElement("div");
progressFill.style.height = "100%";
progressFill.style.width = "0%";
progressFill.style.background = "cyan";
progressBar.appendChild(progressFill);
document.body.appendChild(progressBar);

// ===== Camera Toggle =====
const camToggle = document.createElement("button");
camToggle.innerText = "Hide Camera";
camToggle.style.position = "fixed";
camToggle.style.top = "60px";
camToggle.style.left = "20px";
camToggle.style.zIndex = "20";
camToggle.style.padding = "8px 14px";
camToggle.style.background = "rgba(0,0,0,0.7)";
camToggle.style.color = "#fff";
camToggle.style.border = "1px solid cyan";
camToggle.style.cursor = "pointer";
document.body.appendChild(camToggle);

let camVisible = true;
camToggle.onclick = () => {
  camVisible = !camVisible;
  camContainer.style.display = camVisible ? "block" : "none";
  camToggle.innerText = camVisible ? "Hide Camera" : "Show Camera";
};

// ================= OVERLAY =================
function resizeOverlay() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
resizeOverlay();
window.addEventListener("resize", resizeOverlay);

// ================= THREE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const camera3D = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 300);
camera3D.position.z = 18;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera3D.aspect = innerWidth / innerHeight;
  camera3D.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ================= PARTICLES =================
const COUNT = devicePixelRatio > 1.4 ? 45000 : 55000;
const geo = new THREE.BufferGeometry();

const base = new Float32Array(COUNT * 3);
const heart = new Float32Array(COUNT * 3);
const saturn = new Float32Array(COUNT * 3);
const flower = new Float32Array(COUNT * 3);
const text = new Float32Array(COUNT * 3);
const core = new Float32Array(COUNT);

// ================= TEXT =================
function generateTextPoints(txt) {
  const c = document.createElement("canvas");
  c.width = 600; c.height = 200;
  const cx = c.getContext("2d");
  cx.font = "bold 72px Arial";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillStyle = "#fff";
  cx.fillText(txt, c.width / 2, c.height / 2);

  const img = cx.getImageData(0, 0, c.width, c.height).data;
  const pts = [];
  for (let y = 0; y < c.height; y += 3) {
    for (let x = 0; x < c.width; x += 3) {
      const i = (y * c.width + x) * 4;
      if (img[i + 3] > 150) {
        pts.push([(x - c.width / 2) / 12, -(y - c.height / 2) / 12, (Math.random() - 0.5) * 2]);
      }
    }
  }
  return pts;
}
const textRaw = generateTextPoints("I love you Pgll");

// ================= SHAPES =================
function heartPoint(i) {
  const t = (i / COUNT) * Math.PI * 2;
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [(x / 16) * 4, (y / 16) * 4, (Math.random() - 0.5) * 3];
}

function saturnPoint() {
  if (Math.random() < 0.35) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 2.8;
    return [r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)];
  }
  const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 2.5;
  return [Math.cos(a) * r, (Math.random() - 0.5) * 0.6, Math.sin(a) * r];
}

function flowerPoint(i) {
  const t = (i / COUNT) * Math.PI * 2;
  const r = Math.sin(5 * t) * 3.8;
  return [Math.cos(t) * r, Math.sin(t) * r, (Math.random() - 0.5) * 3];
}

// ================= INIT =================
for (let i = 0; i < COUNT; i++) {
  const i3 = i * 3;

  base[i3] = (Math.random() - 0.5) * 30;
  base[i3 + 1] = (Math.random() - 0.5) * 30;
  base[i3 + 2] = (Math.random() - 0.5) * 30;

  [heart[i3], heart[i3 + 1], heart[i3 + 2]] = heartPoint(i);
  [saturn[i3], saturn[i3 + 1], saturn[i3 + 2]] = saturnPoint();
  [flower[i3], flower[i3 + 1], flower[i3 + 2]] = flowerPoint(i);

  const p = textRaw[i % textRaw.length];
  text[i3] = p[0]; text[i3 + 1] = p[1]; text[i3 + 2] = p[2];

  core[i] = Math.random() < 0.45 ? 1 : 0;
}

geo.setAttribute("position", new THREE.BufferAttribute(base, 3));
geo.setAttribute("heart", new THREE.BufferAttribute(heart, 3));
geo.setAttribute("saturn", new THREE.BufferAttribute(saturn, 3));
geo.setAttribute("flower", new THREE.BufferAttribute(flower, 3));
geo.setAttribute("text", new THREE.BufferAttribute(text, 3));
geo.setAttribute("aCore", new THREE.BufferAttribute(core, 1));

// ================= SHADER =================
const mat = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uMode: { value: 0 },
    uMix: { value: 0 },
    uPulse: { value: 0 },
    uColor: { value: new THREE.Color(0.6, 0.6, 1) }
  },
  vertexShader: `
    uniform float uTime, uMode, uMix, uPulse;
    attribute vec3 heart, saturn, flower, text;
    attribute float aCore;

    void main(){
      vec3 target = position;
      if(uMode>0.5 && uMode<1.5) target = heart*(1.0+uPulse);
      else if(uMode>1.5 && uMode<2.5) target = saturn;
      else if(uMode>2.5 && uMode<3.5) target = flower;
      else if(uMode>3.5 && uMode<4.5) target = text;

      vec3 pos = mix(position, target, uMix * aCore);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.);
      gl_PointSize = mix(1.6,4.2,aCore);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    void main(){
      float d=length(gl_PointCoord-.5);
      if(d>.5) discard;
      gl_FragColor=vec4(uColor*(1.3-d),1.);
    }
  `
});
scene.add(new THREE.Points(geo, mat));

// ================= STATE =================
let targetMode = 0;
let currentMode = 0;
let lastMode = -1;

// ================= ANIMATE =================
function animate(){
  requestAnimationFrame(animate);

  mat.uniforms.uTime.value += 0.015;

  if(lastMode !== targetMode){
    mat.uniforms.uMix.value = 0;
    lastMode = targetMode;
  }

  mat.uniforms.uMix.value += (1 - mat.uniforms.uMix.value) * 0.06;
  progressFill.style.width = `${Math.floor(mat.uniforms.uMix.value * 100)}%`;

  currentMode += (targetMode - currentMode) * 0.08;
  mat.uniforms.uMode.value = currentMode;

  mat.uniforms.uPulse.value = currentMode>0.5&&currentMode<1.5
    ? Math.sin(mat.uniforms.uTime.value*3)*0.06
    : 0;

  if(currentMode>1.5 && currentMode<2.5){
    scene.rotation.y += 0.002;
  }

  renderer.render(scene, camera3D);
}
animate();

// ================= MEDIAPIPE =================
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({ maxNumHands: 2, modelComplexity: 0 });

const bones = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20]
];

function drawSkeleton(lm){
  ctx.strokeStyle="cyan"; ctx.lineWidth=2;
  bones.forEach(([a,b])=>{
    ctx.beginPath();
    ctx.moveTo(lm[a].x*canvas.width,lm[a].y*canvas.height);
    ctx.lineTo(lm[b].x*canvas.width,lm[b].y*canvas.height);
    ctx.stroke();
  });
  ctx.fillStyle="#fff";
  lm.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x*canvas.width,p.y*canvas.height,3,0,Math.PI*2);
    ctx.fill();
  });
}

hands.onResults(res=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!res.multiHandLandmarks?.length){
    targetMode=0;
    gestureDebug.innerText="Idle";
    return;
  }

  res.multiHandLandmarks.forEach(drawSkeleton);

  const lm=res.multiHandLandmarks[0];
  const up=i=>lm[i].y<lm[i-2].y;
  const f=[up(8),up(12),up(16),up(20)];

  // 💖 THREE FINGER LOVE (EDITED PART)
  if(f[0] && f[1] && f[2] && !f[3]){
    targetMode=4;
    mat.uniforms.uColor.value.lerp(new THREE.Color(1,0.25,0.4),0.08);
    gestureDebug.innerText="💖 I love you Pgll ";
    return;
  }

  if(f.every(v=>!v)){
    targetMode=1;
    mat.uniforms.uColor.value.lerp(new THREE.Color(1,0.3,0.5),0.06);
    gestureDebug.innerText="❤️ Heart"; return;
  }
  if(f[0]&&f[1]&&!f[2]&&!f[3]){
    targetMode=2;
    mat.uniforms.uColor.value.lerp(new THREE.Color(0.2,0.9,1),0.06);
    gestureDebug.innerText="🪐 Saturn"; return;
  }
  if(f[0]&&!f[1]&&!f[2]&&!f[3]){
    targetMode=3;
    mat.uniforms.uColor.value.lerp(new THREE.Color(0.8,0.4,1),0.06);
    gestureDebug.innerText="🌸 Flower"; return;
  }
  if(f.every(v=>v)){
    targetMode=0;
    mat.uniforms.uColor.value.lerp(new THREE.Color(0.6,0.6,1),0.06);
    gestureDebug.innerText="✋ Space";
  }
});

// ================= START =================
document.getElementById("startBtn").onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await video.play();

  let last = 0;
  async function loop(t){
    if(t-last>33){
      last=t;
      await hands.send({image:video});
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
};
