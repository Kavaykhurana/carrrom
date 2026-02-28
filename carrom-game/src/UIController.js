export class UIController {
    constructor(engine) {
        this.engine = engine;
        this.storage = engine.storageManager;
        
        this.domMenuLayer = document.getElementById('ui-layer');
        
        // Bind generic buttons
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) btnRestart.addEventListener('click', () => this.handleRestart());
        
        const btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.addEventListener('click', () => this.handlePauseToggle());
        
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) btnSettings.addEventListener('click', () => this.handleSettings());
        
        this._buildMainMenu();
    }
    
    _buildMainMenu() {
        this.domMenuLayer.classList.remove('hidden');
        this.domMenuLayer.innerHTML = `
            <div class="menu-card">
                <h1 class="menu-title">CARROM</h1>
                <h3 class="menu-subtitle">CHAMPIONSHIP (LOCAL)</h3>
                
                <p class="menu-label">Select Number of Players:</p>
                <div class="menu-actions">
                    <button class="menu-btn premium-btn" data-players="2">2 Player</button>
                    <button class="menu-btn premium-btn" data-players="3">3 Player</button>
                    <button class="menu-btn premium-btn" data-players="4">4 Player</button>
                </div>
            </div>
        `;
        
        const btns = this.domMenuLayer.querySelectorAll('.menu-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const count = parseInt(e.target.getAttribute('data-players'));
                this.domMenuLayer.classList.add('hidden');
                
                // Initialize players
                this.engine.turnManager.initPlayers(count);
                this._buildScoreboard(count);
                
                // Transition state to PLAYING
                this.engine.stateMachine.setState('PLAYING');
                
                // Ensure starting from a clean execution state
                if (this.engine.isRunning) {
                    this.engine.isRunning = false;
                }
                this.engine.start();
            });
        });
    }

    _buildScoreboard(numPlayers) {
        const scoreboard = document.getElementById('scoreboard');
        let html = '';
        for (let i = 1; i <= numPlayers; i++) {
            html += `
                <div id="sb-p${i}" class="sb-player">
                    <div class="sb-name">Player ${i}</div>
                    <div class="turn-status"></div>
                    <div class="score-row">Score: <span class="sb-score" id="score-p${i}">0</span></div>
                    <div class="pieces-container" id="pieces-p${i}"></div>
                </div>
            `;
        }
        scoreboard.innerHTML = html;
        scoreboard.style.display = 'flex';
        
        // Setup initial active
        this.updateTurnHUD(1);
    }
    
    updateTurnHUD(activeId) {
        const players = document.querySelectorAll('.sb-player');
        players.forEach(el => {
            el.classList.remove('active');
            const status = el.querySelector('.turn-status');
            if (status) status.innerText = '';
        });
        
        const active = document.getElementById(`sb-p${activeId}`);
        if(active) {
            active.classList.add('active');
            const status = active.querySelector('.turn-status');
            if(status) {
                status.innerText = 'YOUR TURN';
            }
        }
    }

    updatePocketedVisuals(players, bodies) {
        players.forEach(p => {
            const container = document.getElementById(`pieces-p${p.id}`);
            if (!container) return;
            
            if (!p.color) {
                container.innerHTML = '';
                return;
            }
            
            // Count remaining pieces of their assigned color on the physics board
            const remaining = bodies.filter(b => b.type === p.color && b.isActive).length;
            const pocketedCount = 9 - remaining; // Assume total 9 per color
            
            let html = '';
            for (let i = 0; i < pocketedCount; i++) {
                html += `<div class="piece-dot ${p.color}"></div>`;
            }
            container.innerHTML = html;
        });
    }

    handleRestart() {
        location.reload();
    }

    handlePauseToggle() {
        if (this.engine.isRunning) {
            this.engine.pause();
            this.domMenuLayer.classList.remove('hidden');
            this.domMenuLayer.innerHTML = `
                <div class="pause-card">
                    <h1 class="pause-title">⏸ PAUSED</h1>
                    <button id="btn-resume" class="premium-btn">Resume Game</button>
                </div>
            `;
            document.getElementById('btn-resume').addEventListener('click', () => {
                this.domMenuLayer.classList.add('hidden');
                this.engine.start();
            });
        }
    }
    
    showBoardEnd(players, winner, points) {
        this.domMenuLayer.classList.remove('hidden');
        
        let scoreHTML = `<h1 class="result-title">BOARD COMPLETE</h1>`;
        if (winner && points) {
            scoreHTML += `<h2 class="result-subtitle">${winner.name} wins the board (+${points} pts)</h2>`;
        } else {
            scoreHTML += `<h2 class="result-subtitle">Draw / No points awarded</h2>`;
        }
        
        scoreHTML += `<div class="result-scores">`;
        players.forEach(p => {
            scoreHTML += `<div class="result-score-line">Player ${p.id} Score: <span class="score-value">${p.score}</span></div>`;
        });
        scoreHTML += `</div>`;
        
        this.domMenuLayer.innerHTML = `<div class="result-card">${scoreHTML}</div>`;
        
        setTimeout(() => {
            this.domMenuLayer.classList.add('hidden');
        }, 2500);
    }
    
    showGameOver(winner, players) {
        this.domMenuLayer.classList.remove('hidden');
        
        let scoreHTML = `<h1 class="champion-title">👑 CHAMPION!</h1>`;
        scoreHTML += `<h2 class="result-subtitle">${winner.name} has reached the winning score.</h2>`;
        
        scoreHTML += `<div class="result-scores">`;
        players.forEach(p => {
            const crown = p === winner ? ' 👑' : '';
            scoreHTML += `<div class="result-score-line">Player ${p.id} Final Score: <span class="score-value">${p.score}</span>${crown}</div>`;
        });
        scoreHTML += `</div>`;
        
        scoreHTML += `<div class="settings-actions"><button id="btn-restart-end" class="premium-btn">Play Again</button></div>`;
        
        this.domMenuLayer.innerHTML = `<div class="result-card">${scoreHTML}</div>`;
        
        document.getElementById('btn-restart-end').addEventListener('click', () => {
            location.reload();
        });
    }

    handleSettings() {
        this.engine.pause();
        this.domMenuLayer.classList.remove('hidden');
        
        const settings = this.storage.data.settings;
        
        this.domMenuLayer.innerHTML = `
            <div class="settings-card">
                <h1 class="settings-title">⚙️ Settings</h1>
                <div class="settings-row">
                    <span class="settings-label">Theme</span>
                    <span class="settings-value">${settings.theme}</span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">Volume</span>
                    <span class="settings-value">${Math.round(settings.volume * 100)}%</span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">Difficulty</span>
                    <span class="settings-value">${settings.difficulty}</span>
                </div>
                <div class="settings-actions">
                    <button id="btn-close-settings" class="premium-btn">Close</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            this.domMenuLayer.classList.add('hidden');
            this.engine.start();
        });
    }
}
