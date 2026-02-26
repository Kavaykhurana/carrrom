export class StorageManager {
    constructor() {
        this.storageKey = 'carrom_save_data';
        
        // Defaults
        this.data = {
            coins: 0,
            level: 1,
            xp: 0,
            stats: {
                gamesPlayed: 0,
                wins: 0,
                fouls: 0,
                queensPocketed: 0
            },
            settings: {
                volume: 0.8,
                theme: 'Classic Teak',
                difficulty: 'medium'
            }
        };
        
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge to keep new defaults
                this.data = { ...this.data, ...parsed };
                // Deep merge stats/settings
                if (parsed.stats) this.data.stats = { ...this.data.stats, ...parsed.stats };
                if (parsed.settings) this.data.settings = { ...this.data.settings, ...parsed.settings };
            }
        } catch(e) {
            console.warn("Could not load save data", e);
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch(e) {
            console.warn("Could not save data", e);
        }
    }
    
    addCoins(amount) {
        this.data.coins += amount;
        this.save();
    }
    
    addXP(amount) {
        this.data.xp += amount;
        // Simple level curve
        const nextLevel = this.data.level * 1000;
        if (this.data.xp >= nextLevel) {
            this.data.level++;
            this.data.xp -= nextLevel;
            console.log(`Level Up! You are now level ${this.data.level}`);
        }
        this.save();
    }
}
