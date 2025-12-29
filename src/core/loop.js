import { getScene, getCamera, getRenderer } from './scene.js';
import { updatePlayer } from '../player/player.js';
import { updateBullets } from '../combat/bullets.js';
import { updateEnemies, spawnEnemy } from '../enemies/enemySystem.js';
import { ENEMY_SPAWN_RATE } from './constants.js';
import { getGameState } from '../game/state.js';
import { updateDeathclock, gameOver } from '../game/game.js';
import { updateUI } from '../ui/ui.js';

let lastTime = 0;
let enemySpawnTimer = 0;

export function startAnimationLoop() {
    animate();
}

function animate(currentTime = 0) {
    requestAnimationFrame(animate);

    const scene = getScene();
    const camera = getCamera();
    const renderer = getRenderer();
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    const gameState = getGameState();
    if (gameState === 'playing') {
        updatePlayer(deltaTime);
        updateBullets(deltaTime);
        updateEnemies(deltaTime);

        // Countdown deathclock
        updateDeathclock(deltaTime);
        updateUI();

        // Spawn enemies
        enemySpawnTimer += deltaTime * 1000;
        if (enemySpawnTimer >= ENEMY_SPAWN_RATE) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }
    } else {
        // Reset timer when not playing
        enemySpawnTimer = 0;
    }
    
    renderer.render(scene, camera);
}

export function resetEnemySpawnTimer() {
    enemySpawnTimer = 0;
}

export function getEnemySpawnTimer() {
    return enemySpawnTimer;
}

