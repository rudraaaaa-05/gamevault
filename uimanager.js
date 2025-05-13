class UIManager {
    constructor(gameManager, terminal) {
        this.gameManager = gameManager;
        this.terminal = terminal;
        this.searchTimeout = null;
        this.activeModal = null;
        this.disqusInitialized = false; // Track Disqus script loading
    }

    initialize() {
        this.setupEventListeners();
        this.renderGameList(true);
        this.terminal.log("System initialized successfully");
    }

    setupEventListeners() {
        document.getElementById('search').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleFilter(btn.dataset.filter);
            });
        });

        document.getElementById('prev-page').addEventListener('click', () => {
            this.gameManager.currentPage--;
            this.renderGameList();
            this.terminal.log(`Navigated to page ${this.gameManager.currentPage}`);
        });

        document.getElementById('next-page').addEventListener('click', () => {
            this.gameManager.currentPage++;
            this.renderGameList();
            this.terminal.log(`Navigated to page ${this.gameManager.currentPage}`);
        });

        document.getElementById('sort').addEventListener('change', (e) => {
            this.gameManager.sortMethod = e.target.value;
            this.gameManager.sortGames();
            this.renderGameList();
            this.terminal.log(`Sorted by: ${e.target.value}`);
        });
    }

    renderGameList(initial = false) {
        const gameList = document.getElementById('game-list');
        gameList.classList.remove('visible');
        
        setTimeout(() => {
            this.updateGameGrid();
            gameList.classList.add('visible');
            this.gameManager.updatePagination();
        }, 300);
    }

    updateGameGrid() {
        const games = this.gameManager.getPaginatedGames();
        const gameList = document.getElementById('game-list');
        
        gameList.innerHTML = games.map(game => `
            <div class="game-card" data-id="${game.id}">
                <div class="game-image-container scanlines">
                    <img src="${game.image}" 
                         alt="${game.name}" 
                         class="game-image pixelate"
                         loading="lazy">
                    <div class="status-badge ${game.is_cracked ? 'cracked' : 'uncracked'}">
                        ${game.is_cracked ? 'CRACKED' : 'UNCRACKED'}
                    </div>
                    ${game.denuvo ? '<div class="denuvo-badge"><i class="fas fa-shield-alt"></i> DENUVO</div>' : ''}
                    ${game.repack_available ? '<div class="repack-badge"><i class="fas fa-archive"></i> REPACK</div>' : ''}
                    ${game.online ? '<div class="online-badge"><i class="fas fa-globe"></i> ONLINE</div>' : ''}
                    ${game.nsfw ? '<div class="nsfw-badge"><i class="fas fa-exclamation-triangle"></i> NSFW</div>' : ''}
                </div>
                <div class="game-details">
                    <h3>${game.name}</h3>
                    <div class="game-meta">
                        ${this.getCrackersHTML(game.cracked_by)}
                        <span><i class="fas fa-calendar-day"></i> ${game.crack_date}</span>
                        <div class="version-info">
                            <span>Version: ${game.cracked_version}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.addCardListeners();
    }

    getCrackersHTML(crackers) {
        if (!crackers || !crackers.length) return '<span>Unknown</span>';
        return crackers.map(c => `
            <span class="cracker-info">
                <i class="fa-brands fa-steam"></i> 
                ${c.url ? `<a href="${c.url}" target="_blank">${c.name}</a>` : c.name}
            </span>
        `).join('');
    }

    showGameModal(game) {
        if (this.activeModal) {
            this.activeModal.remove();
            this.activeModal = null;
        }

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${game.name}</h2>
                    <div class="modal-status">
                        <div class="status-badge ${game.is_cracked ? 'cracked' : 'uncracked'}">
                            ${game.is_cracked ? 'CRACKED' : 'UNCRACKED'}
                        </div>
                        ${game.denuvo ? '<div class="denuvo-badge"><i class="fas fa-shield-alt"></i> DENUVO</div>' : ''}
                        ${game.repack_available ? '<div class="repack-badge"><i class="fas fa-archive"></i> REPACK</div>' : ''}
                        ${game.online ? '<div class="online-badge"><i class="fas fa-globe"></i> ONLINE</div>' : ''}
                        ${game.nsfw ? '<div class="nsfw-badge"><i class="fas fa-exclamation-triangle"></i> NSFW</div>' : ''}
                    </div>
                </div>
                <div class="modal-body">
                    <div class="modal-media">
                        <div class="main-image-container">
                            <img src="${game.image}" alt="${game.name}" class="pixelate">
                        </div>
                    </div>
                    <div class="modal-details">
                        <div class="detail-item">
                            <strong><i class="fas fa-calendar-day"></i> Release Date</strong>
                            ${game.crack_date}
                        </div>
                        <div class="detail-item">
                            <strong><i class="fas fa-code-branch"></i> Available Version</strong>
                            Latest: ${game.cracked_version}
                        </div>
                        ${this.getCrackersHTML(game.cracked_by)}
                    </div>

                    ${game.trusted_sources?.length ? `
                    <div class="modal-section">
                        <h3><i class="fas fa-shield-alt"></i> Trusted Sources</h3>
                        <ul class="trusted-sources">
                            ${game.trusted_sources.map(source => `
                                <li>
                                    <a href="${source.url}" target="_blank" class="neon">
                                        ${source.name}
                                        ${source.safe ? '<span class="source-safety safe">SAFE</span>' : 
                                         source.risky ? '<span class="source-safety warning">RISKY</span>' : 
                                         '<span class="source-safety verified">VERIFIED</span>'}
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>` : ''}

               ${game.online ? `
<div class="modal-section">
    <h3><i class="fas fa-wrench"></i> Update Tutorial</h3>
    <div class="tutorial-content">
        <p>Methods used to update games: </p>
        <ol class="tutorial-steps">
            <li>
                <strong>Update using Installer</strong>

<div class="tutorial-links">
    ${
        game.update_sources?.length
            ? game.update_sources.map(source => `
                <a href="${source.url}" target="_blank" class="tutorial-link">
                    <i class="fas fa-external-link-alt"></i> ${source.name}
                    ${source.official ? '<span class="official-tag">OFFICIAL</span>' : ''}
                </a>
            `).join('')
            : `
                <a href="https://cs.rin.ru/forum/index.php" target="_blank" rel="noopener noreferrer" class="tutorial-link">CS.RIN.RU</a>
                <a href="https://elamigos.site/#TopOfPage" target="_blank" rel="noopener noreferrer" class="tutorial-link">ElAmigos</a>
                <a href="https://teamkong.tk/" target="_blank" rel="noopener noreferrer" class="tutorial-link">Team Kong</a>
            `
    }
</div>
            <li>
                <strong>Update using Re-Hash Method (RECOMMENDED) </strong>
                <div class="tutorial-code">${game.update_method || '<a href="https://www.youtube.com/watch?v=ZJRRErY8lC0" target="_blank" rel="noopener noreferrer" class="tutorial-link">Youtube Video</a>'}</div>
            </li>
        </ol>
        ${game.update_guide ? `
            <a href="${game.update_guide}" target="_blank" class="neon-btn">
                <i class="fas fa-book"></i> Complete Update Guide
            </a>
        ` : ''}
    </div>
</div>` : ''}

                    <!-- Disqus Comments Section -->
                    <div class="modal-section">
                        <h3><i class="fas fa-comments"></i> Community Discussion</h3>
                        <div id="disqus_thread"></div>
                    </div>
                </div>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
        `;

        // Close handlers
        modal.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        this.activeModal = modal;
        
        // Initialize Disqus
        this.initDisqus(game);
        this.terminal.log(`Viewed details for: ${game.name}`);
    }

    initDisqus(game) {
        window.disqus_config = function() {
            this.page.url = `${window.location.origin}/#game-${game.id}`;
            this.page.identifier = `game-${game.id}`;
            this.page.title = `${game.name} Discussion - OnlyCracks`;
        };

        if (!this.disqusInitialized) {
            const disqusScript = document.createElement('script');
            disqusScript.src = 'https://onlycracks.disqus.com/embed.js';
            disqusScript.setAttribute('data-timestamp', +new Date());
            document.body.appendChild(disqusScript);
            this.disqusInitialized = true;
        } else {
            if (window.DISQUS) {
                DISQUS.reset({
                    reload: true,
                    config: window.disqus_config
                });
            }
        }
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.remove();
            this.activeModal = null;
            document.body.classList.remove('modal-open');
        }
    }

    addCardListeners() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (this.activeModal) return;
                
                const gameId = parseInt(card.dataset.id);
                const game = this.gameManager.games.find(g => g.id === gameId);
                if (game) this.showGameModal(game);
            });
        });
    }

    handleFilter(filterType) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
        this.gameManager.filterGames(filterType);
        this.renderGameList();
        this.terminal.log(`Filter applied: ${filterType}`);
    }

    handleSearch(term) {
        const searchTerm = term.toLowerCase();
        this.gameManager.filteredGames = this.gameManager.games.filter(game =>
            game.name.toLowerCase().includes(searchTerm) ||
            (game.cracked_by?.some(c => c.name.toLowerCase().includes(searchTerm))) ||
            (game.trusted_sources?.some(s => s.name.toLowerCase().includes(searchTerm)))
        );
        this.gameManager.currentPage = 1;
        this.renderGameList();
        this.terminal.log(`Searched for: "${term}" (${this.gameManager.filteredGames.length} results)`);
    }
}