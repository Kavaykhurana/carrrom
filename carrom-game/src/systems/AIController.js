import { Vector2 } from '../utils/Vector2.js';
import { BoardGeometry as Geo } from '../board/BoardGeometry.js';

export class AIController {
    constructor(engine, difficulty = 'medium') {
        this.engine = engine;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
        
        this.isThinking = false;
        this.thinkTimer = 0;
        this.thinkDuration = 0;
        
        this.plannedShot = null;
    }

    startTurn() {
        console.log(`AI thinking... Difficulty: ${this.difficulty}`);
        this.isThinking = true;
        this.thinkTimer = 0;
        
        if (this.difficulty === 'easy') this.thinkDuration = Math.random() * 1 + 2; // 2-3s
        else if (this.difficulty === 'medium') this.thinkDuration = Math.random() * 0.5 + 1.5; // 1.5-2s
        else this.thinkDuration = Math.random() * 0.7 + 0.8; // 0.8-1.5s
        
        // Compute best shot asynchronously (conceptually)
        // For physics deterministic realism, we just calculate it instantly and delay act
        this.plannedShot = this.planShot();
    }

    update(dt) {
        if (!this.isThinking) return;
        
        this.thinkTimer += dt;
        if (this.thinkTimer >= this.thinkDuration) {
            this.executeShot();
        }
    }

    planShot() {
        // Simplified heuristic AI for demo purposes
        // Real AI would simulate all angles / pockets for all own pieces
        
        const myColor = this.engine.turnManager.activePlayer.color;
        const myPieces = this.engine.physicsWorld.bodies.filter(b => b.type === myColor);
        const pockets = Geo.getPockets();
        const strikerPos = this.engine.striker.pos;
        
        if (myPieces.length === 0) {
            // Target queen
            const queen = this.engine.physicsWorld.bodies.find(b => b.type === 'queen');
            if (queen) myPieces.push(queen);
            else return this._fallbackShot();
        }
        
        // Find simplest direct shot
        let bestTarget = myPieces[0];
        let bestPocket = pockets[0];
        let shortestDistSq = Infinity;
        
        for (let p of myPieces) {
            for (let pocket of pockets) {
                const distSq = p.pos.distSq(pocket);
                if (distSq < shortestDistSq) {
                    shortestDistSq = distSq;
                    bestTarget = p;
                    bestPocket = pocket;
                }
            }
        }
        
        // Vector from target piece TO pocket
        const toPocketX = bestPocket.x - bestTarget.pos.x;
        const toPocketY = bestPocket.y - bestTarget.pos.y;
        
        // Where striker needs to be at moment of impact
        const rSum = this.engine.striker.radius + bestTarget.radius;
        const normX = toPocketX / Math.sqrt(toPocketX*toPocketX + toPocketY*toPocketY);
        const normY = toPocketY / Math.sqrt(toPocketX*toPocketX + toPocketY*toPocketY);
        
        const ghostPtX = bestTarget.pos.x - normX * rSum;
        const ghostPtY = bestTarget.pos.y - normY * rSum;
        
        // Striker Aim Vector
        let aimVecX = ghostPtX - strikerPos.x;
        let aimVecY = ghostPtY - strikerPos.y;
        
        // Add difficulty noise
        if (this.difficulty === 'easy') {
            const error = (Math.random() - 0.5) * 0.5; // +-25 degrees rough
            const len = Math.sqrt(aimVecX*aimVecX + aimVecY*aimVecY);
            aimVecX += error * len;
            aimVecY += error * len;
        } else if (this.difficulty === 'medium') {
            const error = (Math.random() - 0.5) * 0.1; 
            const len = Math.sqrt(aimVecX*aimVecX + aimVecY*aimVecY);
            aimVecX += error * len;
            aimVecY += error * len;
        }
        
        // Power calculation simply based on distance
        let power = 0.6; 
        if (this.difficulty === 'hard') power = 0.8;
        if (this.difficulty === 'easy') power = Math.random() * 0.4 + 0.4;
        
        return {
            dir: new Vector2(aimVecX, aimVecY).normalize(),
            power: power
        };
    }

    _fallbackShot() {
        return { dir: new Vector2(0, -1), power: 0.5 };
    }

    executeShot() {
        this.isThinking = false;
        
        if (this.plannedShot) {
            const velVec = this.plannedShot.dir.clone().mult(this.plannedShot.power * this.engine.aimingSystem.maxVelocity);
            this.engine.striker.vel.copy(velVec);
            this.engine.striker.isSleeping = false;
            this.engine.stateMachine.setState('SIMULATING');
            
            // Re-bind to idle after execution
            this.engine.aimingSystem.state = 'IDLE';
        }
    }
}
