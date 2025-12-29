# 3D Shooter Game

A first-person 3D shooter game built with Three.js.

## Features

- First-person perspective with mouse look controls
- WASD movement controls
- Shooting mechanics with bullet physics
- Enemy AI that spawns and chases the player
- Collision detection
- Health and score system
- Game over screen
- Dynamic lighting and shadows
- Procedurally generated obstacles

## How to Play

1. Click "Start Game" to begin
2. Use **WASD** keys to move around
3. Move your **mouse** to look around
4. **Click** to shoot at enemies
5. Survive as long as possible and rack up points!

## Controls

- **W** - Move forward
- **S** - Move backward
- **A** - Strafe left
- **D** - Strafe right
- **Mouse** - Look around
- **Click** - Shoot

## Installation & Running

### Option 1: Using npm (recommended)

```bash
npm install
npm start
```

Then open your browser to the URL shown (usually `http://localhost:3000`)

### Option 2: Using a simple HTTP server

If you have Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Direct file access

You can also open `index.html` directly in a modern browser, though some features may be limited due to CORS restrictions.

## Game Mechanics

- **Health**: Starts at 100, decreases by 10 when an enemy touches you
- **Score**: Gain 10 points for each enemy defeated
- **Enemies**: Spawn every 2 seconds and chase the player
- **Bullets**: Travel at high speed and destroy enemies on contact

## Technologies Used

- Three.js - 3D graphics library
- Vanilla JavaScript - Game logic
- HTML5 Canvas - Rendering
- CSS3 - UI styling

Enjoy the game!


