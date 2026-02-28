import { Vector2 } from '../utils/Vector2.js';
import { BoardGeometry as Geo } from '../board/BoardGeometry.js';
import { ShotPredictor } from './ShotPredictor.js';

export class AimingSystem {
    constructor(striker, physicsWorld) {
        this.striker = striker;
        this.physicsWorld = physicsWorld;
        this.predictor = new ShotPredictor(physicsWorld);
        
        this.state = 'IDLE'; // IDLE, POSITIONING, AIMING
        this.maxPowerDist = 200; // max drag distance to charge 100%
        this.maxVelocity = 3400; // Max release velocity
        this.currentPower = 0;
        
        // Vector pointing opposite of the drag direction (where striker will fly)
        this.aimRefDir = new Vector2(0, -1);
        
        // Prediction state
        this.predictionData = null;
        
        // DOM overlays
        this.domPower = document.getElementById('power-bar-fill');
        this.domPowerText = document.getElementById('power-display');
        this.domAngleText = document.getElementById('angle-display');
    }

    handleStart(pos, baselineId = 'bottom') {
        const bounds = Geo.getBaselines();
        const b = bounds[baselineId];
        const clickTolerance = 60;
        
        const distSq = this.striker.pos.distSq(pos);
        
        if (distSq <= this.striker.radius * this.striker.radius * 4) { // Generous tap box for striker
            this.state = 'DRAG_CHECK';
            this.currentPower = 0;
            this.predictionData = null;
            return;
        }

        let onBaseline = false;
        if (baselineId === 'bottom' || baselineId === 'top') {
            if (Math.abs(pos.y - b.y) < clickTolerance && pos.x > b.startX - 20 && pos.x < b.endX + 20) {
                onBaseline = true;
                this.state = 'POSITIONING';
                this.striker.pos.x = Math.max(b.startX, Math.min(b.endX, pos.x)); 
            }
        } else {
            if (Math.abs(pos.x - b.x) < clickTolerance && pos.y > b.startY - 20 && pos.y < b.endY + 20) {
                onBaseline = true;
                this.state = 'POSITIONING';
                this.striker.pos.y = Math.max(b.startY, Math.min(b.endY, pos.y));
            }
        }

        if (!onBaseline) {
            this.state = 'AIMING';
            this.currentPower = 0;
            this.predictionData = null;
        }
    }

    handleMove(pos, startPos, baselineId = 'bottom') {
        const dx = startPos.x - pos.x;
        const dy = startPos.y - pos.y;
        
        if (this.state === 'DRAG_CHECK') {
            const dragDist = Math.sqrt(dx*dx + dy*dy);
            if (dragDist > 5) {
                // Determine intent based on drag angle
                // If dragging mostly parallel to baseline -> POSITIONING
                // If dragging perpendicular -> AIMING
                if (baselineId === 'bottom' || baselineId === 'top') {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.state = 'POSITIONING';
                    } else {
                        this.state = 'AIMING';
                    }
                } else {
                    if (Math.abs(dy) > Math.abs(dx)) {
                        this.state = 'POSITIONING';
                    } else {
                        this.state = 'AIMING';
                    }
                }
            }
        }

        if (this.state === 'POSITIONING') {
            const bounds = Geo.getBaselines();
            const b = bounds[baselineId];
            
            if (baselineId === 'bottom' || baselineId === 'top') {
                const clampedX = Math.max(b.startX, Math.min(b.endX, pos.x));
                this.striker.pos.x = clampedX;
            } else {
                const clampedY = Math.max(b.startY, Math.min(b.endY, pos.y));
                this.striker.pos.y = clampedY;
            }
        } 
        else if (this.state === 'AIMING') {
            const aimVec = new Vector2(dx, dy);
            const dist = aimVec.mag();
            
            if (dist > 5) {
                this.aimRefDir.copy(aimVec).normalize();
            }
            
            const powerRatio = Math.min(dist / this.maxPowerDist, 1.0);
            this.currentPower = powerRatio;
            
            if (this.currentPower > 0.02) { // More sensitive threshold
                const launchVel = new Vector2(this.aimRefDir.x, this.aimRefDir.y);
                launchVel.mult(this.currentPower * this.maxVelocity);
                this.predictionData = this.predictor.predict(this.striker, launchVel);
            } else {
                this.predictionData = null;
            }
            
            this.updateDOM();
        }
    }

    handleEnd(pos, startPos) {
        if (this.state === 'AIMING') {
            if (this.currentPower > 0.02) {
                // Fire the striker!
                const launchVel = new Vector2(this.aimRefDir.x, this.aimRefDir.y);
                launchVel.mult(this.currentPower * this.maxVelocity);
                
                this.striker.vel.copy(launchVel);
                this.striker.isSleeping = false;
                
                this.state = 'IDLE';
                this.currentPower = 0;
                this.predictionData = null;
                this.updateDOM();
                return true; 
            }
        }
        
        this.state = 'IDLE';
        this.currentPower = 0;
        this.predictionData = null;
        this.updateDOM();
        return false;
    }

    updateDOM() {
        if (this.domPower) {
            const pct = Math.round(this.currentPower * 100);
            this.domPower.style.width = `${pct}%`;
            this.domPowerText.innerText = `${pct}%`;
            
            // Aim line color shifts: white (low power) -> yellow -> orange -> red (max)
            let colorStr = '#ffffff';
            if (pct > 75) colorStr = '#ff4400';
            else if (pct > 50) colorStr = '#ffa500';
            else if (pct > 25) colorStr = '#ffff00';
            
            this.domPower.style.background = colorStr;
            
            let deg = Math.atan2(this.aimRefDir.y, this.aimRefDir.x) * (180 / Math.PI);
            deg = Math.round(deg < 0 ? deg + 360 : deg);
            this.domAngleText.innerText = `${deg}°`;
        }
    }

    render(ctx) {
        if (this.state === 'AIMING') {
            
            let colorR = 255;
            let colorG = 255 - (this.currentPower * 200);
            let colorB = 255 - (this.currentPower * 255);
            const rgbStr = `rgba(${colorR}, ${Math.max(0, colorG)}, ${Math.max(0, colorB)}`;
            
            if (this.predictionData && this.predictionData.path.length > 1) {
                const path = this.predictionData.path;
                
                // Draw path segments
                ctx.lineWidth = 3;
                
                for (let i = 0; i < path.length - 1; i++) {
                    const alpha = 0.8 - (i * 0.2); // Fade each bounce
                    ctx.strokeStyle = `${rgbStr}, ${alpha})`;
                    
                    if (i > 0) ctx.setLineDash([8, 8]); // Dashed beyond first reflection
                    else ctx.setLineDash([]);
                    
                    ctx.beginPath();
                    ctx.moveTo(path[i].x, path[i].y);
                    ctx.lineTo(path[i+1].x, path[i+1].y);
                    ctx.stroke();
                }
                ctx.setLineDash([]); // Reset
                
                // Draw target ghost circle
                if (this.predictionData.hitPos) {
                    ctx.strokeStyle = `${rgbStr}, 0.6)`;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.arc(this.predictionData.hitPos.x, this.predictionData.hitPos.y, this.striker.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Draw ghost piece trajectory
                    if (this.predictionData.ghostVelocity && this.predictionData.hitPiece) {
                        const ghostEnd = new Vector2(
                            this.predictionData.hitPiece.pos.x + this.predictionData.ghostVelocity.x * 0.05,
                            this.predictionData.hitPiece.pos.y + this.predictionData.ghostVelocity.y * 0.05
                        );
                        
                        ctx.strokeStyle = `rgba(255,255,255,0.3)`;
                        ctx.beginPath();
                        ctx.moveTo(this.predictionData.hitPiece.pos.x, this.predictionData.hitPiece.pos.y);
                        ctx.lineTo(ghostEnd.x, ghostEnd.y);
                        ctx.stroke();
                    }
                }
            } else {
                // Fallback straight line
                ctx.strokeStyle = `${rgbStr}, 0.5)`;
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 15]);
                ctx.beginPath();
                ctx.moveTo(this.striker.pos.x, this.striker.pos.y);
                const lineEndStr = 400 * this.currentPower + 100;
                ctx.lineTo(
                    this.striker.pos.x + this.aimRefDir.x * lineEndStr,
                    this.striker.pos.y + this.aimRefDir.y * lineEndStr
                );
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Power ring around striker
            ctx.strokeStyle = `${rgbStr}, 0.8)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.striker.pos.x, this.striker.pos.y, this.striker.radius + 15 + (this.currentPower * 10), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
