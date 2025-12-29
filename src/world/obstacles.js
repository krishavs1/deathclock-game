import * as THREE from 'three';

export function createObstacles(scene) {
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
    
    // Create random obstacles
    for (let i = 0; i < 20; i++) {
        const size = Math.random() * 2 + 1;
        const obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(size, size * 2, size),
            obstacleMaterial
        );
        obstacle.position.set(
            (Math.random() - 0.5) * 150,
            size,
            (Math.random() - 0.5) * 150
        );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
    }
}

