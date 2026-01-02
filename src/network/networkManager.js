// Network manager - Socket.io client and message handling

import io from 'socket.io-client';
import {
    setLocalPlayerId,
    getLocalPlayerId,
    updateRemotePlayer,
    removeRemotePlayer,
    setNetworkBullet,
    removeNetworkBullet,
    setServerTimestamp,
    setIsConnected,
    setMatchState,
    setMatchTimer,
    resetNetworkState,
    getRemotePlayers
} from './networkState.js';
import { InterpolationManager } from './interpolation.js';
import { ClientPrediction } from './clientPrediction.js';

let socket = null;
let interpolationManager = null;
let clientPrediction = null;
let isInitialized = false;
let connectionCallbacks = {
    onConnect: null,
    onDisconnect: null,
    onInit: null,
    onPlayerJoined: null,
    onPlayerLeft: null,
    onHit: null,
    onPlayerDied: null,
    onMatchStart: null,
    onMatchEnd: null,
    onMatchCountdown: null
};

export function initNetwork(serverUrl = 'http://localhost:3000') {
    if (isInitialized) {
        console.warn('Network already initialized');
        return;
    }

    socket = io(serverUrl);
    interpolationManager = new InterpolationManager();
    clientPrediction = new ClientPrediction();
    isInitialized = true;

    setupEventListeners();
}

function setupEventListeners() {
    // Connection events
    socket.on('connect', () => {
        console.log('Connected to server:', socket.id);
        setIsConnected(true);
        if (connectionCallbacks.onConnect) {
            connectionCallbacks.onConnect();
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        if (connectionCallbacks.onDisconnect) {
            connectionCallbacks.onDisconnect();
        }
    });

    // Initial state
    socket.on('init', (data) => {
        console.log('Received init:', data);
        setLocalPlayerId(data.playerId);
        setMatchState(data.matchState);

        // Initialize remote players
        if (data.players) {
            data.players.forEach(player => {
                if (player.id !== data.playerId) {
                    updateRemotePlayer(player.id, player);
                }
            });
        }

        if (connectionCallbacks.onInit) {
            connectionCallbacks.onInit(data);
        }
    });

    // Game state updates
    socket.on('state', (data) => {
        setServerTimestamp(data.timestamp);
        setMatchTimer(data.matchTimer || 0);
        setMatchState(data.matchState);

        const localId = getLocalPlayerId();

        // Update remote players with interpolation
        if (data.players) {
            const remotePlayers = getRemotePlayers();

            data.players.forEach(player => {
                if (player.id !== localId) {
                    // Add to interpolation buffer
                    interpolationManager.addState(player.id, player, data.timestamp);
                    // Store in network state
                    updateRemotePlayer(player.id, player);
                }
            });

            // Remove players no longer in state
            const currentPlayerIds = new Set(data.players.map(p => p.id));
            for (const [playerId] of remotePlayers) {
                if (!currentPlayerIds.has(playerId) && playerId !== localId) {
                    removeRemotePlayer(playerId);
                    interpolationManager.removePlayer(playerId);
                }
            }
        }

        // Update bullets
        if (data.bullets) {
            // Simple approach: just store latest bullet data
            // More sophisticated approach would interpolate bullets too
            data.bullets.forEach(bullet => {
                setNetworkBullet(bullet.id, bullet);
            });
        }
    });

    // Player events
    socket.on('player_joined', (data) => {
        console.log('Player joined:', data.player.name);
        updateRemotePlayer(data.player.id, data.player);
        if (connectionCallbacks.onPlayerJoined) {
            connectionCallbacks.onPlayerJoined(data.player);
        }
    });

    socket.on('player_left', (data) => {
        console.log('Player left:', data.playerId);
        removeRemotePlayer(data.playerId);
        interpolationManager.removePlayer(data.playerId);
        if (connectionCallbacks.onPlayerLeft) {
            connectionCallbacks.onPlayerLeft(data.playerId);
        }
    });

    // Combat events
    socket.on('bullet_spawn', (data) => {
        setNetworkBullet(data.bullet.id, data.bullet);
    });

    socket.on('hit', (data) => {
        console.log('Hit:', data);
        if (connectionCallbacks.onHit) {
            connectionCallbacks.onHit(data);
        }
    });

    socket.on('player_died', (data) => {
        console.log('Player died:', data);
        if (connectionCallbacks.onPlayerDied) {
            connectionCallbacks.onPlayerDied(data);
        }
    });

    // Match events
    socket.on('match_countdown', (data) => {
        console.log('Match countdown:', data.duration);
        if (connectionCallbacks.onMatchCountdown) {
            connectionCallbacks.onMatchCountdown(data);
        }
    });

    socket.on('match_start', (data) => {
        console.log('Match started');
        setMatchState('playing');
        resetNetworkState();
        if (connectionCallbacks.onMatchStart) {
            connectionCallbacks.onMatchStart(data);
        }
    });

    socket.on('match_end', (data) => {
        console.log('Match ended:', data);
        setMatchState('ended');
        if (connectionCallbacks.onMatchEnd) {
            connectionCallbacks.onMatchEnd(data);
        }
    });

    socket.on('match_cancelled', () => {
        console.log('Match cancelled');
        setMatchState('lobby');
    });
}

// Send player join
export function joinGame(playerName = 'Player') {
    if (!socket) {
        console.error('Network not initialized');
        return;
    }
    socket.emit('join', { playerName });
}

// Send player input
export function sendInput(keys, rotation) {
    if (!socket) {
        console.warn('Cannot send input: socket not initialized');
        return;
    }
    if (!clientPrediction) {
        console.warn('Cannot send input: clientPrediction not initialized');
        return;
    }

    const sequenceNumber = clientPrediction.sequenceNumber + 1;

    // Debug: log occasionally
    if (Math.random() < 0.01) {
        console.log('Sending input:', { sequenceNumber, keys, rotation });
    }

    socket.emit('input', {
        sequenceNumber,
        keys,
        rotation,
        timestamp: Date.now()
    });

    return sequenceNumber;
}

// Send shoot command
export function sendShoot(position, direction) {
    if (!socket) return;

    socket.emit('shoot', {
        position: { x: position.x, y: position.y, z: position.z },
        direction: { x: direction.x, y: direction.y, z: direction.z },
        timestamp: Date.now()
    });
}

// Get interpolation manager
export function getInterpolationManager() {
    return interpolationManager;
}

// Get client prediction
export function getClientPrediction() {
    return clientPrediction;
}

// Set callbacks
export function on(event, callback) {
    if (connectionCallbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
        connectionCallbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
    }
}

// Get connection status
export function isConnected() {
    return socket && socket.connected;
}

// Disconnect
export function disconnect() {
    if (socket) {
        socket.disconnect();
    }
}
