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

                    ${game.online_tutorial?.guide ? `
                    <div class="update-guide">
                        <h3><i class="fas fa-wrench"></i> Update Guide</h3>
                        <div class="update-step">
                            <h4>Recommended Method</h4>
                            <p>${game.online_tutorial.methods.join('</p><p>')}</p>
                            <a href="${game.online_tutorial.guide}" target="_blank" class="neon">
                                <i class="fas fa-external-link-alt"></i> Full Tutorial
                            </a>
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