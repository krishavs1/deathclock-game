import { getCamera } from '../core/scene.js';
import { MOUSE_SENSITIVITY, FIRE_RATE } from '../core/constants.js';
import { getGameState } from '../game/state.js';
import { shoot } from './gun.js';

let keys = {};
let isPointerLocked = false;
let isMouseDown = false;
let shootingInterval = null;

export function getKeys() {
    return keys;
}

export function getIsPointerLocked() {
    return isPointerLocked;
}

export function setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Mouse movement
    document.addEventListener('mousemove', onMouseMove);

    // Pointer lock
    document.addEventListener('click', () => {
        if (getGameState() === 'playing' && !isPointerLocked) {
            document.body.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === document.body;
        // Stop shooting if pointer lock is lost
        if (!isPointerLocked) {
            stopShooting();
        }
    });

    // Shooting - continuous fire on mouse hold
    document.addEventListener('mousedown', (e) => {
        if (getGameState() === 'playing' && isPointerLocked && e.button === 0) {
            startShooting();
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            stopShooting();
        }
    });

    // Also handle when mouse leaves window
    document.addEventListener('mouseleave', () => {
        stopShooting();
    });

    // Window resize
    window.addEventListener('resize', () => {
        const camera = getCamera();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        import('../core/scene.js').then(({ getRenderer }) => {
            getRenderer().setSize(window.innerWidth, window.innerHeight);
        });
    });

    // Start button - import dynamically to avoid circular dependency
    document.getElementById('startButton').addEventListener('click', () => {
        import('../game/game.js').then(({ startGame }) => startGame());
    });
    document.getElementById('restartButton').addEventListener('click', () => {
        import('../game/game.js').then(({ startGame }) => startGame());
    });
}

function onMouseMove(e) {
    if (!isPointerLocked || getGameState() !== 'playing') return;

    const camera = getCamera();
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    // Rotate camera horizontally (yaw)
    camera.rotation.y -= movementX * MOUSE_SENSITIVITY;

    // Rotate camera vertically (pitch with limits)
    camera.rotation.x -= movementY * MOUSE_SENSITIVITY;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    
    // Always prevent roll (keep ground parallel to bottom edge)
    camera.rotation.z = 0;
    
    // Set rotation order to prevent gimbal lock issues
    camera.rotation.order = 'YXZ';
}

function startShooting() {
    if (shootingInterval) return; // Already shooting
    
    isMouseDown = true;
    const fireDelay = 1000 / FIRE_RATE; // Convert to milliseconds
    
    // Shoot immediately
    if (getGameState() === 'playing' && isPointerLocked) {
        shoot();
    }
    
    // Then continue shooting at fire rate
    shootingInterval = setInterval(() => {
        if (getGameState() === 'playing' && isPointerLocked && isMouseDown) {
            shoot();
        } else {
            stopShooting();
        }
    }, fireDelay);
}

function stopShooting() {
    isMouseDown = false;
    if (shootingInterval) {
        clearInterval(shootingInterval);
        shootingInterval = null;
    }
}

