#version 300 es
precision mediump float;
in vec4 vColor;
in float vStyle, vAngle;
out vec4 frag;
void main() {
    vec2 q = gl_PointCoord*2.0-1.0;
    q = mat2(cos(vAngle),sin(vAngle),-sin(vAngle),cos(vAngle))*q;
    float r = length(q);
    float halo = pow(max(1.0 - r, 0.0),2.1);
    float core = 1.0-smoothstep(.06,.58,r);
    if (vStyle > .5 && vStyle < 1.5) {
        core = (1.0-smoothstep(.04,.19,abs(q.x))) * (1.0-smoothstep(.15,.99,abs(q.y)));
        core += (1.0-smoothstep(.04,.19,abs(q.y))) * (1.0-smoothstep(.15,.99,abs(q.x)));
    } else if (vStyle > 2.5) {
        halo = 1.0 - smoothstep(.02,.21,abs(r-.77));
        core = 1.0 - smoothstep(.012,.075,abs(r-.77));
    } else if (vStyle > 1.5) {
        core = 1.0-smoothstep(.33,.68,abs(q.x)+abs(q.y)*.71);
    }
    frag = vec4(mix(vColor.rgb,vec3(1),.55*min(1.0,core)), vColor.a*(.53*halo+.84*core));
}
