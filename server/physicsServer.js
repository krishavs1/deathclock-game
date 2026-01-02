// Server-side physics and movement validation

import { Vector3, clamp } from './utils/vector.js';
import { SERVER_CONFIG } from './config.js';

export class PhysicsServer {
    constructor() {
        this.boundary = SERVER_CONFIG.physics.worldBoundary;
        this.moveSpeed = SERVER_CONFIG.physics.moveSpeed;
        this.jumpForce = 12; // Increased from 8 for higher jump
        this.gravity = -25; // Increased (more negative) for faster/snappier jump feel
        this.groundHeight = 1.6; // Player eye height when on ground
    }

    updatePlayerMovement(player, inputs, rotation, deltaTime) {
        if (!player.isAlive) return;

        // Initialize vertical velocity if not present
        if (player.verticalVelocity === undefined) {
            player.verticalVelocity = 0;
            player.isGrounded = true;
        }

        // Update rotation
        player.rotation = {
            x: clamp(rotation.x, -Math.PI / 2, Math.PI / 2),
            y: rotation.y
        };

        // Handle jumping
        if ((inputs.Space || inputs[' ']) && player.isGrounded) {
            player.verticalVelocity = this.jumpForce;
            player.isGrounded = false;
        }

        // Apply gravity
        if (!player.isGrounded) {
            player.verticalVelocity += this.gravity * deltaTime;
        }

        // Update vertical position
        player.position.y += player.verticalVelocity * deltaTime;

        // Check if player hit ground
        if (player.position.y <= this.groundHeight) {
            player.position.y = this.groundHeight;
            player.verticalVelocity = 0;
            player.isGrounded = true;
        }

        // Calculate movement vector from inputs
        const moveVector = new Vector3();
        const forward = new Vector3(0, 0, -1);
        const right = new Vector3(1, 0, 0);

        // Apply yaw rotation to forward and right vectors
        const yaw = player.rotation.y;
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);

        forward.set(-sinY, 0, -cosY);
        right.set(cosY, 0, -sinY);

        // Apply inputs
        if (inputs.w || inputs.KeyW) moveVector.add(forward);
        if (inputs.s || inputs.KeyS) moveVector.sub(forward);
        if (inputs.a || inputs.KeyA) moveVector.sub(right);
        if (inputs.d || inputs.KeyD) moveVector.add(right);

        // Normalize and apply speed
        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(this.moveSpeed * deltaTime);
            player.position.add(moveVector);
        }

        // Keep player within bounds
        player.position.x = clamp(player.position.x, -this.boundary, this.boundary);
        player.position.z = clamp(player.position.z, -this.boundary, this.boundary);
    }

    validateMovement(player, newPosition, deltaTime) {
        // Check if movement is physically possible (anti-cheat)
        const maxDistance = this.moveSpeed * deltaTime * 1.2; // 20% tolerance
        const distance = player.position.distanceTo(newPosition);

        if (distance > maxDistance) {
            // Suspicious movement detected
            console.warn(`Suspicious movement detected for ${player.id}: ${distance.toFixed(2)} > ${maxDistance.toFixed(2)}`);
            return false;
        }

        // Check boundaries
        if (Math.abs(newPosition.x) > this.boundary ||
            Math.abs(newPosition.z) > this.boundary) {
            return false;
        }

        return true;
    }

    checkCollision(pos1, pos2, radius1 = 1, radius2 = 1) {
        const distance = pos1.distanceTo(pos2);
        return distance < (radius1 + radius2);
    }

    clampToBounds(position) {
        position.x = clamp(position.x, -this.boundary, this.boundary);
        position.z = clamp(position.z, -this.boundary, this.boundary);
        return position;
    }
}
