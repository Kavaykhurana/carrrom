import { CarromPiece } from './CarromPiece.js';

export class Striker extends CarromPiece {
    constructor(x, y) {
        super(x, y, 24, 2.85, 'striker'); 
        
        // Exact blue concentric pattern from reference image
        this.rings = [
            [1.0, '#0019C4'],  // Dark thick blue edge
            [0.85, '#FFFFFF'], // Outer white ring
            [0.72, '#0A31FF'], // Outer blue ring
            [0.58, '#FFFFFF'], // Inner white ring
            [0.45, '#0A31FF'], // Inner blue core
            [0.25, '#FFFFFF'], // Inner white dot
            [0.08, '#0A31FF']  // Tiny blue center pip
        ];
        
        this.highlight = 'rgba(255, 255, 255, 0.6)';
        this.restitution = 0.85; 
    }
    
    // Fall back to CarromPiece shared rendering since it now perfectly handles standard shadow, multi-colored arrays, and highlights!
}
