// Network game state management

let localPlayerId = null;
let remotePlayers = new Map(); // playerId -> player data
let networkBullets = new Map(); // bulletId -> bullet data
let serverTimestamp = 0;
let isConnected = false;
let matchState = 'lobby'; // 'lobby', 'countdown', 'playing', 'ended'
let matchTimer = 0;

export function getLocalPlayerId() {
    return localPlayerId;
}

export function setLocalPlayerId(playerId) {
    localPlayerId = playerId;
}

export function getRemotePlayers() {
    return remotePlayers;
}

export function setRemotePlayers(players) {
    remotePlayers = players;
}

export function updateRemotePlayer(playerId, playerData) {
    remotePlayers.set(playerId, playerData);
}

export function removeRemotePlayer(playerId) {
    remotePlayers.delete(playerId);
}

export function getRemotePlayer(playerId) {
    return remotePlayers.get(playerId);
}

export function getNetworkBullets() {
    return networkBullets;
}

export function setNetworkBullet(bulletId, bulletData) {
    networkBullets.set(bulletId, bulletData);
}

export function removeNetworkBullet(bulletId) {
    networkBullets.delete(bulletId);
}

export function clearNetworkBullets() {
    networkBullets.clear();
}

export function getServerTimestamp() {
    return serverTimestamp;
}

export function setServerTimestamp(timestamp) {
    serverTimestamp = timestamp;
}

export function getIsConnected() {
    return isConnected;
}

export function setIsConnected(connected) {
    isConnected = connected;
}

export function getMatchState() {
    return matchState;
}

export function setMatchState(state) {
    matchState = state;
}

export function getMatchTimer() {
    return matchTimer;
}

export function setMatchTimer(timer) {
    matchTimer = timer;
}

export function resetNetworkState() {
    remotePlayers.clear();
    networkBullets.clear();
    serverTimestamp = 0;
    matchTimer = 0;
}
