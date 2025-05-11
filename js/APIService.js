class APIService {
    constructor() {
        this.BASE_URL = '/docs';
    }

    async getGames() {
        try {
            const response = await fetch(`${this.BASE_URL}/games.json`);
            if (!response.ok) throw new Error('Network response failed');
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                console.error('Invalid data format: Expected array');
                return this.getFallbackData();
            }

            return data.map(game => ({
                id: game.id,
                name: game.name || 'Unknown Game',
                is_cracked: Boolean(game.is_cracked),
                cracked_by: Array.isArray(game.cracked_by) ? game.cracked_by : [],
                crack_date: game.crack_date || 'N/A',
                original_version: game.original_version || '0.0.0',
                cracked_version: game.cracked_version || '0.0.0',
                denuvo: Boolean(game.denuvo),
                image: game.image || '',
                trusted_sources: Array.isArray(game.trusted_sources) ? game.trusted_sources : [],
                repack_available: Boolean(game.repack_available),
                online_tutorial: game.online_tutorial || null
            }));
        } catch (error) {
            console.error('API Error:', error);
            return this.getFallbackData();
        }
    }

    getFallbackData() {
        return []; // Empty array prevents crashes
    }
}