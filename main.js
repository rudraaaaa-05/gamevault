document.addEventListener('DOMContentLoaded', async () => {
    // Random subtitle setup
    const subtitles = [
        "GUESS WHO'S GOING TO JAIL TONIGHT",
        "if buying isin't owning, piracy isin't stealing",
        "black don't crack",
        "free games are better than paid games",
        "games are meant to be shared",
        
        
    ];

    const subtitleElement = document.querySelector('.hero-subtitle');
    if (subtitleElement) {
        const randomIndex = Math.floor(Math.random() * subtitles.length);
        subtitleElement.textContent = subtitles[randomIndex];
        
        // Add glitch effect interactions
        subtitleElement.addEventListener('mouseover', () => {
            subtitleElement.classList.add('glitch');
            subtitleElement.setAttribute('data-text', subtitleElement.textContent);
        });
        
        subtitleElement.addEventListener('mouseout', () => {
            subtitleElement.classList.remove('glitch');
        });
    }

    const updateProgress = (percentage, status) => {
        document.getElementById('load-progress').style.width = `${percentage}%`;
        document.getElementById('load-percent').textContent = `${Math.floor(percentage)}%`;
        document.getElementById('load-status').textContent = status;
        const savedTheme = localStorage.getItem('theme') || 'default';
        document.body.setAttribute('data-theme', savedTheme);
    };

    try {
        const matrixAnim = new MatrixAnimation(document.getElementById('matrix-canvas'));
        matrixAnim.start();

        const apiService = new APIService();
        const gameManager = new GameManager(apiService);
        const terminal = new Terminal();
        
        // Simulated loading steps
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(25, 'Loading database...');
        
        await gameManager.initialize();
        updateProgress(60, 'Initializing interface...');
        
        const uiManager = new UIManager(gameManager, terminal);
        updateProgress(80, 'Finalizing setup...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(100, 'System ready!');
        
        setTimeout(() => {
            document.getElementById('matrix-loader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('matrix-loader').remove();
                document.querySelector('.container').style.opacity = '1';
                matrixAnim.stop();
                uiManager.initialize();
            }, 500);
        }, 1000);

    } catch (error) {
        console.error("Fatal error:", error);
        document.getElementById('matrix-loader').remove();
        document.querySelector('.container').style.opacity = '1';
    }
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme') || 'default';
    const newTheme = currentTheme === 'default' ? 'purple' : 'default';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});


document.getElementById('request-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Request sent successfully!');
            form.reset();
        } else {
            throw new Error('Form submission failed');
        }
    } catch (error) {
        showToast('Error sending request. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

