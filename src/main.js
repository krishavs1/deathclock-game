import { createScene, createCamera, createRenderer, addLighting, getCamera } from './core/scene.js';
import { createGround } from './world/ground.js';
import { createWalls } from './world/walls.js';
import { createObstacles } from './world/obstacles.js';
import { createPlayer, getPlayer } from './player/player.js';
import { createGun } from './player/gun.js';
import { setupEventListeners } from './player/input.js';
import { startAnimationLoop } from './core/loop.js';
import { initNetwork, on, joinGame } from './network/networkManager.js';
import { setPlayerId, setGameState } from './game/state.js';

async function init() {
    console.log('Initializing game...');

    // Create scene
    const scene = createScene();
    console.log('Scene created');

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

    // Initialize network
    console.log('Initializing network...');
    initNetwork('http://localhost:3000');

    // Setup network event handlers
    console.log('Setting up network handlers...');
    on('connect', () => {
        console.log('Connected to game server');
        updateConnectionStatus('Connected', true);
    });

    on('disconnect', () => {
        console.log('Disconnected from game server');
        updateConnectionStatus('Disconnected', false);
    });

    on('init', (data) => {
        console.log('Joined game as:', data.playerId);
        setPlayerId(data.playerId);

        // Sync local player position with server spawn position
        const localPlayer = getPlayer();
        const serverPlayerData = data.players.find(p => p.id === data.playerId);
        if (serverPlayerData && localPlayer) {
            localPlayer.position.set(
                serverPlayerData.position.x,
                serverPlayerData.position.y,
                serverPlayerData.position.z
            );
            const camera = getCamera();
            camera.position.copy(localPlayer.position);
            console.log('Synced local position with server:', localPlayer.position);
        }

        updateConnectionStatus(`Connected as ${data.playerId}`, true);
    });

    on('matchStart', (data) => {
        console.log('Match started - setting game state to playing');
        setGameState('playing');
    });

    on('matchCountdown', (data) => {
        console.log('Match countdown:', data.duration);
    });

    on('matchEnd', (data) => {
        console.log('Match ended');
        setGameState('gameover');
    });

    // Auto-join game (can be triggered by UI later)
    setTimeout(() => {
        joinGame('Player'); // TODO: Get name from UI
    }, 500);

    // Start animation loop
    startAnimationLoop();
}

function updateConnectionStatus(message, isConnected) {
    // Update UI with connection status
    // TODO: Create proper UI element for this
    console.log('Connection status:', message);
}

// Initialize when page loads
try {
    init();
} catch (error) {
    console.error('Failed to initialize game:', error);
    alert('Failed to initialize game. Check console for details. Error: ' + error.message);
}

