class APIService {
    async getGames() {
        try {
            // Use relative path for GitHub Pages compatibility
            const response = await fetch('games.json');
            
            if (!response.ok) {
                throw new Error(`Failed to load games (HTTP ${response.status})`);
            }

            const rawData = await response.json();
            
            // Validate data structure
            if (!Array.isArray(rawData)) {
                console.error('Invalid data format: Expected array in games.json');
                return this.getFallbackData();
            }

            // Normalize game data
            return rawData.map(game => ({
                id: game.id || Date.now().toString(),
                name: game.name || 'Unnamed Game',
                is_cracked: Boolean(game.is_cracked),
                cracked_by: Array.isArray(game.cracked_by) ? game.cracked_by : [],
                crack_date: game.cracked_date || game.crack_date || 'N/A',
                original_version: game.original_version || '0.0.0',
                cracked_version: game.cracked_version || '0.0.0',
                denuvo: Boolean(game.denuvo),
                image: game.image ? this.resolveImagePath(game.image) : '',
                trusted_sources: this.ensureArray(game.trusted_sources),
                repack_available: Boolean(game.repack_available),
                nsfw: Boolean(game.nsfw),
                online_tutorial: game.online_tutorial || null
            }));
            
        } catch (error) {
            console.error('Games API Error:', error);
            return this.getFallbackData();
        }
    }

    // Helper methods
    resolveImagePath(relativePath) {
        // Handle absolute URLs and relative paths
        return relativePath.startsWith('http') ? relativePath : `img/${relativePath}`;
    }

    ensureArray(value) {
        return Array.isArray(value) ? value : [];
    }

    getFallbackData() {
        // Basic fallback to prevent total failure
        return [{
            id: 'fallback',
            name: 'Fallback Game',
            is_cracked: true,
            cracked_by: ['Community'],
            crack_date: '2023-01-01',
            original_version: '1.0.0',
            cracked_version: '1.0.0',
            denuvo: false,
            image: 'img/fallback.png',
            trusted_sources: [],
            repack_available: true,
            nsfw: false
        }];
    }
}

// Export for module systems (remove if not needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}