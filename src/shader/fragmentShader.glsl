uniform sampler2D shapeTextures[4];
uniform float particleIntencity;

varying float vOpacity;
varying vec3 vColor;
varying float vRotation;
varying float vShapeIndex;

void main() {
    // Rotate UV coordinates
    vec2 rotatedUv = gl_PointCoord - 0.5;
    float rotation = vRotation;
    float cosR = cos(rotation);
    float sinR = sin(rotation);
    mat2 rotMat = mat2(cosR, -sinR, sinR, cosR);
    rotatedUv = rotMat * rotatedUv;
    rotatedUv += 0.5;

    // Sample the correct texture based on shape index
    vec4 texColor;
    int shapeIdx = int(vShapeIndex);
    
    // WebGL1 doesn't support dynamic indexing of texture arrays
    // We need to use if-else statements
    if(shapeIdx == 0) {
        texColor = texture2D(shapeTextures[0], rotatedUv);
    } else if(shapeIdx == 1) {
        texColor = texture2D(shapeTextures[1], rotatedUv);
    } else if(shapeIdx == 2) {
        texColor = texture2D(shapeTextures[2], rotatedUv);
    } else {
        texColor = texture2D(shapeTextures[3], rotatedUv);
    }

    // Discard transparent pixels
    if(texColor.a < 0.1) discard;

    // Apply color and intensity
    vec3 color = vColor * particleIntencity;
    gl_FragColor = vec4(color, texColor.a * vOpacity);
}