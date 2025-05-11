class Terminal {
    constructor() {
        this.logElement = document.getElementById('systemLog');
        this.history = [];
        this.historyIndex = -1;
    }

    log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `> [${new Date().toLocaleTimeString()}] ${message}`;
        
        // Add typing animation
        entry.style.width = '0';
        this.logElement.appendChild(entry);
        
        setTimeout(() => {
            entry.style.width = '100%';
            this.logElement.scrollTop = this.logElement.scrollHeight;
        }, 50);

        // Keep only last 50 entries
        if (this.logElement.children.length > 50) {
            this.logElement.removeChild(this.logElement.firstChild);
        }
    }

    clear() {
        this.logElement.innerHTML = '';
    }
}