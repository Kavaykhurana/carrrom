export const BoardGeometry = {
    // Exact sizing constants (mapped to 900x900 virtual canvas)
    boardSize: 800,
    playingArea: 720,
    borderWidth: 40,
    pocketRadius: 26,
    
    // Distances from center (0,0 offset by 450 in engine)
    innerBase: 235,
    outerBase: 265,
    cornerCircleR: 16,
    
    largeCircleR: 235,
    middleCircleR: 90,
    centerCircleR: 15,
    
    padding: 50, // (900 - 800) / 2
    
    getPockets: function() {
        const d = 345; 
        return [
            { x: 450 - d, y: 450 - d },
            { x: 450 + d, y: 450 - d },
            { x: 450 - d, y: 450 + d },
            { x: 450 + d, y: 450 + d }
        ];
    },

    getBounds: function() {
        return {
            minX: 90,
            minY: 90,
            maxX: 810,
            maxY: 810
        };
    },
    
    getBaselines: function() {
        // midBase is the line the striker physically sits on (center of inner and outer)
        const midBase = 450 + (this.innerBase + this.outerBase) / 2; // 700
        const midBaseOpposite = 450 - (this.innerBase + this.outerBase) / 2; // 200
        
        // The baselines extend exactly to the outer baseline lines of perpendicular sides
        const start = 450 - this.outerBase; // 185
        const end = 450 + this.outerBase; // 715
        
        return {
            bottom: {
                y: midBase,
                startX: start,
                endX: end,
                cutoutTargetLine: this.cornerCircleR
            },
            top: {
                y: midBaseOpposite,
                startX: start,
                endX: end,
                cutoutTargetLine: this.cornerCircleR
            },
            left: {
                x: midBaseOpposite,
                startY: start,
                endY: end,
                cutoutTargetLine: this.cornerCircleR
            },
            right: {
                x: midBase,
                startY: start,
                endY: end,
                cutoutTargetLine: this.cornerCircleR
            }
        };
    }
};
