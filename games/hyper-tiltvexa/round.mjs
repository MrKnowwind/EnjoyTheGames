const SLOT_COUNT = 8;

export const BOARD_RADIUS = 3.75;
export const BALL_RADIUS = .205;
export const HOLE_RADIUS = .39;
export const GOLDEN_RADIUS = .58;
export const ROUND_SECONDS = 75;
export const INACTIVE_POINTS = 10;
export const TIME_BONUS = 5;
export const STEP = 1 / 120;
export const SLOTS = Array.from({ length: SLOT_COUNT }, (_, index) => {
  const angle = (index / SLOT_COUNT - .25) * 2 * Math.PI;
  return { angle, x: Math.cos(angle) * 3.22, z: Math.sin(angle) * 3.22 };
});

const marble = (color, coins, time = 0) => ({ color, rgb: Number.parseInt(color.slice(1), 16), coins, time });
export const BLUE = marble("#258dea", 10);
const STANDARD = [BLUE, marble("#ed438b", 10), marble("#26cbaa", 10)];
export const GOLD = marble("#ffb629", 25);
export const LUCKY = marble("#a655f1", 35);
const TIME = marble("#41e4f4", 12, TIME_BONUS);

export const POWER_UPS = {
  time: { cost: 40, seconds: 6 },
  magnet: { cost: 30, seconds: 10 },
};

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
const makeBall = (kind, x = 0, z = 0) => ({
  kind, x, z, vx: 0, vz: 0, y: BALL_RADIUS, vy: 0, falling: false, rotation: [0, 0, 0, 1],
});

function roll(ball, dx, dz) {
  const travel = Math.hypot(dx, dz);
  if (travel < .00001) return;
  const halfAngle = travel / (2 * BALL_RADIUS);
  const sine = Math.sin(halfAngle) / travel;
  const rx = dz * sine;
  const rz = -dx * sine;
  const rw = Math.cos(halfAngle);
  const q = ball.rotation;
  const x = rw * q[0] + rx * q[3] - rz * q[1];
  const y = rw * q[1] + rz * q[0] - rx * q[2];
  const z = rw * q[2] + rz * q[3] + rx * q[1];
  const w = rw * q[3] - rx * q[0] - rz * q[2];
  const norm = Math.hypot(x, y, z, w);
  q[0] = x / norm;
  q[1] = y / norm;
  q[2] = z / norm;
  q[3] = w / norm;
}

// The simulation runs in board coordinates independently of rendering and input.
export class TiltRound {
  timeLeft = ROUND_SECONDS;
  elapsed = 0;
  tiltX = 0;
  tiltZ = 0;
  energy = 0;
  golden = false;
  goals = 0;
  coinsEarned = 0;
  coinsSpent = 0;
  magnetLeft = 0;
  score = 0;
  multiplier = 1;
  bestMultiplier = 1;
  boosts = 0;
  streak = 0;
  refill = 0;
  events = [];

  constructor(random = Math.random) {
    this.random = random;
    this.targets = new Set([Math.floor(random() * SLOT_COUNT)]);
    this.balls = [makeBall(this.pick(STANDARD))];
  }

  get coins() { return this.coinsEarned - this.coinsSpent; }
  get finished() { return this.timeLeft <= 0; }

  pick(list) { return list[Math.floor(this.random() * list.length)]; }

  canBuy(item) {
    return !this.finished && this.coins >= POWER_UPS[item].cost && (item !== "magnet" || this.magnetLeft <= 0);
  }

  buy(item) {
    if (!this.canBuy(item)) return false;
    const { cost, seconds } = POWER_UPS[item];
    this.coinsSpent += cost;
    if (item === "time") this.timeLeft += seconds;
    else this.magnetLeft = seconds;
    return true;
  }

  step(dt, dragX = 0, dragZ = 0) {
    this.events.length = 0;
    const delta = Math.max(0, Math.min(dt, this.timeLeft));
    this.elapsed += delta;
    this.timeLeft = Math.max(0, this.timeLeft - delta);
    const magnetDelta = Math.min(this.magnetLeft, delta);
    this.magnetLeft = Math.max(0, this.magnetLeft - delta);
    if (this.finished) return;

    if (this.golden) {
      this.energy = Math.max(0, this.energy - delta / 8);
      if (this.energy === 0) this.golden = false;
    }
    const response = 1 - Math.exp(-delta * 12);
    this.tiltX += (dragX * .29 - this.tiltX) * response;
    this.tiltZ += (dragZ * .29 - this.tiltZ) * response;
    const grip = Math.exp(-delta * (this.golden ? 1.7 : 1.15));
    const ax = Math.sin(this.tiltX) * 27;
    const az = Math.sin(this.tiltZ) * 27;

    for (const ball of this.balls) {
      if (ball.falling) {
        ball.vy -= 17 * delta;
        ball.y += ball.vy * delta;
      } else {
        if (magnetDelta > 0) this.pullTowardTarget(ball, magnetDelta);
        ball.vx = clamp((ball.vx + ax * delta) * grip, 5);
        ball.vz = clamp((ball.vz + az * delta) * grip, 5);
        roll(ball, ball.vx * delta, ball.vz * delta);
      }
      ball.x += ball.vx * delta;
      ball.z += ball.vz * delta;
    }
    this.separateMarbles();
    for (let index = this.balls.length - 1; index >= 0; index--) {
      const ball = this.balls[index];
      if (ball.falling) {
        if (ball.y < -1.55) this.balls.splice(index, 1);
      } else {
        this.checkBoard(ball);
      }
    }

    this.refill -= delta;
    const desired = this.elapsed >= 43 ? 3 : this.elapsed >= 20 ? 2 : 1;
    if (this.refill <= 0 && this.balls.filter((ball) => !ball.falling).length < desired) this.spawn();
  }

  pullTowardTarget(ball, delta) {
    const range = 2.15;
    let nearest = range;
    let dx = 0;
    let dz = 0;
    for (const index of this.targets) {
      const slot = SLOTS[index];
      const distance = Math.hypot(slot.x - ball.x, slot.z - ball.z);
      if (distance >= nearest) continue;
      nearest = distance;
      dx = slot.x - ball.x;
      dz = slot.z - ball.z;
    }
    if (nearest < .0001 || nearest >= range) return;
    const force = 28 * (1 - nearest / range) * delta / nearest;
    ball.vx += dx * force;
    ball.vz += dz * force;
  }

  separateMarbles() {
    const diameter = BALL_RADIUS * 2;
    for (let i = 0; i < this.balls.length; i++) {
      const first = this.balls[i];
      if (first.falling) continue;
      for (let j = 0; j < i; j++) {
        const second = this.balls[j];
        if (second.falling) continue;
        const dx = first.x - second.x;
        const dz = first.z - second.z;
        const distance = Math.hypot(dx, dz);
        if (distance >= diameter) continue;
        const nx = distance > .0001 ? dx / distance : 1;
        const nz = distance > .0001 ? dz / distance : 0;
        const push = (diameter - distance) * .5;
        first.x += nx * push;
        first.z += nz * push;
        second.x -= nx * push;
        second.z -= nz * push;
        const speed = (first.vx - second.vx) * nx + (first.vz - second.vz) * nz;
        const impulse = Math.min(0, speed) * .78;
        first.vx -= impulse * nx;
        first.vz -= impulse * nz;
        second.vx += impulse * nx;
        second.vz += impulse * nz;
      }
    }
  }

  checkBoard(ball) {
    for (const [index, slot] of SLOTS.entries()) {
      const dx = ball.x - slot.x;
      const dz = ball.z - slot.z;
      const target = this.targets.has(index);
      const radius = this.golden && target ? GOLDEN_RADIUS : HOLE_RADIUS;
      if (dx * dx + dz * dz > radius * radius) continue;
      if (target) {
        const speed = Math.hypot(ball.vx, ball.vz);
        const perfect = this.golden && speed > 1 && Math.abs(dx * ball.vz - dz * ball.vx) < .15 * speed;
        this.award(index, ball.kind, perfect);
      } else {
        this.miss(ball, INACTIVE_POINTS);
      }
      ball.vx = -dx * 4.5;
      ball.vz = -dz * 4.5;
      this.drop(ball);
      return;
    }
    if (Math.hypot(ball.x, ball.z) > BOARD_RADIUS + .035) {
      this.miss(ball, 0);
      this.drop(ball);
    }
  }

  drop(ball) {
    ball.falling = true;
    ball.vy = -.95;
    this.refill = .38;
  }

  miss(ball, points) {
    this.streak = 0;
    this.multiplier = 1;
    this.score += points;
    this.events.push({ type: "miss", points, x: ball.x, z: ball.z });
  }

  award(slot, kind, perfect) {
    this.goals++;
    this.streak++;
    this.multiplier = Math.min(5, 1 + Math.floor(this.streak / 3));
    this.bestMultiplier = Math.max(this.bestMultiplier, this.multiplier);
    const coins = kind.coins * this.multiplier * (this.golden ? 2 : 1);
    this.coinsEarned += coins;
    this.score += 100 + coins * 10 + (perfect ? 50 : 0);
    this.timeLeft += kind.time;
    this.events.push({ type: "goal", slot, kind, coins, perfect, time: kind.time,
      combo: this.multiplier, golden: this.golden });

    this.energy = Math.min(1, this.energy + (this.golden ? .12 : kind === LUCKY ? .40 : .25));
    if (this.energy >= 1 && !this.golden) {
      this.golden = true;
      this.boosts++;
      this.score += 250;
      this.events.push({ type: "boost" });
    }
    this.targets.delete(slot);
    const needed = this.elapsed >= 20 ? 2 : 1;
    while (this.targets.size < needed) {
      const available = SLOTS.map((_, index) => index).filter((index) => index !== slot && !this.targets.has(index));
      this.targets.add(this.pick(available));
    }
  }

  spawn() {
    const roll = Math.floor(this.random() * 100);
    const kind = roll < 10 ? GOLD : roll < 18 ? LUCKY : roll < 26 ? TIME : this.pick(STANDARD);
    const angle = this.random() * 2 * Math.PI;
    for (let attempt = 0; attempt < SLOT_COUNT; attempt++) {
      const a = angle + attempt * Math.PI / 4;
      const radius = attempt === 0 ? this.random() * .65 : .86;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      if (this.balls.some((ball) => !ball.falling && Math.hypot(ball.x - x, ball.z - z) < .49)) continue;
      this.balls.push(makeBall(kind, x, z));
      break;
    }
    this.refill = .45;
  }
}
