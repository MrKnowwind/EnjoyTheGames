const featured = games[0];
const filters = document.querySelector("[data-filters]");
const gameList = document.querySelector("[data-game-list]");
const resultCount = document.querySelector("[data-result-count]");
const cardTemplate = document.querySelector("#game-card");
const placeholder = "./assets/game-placeholder.webp";

if (featured) {
  document.querySelector("[data-featured-cover]").src = featured.cover || placeholder;
  document.querySelector("#featured-title").textContent = featured.title;
  document.querySelector("[data-featured-description]").textContent = featured.description;
  document.querySelector("[data-featured-link]").href = playUrl(featured.id);
  document.querySelector("[data-featured]").hidden = false;

  addFilter("全部", games);
  for (const category of new Set(games.map((game) => game.category))) {
    addFilter(category, games.filter((game) => game.category === category));
  }
  filters.firstElementChild.setAttribute("aria-pressed", "true");
  renderGames(games);
} else {
  document.querySelector("[data-empty-library]").hidden = false;
}

function playUrl(id) {
  return `./play.html?game=${encodeURIComponent(id)}`;
}

function addFilter(label, matches) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    filters.querySelector('[aria-pressed="true"]')?.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-pressed", "true");
    renderGames(matches);
  });
  filters.append(button);
}

function renderGames(matches) {
  const cards = matches.map((game) => {
    const card = cardTemplate.content.cloneNode(true);
    card.querySelector("a").href = playUrl(game.id);
    card.querySelector("img").src = game.cover || placeholder;
    card.querySelector("h3").textContent = game.title;
    card.querySelector(".card-category").textContent = game.category;
    card.querySelector(".card-description").textContent = game.description;
    return card;
  });
  gameList.replaceChildren(...cards);
  resultCount.textContent = `共 ${matches.length} 款游戏`;
}
