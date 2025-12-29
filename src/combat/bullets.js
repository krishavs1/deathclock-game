import * as THREE from 'three';
import { getScene } from '../core/scene.js';
import { BULLET_SPEED } from '../core/constants.js';
import { getEnemies, removeEnemy } from '../enemies/enemySystem.js';
import { addDeathclock, addScore } from '../game/state.js';
import { updateUI } from '../ui/ui.js';

let bullets = [];

export function getBullets() {
    return bullets;
}

export function clearBullets() {
    const scene = getScene();
    bullets.forEach(bullet => {
        scene.remove(bullet);
    });
    bullets = [];
}

export function createBullet(position, direction) {
    const scene = getScene();
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.copy(position);
    bullet.velocity = direction.multiplyScalar(BULLET_SPEED);
    bullet.castShadow = true;
    
    scene.add(bullet);
    bullets.push(bullet);

    // Remove bullet after 2 seconds if it doesn't hit anything
    setTimeout(() => {
        if (bullets.includes(bullet)) {
            scene.remove(bullet);
            bullets = bullets.filter(b => b !== bullet);
        }
    }, 2000);
}

export function updateBullets(deltaTime) {
    const scene = getScene();
    bullets.forEach((bullet, index) => {
        const moveVector = bullet.velocity.clone().multiplyScalar(deltaTime);
        bullet.position.add(moveVector);

        // Check collision with enemies
        const enemies = getEnemies();
        enemies.forEach((enemy, enemyIndex) => {
            const distance = bullet.position.distanceTo(enemy.mesh.position);
            if (distance < 1) {
                // Hit enemy - add 1 second to deathclock
                scene.remove(bullet);
                bullets = bullets.filter(b => b !== bullet);
                removeEnemy(enemy);
                addDeathclock(1.0); // Add 1 second
                addScore(10);
                updateUI();
            }
        });

        // Remove if too far
        if (bullet.position.length() > 100) {
            scene.remove(bullet);
            bullets = bullets.filter(b => b !== bullet);
        }
    });
}

