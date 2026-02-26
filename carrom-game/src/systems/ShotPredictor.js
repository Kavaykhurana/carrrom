import { Vector2 } from '../utils/Vector2.js';
import { BoardGeometry as Geo } from '../board/BoardGeometry.js';

export class ShotPredictor {
    constructor(physics) {
        this.physics = physics;
        this.maxReflections = 3;
    }

    /**
     * Predicts the path of the striker
     * Returns an object: { path: [Vector2], hitPiece: RigidBody, hitPos: Vector2, ghostVelocity: Vector2 }
     */
    predict(striker, launchVel) {
        let currentPos = striker.pos.clone();
        let currentVel = launchVel.clone();
        
        const path = [currentPos.clone()];
        let hitPiece = null;
        let hitPos = null;
        let ghostVelocity = null;
        let reflectionCount = 0;
        
        let bounds = Geo.getBounds();
        let bodies = this.physics.bodies.filter(b => b !== striker); // all except striker

        // max distance to simulate
        let remainingDist = launchVel.mag() * 1.5; // roughly the distance it would travel w/ friction
        if (remainingDist < 10) return { path, hitPiece, hitPos, ghostVelocity };

        for (let r = 0; r < this.maxReflections + 1 && remainingDist > 0; r++) {
            let nextCollision = this._findNextCollision(currentPos, currentVel, striker.radius, bounds, bodies);
            
            if (nextCollision) {
                let distToHit = currentPos.dist(nextCollision.point);
                remainingDist -= distToHit;
                
                currentPos = nextCollision.point;
                path.push(currentPos.clone());
                
                if (nextCollision.type === 'piece') {
                    hitPiece = nextCollision.piece;
                    hitPos = currentPos.clone();
                    
                    // compute ghost vector (momentum transfer)
                    // simplest approximation for display: along the normal
                    const rvx = -currentVel.x;
                    const rvy = -currentVel.y;
                    const velAlongNormal = rvx * nextCollision.normal.x + rvy * nextCollision.normal.y;
                    
                    const jVal = -(1 + hitPiece.restitution) * velAlongNormal / (striker.invMass + hitPiece.invMass);
                    
                    ghostVelocity = new Vector2(
                        -nextCollision.normal.x * jVal * hitPiece.invMass,
                        -nextCollision.normal.y * jVal * hitPiece.invMass
                    );
                    
                    // Striker stops or bounces on first piece hit for prediction purposes
                    break;
                } else if (nextCollision.type === 'wall') {
                    // Reflect velocity vector around normal
                    const dot = currentVel.dot(nextCollision.normal);
                    currentVel.x -= 2 * dot * nextCollision.normal.x;
                    currentVel.y -= 2 * dot * nextCollision.normal.y;
                    
                    reflectionCount++;
                    if (reflectionCount >= this.maxReflections) break;
                }
            } else {
                // No more collisions, just extend line to remaining distance
                currentVel.normalize();
                currentPos.x += currentVel.x * remainingDist;
                currentPos.y += currentVel.y * remainingDist;
                path.push(currentPos.clone());
                break;
            }
        }
        
        return { path, hitPiece, hitPos, ghostVelocity };
    }

    _findNextCollision(origin, vel, radius, bounds, bodies) {
        let bestT = Infinity;
        let bestCollision = null;
        
        // 1. Check against bounds (Wall) - AABB vs Ray
        let vX = vel.x;
        let vY = vel.y;
        
        if (vX > 0) {
            let t = (bounds.maxX - radius - origin.x) / vX;
            if (t > 0.001 && t < bestT) { bestT = t; bestCollision = { type: 'wall', point: new Vector2(bounds.maxX - radius, origin.y + vY * t), normal: new Vector2(-1, 0) }; }
        } else if (vX < 0) {
            let t = (bounds.minX + radius - origin.x) / vX;
            if (t > 0.001 && t < bestT) { bestT = t; bestCollision = { type: 'wall', point: new Vector2(bounds.minX + radius, origin.y + vY * t), normal: new Vector2(1, 0) }; }
        }
        
        if (vY > 0) {
            let t = (bounds.maxY - radius - origin.y) / vY;
            if (t > 0.001 && t < bestT) { bestT = t; bestCollision = { type: 'wall', point: new Vector2(origin.x + vX * t, bounds.maxY - radius), normal: new Vector2(0, -1) }; }
        } else if (vY < 0) {
            let t = (bounds.minY + radius - origin.y) / vY;
            if (t > 0.001 && t < bestT) { bestT = t; bestCollision = { type: 'wall', point: new Vector2(origin.x + vX * t, bounds.minY + radius), normal: new Vector2(0, 1) }; }
        }
        
        // 2. Check against pieces (Circle Sweep)
        for (let piece of bodies) {
            let diffX = origin.x - piece.pos.x;
            let diffY = origin.y - piece.pos.y;
            
            // Quadratic equation: a*t^2 + b*t + c = 0
            let a = vX * vX + vY * vY;
            let b = 2 * (diffX * vX + diffY * vY);
            let sumR = radius + piece.radius;
            let c = (diffX * diffX + diffY * diffY) - (sumR * sumR);
            
            // discriminant
            let d = b * b - 4 * a * c;
            
            if (d >= 0) {
                let t = (-b - Math.sqrt(d)) / (2 * a);
                if (t > 0.001 && t < bestT) {
                    bestT = t;
                    let pt = new Vector2(origin.x + vX * t, origin.y + vY * t);
                    let nx = pt.x - piece.pos.x;
                    let ny = pt.y - piece.pos.y;
                    let dist = Math.sqrt(nx*nx + ny*ny);
                    
                    bestCollision = { type: 'piece', piece: piece, point: pt, normal: new Vector2(nx/dist, ny/dist) };
                }
            }
        }
        
        return bestCollision;
    }
}
