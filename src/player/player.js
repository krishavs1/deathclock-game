import * as THREE from 'three';
import { getCamera } from '../core/scene.js';
import { MOVE_SPEED } from '../core/constants.js';
import { getKeys } from './input.js';
import { updateGunPosition } from './gun.js';

let player = null;

export function createPlayer() {
    player = {
        position: new THREE.Vector3(0, 1.6, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 0, -1)
    };
    return player;
}

export function getPlayer() {
    return player;
}

export function resetPlayer() {
    if (player) {
        player.position.set(0, 1.6, 0);
        player.velocity.set(0, 0, 0);
        player.direction.set(0, 0, -1);
    }
}

export function updatePlayer(deltaTime) {
    const keys = getKeys();
    const camera = getCamera();
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

    player.position.add(moveVector);

    // Keep player within bounds
    const boundary = 90;
    player.position.x = Math.max(-boundary, Math.min(boundary, player.position.x));
    player.position.z = Math.max(-boundary, Math.min(boundary, player.position.z));

    camera.position.copy(player.position);
    
    // Always ensure camera never rolls (keep ground level)
    camera.rotation.z = 0;
    
    // Update gun position and rotation to follow camera (FPV style)
    updateGunPosition();
}

