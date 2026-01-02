// Server and game configuration

export const SERVER_CONFIG = {
    port: process.env.PORT || 3000,
    tickRate: 20, // 20 updates per second (50ms per tick)
    maxPlayers: 8,
    minPlayersToStart: 2,

    match: {
        countdownDuration: 10, // seconds
        matchDuration: 300, // 5 minutes
        killLimit: 20, // first to 20 kills wins
        respawnDelay: 3, // seconds
    },

    physics: {
        moveSpeed: 7, // Increased from 5 for faster running
        bulletSpeed: 50,
        bulletLifetime: 2, // seconds
        worldBoundary: 90,
    },

    combat: {
        playerHealth: 100,
        bulletDamage: 25, // 4 shots to kill
        collisionRadius: 1.0, // player hit radius
    },

    network: {
        inputSendRate: 60, // Client sends inputs 60 times per second
        stateUpdateRate: 20, // Server sends state 20 times per second
    }
};
