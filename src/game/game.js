import { setGameState, setScore, setGameStartTime, getScore } from './state.js';
import { getCamera } from '../core/scene.js';
import { getPlayer, resetPlayer } from '../player/player.js';
import { resetGun } from '../player/gun.js';
import { clearBullets } from '../combat/bullets.js';
import { clearImpactMarks } from '../combat/impactMarks.js';
import { clearRemotePlayers } from '../multiplayer/remotePlayer.js';
import { updateUI } from '../ui/ui.js';

export function startGame() {
    setGameState('playing');
    setScore(0);
    // Note: Don't clear remote players in multiplayer
    clearBullets();
    clearImpactMarks();
    setGameStartTime(performance.now() / 1000); // Track game start time
    
    resetPlayer();
    const camera = getCamera();
    camera.position.copy(getPlayer().position);
    camera.rotation.set(0, 0, 0);
    camera.rotation.order = 'YXZ'; // Ensure rotation order is set
    
    resetGun();

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    updateUI();
    
    if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
    }
}

export function gameOver() {
    setGameState('gameover');
    document.exitPointerLock();
    document.getElementById('finalScore').textContent = getScore();
    document.getElementById('gameOverScreen').classList.remove('hidden');
}


