import * as THREE from 'three';

export function createHumanoidEnemy() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    
    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 1.5, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);
    
    // Body (box)
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.set(0, 0.8, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Left arm - positioned at shoulder, will rotate around shoulder
    const armGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-0.35, 0.8, 0);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    // Set pivot point at shoulder
    leftArm.position.y -= 0.25; // Move down so rotation is at shoulder
    group.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(0.35, 0.8, 0);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    rightArm.position.y -= 0.25; // Move down so rotation is at shoulder
    group.add(rightArm);
    
    // Left leg - positioned at hip, will rotate around hip
    const legGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.15, 0.15, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    // Set pivot point at hip
    leftLeg.position.y -= 0.25; // Move down so rotation is at hip
    group.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.15, 0.15, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    rightLeg.position.y -= 0.25; // Move down so rotation is at hip
    group.add(rightLeg);
    
    return {
        group: group,
        leftArm: leftArm,
        rightArm: rightArm,
        leftLeg: leftLeg,
        rightLeg: rightLeg,
        body: body
    };
}

