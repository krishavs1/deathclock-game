// Interpolation for smooth remote player movement

import * as THREE from 'three';

const INTERPOLATION_DELAY = 100; // ms - render players 100ms in the past
const MAX_BUFFER_SIZE = 10; // Keep last 10 states

export class InterpolationBuffer {
    constructor(playerId) {
        this.playerId = playerId;
        this.states = [];
    }

    addState(state, timestamp) {
        this.states.push({
            position: new THREE.Vector3(state.position.x, state.position.y, state.position.z),
            rotation: { x: state.rotation.x, y: state.rotation.y },
            timestamp: timestamp
        });

        // Keep only recent states
        const cutoff = Date.now() - (INTERPOLATION_DELAY * 3);
        this.states = this.states.filter(s => s.timestamp > cutoff);

        // Limit buffer size
        if (this.states.length > MAX_BUFFER_SIZE) {
            this.states = this.states.slice(-MAX_BUFFER_SIZE);
        }

        // Sort by timestamp (should already be sorted, but just in case)
        this.states.sort((a, b) => a.timestamp - b.timestamp);
    }

    getInterpolatedState() {
        if (this.states.length === 0) return null;
        if (this.states.length === 1) return this.states[0];

        // Render time is current time minus interpolation delay
        const renderTime = Date.now() - INTERPOLATION_DELAY;

        // Find the two states to interpolate between
        let before = null;
        let after = null;

        for (let i = 0; i < this.states.length - 1; i++) {
            if (this.states[i].timestamp <= renderTime && this.states[i + 1].timestamp >= renderTime) {
                before = this.states[i];
                after = this.states[i + 1];
                break;
            }
        }

        // If we don't have states surrounding the render time
        if (!before || !after) {
            // Use the most recent state if render time is ahead
            if (renderTime >= this.states[this.states.length - 1].timestamp) {
                return this.states[this.states.length - 1];
            }
            // Use the oldest state if render time is behind
            return this.states[0];
        }

        // Calculate interpolation factor
        const total = after.timestamp - before.timestamp;
        const current = renderTime - before.timestamp;
        const t = total > 0 ? current / total : 0;

        // Interpolate position
        const position = new THREE.Vector3().lerpVectors(before.position, after.position, t);

        // Interpolate rotation
        const rotation = {
            x: THREE.MathUtils.lerp(before.rotation.x, after.rotation.x, t),
            y: lerpAngle(before.rotation.y, after.rotation.y, t)
        };

        return { position, rotation, timestamp: renderTime };
    }

    clear() {
        this.states = [];
    }
}

// Interpolate angles correctly (shortest path around the circle)
function lerpAngle(a, b, t) {
    let diff = b - a;

    // Normalize to [-PI, PI]
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return a + diff * t;
}

// Manager for all player interpolation buffers
export class InterpolationManager {
    constructor() {
        this.buffers = new Map(); // playerId -> InterpolationBuffer
    }

    addState(playerId, state, timestamp) {
        if (!this.buffers.has(playerId)) {
            this.buffers.set(playerId, new InterpolationBuffer(playerId));
        }
        this.buffers.get(playerId).addState(state, timestamp);
    }

    getInterpolatedState(playerId) {
        const buffer = this.buffers.get(playerId);
        return buffer ? buffer.getInterpolatedState() : null;
    }

    removePlayer(playerId) {
        this.buffers.delete(playerId);
    }

    clear() {
        this.buffers.clear();
    }
}
