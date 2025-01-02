attribute float opacity;
attribute vec3 particleColor;
attribute float rotation;
attribute float speed;
attribute float particleSize;

uniform float time;

varying float vOpacity;
varying vec3 vColor;
varying float vRotation;

void main() {
    vOpacity = opacity;
    vColor = particleColor;
    vRotation = rotation;
    
    // Calculate size attenuation based on distance
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = particleSize * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}