import assert from "node:assert/strict";
import { test } from "node:test";
import { INACTIVE_POINTS, POWER_UPS, ROUND_SECONDS, SLOTS, STEP, TIME_BONUS, TiltRound } from "../games/hyper-tiltvexa/round.mjs";

// Each test drives the same fixed-rate simulation used by the browser player.
function idle(round, seconds) {
  for (let i = 0; i < Math.round(seconds / STEP); i++) round.step(STEP);
}

function steer(round, index) {
  const ball = round.balls.find((entry) => !entry.falling);
  const { x, z } = SLOTS[index];
  const dx = x - ball.x;
  const dz = z - ball.z;
  const length = Math.hypot(dx, dz);
  for (let i = 0; i < 300; i++) {
    round.step(STEP, dx / length, dz / length);
    if (round.events.length) return [...round.events];
  }
  assert.fail("No slot or edge reached");
}

function hit(round) {
  const target = round.targets.values().next().value;
  const event = steer(round, target).find((outcome) => outcome.type === "goal");
  assert.ok(event, "aiming at a lit slot scores a goal");
  idle(round, 1);
  return event;
}

test("lit slot earns coins, adds charge and moves the target", () => {
  const round = new TiltRound(() => .5);
  assert.equal(round.timeLeft, 75);
  const target = round.targets.values().next().value;
  assert.equal(hit(round).coins, 10);
  assert.equal(round.score, 200);
  assert.equal(round.energy, .25);
  assert.equal(round.targets.has(target), false);
});

test("dark slot earns only the small score and ball count increases as the round runs", () => {
  const round = new TiltRound(() => .5);
  assert.deepEqual(steer(round, 0).map(({ type, points }) => ({ type, points })),
    [{ type: "miss", points: INACTIVE_POINTS }]);
  assert.equal(round.coins, 0);
  assert.equal(round.multiplier, 1);
  assert.equal(round.score, 10);
  idle(round, 1);
  assert.equal(round.balls.length, 1);
  idle(round, 22);
  assert.equal(round.balls.length, 2);
  idle(round, 23);
  assert.equal(round.balls.length, 3);
  idle(round, ROUND_SECONDS);
  assert.ok(round.finished);
  assert.equal(round.score, 10);
  assert.equal(round.buy("time"), false);
});

test("rolling between holes and off the board gives zero points", () => {
  const round = new TiltRound(() => .5);
  const angle = -Math.PI / 2 + Math.PI / 8;
  for (let i = 0; i < 240; i++) {
    round.step(STEP, Math.cos(angle), Math.sin(angle));
    if (round.events.length) {
      assert.deepEqual(round.events.map(({ type, points }) => ({ type, points })), [{ type: "miss", points: 0 }]);
      assert.equal(round.score, 0);
      return;
    }
  }
  assert.fail("The marble did not fall off the board");
});

test("consecutive hits increase multiplier and trigger draining, rechargeable Golden Gravity", () => {
  const round = new TiltRound(() => .5);
  for (let i = 0; i < 4; i++) hit(round);
  assert.equal(round.multiplier, 2);
  assert.equal(round.boosts, 1);
  assert.equal(round.golden, true);
  const before = round.energy;
  const elapsed = round.elapsed;
  const goal = hit(round);
  assert.equal(goal.coins, 40);
  assert.equal(goal.perfect, true);
  assert.ok(Math.abs(round.energy - (before - (round.elapsed - elapsed) / 8 + .12)) < .001);
  idle(round, 9);
  assert.equal(round.golden, false);
  assert.equal(round.energy, 0);
});

test("hitting a Time marble adds five seconds", () => {
  const round = new TiltRound(() => .21);
  hit(round);
  const before = round.timeLeft;
  const elapsed = round.elapsed;
  assert.equal(hit(round).time, TIME_BONUS);
  assert.ok(Math.abs(round.timeLeft - (before + TIME_BONUS - (round.elapsed - elapsed))) < .001);
});

test("extra time spends the balance and preserves earned coins and score", () => {
  const round = new TiltRound(() => .5);
  assert.equal(round.buy("time"), false);
  for (let i = 0; i < 4; i++) hit(round);
  const { coins, coinsEarned, timeLeft, score } = round;
  assert.equal(round.buy("time"), true);
  assert.equal(round.coins, coins - POWER_UPS.time.cost);
  assert.equal(round.coinsEarned, coinsEarned);
  assert.equal(round.score, score);
  assert.equal(round.timeLeft, timeLeft + POWER_UPS.time.seconds);
});

test("magnet attracts toward lit slots only and cannot be bought twice while active", () => {
  const round = new TiltRound(() => .5);
  for (let i = 0; i < 4; i++) hit(round);
  const balance = round.coins;
  assert.equal(round.buy("magnet"), true);
  assert.equal(round.buy("magnet"), false);
  assert.equal(round.coins, balance - POWER_UPS.magnet.cost);

  const ball = round.balls.find((entry) => !entry.falling);
  const target = round.targets.values().next().value;
  const dark = (target + 4) % SLOTS.length;
  Object.assign(ball, { x: SLOTS[dark].x * .72, z: SLOTS[dark].z * .72, vx: 0, vz: 0 });
  idle(round, 1);
  assert.ok(Math.hypot(ball.vx, ball.vz) < .01);
  const { x, z } = SLOTS[target];
  const length = Math.hypot(x, z);
  Object.assign(ball, { x: x * (1 - 1.76 / length), z: z * (1 - 1.76 / length), vx: 0, vz: 0 });
  const goals = round.goals;
  idle(round, .7);
  assert.equal(round.goals, goals + 1);
  idle(round, 9);
  assert.equal(round.magnetLeft, 0);
  assert.equal(round.canBuy("magnet"), true);
});
