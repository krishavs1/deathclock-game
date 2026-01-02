import { getScore, getPlayerHealth } from '../game/state.js';
import { getMatchTimer, getMatchState } from '../network/networkState.js';

export function updateUI() {
    // Update score
    document.getElementById('scoreValue').textContent = getScore();
    
    // Update health (for multiplayer)
    const health = getPlayerHealth();
    document.getElementById('healthValue').textContent = health;
    
    // TODO: Update UI with match timer and other multiplayer stats
    // const matchTimer = getMatchTimer();
    // const matchState = getMatchState();
}

