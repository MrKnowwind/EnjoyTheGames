import { INACTIVE_POINTS, POWER_UPS, STEP, TIME_BONUS, TiltRound } from "./round.mjs";
import { BoardView } from "./board.mjs";
import { SkyView } from "./sky-view.mjs";
import { SkyEffects } from "./sky-effects.mjs";

const language = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "zh-CN";
const byId = (id) => document.getElementById(id);
const status = byId("load-status");
const titleArt = language === "en" ? "./art/title.webp" : "./art/title-zh-CN.webp";
byId("loading-title").src = titleArt;

try {
  const canvas = byId("board");
  const [response, sky] = await Promise.all([fetch(`./locales/${language}.json`), SkyView.create(canvas)]);
  if (!response.ok) throw new Error(`Locale request returned ${response.status}`);
  const view = sky ?? new BoardView(canvas);
  initialize(await response.json(), view, Boolean(sky));
} catch (error) {
  status.textContent = "无法载入游戏，请刷新后重试。";
  console.error(error);
}

function initialize(strings, view, isWebGL) {
  document.documentElement.lang = language;
  document.title = strings.title;
  const number = new Intl.NumberFormat(language);
  const t = (key, values) => strings[key].replace(/\{(\w+)\}/g, (_, name) => number.format(values[name]));
  for (const element of document.querySelectorAll("[data-text]")) {
    element.textContent = t(element.dataset.text);
  }
  for (const element of document.querySelectorAll("[data-label]")) {
    element.setAttribute("aria-label", t(element.dataset.label));
  }
  byId("title-art").src = titleArt;
  byId("title-art").alt = t("title");
  if (language === "en") {
    byId("result-goal-ring").hidden = true;
    byId("result-goal-icon").src = "./art/goal.webp";
    byId("result-goal-icon").hidden = false;
  }

  const game = byId("game");
  const hud = byId("hud");
  const footer = byId("game-footer");
  const canvas = byId("board");
  const hudSafe = byId("hud-safe");
  const layout = byId("hud-layout");
  const dial = byId("tilt-dial");
  const effects = new SkyEffects();
  const preview = new TiltRound(() => .18);
  preview.tiltX = -.09;
  preview.tiltZ = -.12;
  const panels = ["home", "help", "paused", "results"];
  const toolButtons = { time: byId("buy-time"), magnet: byId("buy-magnet") };
  const charge = byId("charge");
  const chargeTrack = byId("charge-track");
  const feedback = byId("feedback");
  const feedbackArt = byId("feedback-art");
  const feedbackCaption = byId("feedback-caption");
  const smallScore = byId("small-score");
  const magnetTimer = byId("magnet-timer");
  const helpPages = [...document.querySelectorAll(".help-page")];
  const helpDots = [...document.querySelectorAll(".help-dots i")];
  const helpTitles = ["help", "coinBoosts", "powerUps"];
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const held = new Set();
  const record = readRecord();
  let round;
  let screen = "home";
  let pointer;
  let feedbackUntil = 0;
  let feedbackStart = 0;
  let feedbackKind;
  let scoreUntil = 0;
  let helpPage = 0;
  let layoutScale = 1;
  let designHeight = 760;
  let sceneTime = 0;
  let frame;
  let lastTime;
  let accumulator = 0;

  for (const [id, label] of [["rule-slots", t("ruleSlots", { points: INACTIVE_POINTS })],
    ["rule-time", t("ruleTime", { seconds: TIME_BONUS })],
    ["time-cost", t("timeCost", POWER_UPS.time)], ["magnet-cost", t("magnetCost", POWER_UPS.magnet)],
    ["time-price", number.format(POWER_UPS.time.cost)], ["magnet-price", number.format(POWER_UPS.magnet.cost)]]) {
    setText(id, label);
  }
  toolButtons.time.setAttribute("aria-label", `${t("extraTime")} ${t("timeCost", POWER_UPS.time)}`);
  toolButtons.magnet.setAttribute("aria-label", `${t("magnet")} ${t("magnetCost", POWER_UPS.magnet)}`);
  canvas.setAttribute("aria-label", t("title"));
  byId("start").addEventListener("click", startRound);
  byId("help-button").addEventListener("click", () => {
    turnHelp(0);
    show("help", "close-help");
  });
  byId("close-help").addEventListener("click", () => show("home", "help-button"));
  byId("help-prev").addEventListener("click", () => turnHelp(helpPage - 1));
  byId("help-next").addEventListener("click", () => turnHelp(helpPage + 1));
  byId("pause").addEventListener("click", pause);
  byId("resume").addEventListener("click", () => show("play", "board"));
  byId("restart").addEventListener("click", startRound);
  byId("replay").addEventListener("click", startRound);
  byId("pause-home").addEventListener("click", home);
  byId("result-home").addEventListener("click", home);

  for (const [item, button] of Object.entries(toolButtons)) {
    button.addEventListener("click", () => {
      if (screen !== "play" || !round.buy(item)) return;
      if (item === "time") announce("time_up", t("timeBonus", POWER_UPS.time), 1.12);
      updateHud();
    });
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (screen !== "play" || pointer || event.button !== 0) return;
    event.preventDefault();
    const local = layout.getBoundingClientRect();
    pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, reach: 66 * layoutScale,
      dialX: (event.clientX - local.left) / layoutScale, dialY: (event.clientY - local.top) / layoutScale, dx: 0, dz: 0 };
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener("pointermove", (event) => {
    if (pointer?.id !== event.pointerId) return;
    const x = (event.clientX - pointer.startX) / pointer.reach;
    const z = (event.clientY - pointer.startY) / pointer.reach;
    const length = Math.max(1, Math.hypot(x, z));
    pointer.dx = x / length;
    pointer.dz = z / length;
    if (Math.hypot(pointer.dx, pointer.dz) > .13) byId("steer-hint").hidden = true;
  });
  canvas.addEventListener("lostpointercapture", (event) => {
    if (pointer?.id === event.pointerId) pointer = undefined;
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && screen === "play") pause();
    else if (event.key === "Escape" && screen === "paused") show("play", "board");
    else if (event.key === "Escape" && screen === "help") show("home", "help-button");
    if (screen !== "play" || !Object.hasOwn(directions, event.key)) return;
    event.preventDefault();
    held.add(event.key);
    byId("steer-hint").hidden = true;
  });
  window.addEventListener("keyup", (event) => held.delete(event.key));
  window.addEventListener("blur", clearInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && screen === "play") pause();
  });

  if (!isWebGL) {
    view.texture.addEventListener("load", draw);
    view.texture.src = "./art/deck_color.png";
  }
  game.dataset.renderer = isWebGL ? "webgl2" : "canvas";
  byId("loading").hidden = true;
  game.hidden = false;
  new ResizeObserver(resize).observe(hudSafe);
  resize();
  show("home");

  function resize() {
    const width = hudSafe.clientWidth;
    const height = hudSafe.clientHeight;
    if (!width || !height) return;
    layoutScale = Math.min(width / 400, height / 618, 1.35);
    designHeight = height / layoutScale;
    layout.style.setProperty("--hud-scale", layoutScale);
    layout.style.setProperty("--design-height", `${designHeight}px`);
    layout.style.setProperty("--title-y", `${Math.max(83, Math.min(156, designHeight * .159)) - 14}px`);
    layout.style.setProperty("--play-y", `${Math.min(designHeight * .895, designHeight - 60)}px`);
    layout.style.setProperty("--footer-y", `${designHeight - 63}px`);
    view.resize();
    draw();
  }

  function turnHelp(page) {
    helpPage = page;
    setText("help-title", t(helpTitles[page]));
    helpPages.forEach((element, index) => { element.hidden = index !== page; });
    helpDots.forEach((element, index) => element.toggleAttribute("data-active", index === page));
    byId("help-prev").disabled = page === 0;
    byId("help-next").disabled = page === helpPages.length - 1;
  }

  function startRound() {
    round = new TiltRound();
    accumulator = 0;
    effects.clear();
    feedbackUntil = 0;
    scoreUntil = 0;
    feedback.hidden = true;
    smallScore.hidden = true;
    byId("steer-hint").hidden = false;
    show("play", "board");
  }

  function pause() {
    setText("pause-time", t("seconds", { value: Math.ceil(round.timeLeft) }));
    show("paused", "resume");
  }

  function home() {
    round = undefined;
    effects.clear();
    show("home", "start");
  }

  function show(next, focus) {
    cancelAnimationFrame(frame);
    lastTime = undefined;
    clearInput();
    screen = next;
    game.dataset.screen = next;
    for (const name of panels) byId(name).hidden = name !== next;
    hud.hidden = footer.hidden = next !== "play";
    canvas.tabIndex = next === "play" ? 0 : -1;
    if (next === "home") {
      game.removeAttribute("data-golden");
      setText("best-score", number.format(record.score));
    }
    if (next === "play") {
      updateHud();
    }
    if (next === "play" || next === "home" || next === "help") frame = requestAnimationFrame(update);
    if (focus) byId(focus).focus({ preventScroll: true });
    draw();
  }

  function clearInput() {
    if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
    pointer = undefined;
    held.clear();
  }

  function axes() {
    if (pointer) return [pointer.dx, pointer.dz];
    let x = 0;
    let z = 0;
    for (const key of held) {
      const [dx, dz] = directions[key];
      x += dx;
      z += dz;
    }
    const length = Math.max(1, Math.hypot(x, z));
    return [x / length, z / length];
  }

  function update(now) {
    const delta = lastTime === undefined ? 0 : Math.min(.20, (now - lastTime) / 1000);
    lastTime = now;
    sceneTime += delta;
    if (screen === "play") {
      accumulator += delta;
      const [x, z] = axes();
      while (accumulator >= STEP && !round.finished) {
        accumulator -= STEP;
        round.step(STEP, x, z);
        for (const event of round.events) {
          effects.burst(event);
          handleEvent(event);
        }
        effects.tick(STEP, round);
      }
      if (round.finished) {
        showResults();
        return;
      }
      updateHud();
      updateEffects();
    }
    draw();
    frame = requestAnimationFrame(update);
  }

  function draw() {
    if (isWebGL) view.draw(sceneTime, screen, round ?? preview, effects.snapshot());
    else view.draw(round ?? preview);
  }

  function handleEvent(event) {
    if (event.type === "boost") announce("boost", byId("feedback-reward").textContent, 1.55);
    if (event.type === "miss" && event.points) {
      smallScore.textContent = t("inactiveGoal", event);
      smallScore.hidden = false;
      scoreUntil = round.elapsed + .75;
    }
    if (event.type === "goal") {
      const icon = event.time ? "time_up" : event.perfect ? "perfect" : event.combo > 1 ? "combo" : "goal";
      const reward = event.time ? t("timeGoal", { coins: event.coins, seconds: event.time }) : t("coinReward", event);
      if (feedbackKind === "boost" && round.elapsed - feedbackStart < 1) setText("feedback-reward", reward);
      else announce(icon, reward, 1.02);
    }
  }

  function announce(icon, reward, duration) {
    feedbackKind = icon;
    feedbackStart = round.elapsed;
    feedbackUntil = round.elapsed + duration;
    const keys = { boost: "boost", goal: "goalBanner", perfect: "perfectBanner", combo: "comboBanner", time_up: "timeBanner" };
    feedbackArt.hidden = language !== "en";
    feedbackCaption.hidden = language === "en";
    if (language === "en") {
      feedbackArt.src = `./art/${icon}.webp`;
      feedbackArt.alt = t(keys[icon]);
    } else {
      feedbackCaption.textContent = t(keys[icon]);
    }
    setText("feedback-reward", reward);
    feedback.hidden = false;
  }

  function updateEffects() {
    feedback.hidden = round.elapsed >= feedbackUntil;
    if (!feedback.hidden) {
      const age = round.elapsed - feedbackStart;
      feedback.style.setProperty("--feedback-y", `${Math.max(designHeight * .246, round.magnetLeft > 0 ? 212 : 151) - age * 13}px`);
      feedback.style.scale = 1 + .18 * Math.exp(-age * 10) * Math.sin(age * 30);
      feedback.style.opacity = Math.min(1, (feedbackUntil - round.elapsed) / .26);
    }
    smallScore.hidden = round.elapsed >= scoreUntil;
    if (!smallScore.hidden) smallScore.style.opacity = Math.min(1, (scoreUntil - round.elapsed) / .22);
    dial.hidden = !pointer;
    if (!pointer) return;
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
    const { dialX, dialY, dx, dz } = pointer;
    dial.style.left = `${clamp(dialX, 56, 344)}px`;
    dial.style.top = `${clamp(dialY, round.magnetLeft > 0 ? 239 : 177, designHeight - 157)}px`;
    dial.style.setProperty("--knob-x", `${dx * 29}px`);
    dial.style.setProperty("--knob-y", `${dz * 29}px`);
    dial.style.setProperty("--rod", `${Math.hypot(dx, dz) * 29}px`);
    dial.style.setProperty("--axis", `${Math.atan2(dz, dx)}rad`);
  }

  function updateHud() {
    const seconds = Math.ceil(round.timeLeft);
    setText("timer", t("seconds", { value: seconds }));
    byId("timer").toggleAttribute("data-urgent", seconds <= 10);
    setText("score", number.format(round.score));
    setText("coins", number.format(round.coins));
    setText("combo", `×${number.format(round.multiplier)}`);
    setText("charge-label", t(round.golden ? "doubleCoins" : "gravity"));
    if (charge.value !== round.energy) {
      charge.value = round.energy;
      chargeTrack.style.setProperty("--charge", `${round.energy * 100}%`);
    }
    game.toggleAttribute("data-golden", round.golden);
    magnetTimer.hidden = round.magnetLeft <= 0;
    if (round.magnetLeft > 0) setText("magnet-time", t("seconds", { value: Math.ceil(round.magnetLeft) }));
    for (const [item, button] of Object.entries(toolButtons)) button.disabled = !round.canBuy(item);
  }

  function showResults() {
    const stats = { score: round.score, goals: round.goals, coins: round.coinsEarned,
      combo: round.bestMultiplier, boosts: round.boosts };
    const newBest = stats.score > record.score;
    for (const [key, value] of Object.entries(stats)) record[key] = Math.max(value, record[key]);
    try { localStorage.setItem("hyper-tiltvexa:records", JSON.stringify(record)); } catch { /* Storage is optional. */ }
    setText("result-title", t(newBest ? "newBest" : "finished"));
    byId("results").toggleAttribute("data-record", newBest);
    setText("result-best", t("best", record));
    for (const [key, value] of Object.entries(stats)) {
      setText(`result-${key}`, `${key === "combo" ? "×" : ""}${number.format(value)}`);
    }
    show("results", "result-title");
  }
}

function setText(id, value) {
  const element = byId(id);
  if (element.textContent !== value) element.textContent = value;
}

function readRecord() {
  const record = { score: 0, goals: 0, coins: 0, combo: 1, boosts: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem("hyper-tiltvexa:records"));
    for (const key of Object.keys(record)) {
      if (Number.isSafeInteger(saved?.[key]) && saved[key] >= record[key]) record[key] = saved[key];
    }
  } catch { /* Start with a fresh record if storage is unavailable. */ }
  return record;
}
