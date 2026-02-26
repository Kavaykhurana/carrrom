import { CarromPiece } from './CarromPiece.js';

export class RedQueen extends CarromPiece {
    constructor(x, y) {
        super(x, y, 18, 1.0, 'queen');
        
        this.rings = [
            [1.0, '#D10056'],  // Magenta outer
            [0.65, '#FFFFFF'], // White ring
            [0.50, '#E60073'], // Hot pink core
            [0.18, '#FFFFFF']  // White center dot
        ];
        
        this.highlight = 'rgba(255, 100, 200, 0.5)';
    }
}
