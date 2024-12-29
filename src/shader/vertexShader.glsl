attribute float opacity;
attribute vec3 particleColor;
varying float vOpacity;
varying vec3 vColor;

void main() {
  vOpacity = opacity;
  vColor = particleColor;
  gl_PointSize = 20.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}