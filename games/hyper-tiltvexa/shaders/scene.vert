#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
uniform mat4 uWorld, uPV;
uniform mat3 uNormalMatrix;
out vec3 vWorld, vNormal;
out vec2 vUV;
void main() {
    vec4 p = uWorld * vec4(aPosition, 1.0);
    vWorld = p.xyz;
    vNormal = uNormalMatrix * aNormal;
    vUV = aUV;
    gl_Position = uPV * p;
}
