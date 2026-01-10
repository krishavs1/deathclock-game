import * as THREE from 'three';

let collisionObjects = [];

export function registerCollisionObject(mesh) {
    collisionObjects.push(mesh);
}

export function clearCollisionObjects() {
    collisionObjects = [];
}

export function checkCollision(position, radius = 0.5) {
    const playerSphere = new THREE.Sphere(position, radius);
    
    for (const obj of collisionObjects) {
        const box = new THREE.Box3().setFromObject(obj);
        
        if (box.intersectsSphere(playerSphere)) {
            if (box.containsPoint(position)) {
                return true;
            }
            
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
    const direction = new THREE.Vector3().subVectors(newPosition, oldPosition);
    const distance = direction.length();
    
    if (distance === 0) return oldPosition;
    
    direction.normalize();
    
    const testPosX = new THREE.Vector3(newPosition.x, oldPosition.y, oldPosition.z);
    if (!checkCollision(testPosX, radius)) {
        return testPosX;
    }
    
    const testPosZ = new THREE.Vector3(oldPosition.x, oldPosition.y, newPosition.z);
    if (!checkCollision(testPosZ, radius)) {
        return testPosZ;
    }
    
    return oldPosition;
}

export function checkPointCollision(point, radius = 0.1) {
    for (const obj of collisionObjects) {
        const box = new THREE.Box3().setFromObject(obj);
        
        if (box.containsPoint(point)) {
            return true;
        }
        
        const closestPoint = box.clampPoint(point, new THREE.Vector3());
        const distance = point.distanceTo(closestPoint);
        if (distance < radius) {
            return true;
        }
    }
    
    return false;
}

