import { GameEngine } from './GameEngine.js';

// Boot up game
window.addEventListener('DOMContentLoaded', () => {
    const gameEngine = new GameEngine();
    window.__engine__ = gameEngine; // Debug access
    
    // Start render loop immediately so the board is visible behind the menu
    gameEngine.start();
});
