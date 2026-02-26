export class StateMachine {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.currentState = 'MENU';
        // 'MENU' -> 'PLAYING' -> 'SIMULATING' -> 'EVALUATING' -> 'SCORE_SCREEN' -> 'GAME_OVER'
    }

    setState(newState) {
        if (this.currentState === newState) return;
        
        console.log(`State Transition: ${this.currentState} -> ${newState}`);
        this.currentState = newState;
        
        // Handle transitions
        if (newState === 'PLAYING') {
            // Un-hide UI for playing, wait for input
            if (this.engine.aimingSystem) {
                this.engine.aimingSystem.state = 'IDLE';
            }
        } else if (newState === 'SIMULATING') {
            // Shot has been fired. Wait until all pieces are sleeping
        } else if (newState === 'EVALUATING') {
            // Board has settled. Ask TurnManager to evaluate rules
            this.engine.turnManager.evaluateShot();
        }
    }

    update() {
        if (this.currentState === 'SIMULATING') {
            if (this.engine.isBoardSleeping()) {
                this.setState('EVALUATING');
            }
        }
    }
}
