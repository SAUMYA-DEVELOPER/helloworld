export function initHands(video, onResults){
  const load = src => new Promise(r=>{
    const s=document.createElement('script');
    s.src=src; s.onload=r; document.head.appendChild(s);
  });

  (async()=>{
    await load('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.min.js');
    await load('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.min.js');

    const hands = new window.Hands({
      locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
    });

    hands.setOptions({maxNumHands:2});
    hands.onResults(onResults);

    const cam = new window.Camera(video,{
      onFrame:async()=>hands.send({image:video}),
      width:640,height:480
    });
    cam.start();
  })();
}
