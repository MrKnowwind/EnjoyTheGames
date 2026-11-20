#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec4 aColor;
layout(location=2) in vec3 aData;
uniform mat4 uPVB;
uniform float uDensity;
out vec4 vColor;
out float vStyle, vAngle;
void main() {
    gl_Position = uPVB * vec4(aPosition,1.0);
    gl_PointSize = max(1.0, aData.x * uDensity);
    vColor = aColor;
    vStyle = aData.y;
    vAngle = aData.z;
}
