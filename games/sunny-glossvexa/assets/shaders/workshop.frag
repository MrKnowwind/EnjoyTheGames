#version 300 es
precision highp float;
precision highp sampler3D;
in vec3 vWorld;
in vec3 vLocal;
in vec3 vNormal;
in vec2 vUv;
in vec3 vTint;
flat in int vSurface;
uniform sampler2D uBase;
uniform sampler2D uDetail;
uniform sampler2D uPacked;
uniform sampler3D uDirt;
uniform vec3 uStain;
uniform vec3 uEye;
uniform vec3 uHit;
uniform float uWashable;
uniform float uLucky;
uniform float uSpray;
uniform float uGleam;
uniform float uTime;
uniform float uFlow;
out vec4 outColor;

const int VINYL = 8;

vec2 atlas(vec2 uv) {
    vec2 slot = vec2(float(vSurface % 4), float(vSurface / 4));
    return (slot + (fract(uv) * 480.0 + 16.0) / 512.0) / vec2(4.0, 2.0);
}

float hash(vec3 p) {
    vec3 q = fract(p * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}

vec3 illuminate(vec3 N, vec3 V, vec3 L, vec3 base, float rough, float metal, vec3 radiance) {
    vec3 H = normalize(V + L);
    float NL = max(dot(N, L), 0.0);
    float NV = max(dot(N, V), 0.001);
    float NH = max(dot(N, H), 0.0);
    float HV = max(dot(H, V), 0.0);
    float a = rough * rough;
    float a2 = a * a;
    float d = NH * NH * (a2 - 1.0) + 1.0;
    float distribution = a2 / max(3.14159 * d * d, 0.0002);
    float k = (rough + 1.0) * (rough + 1.0) / 8.0;
    float visibility = (NL / (NL * (1.0 - k) + k)) * (NV / (NV * (1.0 - k) + k));
    vec3 f0 = mix(vec3(0.04), base, metal);
    vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - HV, 5.0);
    vec3 spec = distribution * visibility * fresnel / max(4.0 * NL * NV, 0.001);
    vec3 diff = (1.0 - fresnel) * (1.0 - metal) * base / 3.14159;
    return (diff + min(spec, vec3(3.0))) * NL * radiance;
}

void main() {
    vec3 n0 = normalize(vNormal);
    vec3 V = normalize(uEye);
    vec2 du = dFdx(vUv), dv = dFdy(vUv);
    vec3 px = dFdx(vWorld), py = dFdy(vWorld);
    vec3 N = n0;
    vec3 base = pow(vTint, vec3(2.2));
    float rough = 0.32;
    float metal = 0.0;
    float ao = 1.0;
    float wetSheen = 0.0;
    // Smooth molded vinyl uses mesh normals and soft highlights.
    if (vSurface != VINYL) {
        vec3 tangent = px * dv.y - py * du.y;
        float handed = (du.x * dv.y - du.y * dv.x < 0.0) ? -1.0 : 1.0;
        tangent = tangent * handed - n0 * dot(tangent * handed, n0);
        if (dot(tangent, tangent) < 1e-14) {
            tangent = cross(n0, abs(n0.y) < 0.95 ? vec3(0,1,0) : vec3(1,0,0));
        }
        vec3 T = normalize(tangent);
        vec3 B = normalize(cross(n0, T));
        B *= dot(B, (py * du.x - px * dv.x) * handed) < 0.0 ? -1.0 : 1.0;
        vec2 atlasDx = du * (480.0 / 512.0) / vec2(4.0, 2.0);
        vec2 atlasDy = dv * (480.0 / 512.0) / vec2(4.0, 2.0);
        vec2 sampleUv = vUv;
        // Micro-relief parallax confined to material UVs. World picking keeps the true silhouette.
        vec4 detail = textureGrad(uDetail, atlas(sampleUv), atlasDx, atlasDy);
        if (vSurface <= 3) {
            sampleUv -= vec2(dot(V, T), dot(V, B)) * (detail.a - 0.48) * 0.013
                / max(abs(dot(V, n0)), 0.4);
            detail = textureGrad(uDetail, atlas(sampleUv), atlasDx, atlasDy);
        }
        vec3 mapN = normalize(detail.xyz * 2.0 - 1.0);
        N = normalize(n0 * mapN.z + T * mapN.x + B * mapN.y);
        vec3 mapColor = textureGrad(uBase, atlas(sampleUv), atlasDx, atlasDy).rgb;
        vec3 materialData = textureGrad(uPacked, atlas(sampleUv), atlasDx, atlasDy).rgb;
        base = pow(vTint * mapColor, vec3(2.2));
        rough = max(0.18, materialData.r);
        metal = materialData.g;
        ao = materialData.b;
        if (vSurface == 5 || vSurface == 6) {
            N = normalize(mix(n0, N, 0.46));
            base = mix(base, pow(vTint, vec3(2.2)), 0.34);
        }
    }

    if (uWashable > 0.5) {
        vec3 coord = (vLocal + vec3(2,0,2)) / 4.0;
        float mass = texture(uDirt, (coord * 63.0 + 0.5) / 64.0).r;
        float grain = hash(floor(vLocal * 145.0));
        float mud = smoothstep(0.008, 0.77, mass * (0.86 + 0.23 * grain));
        mud = max(mud, mass * 0.48);
        vec3 deposit = pow(uStain * (0.76 + 0.4 * grain), vec3(2.2));
        base = mix(base, deposit, mud * 0.97);
        rough = mix(rough, mix(0.84, 0.44, uLucky), mud);
        metal = mix(metal, uLucky * 0.68, mud);
        ao = mix(ao, 0.79 + grain * 0.18, mud);
        float wet = exp(-dot(vWorld - uHit, vWorld - uHit) * 5.0) * uSpray;
        wet *= 1.0 - mud;
        rough = max(0.16, rough - wet * 0.21 - (1.0 - mud) * uGleam * 0.11);
        vec3 halfVector = normalize(V + normalize(vec3(-0.45, 0.7, 0.62)));
        float trickle = smoothstep(0.80, 0.98, sin(vLocal.y * 59.0 + vLocal.x * 22.0 + uFlow * 8.0));
        wetSheen = wet * pow(max(dot(N, halfVector), 0.0), 6.0) * (0.15 + 0.27 * trickle);
    }

    vec3 light = illuminate(N, V, normalize(vec3(-0.6, 0.85, 0.48)), base, rough, metal,
        vec3(2.15, 1.98, 1.7));
    light += illuminate(N, V, normalize(vec3(0.48, 0.5, -0.68)), base, rough, metal,
        vec3(0.60, 0.92, 1.22));
    vec3 reflected = reflect(-V, N);
    float sky = smoothstep(-0.7, 0.95, reflected.y);
    float fill = 0.50 + 0.45 * max(0.0, N.y);
    light += base * fill * ao * (1.0 - metal * 0.6);
    light += mix(vec3(0.027, 0.043, 0.058), vec3(0.10, 0.15, 0.19), sky)
        * mix(vec3(0.27), max(base, vec3(0.13)), metal) * (0.9 - 0.55 * rough);
    light += vec3(0.16, 0.22, 0.27) * pow(1.0 - max(dot(n0, V), 0.0), 3.0)
        * (0.3 + uWashable * 0.22);
    if (uGleam > 0.0 && uWashable > 0.5) {
        float sweep = 1.0 - smoothstep(0.0, 0.22,
            abs(vLocal.y * 0.67 + vLocal.x * 0.38 - uTime));
        light += vec3(0.85, 0.96, 1.0) * sweep * uGleam * (0.22 + 0.50 * sky);
    }
    light += vec3(0.53, 0.87, 1.0) * wetSheen;
    vec3 color = pow(clamp(light, 0.0, 1.0), vec3(1.0 / 2.2));
    outColor = vec4(color, 1.0);
}

