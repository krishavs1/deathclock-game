// Player model factory - creates visual representation for remote players

import * as THREE from 'three';

// Color palette for players
const PLAYER_COLORS = [
    0x00ff00, // Green
    0x0000ff, // Blue
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff, // Cyan
    0xff8800, // Orange
    0x8800ff, // Purple
    0xff0088  // Pink
];

export function createPlayerModel(playerId, playerName = 'Player', colorIndex = 0) {
    const group = new THREE.Group();
    const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
    const material = new THREE.MeshStandardMaterial({ color });

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

    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-0.35, 0.8, 0);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    leftArm.position.y -= 0.25;
    group.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(0.35, 0.8, 0);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    rightArm.position.y -= 0.25;
    group.add(rightArm);

    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.15, 0.15, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    leftLeg.position.y -= 0.25;
    group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.15, 0.15, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    rightLeg.position.y -= 0.25;
    group.add(rightLeg);

    // Name tag (sprite with text)
    const nameTag = createNameTag(playerName);
    nameTag.position.set(0, 2.2, 0);
    group.add(nameTag);

    // Health bar
    const healthBar = createHealthBar();
    healthBar.position.set(0, 2.0, 0);
    group.add(healthBar);

    return {
        group,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        body,
        head,
        nameTag,
        healthBar,
        walkTime: Math.random() * Math.PI * 2
    };
}

function createNameTag(name) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    // Draw text
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 32px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.5, 0.4, 1);

    return sprite;
}

function createHealthBar() {
    const group = new THREE.Group();

    // Background (red)
    const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(background);

    // Foreground (green, will scale based on health)
    const fgGeometry = new THREE.PlaneGeometry(1, 0.1);
    const fgMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    const foreground = new THREE.Mesh(fgGeometry, fgMaterial);
    foreground.position.z = 0.01; // Slightly in front
    group.add(foreground);

    // Store reference to foreground for updating
    group.userData.foreground = foreground;

    return group;
}

export function updateHealthBar(healthBar, healthPercent) {
    const foreground = healthBar.userData.foreground;
    if (foreground) {
        foreground.scale.x = Math.max(0, Math.min(1, healthPercent));
        // Shift position to keep it left-aligned
        foreground.position.x = -(1 - foreground.scale.x) / 2;
    }
}
