import * as THREE from 'three';
import { getScene } from '../core/scene.js';
import { getCamera } from '../core/scene.js';
import { BULLET_SPEED } from '../core/constants.js';
import { createBullet } from '../combat/bullets.js';
import { createImpactMark } from '../combat/impactMarks.js';
import { checkPointCollision } from '../world/collision.js';

let gun = null;
let gunRecoil = 0;
let muzzleFlash = null;

export function createGun() {
    const gunGroup = new THREE.Group();
    // Use BRIGHT, OBVIOUS colors so it's impossible to miss
    const gunMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        metalness: 0.5,
        roughness: 0.5
    });
    const gunAccentMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444
    });
    
    // HUGE barrel - make it impossible to miss
    const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 2.0),
        gunMaterial
    );
    barrel.position.set(0, 0, -1.0);
    barrel.castShadow = true;
    gunGroup.add(barrel);
    
    // Large grip
    const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.7, 0.25),
        gunAccentMaterial
    );
    grip.position.set(0, -0.35, -0.5);
    grip.castShadow = true;
    gunGroup.add(grip);
    
    // Trigger guard
    const triggerGuard = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, 0.15),
        gunMaterial
    );
    triggerGuard.position.set(0, -0.25, -0.55);
    gunGroup.add(triggerGuard);
    
    // Large stock
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.7),
        gunMaterial
    );
    stock.position.set(0, 0, -1.5);
    gunGroup.add(stock);
    
    // Big sight
    const sight = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.3, 0.3),
        gunAccentMaterial
    );
    sight.position.set(0, 0.25, -2.0);
    gunGroup.add(sight);
    
    // Add gun to SCENE (not camera) - we'll update position each frame
    const scene = getScene();
    scene.add(gunGroup);
    gun = gunGroup;
    
    // Create muzzle flash
    const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0
    });
    muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    muzzleFlash.position.set(0, 0, -2.0);
    gunGroup.add(muzzleFlash);
    
    console.log('Gun created and added to scene!');
}

export function updateGunPosition() {
    if (!gun) return;
    
    const camera = getCamera();
    
    // Calculate gun position relative to camera
    // Base offset: right, down, forward (in camera space)
    const gunOffset = new THREE.Vector3(0.8, -0.6, -1.5);
    gunOffset.applyQuaternion(camera.quaternion);
    
    let newGunPosition = camera.position.clone().add(gunOffset);
    
    // Calculate where the gun barrel tip would be (gun extends forward about 2.2 units from center)
    // The barrel goes from z=-1.0 to z=-2.0, and sight extends to -2.0, so tip is around -2.2
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    const barrelTipOffset = forward.clone().multiplyScalar(2.2);
    const barrelTip = newGunPosition.clone().add(barrelTipOffset);
    
    // Prevent gun and barrel from going below ground level
    const groundLevel = 0.15; // Minimum height above ground
    const minGunY = groundLevel;
    const minBarrelY = groundLevel; // Barrel tip must be above ground
    
    // Adjust gun position if it or its barrel would go below ground
    if (newGunPosition.y < minGunY || barrelTip.y < minBarrelY) {
        // Calculate how much we need to raise the gun
        const gunRaise = Math.max(
            minGunY - newGunPosition.y,
            minBarrelY - barrelTip.y
        );
        
        if (gunRaise > 0) {
            newGunPosition.y += gunRaise;
        }
    }
    
    // Check for collisions with buildings/walls
    // If gun or barrel tip would collide, pull gun back towards camera
    const gunCollisionRadius = 0.15; // Small radius for gun collision check
    const barrelCollisionRadius = 0.1; // Even smaller for barrel tip
    
    if (checkPointCollision(newGunPosition, gunCollisionRadius) || 
        checkPointCollision(barrelTip, barrelCollisionRadius)) {
        // Pull gun back towards camera until it no longer collides
        const directionToCamera = new THREE.Vector3().subVectors(camera.position, newGunPosition);
        const distanceToCamera = directionToCamera.length();
        directionToCamera.normalize();
        
        const maxPullback = Math.min(1.5, distanceToCamera * 0.8); // Don't pull back more than 80% of distance to camera
        let pullbackDistance = 0;
        const pullbackStep = 0.05; // Small steps to find safe position
        
        while (pullbackDistance < maxPullback) {
            pullbackDistance += pullbackStep;
            const testPosition = newGunPosition.clone().add(
                directionToCamera.clone().multiplyScalar(pullbackDistance)
            );
            // Recalculate barrel tip for new position
            const testBarrelTip = testPosition.clone().add(barrelTipOffset);
            
            // Check if this position is safe
            if (!checkPointCollision(testPosition, gunCollisionRadius) && 
                !checkPointCollision(testBarrelTip, barrelCollisionRadius)) {
                newGunPosition = testPosition;
                break;
            }
        }
        
        // If we couldn't find a safe position, just pull it very close to camera
        if (pullbackDistance >= maxPullback) {
            const safeOffset = directionToCamera.clone().multiplyScalar(-0.2); // Very close to camera
            newGunPosition = camera.position.clone().add(safeOffset);
        }
    }
    
    gun.position.copy(newGunPosition);
    
    // Match camera rotation exactly (straight up and down)
    gun.rotation.copy(camera.rotation);
    
    // Update gun recoil animation
    if (gunRecoil > 0) {
        // Apply recoil (kick back and up)
        const recoilOffset = new THREE.Vector3(0, gunRecoil * 0.1, gunRecoil * 0.3);
        recoilOffset.applyQuaternion(camera.quaternion);
        gun.position.add(recoilOffset);
        gun.rotation.x -= gunRecoil * 0.5;
        
        // Re-check ground level after recoil
        const forwardAfterRecoil = new THREE.Vector3(0, 0, -1);
        forwardAfterRecoil.applyQuaternion(camera.quaternion);
        const barrelTipAfterRecoil = gun.position.clone().add(forwardAfterRecoil.multiplyScalar(2.2));
        
        if (gun.position.y < minGunY || barrelTipAfterRecoil.y < minBarrelY) {
            const gunRaise = Math.max(
                minGunY - gun.position.y,
                minBarrelY - barrelTipAfterRecoil.y
            );
            if (gunRaise > 0) {
                gun.position.y += gunRaise;
            }
        }
        
        // Decay recoil
        gunRecoil *= 0.85;
        
        // Reset when recoil is very small
        if (gunRecoil < 0.01) {
            gunRecoil = 0;
        }
    }
}

export function shoot() {
    const camera = getCamera();
    const scene = getScene();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.normalize();

    createBullet(camera.position, direction);

    // Client-side raycast to immediately show impact mark on walls/obstacles
    const raycaster = new THREE.Raycaster(camera.position, direction, 0, 100);
    const objectsToCheck = [];
    
    // Get all meshes in the scene (walls, obstacles, etc.)
    scene.traverse((object) => {
        if (object.isMesh && object !== gun && object.parent !== gun) {
            objectsToCheck.push(object);
        }
    });
    
    const intersects = raycaster.intersectObjects(objectsToCheck, false);
    if (intersects.length > 0) {
        const hit = intersects[0];
        // Create impact mark at hit point
        createImpactMark(hit.point, hit.face.normal);
        console.log('Raycast hit:', hit.point, 'normal:', hit.face.normal);
    }

    // Gun recoil animation
    if (gun) {
        gunRecoil = 0.15; // Recoil amount
    }
    
    // Muzzle flash effect
    if (muzzleFlash) {
        muzzleFlash.material.opacity = 1.0;
        setTimeout(() => {
            if (muzzleFlash) {
                muzzleFlash.material.opacity = 0;
            }
        }, 50); // Flash duration
    }
}

export function resetGun() {
    if (gun) {
        gunRecoil = 0;
    }
    if (muzzleFlash) {
        muzzleFlash.material.opacity = 0;
    }
}

