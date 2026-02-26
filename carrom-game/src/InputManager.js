import { Vector2 } from './utils/Vector2.js';

export class InputManager {
    constructor(canvas, virtualSize) {
        this.canvas = canvas;
        this.virtualSize = virtualSize;
        
        this.pointerDown = false;
        this.pointerPos = new Vector2(0, 0);
        this.pointerStart = new Vector2(0, 0);
        
        this.events = {
            onStart: null,
            onMove: null,
            onEnd: null
        };

        this._bindEvents();
    }

    _bindEvents() {
        // Mouse
        this.canvas.addEventListener('mousedown', this._onStart.bind(this));
        window.addEventListener('mousemove', this._onMove.bind(this));
        window.addEventListener('mouseup', this._onEnd.bind(this));
        
        // Touch
        this.canvas.addEventListener('touchstart', (e) => this._onStart(e.touches[0], true), { passive: false });
        window.addEventListener('touchmove', (e) => this._onMove(e.touches[0], true), { passive: false });
        window.addEventListener('touchend', this._onEnd.bind(this));
    }

    _getVirtualPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.virtualSize / rect.width;
        const scaleY = this.virtualSize / rect.height;
        
        return new Vector2(
            (clientX - rect.left) * scaleX,
            (clientY - rect.top) * scaleY
        );
    }

    _onStart(e, isTouch = false) {
        if(isTouch && e.preventDefault) e.preventDefault(); // Prevent scrolling
        
        const pos = this._getVirtualPos(e.clientX, e.clientY);
        this.pointerDown = true;
        this.pointerPos.copy(pos);
        this.pointerStart.copy(pos);
        
        if (this.events.onStart) this.events.onStart(pos);
    }

    _onMove(e, isTouch = false) {
        if (!this.pointerDown) return;
        
        const pos = this._getVirtualPos(e.clientX, e.clientY);
        this.pointerPos.copy(pos);
        
        if (this.events.onMove) this.events.onMove(pos);
    }

    _onEnd() {
        if (!this.pointerDown) return;
        
        this.pointerDown = false;
        if (this.events.onEnd) this.events.onEnd(this.pointerPos);
    }
}
