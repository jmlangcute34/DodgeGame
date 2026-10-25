# Road Dodge — Browser Edition

A browser-playable adaptation of the original Java Swing Road Dodge game. It uses plain HTML, CSS, and JavaScript, so no Java installation or build step is needed to play it.

## Features

- Four difficulties: Easy, Intermediate, Hard, and Very Hard
- Traffic cars and trucks, collision detection, scrolling road, score and high score per difficulty
- Earn coins for cars dodged; harder difficulties award more coins
- Garage with seven car colors and a map shop with five road themes
- Rain, snow, and night-drive effects
- Keyboard controls (arrow keys or WASD) and mobile on-screen left/right buttons
- Progress saved in the browser with `localStorage`

## Run locally

Open `index.html` in a modern browser. For the most consistent behavior, you can also run a simple local web server from this folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Sign in to GitHub and create a **public** repository, for example `road-dodge`.
2. Upload `index.html`, `style.css`, `game.js`, and `README.md` to the repository's root folder.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then click **Save**.
6. Wait for GitHub Pages to finish publishing. The URL will look like `https://YOUR-USERNAME.github.io/road-dodge/`.

The site is static; no server or Java runtime is required. Saved coins and scores are stored separately in each player's browser. Clearing browser site data resets that progress.

## Controls

- Steer: `←` / `→` or `A` / `D`
- Menus: `↑` / `↓` or `W` / `S`
- Select: `Enter` or `Space`
- Back to menu: `Esc`
- On phones/tablets: hold the left/right buttons below the game

## Notes

This is a web adaptation of the uploaded Java Swing source, not a direct execution of Java Swing in the browser. It preserves the core gameplay and shop/progression concepts while using browser canvas rendering.
