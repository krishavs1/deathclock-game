// Collision detection system for player vs obstacles and walls

import * as THREE from 'three';
import { getScene } from '../core/scene.js';

let collisionObjects = [];

export function registerCollisionObject(mesh) {
    collisionObjects.push(mesh);
}

export function clearCollisionObjects() {
    collisionObjects = [];
}

export function checkCollision(position, radius = 0.5) {
    // Create a bounding sphere for the player at the new position
    const playerSphere = new THREE.Sphere(position, radius);
    
    for (const obj of collisionObjects) {
        // Get object's bounding box
        const box = new THREE.Box3().setFromObject(obj);
        
        // Check if player sphere intersects with object's bounding box
        if (box.intersectsSphere(playerSphere)) {
            // More precise check: check if position is inside the box
            if (box.containsPoint(position)) {
                return true;
            }
            
            // Check distance from position to box edges
            const closestPoint = box.clampPoint(position, new THREE.Vector3());
            const distance = position.distanceTo(closestPoint);
            if (distance < radius) {
                return true;
            }
        }
    }
    
    return false;
}

export function resolveCollision(oldPosition, newPosition, radius = 0.5) {
    // Try to slide along the obstacle
    const direction = new THREE.Vector3().subVectors(newPosition, oldPosition);
    const distance = direction.length();
    
    if (distance === 0) return oldPosition;
    
    direction.normalize();
    
    // Try moving only in X direction
    const testPosX = new THREE.Vector3(newPosition.x, oldPosition.y, oldPosition.z);
    if (!checkCollision(testPosX, radius)) {
        return testPosX;
    }
    
    // Try moving only in Z direction
    const testPosZ = new THREE.Vector3(oldPosition.x, oldPosition.y, newPosition.z);
    if (!checkCollision(testPosZ, radius)) {
        return testPosZ;
    }
    
    // Can't move, stay in old position
    return oldPosition;
}

