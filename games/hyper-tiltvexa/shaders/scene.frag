#version 300 es
precision highp float;
in vec3 vWorld, vNormal;
in vec2 vUV;
uniform vec3 uEye, uColor;
uniform float uMetal, uRoughness, uGlow, uTime;
uniform int uStyle;
uniform sampler2D uBase, uNormal, uOrm, uHeight;
out vec4 frag;

void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(uEye - vWorld);
    vec3 l = normalize(vec3(-.52, .82, .34));
    vec3 base = uColor;
    float metallic = uMetal;
    float roughness = uRoughness;
    float ao = 1.0;
    if (uStyle == 1) {
        vec3 p1 = dFdx(vWorld), p2 = dFdy(vWorld);
        vec2 t1 = dFdx(vUV), t2 = dFdy(vUV);
        float signUV = sign(t1.x * t2.y - t1.y * t2.x);
        vec3 T = normalize((p1 * t2.y - p2 * t1.y) * signUV);
        vec3 B = normalize((-p1 * t2.x + p2 * t1.x) * signUV);
        mat3 frame = mat3(T, B, n);
        float height = texture(uHeight, vUV).r - .5;
        vec2 parallax = vec2(dot(v, T), dot(v, B)) * height * .009
                        / max(.42, dot(v, n));
        vec2 uv = vUV - parallax;
        vec3 orm = texture(uOrm, uv).rgb;
        base *= pow(texture(uBase, uv).rgb, vec3(2.2));
        n = normalize(frame * (texture(uNormal, uv).rgb * 2.0 - 1.0));
        ao = orm.r;
        roughness = orm.g;
        metallic = orm.b;
    } else if (uStyle == 2 || uStyle == 3) {
        float swirl = vUV.y + .28 * sin(6.2831853 * vUV.x) + .06 * sin(18.84956 * vUV.x);
        float ribbon = smoothstep(.67, .82, cos(24.0 * swirl));
        float filament = smoothstep(.91, .98, sin(35.0 * swirl + 12.5664 * vUV.x));
        vec3 highlight = uStyle == 3
            ? .49 + .42 * cos(6.2831853 * (vUV.y + vec3(.05, .33, .57)))
            : mix(base, vec3(.76, .94, 1.0), .67);
        base = mix(base, highlight, .60 * ribbon + .18 * filament);
    } else if (uStyle == 4) {
        float thread = .5 + .5 * sin(6.2831853 * 16.0 * vUV.x);
        base *= .89 + .11 * smoothstep(.13, .28, thread);
    } else if (uStyle == 5) {
        float phase = .5 + .5 * sin(6.2831853 * (vUV.x * 3.0 - uTime * .45));
        base *= .78 + .48 * pow(phase, 6.0);
    }

    vec3 h = normalize(l + v);
    float nv = max(dot(n, v), .001);
    float nl = max(dot(n, l), 0.0);
    float nh = max(dot(n, h), 0.0);
    float vh = max(dot(v, h), 0.0);
    vec3 f0 = mix(vec3(.045), base, metallic);
    vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - vh, 5.0);
    float a = max(.045, roughness * roughness);
    float a2 = a * a;
    float q = nh * nh * (a2 - 1.0) + 1.0;
    float distribution = a2 / max(.00015, 3.14159 * q * q);
    float k = (roughness + 1.0) * (roughness + 1.0) * .125;
    float visibility = .25 / ((nv * (1.0-k) + k) * (nl * (1.0-k) + k));
    vec3 specular = distribution * visibility * fresnel;
    vec3 r = reflect(-v, n);
    float sky = .60 + .40 * r.y;
    float softbox = pow(max(0.0, dot(r, normalize(vec3(.5,.84,.16)))), mix(44.0, 5.0, roughness));
    vec3 ambient = base * (.23 + .22 * max(n.y,0.0));
    ambient += f0 * vec3(.33,.55,.79) * sky + softbox * mix(vec3(.27), f0 * 2.0, metallic);
    vec3 color = ambient * ao + 2.4 * nl * ((1.0 - metallic) * base * .28 + specular);
    color += base * uGlow + pow(1.0 - nv, 3.0) * vec3(.028,.074,.11);
    frag = vec4(pow(clamp(color, 0.0, 1.0), vec3(1.0/2.2)), 1.0);
}
