export const vertexShader = `
uniform float uTime;
attribute float aScale;
void main(){
  vec3 p = position;
  p.xy += sin(uTime + position.z) * 0.2;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
  gl_PointSize = aScale * 3.0;
}
`;

export const fragmentShader = `
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5,0.0,d);
  gl_FragColor = vec4(0.6,0.8,1.0,a);
}
`;
