// Server-side bullet management and hit detection

import { Vector3 } from './utils/vector.js';
import { SERVER_CONFIG } from './config.js';

export class Bullet {
    constructor(id, shooterId, position, direction) {
        this.id = id;
        this.shooterId = shooterId;
        this.position = position.clone();
        this.velocity = direction.clone().normalize().multiplyScalar(SERVER_CONFIG.physics.bulletSpeed);
        this.createdAt = Date.now();
        this.lifetime = SERVER_CONFIG.physics.bulletLifetime;
    }

    update(deltaTime) {
        const moveVector = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(moveVector);
    }

    isExpired() {
        const age = (Date.now() - this.createdAt) / 1000;
        return age >= this.lifetime || this.position.length() > 100;
    }

    toJSON() {
        return {
            id: this.id,
            position: this.position.toJSON(),
            velocity: this.velocity.toJSON()
        };
    }
}

export class BulletServer {
    constructor(playerManager, physicsServer) {
        this.playerManager = playerManager;
        this.physicsServer = physicsServer;
        this.bullets = new Map(); // id -> Bullet
        this.nextBulletId = 1;
    }

    createBullet(shooterId, position, direction) {
        const player = this.playerManager.getPlayer(shooterId);
        if (!player || !player.isAlive) {
            return null;
        }

        const bulletId = `bullet_${this.nextBulletId++}`;
        const bullet = new Bullet(
            bulletId,
            shooterId,
            Vector3.fromJSON(position),
            Vector3.fromJSON(direction)
        );

        this.bullets.set(bulletId, bullet);
        return bullet;
    }

    update(deltaTime) {
        const hits = [];
        const expiredBullets = [];

        for (const bullet of this.bullets.values()) {
            bullet.update(deltaTime);

            // Check for hits against all players
            const hit = this.checkHit(bullet);
            if (hit) {
                hits.push(hit);
                expiredBullets.push(bullet.id);
            }

            // Check if bullet expired
            if (bullet.isExpired()) {
                expiredBullets.push(bullet.id);
            }
        }

        // Remove expired bullets
        for (const bulletId of expiredBullets) {
            this.bullets.delete(bulletId);
        }

        return hits;
    }

    checkHit(bullet) {
        const shooter = this.playerManager.getPlayer(bullet.shooterId);
        if (!shooter) return null;

        for (const player of this.playerManager.getAllPlayers()) {
            // Skip the shooter and dead players
            if (player.id === bullet.shooterId || !player.isAlive) {
                continue;
            }

            // Simple sphere collision check
            const collisionRadius = SERVER_CONFIG.combat.collisionRadius;
            const distance = bullet.position.distanceTo(player.position);

            if (distance < collisionRadius) {
                // Hit!
                const damage = SERVER_CONFIG.combat.bulletDamage;
                const result = player.takeDamage(damage, bullet.shooterId);

                if (result.died) {
                    // Award kill to shooter
                    shooter.kills++;
                }

                return {
                    bulletId: bullet.id,
                    shooterId: bullet.shooterId,
                    victimId: player.id,
                    damage: damage,
                    died: result.died,
                    position: bullet.position.toJSON()
                };
            }
        }

        return null;
    }

    getAllBullets() {
        return Array.from(this.bullets.values());
    }

    clear() {
        this.bullets.clear();
    }
}
