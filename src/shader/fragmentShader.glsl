varying float vOpacity;
varying vec3 vColor;
varying float vRotation;
uniform sampler2D particleTexture;
uniform float particleIntencity;

// Optimized rotation function using precomputed sin/cos
vec2 rotate(vec2 uv, float rotation) {
	float s = sin(rotation);
	float c = cos(rotation);
	uv -= 0.5;
	return vec2(
		uv.x * c - uv.y * s + 0.5,
		uv.x * s + uv.y * c + 0.5
	);
}

void main() {
    vec2 uv = gl_PointCoord;
	// Rotate UV coordinates
	vec2 rotatedUV = rotate(uv , vRotation);
	
	// Sample texture with rotated coordinates
	vec4 texColor = texture2D(particleTexture, rotatedUV);
	
	// Apply color and opacity
	gl_FragColor = vec4(vColor * particleIntencity, texColor.a * vOpacity);
}