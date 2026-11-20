const language = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "zh-CN";
const loadStatus = document.querySelector("#load-status");

try {
  const response = await fetch(`./locales/${language}.json`);
  if (!response.ok) throw new Error(`Locale request returned ${response.status}`);
  initialize(await response.json());
} catch (error) {
  loadStatus.textContent = "无法载入游戏，请刷新后重试。";
  console.error(error);
}

function initialize(strings) {
  document.documentElement.lang = language;
  document.title = strings.title;
  for (const element of document.querySelectorAll("[data-text]")) {
    element.textContent = strings[element.dataset.text];
  }

  const gameView = document.querySelector("#game");
  const canvas = gameView.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const flightTime = gameView.querySelector("#flight-time");
  const menu = gameView.querySelector("#menu");
  const instruction = gameView.querySelector("#instruction");
  const result = gameView.querySelector("#result");
  const start = gameView.querySelector("#start");
  const left = gameView.querySelector("#left");
  const right = gameView.querySelector("#right");
  const number = new Intl.NumberFormat(language);
  const formatTime = (key, seconds) => strings[key].replaceAll("{seconds}", number.format(seconds));
  const laneCenters = [76, 180, 284];
  const shipY = 444;
  let lane = 1;
  let asteroids = [];
  let elapsed = 0;
  let seconds = 0;
  let spawnIn = 0;
  let lastFrame = 0;
  let running = false;

  left.addEventListener("click", () => move(-1));
  right.addEventListener("click", () => move(1));
  window.addEventListener("keydown", (event) => {
    if (!running || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) move(event.key === "ArrowLeft" ? -1 : 1);
  });
  start.addEventListener("click", () => {
    lane = 1;
    asteroids = [];
    elapsed = 0;
    seconds = 0;
    spawnIn = .35;
    lastFrame = performance.now();
    flightTime.textContent = formatTime("flightTime", seconds);
    menu.hidden = true;
    left.disabled = false;
    right.disabled = false;
    left.focus({ preventScroll: true });
    running = true;
    requestAnimationFrame(update);
  });

  flightTime.textContent = formatTime("flightTime", 0);
  draw();
  loadStatus.hidden = true;
  gameView.hidden = false;

  function move(direction) {
    lane = Math.max(0, Math.min(laneCenters.length - 1, lane + direction));
  }

  function update(now) {
    const step = Math.min((now - lastFrame) / 1000, .05);
    lastFrame = now;
    elapsed += step;
    spawnIn -= step;
    if (spawnIn <= 0) {
      asteroids.push({ lane: Math.floor(Math.random() * laneCenters.length), y: -30 });
      spawnIn = Math.max(.42, .88 - elapsed * .012);
    }
    for (const asteroid of asteroids) asteroid.y += (180 + Math.min(elapsed * 5, 150)) * step;
    asteroids = asteroids.filter((asteroid) => asteroid.y < canvas.height + 24);

    if (Math.floor(elapsed) !== seconds) {
      seconds = Math.floor(elapsed);
      flightTime.textContent = formatTime("flightTime", seconds);
    }
    draw();
    if (asteroids.some((asteroid) => asteroid.lane === lane && Math.abs(asteroid.y - shipY) < 30)) {
      running = false;
      left.disabled = true;
      right.disabled = true;
      instruction.hidden = true;
      result.textContent = formatTime("result", seconds);
      result.hidden = false;
      start.textContent = strings.retry;
      menu.hidden = false;
      start.focus({ preventScroll: true });
      return;
    }
    requestAnimationFrame(update);
  }

  function draw() {
    ctx.fillStyle = "#211931";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#65547f";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 20]);
    ctx.lineDashOffset = -elapsed * 86;
    for (const x of [128, 232]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (const asteroid of asteroids) {
      const x = laneCenters[asteroid.lane];
      const y = asteroid.y;
      ctx.fillStyle = "#bb90e9";
      ctx.beginPath();
      ctx.moveTo(x + 20, y - 5);
      ctx.lineTo(x + 7, y + 21);
      ctx.lineTo(x - 17, y + 12);
      ctx.lineTo(x - 20, y - 9);
      ctx.lineTo(x - 5, y - 21);
      ctx.lineTo(x + 15, y - 16);
      ctx.fill();
    }

    const shipX = laneCenters[lane];
    ctx.fillStyle = "#d7fa72";
    ctx.beginPath();
    ctx.moveTo(shipX, shipY - 24);
    ctx.lineTo(shipX + 22, shipY + 17);
    ctx.lineTo(shipX, shipY + 10);
    ctx.lineTo(shipX - 22, shipY + 17);
    ctx.fill();
  }
}
