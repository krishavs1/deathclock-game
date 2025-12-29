let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let score = 0;
let deathclock = 10.0; // Time in seconds (legacy, will be removed for multiplayer)
let gameStartTime = 0;

// Multiplayer state
let isMultiplayer = true; // Always multiplayer now
let playerId = null; // Local player's network ID
let playerHealth = 100;
let playerKills = 0;
let playerDeaths = 0;

export function getGameState() {
    return gameState;
}

export function setGameState(state) {
    gameState = state;
}

export function getScore() {
    return score;
}

export function setScore(value) {
    score = value;
}

export function addScore(value) {
    score += value;
}

export function getDeathclock() {
    return deathclock;
}

export function setDeathclock(value) {
    deathclock = value;
}

export function addDeathclock(value) {
    deathclock += value;
}

export function getGameStartTime() {
    return gameStartTime;
}

export function setGameStartTime(value) {
    gameStartTime = value;
}

// Multiplayer state getters/setters
export function getIsMultiplayer() {
    return isMultiplayer;
}

export function getPlayerId() {
    return playerId;
}

export function setPlayerId(id) {
    playerId = id;
}

export function getPlayerHealth() {
    return playerHealth;
}

export function setPlayerHealth(health) {
    playerHealth = health;
}

export function getPlayerKills() {
    return playerKills;
}

export function setPlayerKills(kills) {
    playerKills = kills;
}

export function addPlayerKill() {
    playerKills++;
}

export function getPlayerDeaths() {
    return playerDeaths;
}

export function setPlayerDeaths(deaths) {
    playerDeaths = deaths;
}

export function addPlayerDeath() {
    playerDeaths++;
}

