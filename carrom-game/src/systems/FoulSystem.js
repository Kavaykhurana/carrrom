import { WhitePiece } from '../entities/WhitePiece.js';
import { BlackPiece } from '../entities/BlackPiece.js';

export class FoulSystem {
    constructor(engine) {
        this.engine = engine;
    }

    handleStrikerFoul(player) {
        console.log(`FOUL: ${player.name} pocketed the striker.`);
        
        player.fouls += 1;
        player.dues = (player.dues || 0) + 1;
        
        // Exact ICF Rule: Pocketing Striker = Lose Turn + 1 Piece Due
        this.processDues(player);
    }
    
    processDues(player) {
        if (!player.dues || player.dues <= 0) return;
        
        // If they have no color yet, they cannot place a due yet
        if (!player.color) return;

        // Has the player pocketed any of their pieces already?
        // Let's count how many pieces of their color they had total (9) vs how many are on board
        const piecesOnBoard = this.engine.physicsWorld.bodies.filter(b => b.type === player.color).length;
        
        if (piecesOnBoard < 9) {
            // They have a piece available to return
            this._returnPiece(player.color);
            player.dues -= 1;
            
            // If they owe more, call recursively
            if (player.dues > 0) this.processDues(player);
        } else {
            console.log(`${player.name} owes a Due but has no pieces pocketed yet! It remains outstanding.`);
        }
    }

    _returnPiece(color) {
        // Return piece to the center circle
        const cx = 450;
        const cy = 450;
        
        const piece = color === 'white' ? new WhitePiece(cx, cy) : new BlackPiece(cx, cy);
        
        // Place in inner circle
        this.engine.physicsWorld.addBody(piece);
    }
}
