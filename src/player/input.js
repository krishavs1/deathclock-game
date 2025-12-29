import { getCamera } from '../core/scene.js';
import { MOUSE_SENSITIVITY } from '../core/constants.js';
import { getGameState } from '../game/state.js';
import { shoot } from './gun.js';

let keys = {};
let isPointerLocked = false;

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
    });

    // Shooting
    document.addEventListener('click', (e) => {
        if (getGameState() === 'playing' && isPointerLocked) {
            shoot();
        }
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

