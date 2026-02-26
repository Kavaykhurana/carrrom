import { BoardGeometry as Geo } from '../board/BoardGeometry.js';

export class TurnManager {
    constructor(engine) {
        this.engine = engine;
        this.players = [];
        this.activePlayerIndex = 0;
        this.activePlayer = null;
        this.turnPocketed = [];
        
        this.initPlayers(2); // fallback
    }

    initPlayers(numPlayers) {
        this.players = [];
        
        // Determine edge seating based on player count
        let layout;
        if (numPlayers === 2) layout = ['bottom', 'top'];
        else if (numPlayers === 3) layout = ['bottom', 'right', 'top'];
        else layout = ['bottom', 'right', 'top', 'left'];

        for (let i = 0; i < numPlayers; i++) {
            this.players.push({
                id: i + 1,
                name: `P${i + 1}`,
                score: 0,
                fouls: 0,
                baseline: layout[i]
            });
        }
        
        // First player to pocket a piece chooses color (Standard convention if not pre-assigned)
        // Strictly speaking, first to break gets White. Let's assign colors if playing 2P
        if (numPlayers === 2) {
            this.players[0].color = 'white';
            this.players[1].color = 'black';
        } else if (numPlayers === 4) {
            this.players[0].color = 'white';
            this.players[1].color = 'black';
            this.players[2].color = 'white';
            this.players[3].color = 'black';
        } else {
            // Free for all colors initially null until pocket
            this.players.forEach(p => p.color = null);
        }
        
        this.activePlayerIndex = 0;
        this.activePlayer = this.players[0];
    }

    onPiecePocketed(piece) {
        this.turnPocketed.push(piece);
        
        if (piece.type === 'striker') {
            this._showSplash('foul-splash');
        } else if (piece.type === 'queen') {
            this._showSplash('queen-splash');
        } else if (piece.type === 'white' || piece.type === 'black') {
            // Check if player has a color, claim it if unassigned
            if (!this.activePlayer.color) {
                this.activePlayer.color = piece.type;
            }
            
            // Give live points
            if (piece.type === this.activePlayer.color) {
                this.engine.scoreSystem.addPoints(this.activePlayer, 10);
            }
        }
        
        // Ensure HUD dots update instantly
        if (this.engine.uiController) {
            this.engine.uiController.updatePocketedVisuals(this.players, this.engine.physicsWorld.bodies);
        }
    }

    evaluateShot() {
        let isFoul = false;
        let earnedExtraTurn = false;
        
        const foulSystem = this.engine.foulSystem;
        const queenSystem = this.engine.queenSystem;
        const scoreSystem = this.engine.scoreSystem;

        // Process all pieces pocketed this turn
        let strikerPocketed = false;
        let ownColorPocketed = 0;
        let oppColorPocketed = 0;
        let queenPocketed = false;

        for (let p of this.turnPocketed) {
            if (p.type === 'striker') {
                strikerPocketed = true;
            } else if (p.type === 'queen') {
                queenPocketed = true;
            } else if (p.type === 'white' || p.type === 'black') {
                // If player has no color yet (e.g., 3 player mode), claim the first pocketed
                if (!this.activePlayer.color) {
                    this.activePlayer.color = p.type;
                }
                
                if (p.type === this.activePlayer.color) {
                    ownColorPocketed++;
                } else {
                    oppColorPocketed++;
                }
            }
        }

        // 1. Foul Checking
        if (strikerPocketed) {
            foulSystem.handleStrikerFoul(this.activePlayer);
            isFoul = true;
        }

        if (isFoul && ownColorPocketed > 0) {
            this.activePlayer.dues = (this.activePlayer.dues || 0) + ownColorPocketed;
        }

        // 2. Process Queen rules
        if (queenPocketed && !isFoul) {
            queenSystem.handleQueenPocketed(this.activePlayer);
            earnedExtraTurn = true;
        }

        queenSystem.evaluateCover(this.activePlayer, ownColorPocketed, isFoul);

        // 3. Scoring & Turn Maintenance
        if (!isFoul) {
            if (ownColorPocketed > 0) {
                earnedExtraTurn = true;
            }
        }
        
        // Process outstanding Dues if any pieces were just pocketed
        foulSystem.processDues(this.activePlayer);

        // Reset strike turn tracker
        this.turnPocketed = [];

        // Check if board concludes (all pieces of a color gone)
        const boardEnded = this._checkBoardEnd();

        // 5. Change Turn or Keep Turn
        if (!boardEnded) {
            if (isFoul || !earnedExtraTurn) {
                this._switchTurn();
            }

            // 4. Reset Striker to baseline (after turn switch is evaluated)
            this._resetStriker();

            // Go back to playing state
            if (this.engine.stateMachine.currentState !== 'GAME_OVER') {
                this.engine.stateMachine.setState('PLAYING');
            }
        }
        
        // Refresh piece counters
        if (this.engine.uiController) {
            this.engine.uiController.updatePocketedVisuals(this.players, this.engine.physicsWorld.bodies);
        }
    }
    
    _checkBoardEnd() {
        if (!this.activePlayer.color) return false;
        
        // Check if all their pieces are gone
        const remaining = this.engine.physicsWorld.bodies.filter(b => b.type === this.activePlayer.color).length;
        if (remaining === 0) {
            // Find opponent
            const opponent = this.players.find(p => p.color && p.color !== this.activePlayer.color) || this.players[1];
            
            const qsys = this.engine.queenSystem;
            const queenOnBoard = this.engine.physicsWorld.bodies.some(b => b.type === 'queen');

            if (queenOnBoard) {
                // Sank last piece while Queen is still on board -> Loss
                console.log("Foul: Pocketed last piece before Queen! Opponent wins the board.");
                // Opponent gets points for their pieces + 3 for Queen penalty
                this.engine.scoreSystem.evaluateBoardEnd(opponent, this.activePlayer, true); 
            } else {
                // Normal win
                const winnerCoveredQueen = (qsys.queenCoveredBy === this.activePlayer);
                this.engine.scoreSystem.evaluateBoardEnd(this.activePlayer, opponent, winnerCoveredQueen);
            }
            return true;
        }
        return false;
    }

    _switchTurn() {
        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
        this.activePlayer = this.players[this.activePlayerIndex];
        this._updateTurnHUD();
    }

    _resetStriker() {
        const striker = this.engine.striker;
        const bases = Geo.getBaselines();
        
        striker.vel.set(0, 0);
        striker.isSleeping = true;

        const b = this.activePlayer.baseline;
        if (b === 'bottom') striker.pos.set(450, bases.bottom.y);
        else if (b === 'top') striker.pos.set(450, bases.top.y);
        else if (b === 'left') striker.pos.set(bases.left.x, 450);
        else if (b === 'right') striker.pos.set(bases.right.x, 450);
        
        // Re-add striker to physics if it was pocketed
        if (!this.engine.physicsWorld.bodies.includes(striker)) {
            this.engine.physicsWorld.addBody(striker);
        }
    }

    _updateTurnHUD() {
        if(this.engine.uiController) {
            this.engine.uiController.updateTurnHUD(this.activePlayer.id);
        }
    }

    _showSplash(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.classList.remove('hidden');
            // Reset animation
            el.style.animation = 'none';
            el.offsetHeight; /* trigger reflow */
            el.style.animation = null; 
            
            setTimeout(() => {
                el.classList.add('hidden');
            }, 1500);
        }
    }
}
