import { sendShoot } from '../network/networkManager.js';
import { createImpactMark } from './impactMarks.js';
import { getNetworkBullets } from '../network/networkState.js';
import * as THREE from 'three';

// Track bullets to detect when they expire (hit walls)
let previousBulletIds = new Set();
let bulletDirections = new Map(); // bulletId -> direction
let bulletLastPositions = new Map(); // bulletId -> last position

export function getBullets() {
    return []; // No bullets rendered
}

export function clearBullets() {
    previousBulletIds.clear();
    bulletDirections.clear();
    bulletLastPositions.clear();
}

export function createBullet(position, direction) {
    // Send shoot event to server (server will handle bullet creation and physics)
    sendShoot(position, direction);
}

// Handle bullet impact from server (player hits)
export function handleBulletImpact(hitData) {
    if (hitData.position) {
        const position = new THREE.Vector3(
            hitData.position.x,
            hitData.position.y,
            hitData.position.z
        );
        
        // Calculate normal from bullet direction (opposite of velocity)
        const direction = bulletDirections.get(hitData.bulletId);
        const normal = direction 
            ? direction.clone().negate().normalize()
            : new THREE.Vector3(0, 0, 1); // Default: facing forward
        
        createImpactMark(position, normal);
        
        // Remove from tracking
        bulletDirections.delete(hitData.bulletId);
    }
}

export function updateBullets(deltaTime) {
    // Get network bullets from server state
    const networkBullets = getNetworkBullets();
    const currentBulletIds = new Set(networkBullets.keys());
    
    // Debug: log bullet count occasionally
    if (Math.random() < 0.01 && networkBullets.size > 0) {
        console.log('Network bullets:', networkBullets.size, 'Previous:', previousBulletIds.size);
    }
    
    // Store bullet directions and positions for impact marks
    for (const [bulletId, bulletData] of networkBullets) {
        if (bulletData.velocity) {
            // Store normalized direction
            const direction = new THREE.Vector3(
                bulletData.velocity.x,
                bulletData.velocity.y,
                bulletData.velocity.z
            ).normalize();
            bulletDirections.set(bulletId, direction);
        }
        
        if (bulletData.position) {
            // Store last known position
            const position = new THREE.Vector3(
                bulletData.position.x,
                bulletData.position.y,
                bulletData.position.z
            );
            bulletLastPositions.set(bulletId, position);
        }
    }
    
    // Detect expired bullets (hit walls/obstacles or went out of bounds)
    for (const bulletId of previousBulletIds) {
        if (!currentBulletIds.has(bulletId)) {
            // Bullet expired - create impact mark at last known position
            const lastPosition = bulletLastPositions.get(bulletId);
            if (lastPosition) {
                // Get direction for normal calculation
                const direction = bulletDirections.get(bulletId);
                const normal = direction 
                    ? direction.clone().negate().normalize()
                    : new THREE.Vector3(0, 0, 1);
                
                console.log('Creating impact mark at:', lastPosition, 'normal:', normal);
                createImpactMark(lastPosition, normal);
            } else {
                console.log('Bullet expired but no last position:', bulletId);
            }
            
            // Clean up
            bulletDirections.delete(bulletId);
            bulletLastPositions.delete(bulletId);
        }
    }
    
    previousBulletIds = currentBulletIds;
}

