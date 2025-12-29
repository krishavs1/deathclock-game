import { getScene } from '../core/scene.js';
import { getPlayer } from '../player/player.js';
import { ENEMY_SPEED, ENEMY_SPAWN_DISTANCE } from '../core/constants.js';
import { createHumanoidEnemy } from './enemyFactory.js';
import * as THREE from 'three';

let enemies = [];

export function getEnemies() {
    return enemies;
}

export function clearEnemies() {
    const scene = getScene();
    enemies.forEach(enemy => {
        scene.remove(enemy.mesh);
    });
    enemies = [];
}

export function spawnEnemy() {
    const player = getPlayer();
    const scene = getScene();
    const angle = Math.random() * Math.PI * 2;
    const distance = ENEMY_SPAWN_DISTANCE;
    const spawnX = player.position.x + Math.cos(angle) * distance;
    const spawnZ = player.position.z + Math.sin(angle) * distance;

    const enemyParts = createHumanoidEnemy();
    enemyParts.group.position.set(spawnX, 0, spawnZ);

    scene.add(enemyParts.group);

    enemies.push({
        mesh: enemyParts.group,
        parts: enemyParts,
        health: 1,
        walkTime: Math.random() * Math.PI * 2 // Random starting phase for variety
    });
}

export function updateEnemies(deltaTime) {
    const player = getPlayer();
    const scene = getScene();
    enemies.forEach((enemy, index) => {
        // Move towards player
        const direction = new THREE.Vector3()
            .subVectors(player.position, enemy.mesh.position)
            .normalize();
        
        const moveVector = direction.multiplyScalar(ENEMY_SPEED * deltaTime);
        enemy.mesh.position.add(moveVector);

        // Rotate enemy to face player
        enemy.mesh.lookAt(player.position);

        // Update walking animation
        enemy.walkTime += deltaTime * 8; // Animation speed
        const walkPhase = Math.sin(enemy.walkTime);
        
        // Animate arms (swing opposite to legs)
        const armSwing = walkPhase * 0.5; // Swing angle in radians
        enemy.parts.leftArm.rotation.x = armSwing;
        enemy.parts.rightArm.rotation.x = -armSwing;
        
        // Animate legs (alternating)
        const legSwing = walkPhase * 0.6; // Leg swing angle
        enemy.parts.leftLeg.rotation.x = legSwing;
        enemy.parts.rightLeg.rotation.x = -legSwing;
        
        // Add slight body bob
        enemy.parts.body.position.y = 0.8 + Math.abs(walkPhase) * 0.05;

        // Check collision with player
        const distance = enemy.mesh.position.distanceTo(player.position);
        if (distance < 1.5) {
            // Enemy hit player - remove enemy (no time penalty, just remove)
            scene.remove(enemy.mesh);
            enemies = enemies.filter(e => e !== enemy);
        }
    });
}

export function removeEnemy(enemy) {
    const scene = getScene();
    scene.remove(enemy.mesh);
    enemies = enemies.filter(e => e !== enemy);
}

