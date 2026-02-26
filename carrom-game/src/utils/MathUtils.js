/**
 * Math and Collision Utilities
 */
export const MathUtils = {
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    },

    degToRad(deg) {
        return deg * (Math.PI / 180);
    },

    radToDeg(rad) {
        return rad * (180 / Math.PI);
    },

    /**
     * Checks if two circles overlap
     */
    circleIntersect(c1, c2) {
        const distSq = (c1.pos.x - c2.pos.x) ** 2 + (c1.pos.y - c2.pos.y) ** 2;
        const radii = c1.radius + c2.radius;
        return distSq < radii * radii;
    }
};
