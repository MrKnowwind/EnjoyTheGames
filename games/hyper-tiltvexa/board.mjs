import { BALL_RADIUS, BOARD_RADIUS, GOLDEN_RADIUS, HOLE_RADIUS, SLOTS } from "./round.mjs";

export class BoardView {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.texture = new Image();
  }

  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.pixelRatio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
  }

  draw(round) {
    if (!this.width || !this.height) return;
    const ctx = this.context;
    const ratio = this.pixelRatio;
    const scale = Math.min(this.width / 8.5, this.height / 7.6);
    const centerX = this.width * .5;
    const centerY = this.height * .48;
    const cx = Math.cos(round.tiltX);
    const sx = Math.sin(round.tiltX);
    const cz = Math.cos(round.tiltZ);
    const sz = Math.sin(round.tiltZ);
    // Orthographic projection from the same camera angle as the Android board.
    const xToY = .658 * sx;
    const zToX = -sz * sx;
    const zToY = .753 * cz + .658 * sz * cx;
    const heightToX = cz * sx;
    const heightToY = .753 * sz - .658 * cz * cx;
    const project = (x, z, y) => [
      centerX + scale * (x * cx + z * zToX + y * heightToX),
      centerY + scale * (x * xToY + z * zToY + y * heightToY),
    ];

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const shadow = ctx.createRadialGradient(centerX, centerY + scale * 2, scale * .25,
      centerX, centerY + scale * 2, scale * 3.8);
    shadow.addColorStop(0, "#2c5f9b66");
    shadow.addColorStop(1, "#3882b900");
    ctx.fillStyle = shadow;
    ctx.fillRect(0, centerY - scale, this.width, this.height);

    const deck = (level) => {
      const [x, y] = project(0, 0, level);
      ctx.setTransform(ratio * scale * cx, ratio * scale * xToY,
        ratio * scale * zToX, ratio * scale * zToY, ratio * x, ratio * y);
    };
    const circle = (x, y, radius, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    };

    for (const [level, radius, fill] of [
      [-.82, 3.34, "#214d84"], [-.66, 3.58, "#1e5b9b"], [-.45, 3.82, "#153e74"],
      [-.18, 3.91, "#dd8b2b"], [0, 3.89, round.golden ? "#fff099" : "#ffc469"],
    ]) {
      deck(level);
      circle(0, 0, radius, fill);
    }

    deck(0);
    circle(0, 0, BOARD_RADIUS, "#1870a7");
    if (this.texture.complete && this.texture.naturalWidth) {
      ctx.save();
      ctx.clip();
      ctx.drawImage(this.texture, -BOARD_RADIUS, -BOARD_RADIUS, BOARD_RADIUS * 2, BOARD_RADIUS * 2);
      ctx.restore();
    }
    if (round.golden) circle(0, 0, BOARD_RADIUS, "#ffc9543d");

    for (const [index, { x, z }] of SLOTS.entries()) {
      const active = round.targets.has(index);
      const radius = active && round.golden ? GOLDEN_RADIUS : HOLE_RADIUS;
      const ring = round.golden ? "#fff1a0" : "#8bfbff";
      if (active) {
        ctx.shadowColor = round.magnetLeft ? "#d3b8ff" : ring;
        ctx.shadowBlur = ratio * 13;
        circle(x, z, radius + .098, ring);
        ctx.shadowBlur = 0;
      } else {
        circle(x, z, radius + .065, "#68a8d3");
      }
      circle(x, z, radius, active && round.golden ? "#5f3213" : "#0b2445");
      circle(x, z - radius * .24, radius * .67, active && round.golden ? "#8d481c" : "#143961");
    }
    for (const ball of round.balls) {
      if (!ball.falling) circle(ball.x + .06, ball.z + .08, BALL_RADIUS * 1.15, "#042b5355");
    }

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const radius = BALL_RADIUS * scale;
    const marbles = round.balls.map((ball) => ({ ball, point: project(ball.x, ball.z, ball.y) }));
    marbles.sort((a, b) => a.point[1] - b.point[1]);
    for (const { ball, point: [x, y] } of marbles) {
      ctx.globalAlpha = ball.falling ? Math.max(0, Math.min(1, 1 + ball.y * 2.8)) : 1;
      const glass = ctx.createRadialGradient(x - radius * .35, y - radius * .42, 0, x, y, radius);
      glass.addColorStop(0, "#fff");
      glass.addColorStop(.47, ball.kind.color);
      glass.addColorStop(.86, ball.kind.color);
      glass.addColorStop(1, "#172b4a");
      circle(x, y, radius, glass);
    }
    ctx.globalAlpha = 1;

  }
}
