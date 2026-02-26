import { MathUtils } from '../utils/MathUtils.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    emitSparks(x, y, count = 5, color = '#FFD700', intensity = 1.0) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (100 * intensity) + 50;
            const life = Math.random() * 0.3 + 0.2; // 0.2 to 0.5s
            
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life,
                maxLife: life,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }

    emitDust(x, y) {
        // Simple pocket entry effect
        for (let i = 0; i < 15; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 80 + 20;
            const life = Math.random() * 0.4 + 0.3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life, maxLife: life,
                color: 'rgba(255,255,255,0.4)',
                size: Math.random() * 4 + 2
            });
        }
    }

    update(dt) {
        // Iterate backwards for easy removal
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life -= dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Decelerate
            p.vx *= 0.95; 
            p.vy *= 0.95;
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    }

    render(ctx) {
        if (this.particles.length === 0) return;
        
        ctx.save();
        for (let p of this.particles) {
            // Fade out
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
