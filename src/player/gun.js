import * as THREE from 'three';
import { getScene, getCamera } from '../core/scene.js';
import { createBullet } from '../combat/bullets.js';
import { createImpactMark } from '../combat/impactMarks.js';
import { checkPointCollision } from '../world/collision.js';

let gun = null;
let gunRecoil = 0;
let muzzleFlash = null;

export function createGun() {
    const gunGroup = new THREE.Group();
    const gunMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        metalness: 0.5,
        roughness: 0.5
    });
    const gunAccentMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444
    });
    
    const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 2.0),
        gunMaterial
    );
    barrel.position.set(0, 0, -1.0);
    barrel.castShadow = true;
    gunGroup.add(barrel);
    
    const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.7, 0.25),
        gunAccentMaterial
    );
    grip.position.set(0, -0.35, -0.5);
    grip.castShadow = true;
    gunGroup.add(grip);
    
    const triggerGuard = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, 0.15),
        gunMaterial
    );
    triggerGuard.position.set(0, -0.25, -0.55);
    gunGroup.add(triggerGuard);
    
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.7),
        gunMaterial
    );
    stock.position.set(0, 0, -1.5);
    gunGroup.add(stock);
    
    const sight = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.3, 0.3),
        gunAccentMaterial
    );
    sight.position.set(0, 0.25, -2.0);
    gunGroup.add(sight);
    
    const scene = getScene();
    scene.add(gunGroup);
    gun = gunGroup;
    
    const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0
    });
    muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    muzzleFlash.position.set(0, 0, -2.0);
    gunGroup.add(muzzleFlash);
}

export function updateGunPosition() {
    if (!gun) return;
    
    const camera = getCamera();
    
    const gunOffset = new THREE.Vector3(0.8, -0.6, -1.5);
    gunOffset.applyQuaternion(camera.quaternion);
    
    let newGunPosition = camera.position.clone().add(gunOffset);
    
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    const barrelTipOffset = forward.clone().multiplyScalar(2.2);
    const barrelTip = newGunPosition.clone().add(barrelTipOffset);
    
    const groundLevel = 0.15;
    const minGunY = groundLevel;
    const minBarrelY = groundLevel;
    
    if (newGunPosition.y < minGunY || barrelTip.y < minBarrelY) {
        const gunRaise = Math.max(
            minGunY - newGunPosition.y,
            minBarrelY - barrelTip.y
        );
        
        if (gunRaise > 0) {
            newGunPosition.y += gunRaise;
        }
    }
    
    const gunCollisionRadius = 0.15;
    const barrelCollisionRadius = 0.1;
    
    if (checkPointCollision(newGunPosition, gunCollisionRadius) || 
        checkPointCollision(barrelTip, barrelCollisionRadius)) {
        const directionToCamera = new THREE.Vector3().subVectors(camera.position, newGunPosition);
        const distanceToCamera = directionToCamera.length();
        directionToCamera.normalize();
        
        const maxPullback = Math.min(1.5, distanceToCamera * 0.8);
        let pullbackDistance = 0;
        const pullbackStep = 0.05;
        
        while (pullbackDistance < maxPullback) {
            pullbackDistance += pullbackStep;
            const testPosition = newGunPosition.clone().add(
                directionToCamera.clone().multiplyScalar(pullbackDistance)
            );
            const testBarrelTip = testPosition.clone().add(barrelTipOffset);
            
            if (!checkPointCollision(testPosition, gunCollisionRadius) && 
                !checkPointCollision(testBarrelTip, barrelCollisionRadius)) {
                newGunPosition = testPosition;
                break;
            }
        }
        
        if (pullbackDistance >= maxPullback) {
            const safeOffset = directionToCamera.clone().multiplyScalar(-0.2);
            newGunPosition = camera.position.clone().add(safeOffset);
        }
    }
    
    gun.position.copy(newGunPosition);
    gun.rotation.copy(camera.rotation);
    
    if (gunRecoil > 0) {
        const recoilOffset = new THREE.Vector3(0, gunRecoil * 0.1, gunRecoil * 0.3);
        recoilOffset.applyQuaternion(camera.quaternion);
        gun.position.add(recoilOffset);
        gun.rotation.x -= gunRecoil * 0.5;
        
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
        
        gunRecoil *= 0.85;
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

    const raycaster = new THREE.Raycaster(camera.position, direction, 0, 100);
    const objectsToCheck = [];
    
    scene.traverse((object) => {
        if (object.isMesh && object !== gun && object.parent !== gun) {
            objectsToCheck.push(object);
        }
    });
    
    const intersects = raycaster.intersectObjects(objectsToCheck, false);
    if (intersects.length > 0) {
        const hit = intersects[0];
        createImpactMark(hit.point, hit.face.normal);
    }

    if (gun) {
        gunRecoil = 0.15;
    }
    
    if (muzzleFlash) {
        muzzleFlash.material.opacity = 1.0;
        setTimeout(() => {
            if (muzzleFlash) {
                muzzleFlash.material.opacity = 0;
            }
        }, 50);
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

