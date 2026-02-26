import { RigidBody } from '../physics/RigidBody.js';

export class CarromPiece extends RigidBody {
    constructor(x, y, radius, mass = 1.0, type = 'piece') {
        super(x, y, radius, mass, type);
        this.restitution = 0.88; 
        this.isActive = true; 
        
        // Support concentric ring arrays [radiusMultiplier, color]
        this.rings = [
            [1.0, '#555'],
            [0.7, '#ccc']
        ];
        
        this.highlight = 'rgba(255,255,255,0.4)';
    }

    render(ctx) {
        if (!this.isActive) return;
        
        // Shadow for the base disk
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw rings from outside in
        for (let i = 0; i < this.rings.length; i++) {
            const [rMult, color] = this.rings[i];
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius * rMult, 0, Math.PI * 2);
            ctx.fill();
            
            // Turn off shadow for inner elements
            ctx.shadowColor = 'transparent';
        }

        // Highlight for 3D premium effect overlay
        const grad = ctx.createLinearGradient(
            this.pos.x - this.radius, this.pos.y - this.radius,
            this.pos.x + this.radius, this.pos.y + this.radius
        );
        grad.addColorStop(0, this.highlight);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
