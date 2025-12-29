// Main game server - coordinates game state and match lifecycle

import { PlayerManager } from './playerManager.js';
import { PhysicsServer } from './physicsServer.js';
import { BulletServer } from './bulletServer.js';
import { SERVER_CONFIG } from './config.js';

export class GameServer {
    constructor(io) {
        this.io = io;
        this.playerManager = new PlayerManager();
        this.physicsServer = new PhysicsServer();
        this.bulletServer = new BulletServer(this.playerManager, this.physicsServer);

        this.matchState = 'lobby'; // 'lobby', 'countdown', 'playing', 'ended'
        this.matchTimer = 0;
        this.countdownTimer = 0;

        this.tickRate = SERVER_CONFIG.tickRate;
        this.tickInterval = 1000 / this.tickRate;
        this.lastTickTime = Date.now();
        this.gameLoopInterval = null;
    }

    start() {
        console.log('Game server started');
        this.startGameLoop();
    }

    stop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
    }

    startGameLoop() {
        this.gameLoopInterval = setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - this.lastTickTime) / 1000; // Convert to seconds
            this.lastTickTime = now;

            this.update(deltaTime);
        }, this.tickInterval);
    }

    update(deltaTime) {
        // Update match state
        this.updateMatchState(deltaTime);

        if (this.matchState === 'playing') {
            // Update respawn timers
            this.playerManager.updateRespawnTimers(deltaTime);

            // Update bullets and check for hits
            const hits = this.bulletServer.update(deltaTime);

            // Broadcast hits
            for (const hit of hits) {
                this.io.emit('hit', hit);

                if (hit.died) {
                    this.io.emit('player_died', {
                        victimId: hit.victimId,
                        killerId: hit.shooterId
                    });

                    // Check win condition
                    this.checkWinCondition();
                }
            }

            // Broadcast game state
            this.broadcastState();
        }
    }

    updateMatchState(deltaTime) {
        const playerCount = this.playerManager.getPlayerCount();

        switch (this.matchState) {
            case 'lobby':
                if (playerCount >= SERVER_CONFIG.minPlayersToStart) {
                    this.startCountdown();
                }
                break;

            case 'countdown':
                this.countdownTimer -= deltaTime;
                if (this.countdownTimer <= 0) {
                    this.startMatch();
                } else if (playerCount < SERVER_CONFIG.minPlayersToStart) {
                    // Not enough players, go back to lobby
                    this.matchState = 'lobby';
                    this.io.emit('match_cancelled');
                }
                break;

            case 'playing':
                this.matchTimer += deltaTime;

                // Check time limit
                if (this.matchTimer >= SERVER_CONFIG.match.matchDuration) {
                    this.endMatch('time_limit');
                }
                break;

            case 'ended':
                // Match ended, could auto-restart after a delay
                // For now, manual restart
                break;
        }
    }

    startCountdown() {
        this.matchState = 'countdown';
        this.countdownTimer = SERVER_CONFIG.match.countdownDuration;
        console.log('Match countdown started');
        this.io.emit('match_countdown', {
            duration: SERVER_CONFIG.match.countdownDuration
        });
    }

    startMatch() {
        this.matchState = 'playing';
        this.matchTimer = 0;
        this.playerManager.reset();
        this.bulletServer.clear();

        console.log('Match started');
        this.io.emit('match_start', {
            timestamp: Date.now()
        });
    }

    endMatch(reason) {
        this.matchState = 'ended';
        const scoreboard = this.playerManager.getScoreboard();

        console.log('Match ended:', reason);
        this.io.emit('match_end', {
            reason,
            scoreboard,
            duration: this.matchTimer
        });
    }

    checkWinCondition() {
        const players = this.playerManager.getAllPlayers();
        for (const player of players) {
            if (player.kills >= SERVER_CONFIG.match.killLimit) {
                this.endMatch('kill_limit');
                break;
            }
        }
    }

    broadcastState() {
        const state = {
            timestamp: Date.now(),
            players: this.playerManager.getAllPlayers().map(p => p.toJSON()),
            bullets: this.bulletServer.getAllBullets().map(b => b.toJSON()),
            matchTimer: this.matchTimer,
            matchState: this.matchState
        };

        this.io.emit('state', state);
    }

    handlePlayerJoin(socket, data) {
        const playerName = data.playerName || 'Player';
        const player = this.playerManager.addPlayer(socket.id, playerName);

        console.log(`Player joined: ${player.name} (${player.id})`);

        // Send initial state to the joining player
        socket.emit('init', {
            playerId: player.id,
            config: SERVER_CONFIG,
            players: this.playerManager.getAllPlayers().map(p => p.toJSON()),
            matchState: this.matchState
        });

        // Broadcast to other players
        socket.broadcast.emit('player_joined', {
            player: player.toJSON()
        });
    }

    handlePlayerLeave(socket) {
        const playerId = this.playerManager.removePlayer(socket.id);
        if (playerId) {
            console.log(`Player left: ${playerId}`);
            this.io.emit('player_left', { playerId });

            // If not enough players during countdown, cancel it
            if (this.matchState === 'countdown' &&
                this.playerManager.getPlayerCount() < SERVER_CONFIG.minPlayersToStart) {
                this.matchState = 'lobby';
                this.io.emit('match_cancelled');
            }
        }
    }

    handlePlayerInput(socket, data) {
        const player = this.playerManager.getPlayerBySocket(socket.id);
        if (!player) {
            console.warn('Input from unknown player:', socket.id);
            return;
        }

        // Store input sequence for potential reconciliation
        player.lastInputSequence = data.sequenceNumber || 0;
        player.inputs = data.keys || {};

        // Update player movement
        const deltaTime = 1 / 60; // Assume 60Hz input rate
        this.physicsServer.updatePlayerMovement(
            player,
            data.keys || {},
            data.rotation || { x: 0, y: 0 },
            deltaTime
        );
    }

    handlePlayerShoot(socket, data) {
        const player = this.playerManager.getPlayerBySocket(socket.id);
        if (!player || !player.isAlive) return;

        if (this.matchState !== 'playing') return;

        // Create bullet
        const bullet = this.bulletServer.createBullet(
            player.id,
            data.position,
            data.direction
        );

        if (bullet) {
            // Broadcast bullet spawn to all clients
            this.io.emit('bullet_spawn', {
                bullet: bullet.toJSON(),
                shooterId: player.id
            });
        }
    }
}
