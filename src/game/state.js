let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let score = 0;
let deathclock = 10.0; // Time in seconds
let gameStartTime = 0;

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

