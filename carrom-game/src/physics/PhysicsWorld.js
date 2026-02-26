import { BoardGeometry as Geo } from '../board/BoardGeometry.js';

export class PhysicsWorld {
    constructor() {
        this.bodies = [];
        this.velocityIterations = 20; // High precision collision solver
        
        this.onCollision = null; // Callback for audio/particles
        
        // Match bounds to exact visual geometry
        this.boardBounds = Geo.getBounds();
        this.wallRestitution = 0.80;
    }

    addBody(body) {
        this.bodies.push(body);
    }

    removeBody(body) {
        this.bodies = this.bodies.filter(b => b !== body);
    }

    step(dt) {
        // 1. Update positions
        for (let body of this.bodies) {
            body.update(dt);
        }

        // 2. Resolve Collisions (Iterative solver)
        for (let iter = 0; iter < this.velocityIterations; iter++) {
            this._resolveBodyCollisions();
            this._resolveWallCollisions();
        }
    }

    _resolveBodyCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            const bodyA = this.bodies[i];
            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyB = this.bodies[j];

                // Collision Detection: Distance squared comparison
                const diffX = bodyB.pos.x - bodyA.pos.x;
                const diffY = bodyB.pos.y - bodyA.pos.y;
                const distSq = diffX * diffX + diffY * diffY;
                const radiusSum = bodyA.radius + bodyB.radius;

                if (distSq < radiusSum * radiusSum) {
                    // Collision occurs!
                    let dist = Math.sqrt(distSq);
                    
                    let nx, ny;
                    if (dist === 0) {
                        nx = 1;
                        ny = 0;
                        dist = 0.1; // Fake tiny distance to prevent div-by-zero
                    } else {
                        nx = diffX / dist;
                        ny = diffY / dist;
                    }

                    // Positional correction (Prevent tunneling)
                    const penetration = radiusSum - dist;
                    const percent = 0.8; // Positional penetration allowance
                    const slop = 0.01;
                    const correction = Math.max(penetration - slop, 0) / (bodyA.invMass + bodyB.invMass) * percent;
                    
                    const cx = nx * correction;
                    const cy = ny * correction;
                    
                    bodyA.pos.x -= cx * bodyA.invMass;
                    bodyA.pos.y -= cy * bodyA.invMass;
                    bodyB.pos.x += cx * bodyB.invMass;
                    bodyB.pos.y += cy * bodyB.invMass;

                    // Impulse resolution
                    const rvx = bodyB.vel.x - bodyA.vel.x;
                    const rvy = bodyB.vel.y - bodyA.vel.y;

                    // Relative velocity along normal
                    const velAlongNormal = rvx * nx + rvy * ny;

                    // Do not resolve if velocities are separating
                    if (velAlongNormal > 0) continue;

                    // Calculate restitution (bounciness) - taking min of both
                    const e = Math.min(bodyA.restitution, bodyB.restitution);

                    // Calculate impulse scalar
                    let jVal = -(1 + e) * velAlongNormal;
                    jVal /= bodyA.invMass + bodyB.invMass;

                    // Apply impulse
                    const impulseX = nx * jVal;
                    const impulseY = ny * jVal;

                    bodyA.vel.x -= impulseX * bodyA.invMass;
                    bodyA.vel.y -= impulseY * bodyA.invMass;
                    
                    bodyB.vel.x += impulseX * bodyB.invMass;
                    bodyB.vel.y += impulseY * bodyB.invMass;
                    
                    if (this.onCollision && jVal > 0.5) {
                        const midX = (bodyA.pos.x + bodyB.pos.x) / 2;
                        const midY = (bodyA.pos.y + bodyB.pos.y) / 2;
                        // jVal represents collision intensity roughly
                        this.onCollision('body', midX, midY, jVal);
                    }
                }
            }
        }
    }

    _resolveWallCollisions() {
        for (let body of this.bodies) {
            // Left Wall
            if (body.pos.x - body.radius < this.boardBounds.minX) {
                body.pos.x = this.boardBounds.minX + body.radius;
                if (body.vel.x < 0) {
                    body.vel.x *= -this.wallRestitution;
                }
            }
            // Right Wall
            else if (body.pos.x + body.radius > this.boardBounds.maxX) {
                body.pos.x = this.boardBounds.maxX - body.radius;
                if (body.vel.x > 0) {
                    body.vel.x *= -this.wallRestitution;
                }
            }
            
            // Top Wall
            if (body.pos.y - body.radius < this.boardBounds.minY) {
                body.pos.y = this.boardBounds.minY + body.radius;
                if (body.vel.y < 0) {
                    body.vel.y *= -this.wallRestitution;
                }
            }
            // Bottom Wall
            else if (body.pos.y + body.radius > this.boardBounds.maxY) {
                body.pos.y = this.boardBounds.maxY - body.radius;
                if (body.vel.y > 0) {
                    body.vel.y *= -this.wallRestitution;
                }
            }
        }
    }

    renderDebug(ctx) {
        // Draw standard bounds
        ctx.strokeStyle = '#0f0';
        ctx.beginPath();
        const b = this.boardBounds;
        ctx.rect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY);
        ctx.stroke();

        // Draw bodies
        for(let body of this.bodies) {
            ctx.fillStyle = body.color;
            ctx.beginPath();
            ctx.arc(body.pos.x, body.pos.y, body.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
