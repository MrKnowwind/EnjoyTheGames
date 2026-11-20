import { BALL_RADIUS, BLUE, GOLD, LUCKY, SLOTS } from "./round.mjs";
import { skyMeshes } from "./sky-meshes.mjs";
import { PARTICLE_LIMIT, PARTICLE_STRIDE } from "./sky-effects.mjs";

const EYE_Y = 10.7;
const EYE_Z = 9.35;
const EYE_DISTANCE = Math.hypot(EYE_Y, EYE_Z);
const viewMatrix = new Float32Array([
  1, 0, 0, 0, 0, EYE_Z / EYE_DISTANCE, EYE_Y / EYE_DISTANCE, 0,
  0, -EYE_Y / EYE_DISTANCE, EYE_Z / EYE_DISTANCE, 0, 0, 0, -EYE_DISTANCE, 1,
]);
const clouds = [
  [-3.4, -2.7, -10.7, 1.5, .3], [3.2, -3.6, -10.1, 1.9, 1.2],
  [-4.1, -3.6, -5.1, 1.25, .8], [4.2, -2.9, -4.8, 1.32, 2.1],
  [-3.7, -3.4, 1.8, 1.43, 6.2], [3.4, -3.3, 3.7, 1.8, 3.9],
  [-2.6, -3.7, 8.9, 2.2, 3.6], [3.8, -3.8, 10.3, 2.14, 5.3],
  [.2, -4.6, -14.5, 1.8, 3.6], [-.4, -4, 14, 1.9, 2],
];
const cloudPuffs = [
  [-.58, -.08, 0, .66, .44, .70], [.47, -.05, .03, .86, .48, .64],
  [-.12, .18, -.12, .69, .61, .60], [.36, .32, -.03, .54, .67, .54],
  [-.03, -.03, .26, 1.08, .38, .56],
];
const programNames = ["scene", "sky", "fx"];
const textures = { uBase: "deck_color", uNormal: "deck_normal", uOrm: "deck_orm", uHeight: "deck_height" };

export class SkyView {
  static async create(canvas) {
    const gl = canvas.getContext("webgl2", { alpha: false });
    if (!gl) return null;
    const [sources, materials] = await Promise.all([
      Promise.all(programNames.map(async (name) => Promise.all(["vert", "frag"].map(async (stage) => {
        const path = `./shaders/${name}.${stage}`;
        const response = await fetch(path);
        if (!response.ok) throw new Error(`${path}: ${response.status}`);
        return response.text();
      })))),
      Promise.all(Object.values(textures).map(async (name) => {
        const image = new Image();
        image.src = `./art/${name}.png`;
        await image.decode();
        return image;
      })),
    ]);
    return new SkyView(canvas, gl, sources, materials);
  }

  constructor(canvas, gl, sources, materials) {
    this.canvas = canvas;
    this.gl = gl;
    this.sources = sources;
    this.materials = materials;
    this.geometry = skyMeshes();
    this.model = new Float32Array(16);
    this.board = new Float32Array(16);
    this.pv = new Float32Array(16);
    this.pvb = new Float32Array(16);
    this.normal = new Float32Array(9);
    this.setup();
    canvas.addEventListener("webglcontextlost", (event) => event.preventDefault());
    canvas.addEventListener("webglcontextrestored", () => {
      this.setup();
      this.resize();
      if (this.lastFrame) this.draw(...this.lastFrame);
    });
  }

  setup() {
    const gl = this.gl;
    gl.clearColor(.2, .62, .93, 1);
    [this.scene, this.sky, this.fx] = this.sources.map(([vert, frag], i) => program(gl, programNames[i], vert, frag));
    this.meshes = Object.fromEntries(Object.entries(this.geometry).map(([name, data]) => [name, {
      ...vertexArray(gl, [3, 3, 2], data, gl.STATIC_DRAW), count: data.length / 8,
    }]));
    this.particles = vertexArray(gl, [3, 4, 3], PARTICLE_LIMIT * PARTICLE_STRIDE * 4, gl.STREAM_DRAW);
    gl.useProgram(this.scene.id);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    Object.keys(textures).forEach((sampler, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.materials[unit]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(this.scene.uniform(sampler), unit);
    });
    gl.uniform3f(this.scene.uniform("uEye"), 0, EYE_Y, EYE_Z);
  }

  resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(this.canvas.clientWidth * ratio);
    const height = Math.round(this.canvas.clientHeight * ratio);
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    if (!width || !height) return;
    this.gl.viewport(0, 0, width, height);
    this.aspect = width / height;
    const halfWidth = Math.max(4.19, this.aspect * 5.1);
    this.density = width / (2 * halfWidth * 44);
    const projection = new Float32Array([
      1 / halfWidth, 0, 0, 0, 0, this.aspect / halfWidth, 0, 0,
      0, 0, -2 / 63, 0, 0, .055, -65 / 63, 1,
    ]);
    multiply(this.pv, projection, viewMatrix);
  }

  draw(time, screen, round, particles) {
    const gl = this.gl;
    this.lastFrame = [time, screen, round, particles];
    if (!this.canvas.width || !this.canvas.height || !this.aspect || gl.isContextLost()) return;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.sky.id);
    gl.bindVertexArray(null);
    gl.uniform1f(this.sky.uniform("uTime"), time);
    gl.uniform1f(this.sky.uniform("uAspect"), this.aspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (screen === "loading") return;

    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(this.scene.id);
    gl.uniformMatrix4fv(this.scene.uniform("uPV"), false, this.pv);
    gl.uniform1f(this.scene.uniform("uTime"), time);
    this.scenery(time);
    this.drawBoard(time, round, screen === "home" || screen === "help");
    if (particles.length) this.drawParticles(particles);
  }

  scenery(time) {
    for (const [x, y, z, size, phase] of clouds) {
      const drift = Math.sin(time * .19 + phase) * .45;
      for (const [dx, dy, dz, sx, sy, sz] of cloudPuffs) {
        this.place(x + drift + size * dx, y + size * dy, z + size * dz);
        scale(this.model, size * sx, size * sy, size * sz);
        this.mesh("puff", 0xf2faff, .93, 0, .12);
      }
    }
    this.island(-3.05, -2.1, -5.6, .85, time, 0xffaa54);
    this.island(3.53, -2.3, -6.4, 1.08, time + 1.3, 0xf282b0);
    this.island(3.57, -2.77, 5.9, .82, time + 4, 0xffbf58);
    this.balloon(-2.65, .1, -7.6, time, 0xea6996);
    this.balloon(2.99, .28, -8.5, time + 2.2, 0x369fee);
    this.balloon(-3.05, -1.4, 6.45, time + 3.4, 0xfcb255);
  }

  island(x, y, z, size, time, roof) {
    const lift = Math.sin(time * .7) * .13;
    this.place(x, y + lift, z);
    scale(this.model, size, size, size);
    this.mesh("floatDeck", 0xb783ae, .78);
    this.mesh("floatGrass", 0x60c5a6, .82);
    this.place(x - size * .1, y + lift + .47 * size, z);
    scale(this.model, .33 * size, .53 * size, .33 * size);
    this.mesh("puff", 0xfdf1d2, .70);
    this.place(x - size * .1, y + lift + .82 * size, z);
    scale(this.model, .47 * size, .24 * size, .47 * size);
    this.mesh("puff", roof, .37);
    this.place(x + .46 * size, y + lift + .28 * size, z - .29);
    scale(this.model, .23 * size, .42 * size, .22 * size);
    this.mesh("puff", 0x32b292, .77);
  }

  balloon(x, y, z, time, color) {
    const a = x + .24 * Math.sin(time * .37);
    const b = y + .23 * Math.sin(time * .63);
    this.place(a, b, z);
    scale(this.model, .43, .55, .42);
    this.mesh("orb", color, .39, 0, 0, 4);
    this.place(a, b - .67, z);
    this.mesh("basket", 0xc59059, .63);
    for (const side of [-1, 1]) {
      this.place(a + .113 * side, b - .59, z);
      rotate(this.model, 0, 4, -side * 8 * Math.PI / 180);
      this.mesh("rope", 0xf1ce99, .75);
    }
  }

  drawBoard(time, round, showcase) {
    const tiltX = showcase ? .10 * Math.sin(time * .92) : round.tiltX;
    const tiltZ = showcase ? .06 * Math.cos(time * .8) : round.tiltZ;
    const golden = round.golden;
    const pulse = .5 + .5 * Math.sin(time * 7);
    identity(this.board);
    rotate(this.board, 0, 4, -tiltX);
    rotate(this.board, 4, 8, tiltZ);
    this.boardPlace();
    this.mesh("platform", 0x11559b, .40, .51);
    this.mesh("turbine", 0x16457c, .34, .64, 0, 4);
    this.mesh("goldTrim", golden ? 0xffd441 : 0xfcaf4d, .27, .63, golden ? .50 + .45 * pulse : .07, 5);
    this.mesh("surface", 0xffffff, .44, 0, 0, 1);

    for (const [index, { angle, x, z }] of SLOTS.entries()) {
      this.boardPlace();
      rotate(this.model, 0, 8, angle + Math.PI / 8);
      const rail = golden ? 0xffb724 : index % 2 === 0 ? 0x41d7f0 : 0x4fbbe8;
      this.mesh("runner", rail, .25, .42, golden ? .62 : .07, 5);
      const active = showcase ? index === 1 || index === 5 : round.targets.has(index);
      this.boardPlace(x, 0, z);
      this.mesh("socket", 0x153972, .45, .40);
      this.mesh("basin", active ? golden ? 0xbc6d12 : 0x007195 : 0x0c2046, .49, .34, active ? .27 : 0);
      const ring = golden ? 0xffda4b : 0x50f0ff;
      this.mesh("lip", active ? ring : 0x4a80ad, .25, .40, active ? .44 + .47 * pulse : 0, 5);
      if (active && golden) this.mesh("aura", 0xffb834, .28, .24, .7 + .38 * pulse, 5);
      if (active && round.magnetLeft > 0) {
        scale(this.model, 1.24, 1, 1.24);
        this.mesh("aura", 0x9f88ff, .32, .18, .45 + .63 * pulse, 5);
      }
      this.boardPlace(Math.cos(angle) * 2.60, 0, Math.sin(angle) * 2.60);
      this.mesh("bolt", active ? ring : 0x83bce0, .24, .50, active ? .65 : 0);
    }
    if (showcase) {
      const angle = time * 1.1;
      this.marble({ x: .65 * Math.cos(angle), y: BALL_RADIUS, z: .65 * Math.sin(angle),
        kind: BLUE, rotation: [0, Math.sin(angle), 0, Math.cos(angle)] }, false);
      this.marble({ x: 1.1 * Math.cos(-angle - 1.5), y: BALL_RADIUS, z: 1.1 * Math.sin(-angle - 1.5),
        kind: GOLD, rotation: [Math.sin(angle), 0, 0, Math.cos(angle)] }, false);
    } else {
      for (const ball of round.balls) this.marble(ball, golden);
    }
  }

  marble(ball, golden) {
    if (!ball.falling) {
      this.boardPlace(ball.x - .028, .005, ball.z + .019);
      scale(this.model, .238, .006, .186);
      this.mesh("puff", 0x165785, .90);
    }
    this.boardPlace(ball.x, ball.y, ball.z);
    rotateQuaternion(this.model, ball.rotation);
    scale(this.model, BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    const gold = ball.kind === GOLD;
    this.mesh("orb", ball.kind.rgb, gold ? .24 : .28, gold ? .73 : .22, golden ? .24 : .06, ball.kind === LUCKY ? 3 : 2);
  }

  place(x, y, z) {
    identity(this.model);
    this.model[12] = x;
    this.model[13] = y;
    this.model[14] = z;
  }

  boardPlace(x = 0, y = 0, z = 0) {
    this.model.set(this.board);
    for (let row = 0; row < 3; row++) this.model[12 + row] += x * this.board[row] + y * this.board[4 + row] + z * this.board[8 + row];
  }

  mesh(name, color, roughness, metal = 0, glow = 0, style = 0) {
    const gl = this.gl;
    const u = this.scene.uniform;
    for (let column = 0; column < 3; column++) {
      const i = column * 4;
      const length = this.model[i] ** 2 + this.model[i + 1] ** 2 + this.model[i + 2] ** 2;
      for (let row = 0; row < 3; row++) this.normal[column * 3 + row] = this.model[i + row] / length;
    }
    gl.uniformMatrix4fv(u("uWorld"), false, this.model);
    gl.uniformMatrix3fv(u("uNormalMatrix"), false, this.normal);
    gl.uniform3f(u("uColor"), (color >> 16 & 255) / 255, (color >> 8 & 255) / 255, (color & 255) / 255);
    gl.uniform1f(u("uRoughness"), roughness);
    gl.uniform1f(u("uMetal"), metal);
    gl.uniform1f(u("uGlow"), glow);
    gl.uniform1i(u("uStyle"), style);
    gl.bindVertexArray(this.meshes[name].vao);
    gl.drawArrays(gl.TRIANGLES, 0, this.meshes[name].count);
  }

  drawParticles(data) {
    const gl = this.gl;
    multiply(this.pvb, this.pv, this.board);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(this.fx.id);
    gl.uniformMatrix4fv(this.fx.uniform("uPVB"), false, this.pvb);
    gl.uniform1f(this.fx.uniform("uDensity"), this.density);
    gl.bindVertexArray(this.particles.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particles.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    gl.drawArrays(gl.POINTS, 0, data.length / PARTICLE_STRIDE);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
}

function identity(matrix) {
  matrix.fill(0);
  matrix[0] = matrix[5] = matrix[10] = matrix[15] = 1;
}

function scale(matrix, x, y, z) {
  for (let row = 0; row < 3; row++) {
    matrix[row] *= x;
    matrix[row + 4] *= y;
    matrix[row + 8] *= z;
  }
}

function rotate(matrix, a, b, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (let row = 0; row < 3; row++) {
    const x = matrix[a + row];
    const y = matrix[b + row];
    matrix[a + row] = x * c + y * s;
    matrix[b + row] = y * c - x * s;
  }
}

function rotateQuaternion(matrix, [x, y, z, w]) {
  const xx = x * x, yy = y * y, zz = z * z;
  for (let row = 0; row < 3; row++) {
    const a = matrix[row], b = matrix[row + 4], c = matrix[row + 8];
    matrix[row] = a * (1 - 2 * (yy + zz)) + b * 2 * (x * y + w * z) + c * 2 * (x * z - w * y);
    matrix[row + 4] = a * 2 * (x * y - w * z) + b * (1 - 2 * (xx + zz)) + c * 2 * (y * z + w * x);
    matrix[row + 8] = a * 2 * (x * z + w * y) + b * 2 * (y * z - w * x) + c * (1 - 2 * (xx + yy));
  }
}

function multiply(out, left, right) {
  for (let i = 0; i < 16; i += 4) {
    for (let row = 0; row < 4; row++) {
      out[i + row] = left[row] * right[i] + left[row + 4] * right[i + 1] + left[row + 8] * right[i + 2] + left[row + 12] * right[i + 3];
    }
  }
}

function vertexArray(gl, sizes, data, usage) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  const stride = sizes.reduce((total, size) => total + size, 0) * 4;
  let offset = 0;
  sizes.forEach((size, index) => {
    gl.enableVertexAttribArray(index);
    gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset);
    offset += size * 4;
  });
  gl.bindVertexArray(null);
  return { vao, buffer };
}

function program(gl, name, vertex, fragment) {
  const id = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(shader)}`);
    gl.attachShader(id, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(id);
  if (!gl.getProgramParameter(id, gl.LINK_STATUS)) throw new Error(`${name}: ${gl.getProgramInfoLog(id)}`);
  const uniforms = new Map();
  return { id, uniform(name) {
    if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(id, name));
    return uniforms.get(name);
  } };
}
