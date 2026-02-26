import { BoardGeometry as Geo } from './BoardGeometry.js';
import { activeTheme as theme } from './BoardTheme.js';

export class BoardRenderer {
    constructor() {
        this.virtualSize = 900;
        this.center = { x: 450, y: 450 };
    }

    render(ctx) {
        this.drawOuterFrame(ctx);
        this.drawSurface(ctx);
        this.drawPockets(ctx);
        
        ctx.save();
        ctx.translate(this.center.x, this.center.y);
        this.drawLines(ctx);
        ctx.restore();
    }

    drawOuterFrame(ctx) {
        const { padding, boardSize } = Geo;
        
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        
        // Outer wood frame border
        ctx.fillStyle = theme.woodDark;
        ctx.beginPath();
        ctx.roundRect(padding, padding, boardSize, boardSize, 20);
        ctx.fill();
        
        // Reset Shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    }

    drawSurface(ctx) {
        const { padding, boardSize, borderWidth, playingArea } = Geo;
        
        const surfaceOrigin = padding + borderWidth;
        
        ctx.fillStyle = theme.surface;
        ctx.beginPath();
        ctx.roundRect(surfaceOrigin, surfaceOrigin, playingArea, playingArea, 5);
        ctx.fill();
        
        // Sharp black edge defining the boundaries of the play space
        ctx.strokeStyle = theme.lines;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawPockets(ctx) {
        const pockets = Geo.getPockets();
        
        pockets.forEach(p => {
            // Pitch black base hole simulating depth
            ctx.fillStyle = theme.pocket;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Geo.pocketRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner darkness gradient simulating depth inside
            const grad = ctx.createRadialGradient(p.x, p.y, Geo.pocketRadius * 0.2, p.x, p.y, Geo.pocketRadius);
            grad.addColorStop(0, 'rgba(0,0,0,1)');
            grad.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Geo.pocketRadius, 0, Math.PI * 2);
            ctx.fill();

            // Heavy outer wooden rim
            ctx.strokeStyle = theme.pocketSupport;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Geo.pocketRadius + 1, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    drawLines(ctx) {
        // Core geometric patterns of the official board matching exactly
        ctx.strokeStyle = theme.lines;
        ctx.globalAlpha = theme.linesAlpha;
        
        this.drawLargeOverlays(ctx);
        this.drawCenterArea(ctx);
        this.drawDiagonals(ctx);
        this.drawBaselines(ctx);
        
        ctx.globalAlpha = 1.0;
    }

    drawLargeOverlays(ctx) {
        ctx.lineWidth = 1.5;
        
        // The one massive circle perfectly sweeping through all 4 baselines
        ctx.beginPath();
        ctx.arc(0, 0, Geo.largeCircleR, 0, Math.PI * 2);
        ctx.stroke();
        
        // The medium circle enclosing the arrangement center
        ctx.beginPath();
        ctx.arc(0, 0, Geo.middleCircleR, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawCenterArea(ctx) {
        ctx.lineWidth = 1.5;
        
        // Tiny ring denoting exact center placement
        ctx.beginPath();
        ctx.arc(0, 0, Geo.centerCircleR, 0, Math.PI * 2);
        ctx.stroke();
        
        // Solid black anchor dot exactly in the middle 
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = theme.lines;
        ctx.fill();
    }

    drawDiagonals(ctx) {
        const pDist = 330; // Radius distance out towards the pockets
        ctx.lineWidth = 1.5;
        
        const drawArrow = (angle) => {
            ctx.save();
            ctx.rotate(angle);
            
            // Draw pure straight line sweeping inward from corner
            const startDist = pDist - 30; // Close to pocket
            const endDist = 140; // Pinpoint center of innermost loop
            
            ctx.beginPath();
            ctx.moveTo(startDist, 0);
            ctx.lineTo(endDist, 0);
            ctx.stroke();
            
            const circleRadius = 16;
            
            // Outer loop circle on the line
            ctx.beginPath();
            ctx.arc(160, 0, circleRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner loop circle acting as the terminus point
            ctx.beginPath();
            ctx.arc(endDist, 0, circleRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        };

        // Render precisely at corner diagonals
        drawArrow(Math.PI / 4);
        drawArrow(3 * Math.PI / 4);
        drawArrow(5 * Math.PI / 4);
        drawArrow(7 * Math.PI / 4);
    }

    drawBaselines(ctx) {
        ctx.lineWidth = 1.5;
        const oBase = Geo.outerBase;
        const iBase = Geo.innerBase;
        const cRadius = Geo.cornerCircleR;
        
        const drawLine = (x1, y1, x2, y2) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        };

        // Draw overlapping full square grid 
        // Top Baseline
        drawLine(-oBase, -oBase, oBase, -oBase);
        drawLine(-oBase, -iBase, oBase, -iBase);
        
        // Bottom Baseline
        drawLine(-oBase, oBase, oBase, oBase);
        drawLine(-oBase, iBase, oBase, iBase);
        
        // Left Baseline
        drawLine(-oBase, -oBase, -oBase, oBase);
        drawLine(-iBase, -oBase, -iBase, oBase);
        
        // Right Baseline
        drawLine(oBase, -oBase, oBase, oBase);
        drawLine(iBase, -oBase, iBase, oBase);

        // Stamp intersect circles precisely on the corners of the tic-tac-toe grids
        const drawCornerGroup = (signX, signY) => {
            // Unfilled marker sitting on the absolute outside perimeter
            ctx.beginPath();
            ctx.arc(oBase * signX, oBase * signY, cRadius, 0, Math.PI * 2);
            
            // Clear out intersection line artifacts underneath it
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.stroke();
            
            // Master Red target circle marking the inner corners 
            ctx.beginPath();
            ctx.arc(iBase * signX, iBase * signY, cRadius, 0, Math.PI * 2);
            ctx.fillStyle = theme.redAccent;
            ctx.fill();
            
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = theme.lines;
            ctx.stroke();
        };

        drawCornerGroup(1, 1);
        drawCornerGroup(1, -1);
        drawCornerGroup(-1, 1);
        drawCornerGroup(-1, -1);
    }
}
