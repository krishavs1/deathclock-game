import * as THREE from 'three';
import { getScene } from '../core/scene.js';
import { getCamera } from '../core/scene.js';
import { BULLET_SPEED } from '../core/constants.js';
import { createBullet } from '../combat/bullets.js';
import { createImpactMark } from '../combat/impactMarks.js';

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
    const gunOffset = new THREE.Vector3(0.8, -0.6, -1.5);
    gunOffset.applyQuaternion(camera.quaternion);
    gun.position.copy(camera.position).add(gunOffset);
    
    // Match camera rotation exactly (straight up and down)
    gun.rotation.copy(camera.rotation);
    
    // Update gun recoil animation
    if (gunRecoil > 0) {
        // Apply recoil (kick back and up)
        const recoilOffset = new THREE.Vector3(0, gunRecoil * 0.1, gunRecoil * 0.3);
        recoilOffset.applyQuaternion(camera.quaternion);
        gun.position.add(recoilOffset);
        gun.rotation.x -= gunRecoil * 0.5;
        
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

