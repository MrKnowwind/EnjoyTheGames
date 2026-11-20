# EnjoyTheGames

一个点击即玩的 H5 小游戏大厅，收录从安卓移植的游戏和已发布的网页游戏。大厅使用静态 HTML、CSS 和 JavaScript。

## 本地预览

在仓库根目录启动静态服务器，然后打开 `http://127.0.0.1:8000/`。

```sh
python -m http.server 8000 --bind 127.0.0.1
```

## 收录游戏

1. 将可独立运行的 H5 成品放进 `games/<id>/`，入口为 `index.html`。`id` 使用小写英文字母、数字和连字符。
2. 按[本土化工作流](docs/localization.md)整理和翻译游戏文案，确认 H5 版首次打开使用简体中文。
3. 在 [`catalog.js`](catalog.js) 登记 `id`、中文 `title`、`category`、`description` 与 `orientation`（`portrait` 或 `landscape`）。目录按配置顺序展示，首款作为大厅精选。省略 `cover` 时使用占位图。
4. 从大厅打开新游戏，检查触控、键盘和结束重玩等流程。部署时将仓库根目录作为静态站点目录，保留相对路径结构。

已发布的 H5 游戏可在目录配置里添加 `url`，大厅会嵌入原站，同时提供在新标签打开的入口。

「云端弹珠」移植自 Hyper Tiltvexa。WebGL 2 版使用原版着色器、贴图、几何参数和界面素材，支持鼠标或触屏拖拽以及键盘方向键。无 WebGL 2 的浏览器会显示简化画面。独立入口 `games/hyper-tiltvexa/` 默认使用简体中文，添加 `?lang=en` 可查看原版英文标题和反馈素材。

```sh
node scripts/check-locales.mjs games/hyper-tiltvexa/locales
node --test tests/hyper-tiltvexa.test.mjs
```

「星轨疾行」保留作为双语接入样例，独立入口为 `games/star-dash/`。

## GitHub Pages 部署

仓库的 Pages 发布来源设为 GitHub Actions。推送到 `main` 后，[部署工作流](.github/workflows/pages.yml)会检查回合规则和语言包，再发布静态资源。也可以在 Actions 手动运行 **Deploy to GitHub Pages**。
