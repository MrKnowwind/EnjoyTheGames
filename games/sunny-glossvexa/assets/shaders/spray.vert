#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec4 aColor;
layout(location = 3) in float aKind;
uniform mat4 uViewProj;
out vec2 vUv;
out vec4 vColor;
flat out int vKind;
void main() {
    vUv = aUv;
    vColor = aColor;
    vKind = int(aKind);
    gl_Position = uViewProj * vec4(aPosition, 1.0);
}
