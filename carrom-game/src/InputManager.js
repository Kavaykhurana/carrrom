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
        
        // Touch — use { passive: false } to enable preventDefault
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._onStart(e.touches[0]);
        }, { passive: false });
        
        window.addEventListener('touchmove', (e) => {
            if (this.pointerDown) {
                e.preventDefault(); // Prevent page scrolling while aiming
            }
            if (e.touches.length > 0) {
                this._onMove(e.touches[0]);
            }
        }, { passive: false });
        
        window.addEventListener('touchend', (e) => {
            // On touchend, touches is empty — use changedTouches
            if (e.changedTouches && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.pointerPos = this._getVirtualPos(touch.clientX, touch.clientY);
            }
            this._onEnd();
        });
        
        window.addEventListener('touchcancel', () => {
            this._onEnd();
        });
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

    _onStart(e) {
        const pos = this._getVirtualPos(e.clientX, e.clientY);
        this.pointerDown = true;
        this.pointerPos.copy(pos);
        this.pointerStart.copy(pos);
        
        if (this.events.onStart) this.events.onStart(pos);
    }

    _onMove(e) {
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
