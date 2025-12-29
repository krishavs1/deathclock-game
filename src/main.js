import { createScene, createCamera, createRenderer, addLighting } from './core/scene.js';
import { createGround } from './world/ground.js';
import { createWalls } from './world/walls.js';
import { createObstacles } from './world/obstacles.js';
import { createPlayer } from './player/player.js';
import { createGun } from './player/gun.js';
import { setupEventListeners } from './player/input.js';
import { startAnimationLoop } from './core/loop.js';

function init() {
    // Create scene
    const scene = createScene();

    // Create camera
    createCamera();

    // Create renderer
    createRenderer();

    // Add lighting
    addLighting(scene);

    // Create ground
    createGround(scene);

    // Create walls/boundaries
    createWalls(scene);

    // Create obstacles
    createObstacles(scene);

    // Create player (invisible, camera represents player)
    createPlayer();

    // Create gun
    createGun();

    // Event listeners
    setupEventListeners();

    // Start animation loop
    startAnimationLoop();
}

// Initialize when page loads
init();

