#version 300 es
precision highp float;
in vec2 vUv;
in vec4 vColor;
flat in int vKind;
uniform float uClock;
out vec4 outColor;
void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    vec3 color = vColor.rgb;
    float a;
    if (vKind == 0) {
        // Moving pressure pulses travel from the nozzle to the impact.
        float pulse = 0.68 + 0.20 * sin(vUv.x * 57.0 - uClock * 34.0)
            + 0.12 * sin(vUv.x * 173.0 - uClock * 56.0);
        a = pow(max(0.0, 1.0 - abs(p.y)), 2.0) * pulse;
    } else if (vKind == 1) {
        a = 1.0 - smoothstep(0.60, 1.0, r);
        float glint = exp(-dot(p - vec2(-0.26, 0.30), p - vec2(-0.26, 0.30)) * 29.0);
        color = mix(color, vec3(1.0), glint * 0.8);
    } else if (vKind == 2) {
        float edge = 1.0 - smoothstep(0.09, 0.27, abs(r - 0.74));
        a = edge * (0.59 + p.y * 0.35) + (1.0 - smoothstep(0.0, 0.75, r)) * 0.12;
        color = mix(color, vec3(1.0), max(0.0, p.y) * 0.65);
    } else if (vKind == 3) {
        vec2 d = abs(p);
        float rays = pow(d.x, .59) + pow(d.y, .59);
        a = 1.0 - smoothstep(0.40, 0.99, rays);
        color = mix(color, vec3(1.0), 1.0 - smoothstep(0.07, 0.43, r));
    } else if (vKind == 4) {
        a = (1.0 - smoothstep(0.035, 0.20, abs(r - 0.78)));
        a *= 0.76 + 0.24 * sin(atan(p.y, p.x) * 3.0 - uClock * 5.0);
    } else if (vKind == 6) {
        float outline = 1.0 - smoothstep(0.025, 0.12, abs(r - 0.68));
        float center = 1.0 - smoothstep(0.11, 0.22, r);
        a = max(outline * 0.56, center * 0.77);
    } else {
        a = pow(max(0.0, 1.0 - r * r), 2.25);
    }
    outColor = vec4(color, a * vColor.a);
}
