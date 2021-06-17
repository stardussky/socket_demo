#define PI 3.1415926

uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;
varying vec2 vSpacingCoordinate;

void main(){
  vec2 uv = vUv;

  float s = 0.3;

  vec4 final = vec4(0.);
  
  float loop = 3.;
  for(float i = 0.; i < loop; i++){
    float t = mod(uTime * s + i / loop, 1.);
    float c = smoothstep(t, t - 0.1, length(vSpacingCoordinate));
    vec4 bloom = mix(vec4(0.), vec4(1.), c);
    bloom.a *= 1. - t;
    final += bloom;
  }

  gl_FragColor = final;
}