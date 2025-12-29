import * as THREE from 'three';

export function createWalls(scene) {
    const wallHeight = 5;
    const wallThickness = 1;
    const wallLength = 200;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

    // North wall
    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallLength, wallHeight, wallThickness),
        wallMaterial
    );
    northWall.position.set(0, wallHeight / 2, -wallLength / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallLength, wallHeight, wallThickness),
        wallMaterial
    );
    southWall.position.set(0, wallHeight / 2, wallLength / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);

    // East wall
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, wallLength),
        wallMaterial
    );
    eastWall.position.set(wallLength / 2, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // West wall
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, wallLength),
        wallMaterial
    );
    westWall.position.set(-wallLength / 2, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
}

