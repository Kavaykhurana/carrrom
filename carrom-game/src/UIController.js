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
        players.forEach(el => el.classList.remove('active'));
        
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
        location.reload(); // Simple absolute reload for now
    }

    handlePauseToggle() {
        if (this.engine.isRunning) {
            this.engine.pause();
            // Show simple pause overlay
            this.domMenuLayer.classList.remove('hidden');
            this.domMenuLayer.innerHTML = `<h1 style="color:white; font-size: 4rem;">PAUSED</h1><br><button id="btn-resume" style="padding: 10px 20px; font-size: 1.5rem; margin-top:20px;">Resume</button>`;
            document.getElementById('btn-resume').addEventListener('click', () => {
                this.domMenuLayer.classList.add('hidden');
                this.engine.start();
            });
        }
    }
    
    showBoardEnd(players, winner, points) {
        this.domMenuLayer.classList.remove('hidden');
        
        let scoreHTML = `<h1 style="color:var(--text-accent); font-size:3rem; margin-bottom: 20px;">BOARD COMPLETE</h1>`;
        if (winner && points) {
            scoreHTML += `<h2 style="color:white; margin-bottom: 20px;">${winner.name} wins the board (+${points} pts)</h2>`;
        } else {
            scoreHTML += `<h2 style="color:white; margin-bottom: 20px;">Draw / No points awarded</h2>`;
        }
        
        scoreHTML += `<div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">`;
        players.forEach(p => {
            scoreHTML += `<div style="font-size: 1.5rem; color: #fff;">Player ${p.id} Score: <span style="color:var(--text-accent); font-weight:bold;">${p.score}</span></div>`;
        });
        scoreHTML += `</div>`;
        
        this.domMenuLayer.innerHTML = `<div style="background: rgba(40, 20, 10, 0.95); padding: 50px; border-radius: 20px; text-align: center; border: 2px solid #FFD700; box-shadow: 0 10px 50px rgba(0,0,0,0.8);">${scoreHTML}</div>`;
        
        // Hide it automatically after 2.5 seconds (coordinated with Engine reset timer)
        setTimeout(() => {
            this.domMenuLayer.classList.add('hidden');
        }, 2500);
    }
    
    showGameOver(winner, players) {
        this.domMenuLayer.classList.remove('hidden');
        
        let scoreHTML = `<h1 style="color:var(--text-accent); font-size:4rem; margin-bottom: 20px;">CHAMPION!</h1>`;
        scoreHTML += `<h2 style="color:white; margin-bottom: 20px;">${winner.name} has reached the winning score.</h2>`;
        
        scoreHTML += `<div style="display:flex; flex-direction:column; gap:10px; margin-top:20px; margin-bottom: 30px;">`;
        players.forEach(p => {
            const isWinner = p === winner ? " 👑" : "";
            scoreHTML += `<div style="font-size: 1.5rem; color: #fff;">Player ${p.id} Final Score: <span style="color:var(--text-accent); font-weight:bold;">${p.score}</span>${isWinner}</div>`;
        });
        scoreHTML += `</div>`;
        
        scoreHTML += `<button id="btn-restart-end" style="padding: 15px 30px; background: linear-gradient(to bottom, #C8860A, #A0680A); border: 2px solid #FFD700; color: white; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1.2rem;">Play Again</button>`;
        
        this.domMenuLayer.innerHTML = `<div style="background: rgba(40, 20, 10, 0.95); padding: 50px; border-radius: 20px; text-align: center; border: 2px solid #FFD700; box-shadow: 0 10px 50px rgba(0,0,0,0.8);">${scoreHTML}</div>`;
        
        document.getElementById('btn-restart-end').addEventListener('click', () => {
            location.reload();
        });
    }

    handleSettings() {
        // Can build full settings modal later
        alert(`Settings\nTheme: ${this.storage.data.settings.theme}\nVolume: ${this.storage.data.settings.volume}`);
    }
}
