// Main server entry point - Express + Socket.io setup

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameServer } from './gameServer.js';
import { SERVER_CONFIG } from './config.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Initialize game server
const gameServer = new GameServer(io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Player join
    socket.on('join', (data) => {
        gameServer.handlePlayerJoin(socket, data);
    });

    // Player input
    socket.on('input', (data) => {
        gameServer.handlePlayerInput(socket, data);
    });

    // Player shoot
    socket.on('shoot', (data) => {
        gameServer.handlePlayerShoot(socket, data);
    });

    // Player disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        gameServer.handlePlayerLeave(socket);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        players: gameServer.playerManager.getPlayerCount(),
        matchState: gameServer.matchState,
        uptime: process.uptime()
    });
});

// Start server
const PORT = SERVER_CONFIG.port;
httpServer.listen(PORT, () => {
    console.log(`🎮 Game server listening on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    gameServer.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    gameServer.stop();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    gameServer.stop();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
