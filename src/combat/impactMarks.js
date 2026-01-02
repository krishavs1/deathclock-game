// Impact marks system - creates visual marks on surfaces when bullets hit

import * as THREE from 'three';
import { getScene } from '../core/scene.js';

let impactMarks = [];

// Maximum number of marks to keep (prevent memory issues)
const MAX_MARKS = 100;
const MARK_PROXIMITY_THRESHOLD = 0.5; // Distance threshold to consider marks "at the same spot"

export function createImpactMark(position, normal) {
    const scene = getScene();
    
    // Check if there's already a mark very close to this position
    // If so, just update that mark's rotation instead of creating a new one
    for (const existingMark of impactMarks) {
        const distance = existingMark.position.distanceTo(position);
        if (distance < MARK_PROXIMITY_THRESHOLD) {
            // Mark already exists nearby - just rotate it randomly for variety
            const randomRotation = Math.random() * Math.PI * 2;
            existingMark.rotateOnAxis(normal, randomRotation);
            console.log('Updated existing mark at:', position);
            return existingMark;
        }
    }
    
    // Create a smaller triangle mark
    const markGeometry = new THREE.ConeGeometry(0.15, 0.1, 3);
    const markMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666, // Darker gray for better visibility
        metalness: 0.3,
        roughness: 0.7
    });
    
    const mark = new THREE.Mesh(markGeometry, markMaterial);
    
    // Position the mark ON the surface (minimal offset to avoid z-fighting)
    // The offset should be very small and always away from the surface
    const offset = normal.clone().multiplyScalar(0.01); // Small offset
    mark.position.copy(position).add(offset);
    
    // Store the original position and normal for reference
    mark.userData.originalPosition = position.clone();
    mark.userData.normal = normal.clone();
    
    // Orient the mark to face the normal (perpendicular to surface)
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    
    // Handle case where normal is parallel to up vector
    if (Math.abs(normal.dot(up)) > 0.99) {
        // Use a different up vector
        quaternion.setFromUnitVectors(up, normal.y > 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0));
    } else {
        quaternion.setFromUnitVectors(up, normal);
    }
    
    mark.quaternion.copy(quaternion);
    
    // Rotate randomly around the normal for variety
    const randomRotation = Math.random() * Math.PI * 2;
    mark.rotateOnAxis(normal, randomRotation);
    
    scene.add(mark);
    impactMarks.push(mark);
    
    console.log('Impact mark created at:', mark.position, 'total marks:', impactMarks.length);
    
    // Limit the number of marks
    if (impactMarks.length > MAX_MARKS) {
        const oldMark = impactMarks.shift();
        scene.remove(oldMark);
        oldMark.geometry.dispose();
        oldMark.material.dispose();
    }
    
    return mark;
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

