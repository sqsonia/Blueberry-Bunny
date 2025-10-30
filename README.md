# Blueberry Bunny Sort

Blueberry Bunny Sort is a cozy browser puzzle where fruit-shaped bunnies hop between glass tubes. Group every bunny by its favorite flavor to win — and make sure the blueberry bunch sticks together.

## Features

- 🫐 A blueberry bunny family plus strawberry, peach, and kiwi friends to juggle.
- ✋ Smooth drag-and-drop stacks with keyboard access for players who prefer it.
- 🎯 Win detection with a celebratory modal and quick "New round" button.
- 🌈 Hand-crafted visuals: soft gradients, glass tubes, and cute bunny faces with fruit-inspired details.

## How to play

1. Drag the top stack of matching fruit bunnies from one tube toward another.
2. Drop them onto any tube that has enough room for the whole stack—mixing flavors is totally fine.
3. Keep sorting until every tube is filled with a single fruit flavor. Prefer keys? Focus a tube and press Enter/Space to pick up or drop.

## Run locally

No build step is required. Open `index.html` directly in your browser or start a lightweight web server from the project folder:

```powershell
powershell -NoExit -Command "Start-Process msedge.exe '$(Resolve-Path ./index.html)'"
```

Or, if you prefer a static server with live reload, use your favorite tool (such as `npx serve`) and point it at the project directory.
