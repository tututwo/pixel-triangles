attribute float opacity;
attribute vec3 particleColor;
attribute vec3 targetPosition;
attribute vec3 targetColor;
attribute float rotation;
attribute float speed;
attribute float size;
attribute float shapeIndex;

uniform float particleSize;
uniform float time;
uniform float uProgress;

varying float vOpacity;
varying vec3 vColor;
varying float vRotation;
varying float vShapeIndex;

void main() {
    vOpacity = opacity;
    // Interpolate color based on progress
    vColor = mix(particleColor, targetColor, uProgress);
    vRotation = rotation;
    vShapeIndex = shapeIndex;
    
    // Smooth transition between positions
    float duration = 0.4;
    float delay = (1.0 - duration) * opacity; // Use opacity as noise
    float end = delay + duration;
    float progress = smoothstep(delay, end, uProgress);
    
    // Mix between current and target position
    vec3 morphedPosition = mix(position, targetPosition, progress);
    
    // Add depth if enabled
    vec4 modelPosition = modelMatrix * vec4(morphedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    
    // Point size with depth attenuation and individual size variation
    gl_PointSize = size * particleSize * (1.0 / -viewPosition.z);
}