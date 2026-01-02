// Client-side prediction and server reconciliation

import * as THREE from 'three';
import { MOVE_SPEED } from '../core/constants.js';

const MAX_PREDICTION_HISTORY = 60; // Keep last 60 inputs (~1 second at 60Hz)
const RECONCILIATION_THRESHOLD = 0.1; // Reconcile if off by more than 0.1 units

export class ClientPrediction {
    constructor() {
        this.inputHistory = []; // Array of {sequenceNumber, keys, rotation, position, timestamp}
        this.sequenceNumber = 0;
        this.lastServerSequence = 0;
    }

    // Store input and predicted position
    addInput(keys, rotation, position) {
        this.sequenceNumber++;

        const input = {
            sequenceNumber: this.sequenceNumber,
            keys: { ...keys },
            rotation: { ...rotation },
            position: position.clone(),
            timestamp: Date.now()
        };

        this.inputHistory.push(input);

        // Keep history limited
        if (this.inputHistory.length > MAX_PREDICTION_HISTORY) {
            this.inputHistory.shift();
        }

        return this.sequenceNumber;
    }

    // Server sends back the authoritative position with the last processed sequence number
    reconcileWithServer(serverPosition, serverSequence) {
        if (serverSequence <= this.lastServerSequence) {
            // Old packet, ignore
            return null;
        }

        this.lastServerSequence = serverSequence;

        // Find the input that corresponds to this server update
        const inputIndex = this.inputHistory.findIndex(
            input => input.sequenceNumber === serverSequence
        );

        if (inputIndex === -1) {
            // Input not found in history (too old), just accept server position
            this.inputHistory = [];
            return serverPosition.clone();
        }

        // Check if our prediction was accurate
        const predictedPosition = this.inputHistory[inputIndex].position;
        const error = predictedPosition.distanceTo(serverPosition);

        if (error < RECONCILIATION_THRESHOLD) {
            // Prediction was accurate, no correction needed
            // Remove old inputs
            this.inputHistory = this.inputHistory.slice(inputIndex + 1);
            return null;
        }

        // Prediction was off, need to reconcile
        console.log(`Reconciling: error=${error.toFixed(3)}, seq=${serverSequence}`);

        // Start from server position
        let correctedPosition = serverPosition.clone();

        // Replay inputs that happened after the server's acknowledged input
        const inputsToReplay = this.inputHistory.slice(inputIndex + 1);

        for (const input of inputsToReplay) {
            correctedPosition = this.simulateMovement(
                correctedPosition,
                input.keys,
                input.rotation,
                1 / 60 // Assume 60Hz
            );
        }

        // Remove processed inputs
        this.inputHistory = inputsToReplay;

        return correctedPosition;
    }

    // Simulate movement (same logic as server)
    simulateMovement(position, keys, rotation, deltaTime) {
        const moveVector = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);

        // Apply rotation to forward and right vectors
        const euler = new THREE.Euler(0, rotation.y, 0, 'YXZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);

        forward.applyQuaternion(quaternion);
        right.applyQuaternion(quaternion);
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();

        // Apply inputs
        if (keys.KeyW || keys.w) moveVector.add(forward);
        if (keys.KeyS || keys.s) moveVector.sub(forward);
        if (keys.KeyA || keys.a) moveVector.sub(right);
        if (keys.KeyD || keys.d) moveVector.add(right);

        // Apply movement
        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(MOVE_SPEED * deltaTime);
        }

        const newPosition = position.clone().add(moveVector);

        // Keep within bounds (same as server)
        const boundary = 90;
        newPosition.x = Math.max(-boundary, Math.min(boundary, newPosition.x));
        newPosition.z = Math.max(-boundary, Math.min(boundary, newPosition.z));

        return newPosition;
    }

    clear() {
        this.inputHistory = [];
        this.sequenceNumber = 0;
        this.lastServerSequence = 0;
    }
}
