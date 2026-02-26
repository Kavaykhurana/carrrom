import { BlackPiece } from '../entities/BlackPiece.js';
import { WhitePiece } from '../entities/WhitePiece.js';
import { RedQueen } from '../entities/RedQueen.js';
import { Striker } from '../entities/Striker.js';
import { BoardGeometry as Geo } from './BoardGeometry.js';

export const BoardSetup = {
    /**
     * Standard setup places the Queen in the center, surrounded by an alternating ring of 6 pieces,
     * and an outer alternating ring of 12 pieces. Total 19 pieces.
     */
    arrangeStandard(physicsWorld) {
        const cx = 450; // virtualSize/2
        const cy = 450;
        const R = 18; // piece radius
        const offset = R * 2.02; // Tight packing with tiny sub-pixel gap

        // Center Queen
        const queen = new RedQueen(cx, cy);
        physicsWorld.addBody(queen);

        // Standard Hexagonal angles starting from top (12 o'clock)
        const angles = [];
        for (let i = 0; i < 6; i++) {
            angles.push(-Math.PI / 2 + i * (Math.PI / 3)); 
        }

        // Inner Ring (6 pieces)
        // Image shows: 12 o'clock=White, 2=Black, 4=White, 6=Black, 8=White, 10=Black
        for (let i = 0; i < 6; i++) {
            const angle = angles[i];
            const x = cx + Math.cos(angle) * offset;
            const y = cy + Math.sin(angle) * offset;
            
            // Alternating colors
            const piece = (i % 2 === 0) ? new WhitePiece(x, y) : new BlackPiece(x, y);
            physicsWorld.addBody(piece);
        }

        // Outer Ring (12 pieces)
        for (let i = 0; i < 6; i++) {
            // 1. Radial Corners (Points)
            // Image shows all 6 points of the outer hexagon are Black pieces
            const angle = angles[i];
            const cX = cx + Math.cos(angle) * offset * 2;
            const cY = cy + Math.sin(angle) * offset * 2;
            physicsWorld.addBody(new BlackPiece(cX, cY));

            // 2. Edges (Flats) wedged between the points
            // Image shows all 6 flats of the outer hexagon are White pieces
            const edgeAngle = angles[i] + Math.PI / 6; 
            const dist = offset * Math.sqrt(3);
            const eX = cx + Math.cos(edgeAngle) * dist;
            const eY = cy + Math.sin(edgeAngle) * dist;
            physicsWorld.addBody(new WhitePiece(eX, eY));
        }

        // Add Striker at bottom baseline by default
        const bases = Geo.getBaselines();
        const striker = new Striker(450, bases.bottom.y);
        physicsWorld.addBody(striker);
        
        return striker;
    }
};
