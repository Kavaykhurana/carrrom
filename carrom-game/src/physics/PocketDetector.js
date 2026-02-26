import { BoardGeometry as Geo } from '../board/BoardGeometry.js';

export class PocketDetector {
    constructor(physics, onPocketedCallback) {
        this.physics = physics;
        this.pockets = Geo.getPockets();
        this.triggerRadiusSq = 32 * 32; // 32px trigger zone using squared distance
        this.onPocketedCallback = onPocketedCallback;
    }

    update() {
        // Iterate physics bodies backwards to safely remove
        for (let i = this.physics.bodies.length - 1; i >= 0; i--) {
            let body = this.physics.bodies[i];
            
            for (let p of this.pockets) {
                const diffX = body.pos.x - p.x;
                const diffY = body.pos.y - p.y;
                const distSq = diffX * diffX + diffY * diffY;
                
                if (distSq < this.triggerRadiusSq) {
                    // Piece center entered pocket!
                    this._handlePocket(body, i);
                    break;
                }
            }
        }
    }

    _handlePocket(body, index) {
        // Remove from physics simulation immediately
        this.physics.bodies.splice(index, 1);
        
        // Notify game rules manager
        if (this.onPocketedCallback) {
            this.onPocketedCallback(body);
        }
    }
}
