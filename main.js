// ================= DOM =================
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

// ================= THREE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const camera3D = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 300);
camera3D.position.z = 18;

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ================= PARTICLES =================
const COUNT = 55000;
const geo = new THREE.BufferGeometry();

const base   = new Float32Array(COUNT*3);
const heart  = new Float32Array(COUNT*3);
const saturn = new Float32Array(COUNT*3);
const flower = new Float32Array(COUNT*3);
const core   = new Float32Array(COUNT);

// ---------- SHAPE FUNCTIONS ----------
function heartPoint(i){
  const t=(i/COUNT)*Math.PI*2;
  const s=0.8+Math.random()*0.4;
  const x=16*Math.pow(Math.sin(t),3);
  const y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
  return [(x/16)*s*4,(y/16)*s*4,(Math.random()-0.5)*3];
}

function saturnPoint(){
  if(Math.random()<0.35){
    const u=Math.random(),v=Math.random();
    const th=u*2*Math.PI,ph=Math.acos(2*v-1),r=2.8;
    return [r*Math.sin(ph)*Math.cos(th),r*Math.cos(ph),r*Math.sin(ph)*Math.sin(th)];
  }
  const a=Math.random()*Math.PI*2,r=6+Math.random()*2.5;
  return [Math.cos(a)*r,(Math.random()-0.5)*0.6,Math.sin(a)*r];
}

function flowerPoint(i){
  const t=(i/COUNT)*Math.PI*2;
  const r=Math.sin(5*t)*3.8;
  return [Math.cos(t)*r,Math.sin(t)*r,(Math.random()-0.5)*3];
}

// ---------- INIT ----------
for(let i=0;i<COUNT;i++){
  const i3=i*3;

  base[i3]=(Math.random()-0.5)*30;
  base[i3+1]=(Math.random()-0.5)*30;
  base[i3+2]=(Math.random()-0.5)*30;

  [heart[i3],heart[i3+1],heart[i3+2]] = heartPoint(i);
  [saturn[i3],saturn[i3+1],saturn[i3+2]] = saturnPoint();
  [flower[i3],flower[i3+1],flower[i3+2]] = flowerPoint(i);

  core[i]=Math.random()<0.4?1:0;
}

geo.setAttribute("position",new THREE.BufferAttribute(base,3));
geo.setAttribute("heart",new THREE.BufferAttribute(heart,3));
geo.setAttribute("saturn",new THREE.BufferAttribute(saturn,3));
geo.setAttribute("flower",new THREE.BufferAttribute(flower,3));
geo.setAttribute("aCore",new THREE.BufferAttribute(core,1));

// ================= SHADER =================
const mat=new THREE.ShaderMaterial({
  transparent:true,
  blending:THREE.AdditiveBlending,
  uniforms:{
    uTime:{value:0},
    uMode:{value:0},
    uMix:{value:0},
    uColor:{value:new THREE.Color(1,1,1)},
    uPulse:{value:0}
  },
  vertexShader:`
    uniform float uTime,uMode,uMix,uPulse;
    attribute vec3 heart,saturn,flower;
    attribute float aCore;

    void main(){
      vec3 pos = position;
      vec3 target = position;

      if(uMode < 1.5) target = heart * (1.0 + uPulse);
      else if(uMode < 2.5) target = saturn;
      else if(uMode < 3.5) target = flower;
      else target = position; // SAFE IDLE

      pos = mix(pos, target, uMix * aCore);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.);
      gl_PointSize = mix(1.5,3.8,aCore);
    }
  `,
  fragmentShader:`
    uniform vec3 uColor;
    void main(){
      float d=length(gl_PointCoord-.5);
      if(d>.5) discard;
      gl_FragColor=vec4(uColor,1.);
    }
  `
});

scene.add(new THREE.Points(geo,mat));

// ================= STATE =================
let targetMode=0,targetMix=0,currentMode=0;
const gestureDebug=document.getElementById("gestureDebug");

// ================= ANIMATE =================
function animate(){
  requestAnimationFrame(animate);

  mat.uniforms.uTime.value+=0.015;
  mat.uniforms.uPulse.value = currentMode<1.5 ? Math.sin(mat.uniforms.uTime.value*3)*0.06 : 0;

  mat.uniforms.uMix.value += (targetMix - mat.uniforms.uMix.value)*0.05;
  currentMode += (targetMode-currentMode)*0.08;
  mat.uniforms.uMode.value=currentMode;

  if(currentMode>1.5 && currentMode<2.5) scene.rotation.y+=0.002;
  else scene.rotation.y*=0.98;

  renderer.render(scene,camera3D);
}
animate();

// ================= MEDIAPIPE =================
const hands=new Hands({
  locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({maxNumHands:1,modelComplexity:0});

hands.onResults(res=>{
  if(!res.multiHandLandmarks?.length){
    targetMode=0; targetMix=Math.max(targetMix-0.04,0);
    mat.uniforms.uColor.value.lerp(new THREE.Color(0.6,0.6,1),0.06);
    gestureDebug.innerText="Idle";
    return;
  }

  const lm=res.multiHandLandmarks[0];
  const up=i=>lm[i].y<lm[i-2].y;
  const f=[up(8),up(12),up(16),up(20)];

  // PRIORITY ORDER (IMPORTANT)
  if(f.every(v=>!v)){ // ✊ fist
    targetMode=1;
    targetMix=Math.min(targetMix+0.04,1);
    mat.uniforms.uColor.value.lerp(new THREE.Color(1,0.3,0.5),0.06);
    gestureDebug.innerText="❤️ Heart";
    return;
  }

  if(f[0]&&f[1]&&!f[2]&&!f[3]){ // ✌️ peace
    targetMode=2;
    targetMix=Math.min(targetMix+0.04,1);
    mat.uniforms.uColor.value.lerp(new THREE.Color(0.2,0.9,1),0.06);
    gestureDebug.innerText="🪐 Saturn";
    return;
  }

  if(f[0]&&!f[1]&&!f[2]&&!f[3]){ // ☝️
    targetMode=3;
    targetMix=Math.min(targetMix+0.04,1);
    mat.uniforms.uColor.value.lerp(new THREE.Color(0.8,0.4,1),0.06);
    gestureDebug.innerText="🌸 Flower";
    return;
  }

  if(f.every(v=>v)){ // ✋ open palm
    targetMode=0;
    targetMix=Math.max(targetMix-0.04,0);
    mat.uniforms.uColor.value.lerp(new THREE.Color(0.6,0.6,1),0.06);
    gestureDebug.innerText="✋ Space";
  }
});

// ================= START =================
document.getElementById("startBtn").onclick=async()=>{
  const stream=await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject=stream;
  await video.play();
  (async function loop(){
    await hands.send({image:video});
    requestAnimationFrame(loop);
  })();
};
