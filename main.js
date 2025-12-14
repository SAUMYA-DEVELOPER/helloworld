/* ================= DOM ================= */
const video=document.getElementById("video");
const canvas=document.getElementById("overlay");
const ctx=canvas.getContext("2d");
const debug=document.getElementById("gestureDebug");
const loveText=document.getElementById("loveText");

/* ================= THREE ================= */
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x020416);

const camera3D=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,300);
camera3D.position.z=18;

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

/* ================= PARTICLES ================= */
const COUNT=60000;
const geo=new THREE.BufferGeometry();

const base=new Float32Array(COUNT*3);
const heart=new Float32Array(COUNT*3);
const saturn=new Float32Array(COUNT*3);
const cube=new Float32Array(COUNT*3);
const core=new Float32Array(COUNT);

for(let i=0;i<COUNT;i++){
  const i3=i*3;
  base[i3]=(Math.random()-0.5)*30;
  base[i3+1]=(Math.random()-0.5)*30;
  base[i3+2]=(Math.random()-0.5)*30;

  let t=Math.random()*Math.PI*2,s=1.1;
  heart[i3]=16*Math.sin(t)**3*s*0.25;
  heart[i3+1]=(13*Math.cos(t)-5*Math.cos(2*t))*s*0.25;
  heart[i3+2]=(Math.random()-0.5)*2;

  let a=Math.random()*Math.PI*2,r=5+Math.random()*2;
  saturn[i3]=Math.cos(a)*r;
  saturn[i3+1]=(Math.random()-0.5)*0.6;
  saturn[i3+2]=Math.sin(a)*r;

  cube[i3]=(Math.floor(Math.random()*5)-2)*2;
  cube[i3+1]=(Math.floor(Math.random()*5)-2)*2;
  cube[i3+2]=(Math.floor(Math.random()*5)-2)*2;

  core[i]=Math.random()<0.35?1:0;
}

geo.setAttribute("position",new THREE.BufferAttribute(base,3));
geo.setAttribute("heart",new THREE.BufferAttribute(heart,3));
geo.setAttribute("saturn",new THREE.BufferAttribute(saturn,3));
geo.setAttribute("cube",new THREE.BufferAttribute(cube,3));
geo.setAttribute("aCore",new THREE.BufferAttribute(core,1));

/* ================= SHADER ================= */
const mat=new THREE.ShaderMaterial({
  transparent:true,
  blending:THREE.AdditiveBlending,
  uniforms:{
    uTime:{value:0},
    uMode:{value:0},
    uMix:{value:0},
    uHand:{value:new THREE.Vector3()},
    uColor:{value:new THREE.Color(1,1,1)},
    uZoom:{value:18}
  },
  vertexShader:`
    uniform float uTime,uMode,uMix,uZoom;
    uniform vec3 uHand;
    attribute vec3 heart,saturn,cube;
    attribute float aCore;
    void main(){
      vec3 pos=position;
      pos += (uHand-pos)*aCore*0.35;

      vec3 target=heart;
      if(uMode>1.5) target=saturn;
      if(uMode>2.5) target=cube;

      pos=mix(pos,target,uMix);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
      gl_PointSize=mix(1.5,3.5,aCore);
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

/* ================= STATE ================= */
let targetMode=0,targetMix=0;
let handPos=new THREE.Vector3();
let lastX=null;

/* ================= MEDIAPIPE ================= */
const hands=new Hands({
  locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});
hands.setOptions({maxNumHands:2,modelComplexity:0});

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
  lm.forEach(p=>{
    ctx.fillStyle="#00ffff";
    ctx.beginPath();
    ctx.arc(p.x*canvas.width,p.y*canvas.height,3,0,Math.PI*2);
    ctx.fill();
  });

  // hand follow
  handPos.set((lm[9].x-0.5)*30,(-lm[9].y+0.5)*30,0);
  mat.uniforms.uHand.value.copy(handPos);

  // pinch zoom
  const pinch=Math.hypot(lm[4].x-lm[8].x,lm[4].y-lm[8].y);
  camera3D.position.z+=((pinch<0.05?10:18)-camera3D.position.z)*0.05;

  // swipe
  if(lastX!==null){
    if(lm[9].x-lastX>0.08) targetMode=(targetMode+1)%3;
    if(lm[9].x-lastX<-0.08) targetMode=(targetMode+2)%3;
  }
  lastX=lm[9].x;

  targetMix=Math.min(targetMix+0.04,1);
  debug.innerText=["Heart","Saturn","Cube"][targetMode];
});

/* ================= START ================= */
document.getElementById("startBtn").onclick=async()=>{
  const s=await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject=s;await video.play();
  (async function loop(){
    await hands.send({image:video});
    requestAnimationFrame(loop);
  })();
};

/* ================= ANIMATE ================= */
function animate(){
  requestAnimationFrame(animate);
  mat.uniforms.uTime.value+=0.01;
  mat.uniforms.uMix.value+=(targetMix-mat.uniforms.uMix.value)*0.06;
  mat.uniforms.uMode.value+=(targetMode-mat.uniforms.uMode.value)*0.08;

  scene.rotation.y+=0.002;
  renderer.render(scene,camera3D);
}
animate();

addEventListener("resize",()=>{
  camera3D.aspect=innerWidth/innerHeight;
  camera3D.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
