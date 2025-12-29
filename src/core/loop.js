import { getScene, getCamera, getRenderer } from './scene.js';
import { updatePlayer } from '../player/player.js';
import { updateBullets } from '../combat/bullets.js';
import { updateRemotePlayers } from '../multiplayer/remotePlayer.js';
import { getGameState } from '../game/state.js';
import { updateUI } from '../ui/ui.js';

let lastTime = 0;

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
        updateRemotePlayers(deltaTime);
        updateUI();
    }

    // Always update remote players (even in lobby)
    if (gameState !== 'playing') {
        updateRemotePlayers(deltaTime);
    }
    
    renderer.render(scene, camera);
}

// Enemy spawn functions removed - now using multiplayer

