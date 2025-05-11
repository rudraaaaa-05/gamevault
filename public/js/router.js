// Router.js - Handles page changes and navigation
class Router {
    constructor() {
        this.currentPage = 'home';  // Default page
        this.pages = ['home', 'games']

    }

    changePage(page) {
        console.log("Changing to page:", page);  // Diagnostic log
        if (this.pages.includes(page)) {
            this._loadPage(page);
        }
    }

    _loadPage(page) {
        console.log("Loading page:", page);  // Diagnostic log

        // Remove 'active' class from all pages
        this.pages.forEach(p => {
            document.getElementById(`${p}-page`).classList.remove('active');
        });

        // Add 'active' class to the requested page
        document.getElementById(`${page}-page`).classList.add('active');
        this.currentPage = page;
    }
}

const router = new Router();

// Listen for hash changes to switch pages
window.addEventListener('hashchange', () => {
    const page = window.location.hash.substring(1) || 'home';  // Default to 'home' if no hash
    router.changePage(page);
});

// Initialize with the current page
router.changePage(window.location.hash.substring(1) || 'home');
