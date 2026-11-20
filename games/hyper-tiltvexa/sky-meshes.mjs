import { BOARD_RADIUS, HOLE_RADIUS, SLOTS } from "./round.mjs";

const TAU = 2 * Math.PI;

// Profiles and tessellation are from the Android SkyRenderer and SkyMeshes.
export function skyMeshes() {
  return {
    surface: deck(),
    platform: lathe([[0, -.61], [1.92, -.61], [2.84, -.53], [3.35, -.43], [3.67, -.27],
      [3.77, -.14], [3.75, -.022], [3.72, 0], [3.63, -.05], [3.53, -.43], [0, -.43]], 128),
    goldTrim: lathe([[3.56, -.33], [3.68, -.278], [3.712, -.242], [3.728, -.210], [3.699, -.210]], 128),
    turbine: lathe([[0, -.95], [1.30, -.95], [1.91, -.78], [2.08, -.61], [1.88, -.57], [0, -.57]]),
    runner: arcRail(3.73, .245),
    socket: lathe([[.30, -.46], [.45, -.41], [.54, -.24], [.53, -.13], [.49, -.10], [.36, -.13], [.30, -.43]], 40),
    basin: lathe([[.39, 0], [.391, -.022], [.34, -.198], [.285, -.36], [.19, -.42], [0, -.42]], 40),
    lip: lathe([[.474, -.004], [.457, .023], [.414, .037], [.387, .015], [.391, -.025]], 40),
    aura: lathe([[.59, .007], [.58, .024], [.553, .027], [.543, .008]], 40),
    bolt: lathe([[0, -.035], [.077, -.035], [.086, .011], [.065, .035], [0, .035]], 8),
    orb: sphere(36, 22),
    puff: sphere(16, 12),
    floatDeck: lathe([[0, -.89], [.37, -.71], [.74, -.41], [1, -.10], [.87, .09], [0, .09]], 12),
    floatGrass: lathe([[.86, -.052], [.99, -.076], [1.04, .015], [.91, .135], [0, .135]], 28),
    basket: lathe([[0, -.09], [.13, -.09], [.17, -.03], [.18, .09], [.128, .09], [.10, .002], [0, .002]], 12),
    rope: lathe([[.016, 0], [.016, .38]], 8),
  };
}

function quad(data, a, b, c, d) { data.push(...a, ...b, ...c, ...a, ...c, ...d); }

function lathe(profile, sides = 64) {
  return surfaceOfRevolution(profile, sides, 0, TAU, false);
}

function surfaceOfRevolution(profile, sides, start, arc, closedEnds) {
  const data = [];
  for (let row = 0; row < profile.length - 1; row++) {
    const [r1, y1] = profile[row];
    const [r2, y2] = profile[row + 1];
    const length = Math.hypot(y2 - y1, r2 - r1);
    const radial = (y2 - y1) / length;
    const up = (r1 - r2) / length;
    const point = (radius, y, segment, v) => {
      const u = segment / sides;
      const angle = start + arc * u;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [radius * c, y, radius * s, radial * c, up, radial * s, u, v];
    };
    const v = closedEnds ? 0 : row;
    for (let i = 0; i < sides; i++) {
      quad(data, point(r1, y1, i, v), point(r1, y1, i + 1, v), point(r2, y2, i + 1, v + 1), point(r2, y2, i, v + 1));
    }
  }
  if (closedEnds) {
    for (const sign of [-1, 1]) {
      const c = Math.cos(arc / 2);
      const s = Math.sin(sign * arc / 2);
      const cap = ([radius, y]) => [radius * c, y, radius * s, -s * sign, 0, c * sign, 0, 0];
      for (let i = 1; i < profile.length - 1; i++) data.push(...cap(profile[0]), ...cap(profile[i]), ...cap(profile[i + 1]));
    }
  }
  return new Float32Array(data);
}

function arcRail(radius, halfAngle) {
  return surfaceOfRevolution([[radius - .045, -.19], [radius + .06, -.11], [radius + .06, -.035],
    [radius + .023, .025], [radius - .066, .031], [radius - .105, -.025]], 22, -halfAngle, 2 * halfAngle, true);
}

function sphere(sides, rows) {
  const data = [];
  const point = (i, j) => {
    const u = i / sides;
    const v = j / rows;
    const latitude = (v - .5) * Math.PI;
    const x = Math.cos(TAU * u) * Math.cos(latitude);
    const y = Math.sin(latitude);
    const z = Math.sin(TAU * u) * Math.cos(latitude);
    return [x, y, z, x, y, z, u, v];
  };
  for (let i = 0; i < sides; i++) {
    for (let j = 0; j < rows; j++) quad(data, point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1));
  }
  return new Float32Array(data);
}

function deck() {
  const vertices = [];
  const inner = 2.68;
  const outer = BOARD_RADIUS;
  const wedge = TAU / SLOTS.length;
  const plane = (x, z) => [x, 0, z, 0, 1, 0, .5 + x / (2 * outer), .5 + z / (2 * outer)];
  const flat = (radius, angle) => plane(radius * Math.cos(angle), radius * Math.sin(angle));
  const slices = SLOTS.length * 16;
  for (let i = 0; i < slices; i++) {
    const a = i * TAU / slices + SLOTS[0].angle - wedge / 2;
    vertices.push(...plane(0, 0), ...flat(inner, a), ...flat(inner, a + TAU / slices));
  }
  for (const { x, z, angle } of SLOTS) {
    const start = angle - wedge / 2;
    const end = start + wedge;
    const border = [];
    for (let i = 0; i < 16; i++) border.push(flat(outer, start + wedge * i / 16));
    for (let i = 0; i < 8; i++) border.push(flat(outer + (inner - outer) * i / 8, end));
    for (let i = 0; i < 16; i++) border.push(flat(inner, end - wedge * i / 16));
    for (let i = 0; i < 8; i++) border.push(flat(inner + (outer - inner) * i / 8, start));
    const hole = ([px, , pz]) => {
      const dx = px - x;
      const dz = pz - z;
      const scale = HOLE_RADIUS / Math.hypot(dx, dz);
      return plane(x + dx * scale, z + dz * scale);
    };
    for (let i = 0; i < border.length; i++) {
      const a = border[i];
      const b = border[(i + 1) % border.length];
      quad(vertices, a, b, hole(b), hole(a));
    }
  }
  return new Float32Array(vertices);
}
