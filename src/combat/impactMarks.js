import * as THREE from 'three';
import { getScene } from '../core/scene.js';

let impactMarks = [];

const MAX_MARKS = 100;
const MARK_PROXIMITY_THRESHOLD = 0.15;
const MARK_LIFETIME = 3000;

export function createImpactMark(position, normal) {
    const scene = getScene();
    
    for (const existingMark of impactMarks) {
        const distance = existingMark.position.distanceTo(position);
        if (distance < MARK_PROXIMITY_THRESHOLD) {
            const randomRotation = Math.random() * Math.PI * 2;
            existingMark.rotateOnAxis(normal, randomRotation);
            return existingMark;
        }
    }
    
    const markGeometry = new THREE.ConeGeometry(0.15, 0.1, 3);
    const markMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        metalness: 0.3,
        roughness: 0.7
    });
    
    const mark = new THREE.Mesh(markGeometry, markMaterial);
    const offset = normal.clone().multiplyScalar(0.01);
    mark.position.copy(position).add(offset);
    
    mark.userData.originalPosition = position.clone();
    mark.userData.normal = normal.clone();
    
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    
    if (Math.abs(normal.dot(up)) > 0.99) {
        quaternion.setFromUnitVectors(up, normal.y > 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0));
    } else {
        quaternion.setFromUnitVectors(up, normal);
    }
    
    mark.quaternion.copy(quaternion);
    
    const randomRotation = Math.random() * Math.PI * 2;
    mark.rotateOnAxis(normal, randomRotation);
    
    scene.add(mark);
    mark.userData.createdAt = Date.now();
    impactMarks.push(mark);
    
    setTimeout(() => {
        removeImpactMark(mark);
    }, MARK_LIFETIME);
    
    if (impactMarks.length > MAX_MARKS) {
        const oldMark = impactMarks.shift();
        removeImpactMark(oldMark);
    }
    
    return mark;
}

function removeImpactMark(mark) {
    const scene = getScene();
    const index = impactMarks.indexOf(mark);
    if (index !== -1) {
        scene.remove(mark);
        mark.geometry.dispose();
        mark.material.dispose();
        impactMarks.splice(index, 1);
    }
}

export function clearImpactMarks() {
    const scene = getScene();
    impactMarks.forEach(mark => {
        scene.remove(mark);
        mark.geometry.dispose();
        mark.material.dispose();
    });
    impactMarks = [];
}

export function getImpactMarks() {
    return impactMarks;
}

