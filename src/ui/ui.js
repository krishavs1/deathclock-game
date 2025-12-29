import { getDeathclock, getScore } from '../game/state.js';

export function updateUI() {
    // Format time as seconds with 2 decimal places
    const timeLeft = Math.max(0, getDeathclock());
    const timeString = timeLeft.toFixed(2);
    document.getElementById('healthValue').textContent = timeString;
    document.getElementById('scoreValue').textContent = getScore();
}

