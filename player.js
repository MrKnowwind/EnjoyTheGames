const id = new URLSearchParams(location.search).get("game");
const game = games.find((entry) => entry.id === id);
const title = document.querySelector("[data-game-title]");
const stage = document.querySelector("[data-stage]");
const message = document.querySelector("[data-player-message]");
const fullscreen = document.querySelector("[data-fullscreen]");

if (game) {
  document.title = `${game.title} · EnjoyTheGames`;
  title.textContent = game.title;
  stage.dataset.orientation = game.orientation;

  const frame = document.createElement("iframe");
  frame.className = "game-frame";
  frame.title = game.title;
  frame.allowFullscreen = true;
  frame.src = `./games/${encodeURIComponent(game.id)}/index.html`;
  frame.addEventListener("load", () => { message.textContent = ""; }, { once: true });
  message.textContent = "正在载入游戏…";
  stage.append(frame);
  stage.hidden = false;

  if (document.fullscreenEnabled && stage.requestFullscreen) {
    fullscreen.hidden = false;
    fullscreen.addEventListener("click", async () => {
      try {
        await stage.requestFullscreen();
      } catch {
        message.textContent = "当前浏览器无法进入全屏。";
      }
    });
  }
} else {
  title.textContent = "找不到游戏";
  message.textContent = "请返回游戏库，选择一款游戏。";
}
