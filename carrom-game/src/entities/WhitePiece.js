import { CarromPiece } from './CarromPiece.js';

export class WhitePiece extends CarromPiece {
    constructor(x, y) {
        super(x, y, 18, 1.0, 'white');
        
        this.rings = [
            [1.0, '#FDFDFD'],  // Outer edge
            [0.65, '#1A1A1A'], // Black ring
            [0.50, '#F0F0F0'], // Inner white core
            [0.18, '#1A1A1A']  // Black center dot
        ];
        
        this.highlight = 'rgba(255,255,255,0.7)';
    }
}
