#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec3 aTint;
layout(location = 4) in float aSurface;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vWorld;
out vec3 vLocal;
out vec3 vNormal;
out vec2 vUv;
out vec3 vTint;
flat out int vSurface;
void main() {
    vec4 p = uModel * vec4(aPosition, 1.0);
    vWorld = p.xyz;
    vLocal = aPosition;
    vNormal = normalize(mat3(uModel) * aNormal);
    vUv = aUv;
    vTint = aTint;
    vSurface = int(aSurface);
    gl_Position = uViewProj * p;
}
