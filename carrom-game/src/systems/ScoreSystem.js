export class ScoreSystem {
    constructor(engine) {
        this.engine = engine;
        this.winningScore = 150; // Increased to match new live arcade scoring
    }

    addPoints(player, points) {
        player.score += points;
        console.log(`${player.name} scored ${points} points! Total: ${player.score}`);
        this._updateHUD(player);
        this.checkWin(player);
    }

    deductPoints(player, points) {
        // In standard carrom, fouls don't directly deduct points, they incur 'Dues' (returning pieces).
        // Standard rules don't use negative points, so we'll rely on FoulSystem.
        this._updateHUD(player);
    }

    evaluateBoardEnd(winner, loser, winnerCoveredQueen) {
        // Count loser's remaining pieces with correct values
        const remainingPieces = this.engine.physicsWorld.bodies.filter(b => b.type === loser.color);
        
        let boardPoints = 0;
        for (const piece of remainingPieces) {
            boardPoints += piece.type === 'white' ? 20 : 10;
        }

        // Queen points bonus
        if (winnerCoveredQueen) {
            boardPoints += 50;
        }

        this.addPoints(winner, boardPoints);
        
        // Reset board for next round or end game
        if (winner.score < this.winningScore && loser.score < this.winningScore) {
            // Show visible score splash
            if (this.engine.uiController) {
                this.engine.uiController.showBoardEnd(this.engine.turnManager.players, winner, boardPoints);
            }
            
            // Pause 3 seconds then reset
            setTimeout(() => {
                this.engine.resetBoard();
            }, 3000);
        }
    }

    checkWin(player) {
        // Game ends at 25 points or after 8 boards (we'll just use points for now)
        if (player.score >= this.winningScore) {
            console.log(`============= ${player.name} WINS THE GAME! =============`);
            this.engine.stateMachine.setState('GAME_OVER');
            
            // Show Win UI Mapping
            if (this.engine.uiController) {
                this.engine.uiController.showGameOver(player, this.engine.turnManager.players);
            }
        }
    }

    _updateHUD(player) {
        const scoreEl = document.getElementById(`score-p${player.id}`);
        if(scoreEl) {
            scoreEl.innerText = player.score;
        }
    }
}
