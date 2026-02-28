import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { BoardRenderer } from './board/BoardRenderer.js';
import { BoardSetup } from './board/BoardSetup.js';
import { InputManager } from './InputManager.js';
import { AimingSystem } from './systems/AimingSystem.js';
import { PocketDetector } from './physics/PocketDetector.js';

import { StateMachine } from './StateMachine.js';
import { TurnManager } from './systems/TurnManager.js';
import { FoulSystem } from './systems/FoulSystem.js';
import { QueenSystem } from './systems/QueenSystem.js';
import { ScoreSystem } from './systems/ScoreSystem.js';
import { RedQueen } from './entities/RedQueen.js';

import { AudioManager } from './AudioManager.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { AIController } from './systems/AIController.js';
import { StorageManager } from './StorageManager.js';
import { UIController } from './UIController.js';

export class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.timeStep = 1 / 120; // 120Hz physics
        this.maxSubSteps = 10;
        this.accumulator = 0;
        this.lastTime = 0;
        this.virtualSize = 900; 
        
        this.physicsWorld = new PhysicsWorld();
        this.boardRenderer = new BoardRenderer();
        
        this.storageManager = new StorageManager();
        
        // Polish Systems
        this.audioManager = new AudioManager();
        this.particleSystem = new ParticleSystem();
        
        this.physicsWorld.onCollision = (type, x, y, magnitude) => {
            if (magnitude > 100) {
                // normalized intensity 0 to 1 based on perceived heavy hit (e.g. max impulse 2000)
                const intensity = Math.min(magnitude / 1000, 1.0);
                this.audioManager.playCollision(intensity);
                if (intensity > 0.5) {
                    this.particleSystem.emitSparks(x, y, 5, '#FFD700', intensity);
                }
            }
        };

        // Setup Rules & State
        this.stateMachine = new StateMachine(this);
        this.scoreSystem = new ScoreSystem(this);
        this.foulSystem = new FoulSystem(this);
        this.queenSystem = new QueenSystem(this);
        this.turnManager = new TurnManager(this);
        
        this.uiController = new UIController(this);
        
        // Setup Board Entities
        this.striker = BoardSetup.arrangeStandard(this.physicsWorld);
        
        // Setup System Overrides
        this.pocketDetector = new PocketDetector(this.physicsWorld, this.onPiecePocketed.bind(this));
        
        this.inputManager = new InputManager(this.canvas, this.virtualSize);
        this.aimingSystem = new AimingSystem(this.striker, this.physicsWorld);
        
        // Bind Input (Allow ANY human player to aim on their turn)
        this.inputManager.events.onStart = (pos) => {
            if (this.stateMachine.currentState === 'PLAYING') {
                this.audioManager.resume();
                this.audioManager.startAmbient(); // Professional ambient layer
                const activeLine = this.turnManager.activePlayer.baseline;
                this.aimingSystem.handleStart(pos, activeLine);
            }
        };
        this.inputManager.events.onMove = (pos) => {
            if (this.stateMachine.currentState === 'PLAYING') {
                const activeLine = this.turnManager.activePlayer.baseline;
                this.aimingSystem.handleMove(pos, this.inputManager.pointerStart, activeLine);
            }
        };
        this.inputManager.events.onEnd = (pos) => {
            if (this.stateMachine.currentState === 'PLAYING') {
                const shotTaken = this.aimingSystem.handleEnd(pos, this.inputManager.pointerStart);
                if (shotTaken) {
                    this.audioManager.playCollision(0.8); // Striker hit sound
                    this.stateMachine.setState('SIMULATING');
                }
            }
        };
        
        this.isRunning = false;
        
        this._bindEvents();
        this._resize();
        
        // Stay in MENU state until UI triggers start
        // Do NOT set to PLAYING here — UIController will do it
    }

    isBoardSleeping() {
        return this.physicsWorld.bodies.every(b => b.isSleeping);
    }

    onPiecePocketed(piece) {
        this.particleSystem.emitDust(piece.pos.x, piece.pos.y);
        this.audioManager.playPocketed(piece.type);
        this.turnManager.onPiecePocketed(piece);
    }
    
    restoreQueen() {
        const qt = new RedQueen(450, 450);
        this.physicsWorld.addBody(qt);
    }
    
    resetBoard() {
        // Clear all physics bodies
        this.physicsWorld.bodies = [];
        
        // Create new standard board setup
        this.striker = BoardSetup.arrangeStandard(this.physicsWorld);
        this.aimingSystem.striker = this.striker;
        
        // Re-init systems for a fresh board
        this.queenSystem._resetState();
        
        // Alternate breaks in TurnManager
        this.turnManager.boardStarterIndex = ((this.turnManager.boardStarterIndex || 0) + 1) % this.turnManager.players.length;
        this.turnManager.activePlayerIndex = this.turnManager.boardStarterIndex;
        this.turnManager.activePlayer = this.turnManager.players[this.turnManager.activePlayerIndex];
        
        // If 2 player mode, alternate who gets White (first to strike)
        if (this.turnManager.players.length === 2) {
            this.turnManager.players[this.turnManager.activePlayerIndex].color = 'white';
            const opp = (this.turnManager.activePlayerIndex + 1) % 2;
            this.turnManager.players[opp].color = 'black';
        } else {
            this.turnManager.players.forEach(p => p.color = null);
        }
        
        this.turnManager._resetStriker();
        this.turnManager._updateTurnHUD();
        if (this.uiController) {
            this.uiController.updatePocketedVisuals(this.turnManager.players, this.physicsWorld.bodies);
        }
        
        // Go to playing
        this.stateMachine.setState('PLAYING');
    }

    _bindEvents() {
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const wrapper = document.getElementById('canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        
        // Preserve square aspect ratio based on shortest side
        const size = Math.min(rect.width, rect.height) - 20; // 20px padding
        if (size <= 0) return;
        
        this.canvas.width = size * window.devicePixelRatio;
        this.canvas.height = size * window.devicePixelRatio;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        
        // CRITICAL: Reset transform before scaling — ctx.scale() compounds!
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.canvas.width / this.virtualSize, this.canvas.height / this.virtualSize);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this._loop(time));
    }

    pause() {
        this.isRunning = false;
    }

    _loop(time) {
        if (!this.isRunning) return;

        let frameTime = (time - this.lastTime) / 1000; // seconds
        this.lastTime = time;

        // Prevent spiral of death on long frames
        if (frameTime > 0.25) frameTime = 0.25;

        this.accumulator += frameTime;

        let steps = 0;
        while (this.accumulator >= this.timeStep && steps < this.maxSubSteps) {
            this.physicsWorld.step(this.timeStep);
            this.pocketDetector.update();
            this.accumulator -= this.timeStep;
            steps++;
        }
        
        this.particleSystem.update(frameTime);
        
        this.stateMachine.update();

        this._render();

        requestAnimationFrame((t) => this._loop(t));
    }

    _render() {
        this.ctx.clearRect(0, 0, this.virtualSize, this.virtualSize);
        
        // 1. Draw Board
        this.boardRenderer.render(this.ctx);
        
        // 2. Draw Aiming (under pieces)
        if (this.isBoardSleeping()) {
            this.aimingSystem.render(this.ctx); // Render aim line for any active human
        }
        
        // 3. Draw Pieces (sorted so striker is on top)
        const sortedBodies = [...this.physicsWorld.bodies].sort((a, b) => {
            if (a.type === 'striker') return 1;
            if (b.type === 'striker') return -1;
            return 0;
        });

        for (let body of sortedBodies) {
            if(body.render) body.render(this.ctx);
        }
        
        // 4. Draw Particles on top
        this.particleSystem.render(this.ctx);
    }
}
