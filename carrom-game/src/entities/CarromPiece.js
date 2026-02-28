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
        
        const { x, y } = this.pos;
        const r = this.radius;

        // 1. High-fidelity drop shadow (only on outer ring)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Base ring with shadow
        const [outerRMult, outerColor] = this.rings[0];
        ctx.fillStyle = outerColor;
        ctx.beginPath();
        ctx.arc(x, y, r * outerRMult, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Draw interior rings (No shadow to prevent blur artifacts)
        for (let i = 1; i < this.rings.length; i++) {
            const [rMult, color] = this.rings[i];
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r * rMult, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Premium Top-down Lighting Gloss
        const shine = ctx.createRadialGradient(
            x - r * 0.3, y - r * 0.3, r * 0.1,
            x, y, r
        );
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        shine.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
        shine.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // 4. Fine sub-pixel stroke for definition
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
