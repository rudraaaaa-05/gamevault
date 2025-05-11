class GameManager {
    constructor(apiService) {
        this.api = apiService;
        this.games = [];
        this.filteredGames = [];
        this.currentPage = 1;
        this.gamesPerPage = 15;
    }

    async initialize() {
        try {
            this.games = await this.api.getGames();
            this.filteredGames = [...this.games];
        } catch (error) {
            console.error('Init failed:', error);
            this.games = [];
            this.filteredGames = [];
        }
    }

    getPaginatedGames() {
        const start = (this.currentPage - 1) * this.gamesPerPage;
        return this.filteredGames.slice(start, start + this.gamesPerPage);
    }

    filterGames(filterType) {
        this.activeFilter = filterType;
        this.currentPage = 1;
        
        switch(filterType) {
            case 'cracked':
                this.filteredGames = this.games.filter(g => g.is_cracked);
                break;
            case 'uncracked':
                this.filteredGames = this.games.filter(g => !g.is_cracked);
                break;
            case 'denuvo':
                this.filteredGames = this.games.filter(g => g.denuvo);
                break;
            case 'repack':
                this.filteredGames = this.games.filter(g => g.repack_available);
                break;
            default:
                this.filteredGames = [...this.games];
        }
        this.sortGames();
    }

    sortGames() {
        switch(this.sortMethod) {
            case 'newest':
                this.filteredGames.sort((a, b) => new Date(b.crack_date) - new Date(a.crack_date));
                break;
            case 'oldest':
                this.filteredGames.sort((a, b) => new Date(a.crack_date) - new Date(b.crack_date));
                break;
            default:
                this.filteredGames.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredGames.length / this.gamesPerPage);
        document.getElementById('page-info').textContent = `PAGE ${this.currentPage}/${totalPages}`;
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages;
    }
}