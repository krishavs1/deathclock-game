import * as THREE from 'three';
import { getCamera } from '../core/scene.js';
import { MOVE_SPEED, JUMP_FORCE, GRAVITY, GROUND_HEIGHT } from '../core/constants.js';
import { getKeys } from './input.js';
import { updateGunPosition } from './gun.js';
import { sendInput, getClientPrediction } from '../network/networkManager.js';
import { getGameState } from '../game/state.js';
import { checkCollision, resolveCollision } from '../world/collision.js';

let player = null;

export function createPlayer() {
    player = {
        position: new THREE.Vector3(0, GROUND_HEIGHT, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        verticalVelocity: 0, // Separate vertical velocity for jumping
        isGrounded: true,
        direction: new THREE.Vector3(0, 0, -1),
        playerId: null, // Will be set when network initializes
        isLocal: true
    };
    return player;
}

export function setPlayerNetworkId(playerId) {
    if (player) {
        player.playerId = playerId;
    }
}

export function getPlayer() {
    return player;
}

export function resetPlayer() {
    if (player) {
        player.position.set(0, GROUND_HEIGHT, 0);
        player.velocity.set(0, 0, 0);
        player.verticalVelocity = 0;
        player.isGrounded = true;
        player.direction.set(0, 0, -1);
    }
}

export function updatePlayer(deltaTime) {
    const keys = getKeys();
    const camera = getCamera();
    const gameState = getGameState();

    // Send input to server (multiplayer)
    if (gameState === 'playing') {
        const rotation = {
            x: camera.rotation.x,
            y: camera.rotation.y
        };
        sendInput(keys, rotation);
    }

    // Handle jumping
    if (keys['Space'] && player.isGrounded) {
        player.verticalVelocity = JUMP_FORCE;
        player.isGrounded = false;
    }

    // Apply gravity
    if (!player.isGrounded) {
        player.verticalVelocity += GRAVITY * deltaTime;
    }

    // Update vertical position
    player.position.y += player.verticalVelocity * deltaTime;

    // Check if player hit ground
    if (player.position.y <= GROUND_HEIGHT) {
        player.position.y = GROUND_HEIGHT;
        player.verticalVelocity = 0;
        player.isGrounded = true;
    }

    // Client-side prediction for local player
    const moveVector = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    if (keys['KeyW']) moveVector.add(forward);
    if (keys['KeyS']) moveVector.sub(forward);
    if (keys['KeyA']) moveVector.sub(right);
    if (keys['KeyD']) moveVector.add(right);

    moveVector.normalize();
    moveVector.multiplyScalar(MOVE_SPEED * deltaTime);

    // Store old position for collision detection
    const oldPosition = player.position.clone();
    const newPosition = oldPosition.clone().add(moveVector);

    // Check for collisions with obstacles and walls
    if (checkCollision(newPosition, 0.5)) {
        // Try to slide along the obstacle
        const resolvedPosition = resolveCollision(oldPosition, newPosition, 0.5);
        player.position.copy(resolvedPosition);
    } else {
        // No collision, move normally
        player.position.copy(newPosition);
    }

    // Keep player within bounds
    const boundary = 90;
    player.position.x = Math.max(-boundary, Math.min(boundary, player.position.x));
    player.position.z = Math.max(-boundary, Math.min(boundary, player.position.z));

    camera.position.copy(player.position);

    // Always ensure camera never rolls (keep ground level)
    camera.rotation.z = 0;

    // Update gun position and rotation to follow camera (FPV style)
    updateGunPosition();

    // Store predicted position for client prediction
    const clientPrediction = getClientPrediction();
    if (clientPrediction && gameState === 'playing') {
        const rotation = {
            x: camera.rotation.x,
            y: camera.rotation.y
        };
        clientPrediction.addInput(keys, rotation, player.position);
    }
}

