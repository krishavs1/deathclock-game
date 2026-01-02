// Remote player management and rendering

import * as THREE from 'three';
import { getScene, getCamera } from '../core/scene.js';
import { getRemotePlayers } from '../network/networkState.js';
import { getInterpolationManager } from '../network/networkManager.js';
import { createPlayerModel, updateHealthBar } from './playerFactory.js';

let remotePlayers = new Map(); // playerId -> { mesh, parts, lastUpdate }
let playerColorIndex = 0;

export function createRemotePlayer(playerId, playerData) {
    const scene = getScene();

    // Create player model
    const playerParts = createPlayerModel(playerId, playerData.name || playerId, playerColorIndex++);
    // Set position with Y at ground level (feet on ground)
    // Server sends eye/camera height, but model should be positioned at ground level
    playerParts.group.position.set(
        playerData.position.x,
        0, // Ground level - player model's feet should be at y=0
        playerData.position.z
    );

    scene.add(playerParts.group);

    remotePlayers.set(playerId, {
        mesh: playerParts.group,
        parts: playerParts,
        lastUpdate: Date.now()
    });

    console.log('Created remote player:', playerId);
}

export function removeRemotePlayer(playerId) {
    const player = remotePlayers.get(playerId);
    if (player) {
        const scene = getScene();
        scene.remove(player.mesh);
        remotePlayers.delete(playerId);
        console.log('Removed remote player:', playerId);
    }
}

export function updateRemotePlayers(deltaTime) {
    const interpolationManager = getInterpolationManager();
    const networkPlayers = getRemotePlayers();
    const camera = getCamera();

    // Debug: log player count
    if (networkPlayers.size > 0 && Math.random() < 0.01) { // Log occasionally
        console.log(`Remote players: ${networkPlayers.size}, Rendered: ${remotePlayers.size}`);
    }

    // Update existing remote players
    for (const [playerId, player] of remotePlayers) {
        // Get interpolated state
        const interpolatedState = interpolationManager.getInterpolatedState(playerId);

        if (interpolatedState) {
            // Update position
            // Use X and Z from server, but set Y to 0 so feet are on ground
            // (Server sends eye/camera height at y=1.6, but model should be at ground level)
            player.mesh.position.set(
                interpolatedState.position.x,
                0, // Ground level - player model's feet should be at y=0
                interpolatedState.position.z
            );

            // Update rotation (only yaw for now)
            player.mesh.rotation.y = interpolatedState.rotation.y;

            // Walking animation
            player.parts.walkTime += deltaTime * 8;
            const walkPhase = Math.sin(player.parts.walkTime);

            // Animate arms
            const armSwing = walkPhase * 0.5;
            player.parts.leftArm.rotation.x = armSwing;
            player.parts.rightArm.rotation.x = -armSwing;

            // Animate legs
            const legSwing = walkPhase * 0.6;
            player.parts.leftLeg.rotation.x = legSwing;
            player.parts.rightLeg.rotation.x = -legSwing;

            // Body bob
            player.parts.body.position.y = 0.8 + Math.abs(walkPhase) * 0.05;
        }

        // Update health bar
        const playerData = networkPlayers.get(playerId);
        if (playerData && playerData.health !== undefined && playerData.maxHealth) {
            const healthPercent = playerData.health / playerData.maxHealth;
            updateHealthBar(player.parts.healthBar, healthPercent);
        }

        // Make name tag and health bar always face camera
        player.parts.nameTag.lookAt(camera.position);
        player.parts.healthBar.lookAt(camera.position);
    }

    // Create new remote players if they appeared
    for (const [playerId, playerData] of networkPlayers) {
        if (!remotePlayers.has(playerId)) {
            createRemotePlayer(playerId, playerData);
        }
    }

    // Remove remote players that are no longer in network state
    for (const playerId of remotePlayers.keys()) {
        if (!networkPlayers.has(playerId)) {
            removeRemotePlayer(playerId);
        }
    }
}

export function clearRemotePlayers() {
    const scene = getScene();
    for (const player of remotePlayers.values()) {
        scene.remove(player.mesh);
    }
    remotePlayers.clear();
    playerColorIndex = 0;
}

export function getRemotePlayerMeshes() {
    return Array.from(remotePlayers.values()).map(p => p.mesh);
}
