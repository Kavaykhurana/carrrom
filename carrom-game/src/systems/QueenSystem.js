export class QueenSystem {
    constructor(engine) {
        this.engine = engine;
        this.queenPocketedBy = null; // Player who just pocketed it
        this.queenCoveredBy = null; // Player who successfully covered it
        this.needsCover = false;
        this.justPocketed = false; // Add flag to prevent immediate failure
    }

    handleQueenPocketed(player) {
        console.log(`QUEEN Pocketed by ${player.name}. Must cover!`);
        this.queenPocketedBy = player;
        this.queenCoveredBy = null; // Reset previous cover if any
        this.needsCover = true;
        this.justPocketed = true; // Set flag
    }

    evaluateCover(player, ownPiecesPocketed, isFoul) {
        if (!this.needsCover) return;
        
        // If it was just pocketed this exact shot, don't fail the cover yet
        // UNLESS it's a foul on the same shot (e.g. Queen + Striker pocketed)
        if (this.justPocketed) {
            if (isFoul) {
                console.log("Foul while pocketing Queen! Queen returns.");
                this._returnQueen();
            } else if (ownPiecesPocketed > 0) {
                console.log("QUEEN POCKETED AND COVERED IN SAME SHOT!");
                this._markCovered();
            } else {
                console.log("Queen pocketed, needs cover on next shot.");
                this.justPocketed = false; // Next shot will require cover
            }
            return;
        }

        // Now we are on the actual cover shot
        if (this.queenPocketedBy !== player) {
            // Should not happen unless turns switched incorrectly
            console.log("Cover failed! Player changed. Queen returns to board.");
            this._returnQueen();
            return;
        }
        
        // Check if cover was successful
        if (ownPiecesPocketed > 0 && !isFoul) {
            console.log("QUEEN COVERED SUCCESSFULLY!");
            this._markCovered();
        } else if (isFoul) {
            console.log("Foul during Queen cover! Queen returns.");
            this._returnQueen();
        } else {
            console.log("Cover shot failed (no pieces pocketed). Queen returns.");
            this._returnQueen();
        }
    }

    _markCovered() {
        this.queenCoveredBy = this.queenPocketedBy;
        this.needsCover = false;
        this.justPocketed = false;
        // DO NOT reset queenPocketedBy, so we know who is holding it
    }

    _returnQueen() {
        this.engine.restoreQueen();
        this._resetState();
    }
    
    _resetState() {
        this.queenPocketedBy = null;
        this.queenCoveredBy = null;
        this.needsCover = false;
        this.justPocketed = false;
    }
}


