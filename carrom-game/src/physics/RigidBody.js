import { Vector2 } from '../utils/Vector2.js';

export class RigidBody {
    constructor(x, y, radius, mass, type = 'piece') {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(0, 0);
        this.radius = radius;
        this.mass = mass;
        this.invMass = mass === 0 ? 0 : 1 / mass; // mass of 0 means static
        this.type = type; // 'piece', 'striker', 'queen'
        
        // Visual
        this.color = '#fff';
        this.highlight = '#fff';
        this.isSleeping = true;
        
        this.restitution = 0.88; // Default, overriden by specific instances
    }

    applyImpulse(impulse, contactVector = null) {
        if (this.invMass === 0) return;
        
        // linear velocity v = v + impulse / mass
        this.vel.x += impulse.x * this.invMass;
        this.vel.y += impulse.y * this.invMass;
        
        this.isSleeping = false;
    }

    update(dt, dragMultiplier = 1) {
        // Apply friction/drag exactly as requested: Board Friction decay each frame
        // Decay based on dt
        const baseFriction = 0.985;
        this.vel.mult(Math.pow(baseFriction * dragMultiplier, dt * 120)); // Normalized to 120Hz scale

        // Sleep threshold
        if (this.vel.magSq() < 0.09) { // 0.3 * 0.3
            this.vel.set(0, 0);
            this.isSleeping = true;
        } else {
            this.isSleeping = false;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
    }
}
