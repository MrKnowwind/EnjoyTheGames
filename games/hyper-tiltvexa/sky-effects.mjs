import { GOLD, SLOTS } from "./round.mjs";

export const PARTICLE_LIMIT = 320;
export const PARTICLE_STRIDE = 10;
const TAU = 2 * Math.PI;

export class SkyEffects {
  sparks = [];
  emission = 0;
  seed = 271;
  data = new Float32Array(PARTICLE_LIMIT * PARTICLE_STRIDE);

  clear() {
    this.sparks.length = 0;
    this.emission = 0;
  }

  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 2 ** 32;
  }

  add(x, y, z, vx, vy, vz, life, size, color, style, angle, gravity) {
    if (this.sparks.length === PARTICLE_LIMIT) this.sparks.shift();
    this.sparks.push({ x, y, z, vx, vy, vz, life, size, color, style, angle, gravity, age: 0 });
  }

  burst(event) {
    if (event.type === "goal") {
      const { x, z } = SLOTS[event.slot];
      const color = event.golden || event.kind === GOLD ? 0xffbd25 : event.kind.rgb;
      for (let i = 0; i < 31; i++) {
        const angle = this.random() * TAU;
        const speed = 1.1 + 2.9 * this.random();
        this.add(x, .11, z, Math.cos(angle) * speed, 1.1 + this.random() * 2.8,
          Math.sin(angle) * speed, .35 + this.random() * .45, 8 + 11 * this.random(),
          i % 4 === 0 ? 0xffec91 : color, i % 3 === 0 ? 1 : 2, angle, 6);
      }
      this.add(x, .10, z, 0, .48, 0, .48, 58, color, 3, 0, 0);
    }
    if (event.type === "miss") {
      const caught = event.points > 0;
      const color = caught ? 0x8bf4ff : 0x94baf6;
      for (let i = 0; i < (caught ? 12 : 8); i++) {
        const angle = this.random() * TAU;
        this.add(event.x, .09, event.z, Math.cos(angle), .7 + this.random() * .7,
          Math.sin(angle), .38, 8 + this.random() * 6, color, caught ? 2 : 0, angle, 2.9);
      }
      if (caught) this.add(event.x, .11, event.z, 0, .31, 0, .36, 36, color, 3, 0, 0);
    }
    if (event.type === "boost") {
      for (let i = 0; i < 64; i++) {
        const angle = i * TAU / 64;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        this.add(x * 3.62, .04, z * 3.62, x * 1.35, .7 + this.random() * 2.3, z * 1.35,
          .65 + this.random() * .50, 13 + this.random() * 16, i % 2 === 0 ? 0xffdf47 : 0xffa23a, 1, angle, 3);
      }
    }
  }

  tick(dt, round) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      spark.age += dt;
      if (spark.age >= spark.life) {
        this.sparks.splice(i, 1);
        continue;
      }
      spark.vy -= spark.gravity * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.z += spark.vz * dt;
    }
    this.emission += dt;
    if (this.emission < .030) return;
    this.emission -= .030;

    for (const ball of round.balls) {
      if (ball.falling || ball.vx ** 2 + ball.vz ** 2 < .25) continue;
      const color = round.golden ? 0xffca42 : ball.kind.rgb;
      this.add(ball.x - ball.vx * .038, .12, ball.z - ball.vz * .038,
        -ball.vx * .105, .13, -ball.vz * .105, .32, 15, color, 0, 0, .16);
      if (ball.kind.coins > 10 || round.golden) {
        this.add(ball.x + this.random() * .19 - .095, .23, ball.z,
          -ball.vx * .14, .59, -ball.vz * .14, .41, 10, color, 1, this.random() * 6, 0);
      }
    }
    const targets = [...round.targets];
    const slot = SLOTS[targets[Math.floor(this.random() * targets.length)]];
    const angle = this.random() * TAU;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    const radius = round.golden ? .56 : .45;
    this.add(slot.x + x * radius, .05, slot.z + z * radius, x * .19, .68, z * .19,
      .65, 9, round.golden ? 0xffcb48 : 0x45f7fb, 1, angle, .21);
    if (round.magnetLeft > 0) {
      this.add(slot.x + 1.02 * x, .15, slot.z + 1.02 * z, -1.38 * x, .09, -1.38 * z, .48, 13, 0xb1a3ff, 2, angle, 0);
    }
  }

  snapshot() {
    let index = 0;
    for (const spark of this.sparks) {
      const age = spark.age / spark.life;
      this.data[index++] = spark.x;
      this.data[index++] = spark.y;
      this.data[index++] = spark.z;
      this.data[index++] = (spark.color >> 16 & 255) / 255;
      this.data[index++] = (spark.color >> 8 & 255) / 255;
      this.data[index++] = (spark.color & 255) / 255;
      this.data[index++] = (1 - age) ** 1.25;
      this.data[index++] = spark.size * (spark.style === 3 ? .55 + 1.5 * age : 1 - .57 * age);
      this.data[index++] = spark.style;
      this.data[index++] = spark.angle + age * .6;
    }
    return this.data.subarray(0, index);
  }
}
