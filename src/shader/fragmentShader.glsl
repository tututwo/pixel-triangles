varying float vOpacity;
varying vec3 vColor;
float particleIntencity = 1.0;
// vec3 color1 = vec3(169.0 / 255.0, 12.0 / 255.0, 128.0 / 255.0);
void main() {
    vec2 centralizedUV = 2.0 * (gl_PointCoord - 0.5);
    float dist = length(centralizedUV);
    
    // Discard pixels outside the circle
    if (dist > 1.0) {
        discard;
    }
    
    vec4 gradient = vec4(0.01 / dist);
    gradient.rgb = min(gradient.rgb, vec3(60.0 * particleIntencity));
    gradient.rgb = gradient.rgb * vColor * particleIntencity;
    
    // Add alpha falloff towards edges
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    gl_FragColor = vec4(gradient.rgb, alpha * vOpacity / 1.0);
    // gl_FragColor = vec4(.5, .5, .5, 1.0);
}