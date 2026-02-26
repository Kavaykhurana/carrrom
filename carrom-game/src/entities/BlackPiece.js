import { CarromPiece } from './CarromPiece.js';

export class BlackPiece extends CarromPiece {
    constructor(x, y) {
        super(x, y, 18, 1.0, 'black');
        
        this.rings = [
            [1.0, '#1A1A1A'],  // Outer edge
            [0.65, '#F0F0F0'], // White ring
            [0.50, '#222222'], // Inner black core
            [0.18, '#F0F0F0']  // White center dot
        ];
        
        this.highlight = 'rgba(255,255,255,0.2)';
    }
}
