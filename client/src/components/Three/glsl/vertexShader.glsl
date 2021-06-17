varying vec2 vUv;
varying vec3 vPosition;
varying vec2 vSpacingCoordinate;

void main(){
      vec3 pos = position.xyz;

      float rotation = 0.;
      vec2 rotatedPosition = vec2(
        cos(rotation) * pos.x - sin(rotation) * pos.y,
        sin(rotation) * pos.x + cos(rotation) * pos.y
      );

      vec4 modelPosition = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vec4 modelViewPosition = viewMatrix * modelPosition;
      modelViewPosition.xy += rotatedPosition;
      vec4 projectionPosition = projectionMatrix * modelViewPosition;

      gl_Position = projectionPosition;

      vUv = uv;
      vSpacingCoordinate = vec2(
        cos(rotation) * normal.x - sin(rotation) * normal.y,
        sin(rotation) * normal.x + cos(rotation) * normal.y
      );
}