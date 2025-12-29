// Player state management

import { Vector3 } from './utils/vector.js';
import { SERVER_CONFIG } from './config.js';

export class Player {
    constructor(id, socketId, name = 'Player') {
        this.id = id;
        this.socketId = socketId;
        this.name = name;
        this.position = new Vector3(0, 1.6, 0);
        this.rotation = { x: 0, y: 0 }; // pitch and yaw
        this.velocity = new Vector3(0, 0, 0);
        this.health = SERVER_CONFIG.combat.playerHealth;
        this.maxHealth = SERVER_CONFIG.combat.playerHealth;
        this.kills = 0;
        this.deaths = 0;
        this.isAlive = true;
        this.respawnTimer = 0;
        this.lastInputSequence = 0;
        this.inputs = {}; // Current input state
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            position: this.position.toJSON(),
            rotation: this.rotation,
            health: this.health,
            maxHealth: this.maxHealth,
            kills: this.kills,
            deaths: this.deaths,
            isAlive: this.isAlive
        };
    }

    takeDamage(damage, shooterId) {
        if (!this.isAlive) return false;

        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            this.deaths++;
            return { died: true, shooterId };
        }
        return { died: false, shooterId };
    }

    respawn() {
        this.health = this.maxHealth;
        this.isAlive = true;
        this.respawnTimer = 0;
        // Random spawn position
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        this.position.set(
            Math.cos(angle) * distance,
            1.6,
            Math.sin(angle) * distance
        );
        this.velocity.set(0, 0, 0);
    }
}

export class PlayerManager {
    constructor() {
        this.players = new Map(); // id -> Player
        this.socketToPlayer = new Map(); // socketId -> playerId
        this.nextPlayerId = 1;
    }

    addPlayer(socketId, name) {
        const playerId = `player_${this.nextPlayerId++}`;
        const player = new Player(playerId, socketId, name);

        // Spawn at random location
        player.respawn();

        this.players.set(playerId, player);
        this.socketToPlayer.set(socketId, playerId);

        return player;
    }

    removePlayer(socketId) {
        const playerId = this.socketToPlayer.get(socketId);
        if (playerId) {
            this.players.delete(playerId);
            this.socketToPlayer.delete(socketId);
            return playerId;
        }
        return null;
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getPlayerBySocket(socketId) {
        const playerId = this.socketToPlayer.get(socketId);
        return playerId ? this.players.get(playerId) : null;
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    getPlayerCount() {
        return this.players.size;
    }

    updateRespawnTimers(deltaTime) {
        for (const player of this.players.values()) {
            if (!player.isAlive) {
                player.respawnTimer += deltaTime;
                if (player.respawnTimer >= SERVER_CONFIG.match.respawnDelay) {
                    player.respawn();
                }
            }
        }
    }

    getScoreboard() {
        const scores = this.getAllPlayers().map(p => ({
            id: p.id,
            name: p.name,
            kills: p.kills,
            deaths: p.deaths,
            score: p.kills // Simple scoring: 1 point per kill
        }));

        // Sort by kills (descending)
        scores.sort((a, b) => b.kills - a.kills);

        return scores;
    }

    reset() {
        for (const player of this.players.values()) {
            player.kills = 0;
            player.deaths = 0;
            player.health = player.maxHealth;
            player.isAlive = true;
            player.respawn();
        }
    }
}
