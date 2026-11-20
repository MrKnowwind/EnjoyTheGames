#version 300 es
precision mediump float;
in vec2 vUV;
uniform float uTime;
uniform float uAspect;
out vec4 frag;

void main() {
    vec2 p = vUV;
    vec3 air = mix(vec3(.66,.87,.98), vec3(.20,.62,.93), smoothstep(.0,1.0,p.y));
    vec2 sun = (p - vec2(.17,.78)) * vec2(uAspect,1.0);
    float glow = exp(-13.0 * dot(sun,sun));
    air = mix(air,vec3(1.0,.96,.78),glow*.55);
    float haze = sin(p.x*8.0 + p.y*19.0 + uTime*.07)
        + .55*sin(p.x*18.0 - p.y*21.0);
    air = mix(air,vec3(.88,.97,1),.18*smoothstep(.62,1.4,haze)*(1.0-p.y));
    frag = vec4(air,1.0);
}
