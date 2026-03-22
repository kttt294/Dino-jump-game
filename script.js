document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const landingScreen = document.getElementById('landing-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverOverlay = document.getElementById('game-over-overlay');

    // Buttons
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const exitBtn = document.getElementById('exit-btn');

    // Stats
    const scoreCountEl = document.getElementById('score-count');
    const highScoreEl = document.getElementById('high-score');

    // Canvas Setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Set internal resolution
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Game Constants
    const GRAVITY = 2.0;
    const JUMP_FORCE = -28;
    const GROUND_HEIGHT = 33;
    const DINO_WIDTH = 66;
    const DINO_HEIGHT = 100;
    const OBSTACLE_MIN_GAP = 500;
    const GAME_SPEED_INITIAL = 14.0;

    // Game Variables
    let dino = {
        x: 83,
        y: canvas.height - DINO_HEIGHT - GROUND_HEIGHT,
        width: DINO_WIDTH,
        height: DINO_HEIGHT,
        dy: 0,
        isJumping: false
    };

    let obstacles = [];
    let score = 0;
    let highScore = localStorage.getItem('dinoHighScore') || 0;
    highScoreEl.textContent = highScore;
    let gameSpeed = GAME_SPEED_INITIAL;
    let isGameRunning = false;
    let frameId;
    let obstacleTimer = 0;

    // Handle Input
    function jump() {
        if (!isGameRunning) return;
        if (!dino.isJumping) {
            dino.dy = JUMP_FORCE;
            dino.isJumping = true;
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') jump();
    });

    canvas.addEventListener('mousedown', jump);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    });

    // Game Logic
    function createObstacle() {
        const height = 50 + Math.random() * 83;
        const width = 33 + Math.random() * 33;
        return {
            x: canvas.width,
            y: canvas.height - height - GROUND_HEIGHT,
            width: width,
            height: height
        };
    }

    function resetGame() {
        dino.y = canvas.height - DINO_HEIGHT - GROUND_HEIGHT;
        dino.dy = 0;
        dino.isJumping = false;
        obstacles = [];
        score = 0;
        gameSpeed = GAME_SPEED_INITIAL;
        obstacleTimer = 0;
        scoreCountEl.textContent = score;
        gameOverOverlay.classList.add('hidden');
    }

    function update() {
        if (!isGameRunning) return;

        // Dino Physics
        dino.dy += GRAVITY;
        dino.y += dino.dy;

        // Floor Collision
        if (dino.y > canvas.height - DINO_HEIGHT - GROUND_HEIGHT) {
            dino.y = canvas.height - DINO_HEIGHT - GROUND_HEIGHT;
            dino.dy = 0;
            dino.isJumping = false;
        }

        // Obstacles Generation
        obstacleTimer++;
        if (obstacleTimer > 40 + Math.random() * 30) {
            obstacles.push(createObstacle());
            obstacleTimer = 0;
        }

        // Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= gameSpeed;

            // Simplified Collision Detection
            const tolerance = 8;
            if (
                dino.x + tolerance < obstacles[i].x + obstacles[i].width &&
                dino.x + dino.width - tolerance > obstacles[i].x &&
                dino.y + tolerance < obstacles[i].y + obstacles[i].height &&
                dino.y + dino.height - tolerance > obstacles[i].y
            ) {
                endGame();
                return;
            }

            // Remove off-screen obstacles
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                score++;
                scoreCountEl.textContent = score;
                // Slowly increase speed
                gameSpeed += 0.05;
            }
        }

        draw();
        frameId = requestAnimationFrame(update);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Floor
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

        // Draw Dino (Stylized Blocky Dino)
        ctx.fillStyle = '#f59e0b';
        
        // Body
        ctx.beginPath();
        ctx.roundRect(dino.x, dino.y + 25, dino.width - 8, dino.height - 33, 16);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.roundRect(dino.x + 16, dino.y, dino.width + 8, 41, 13);
        ctx.fill();
        
        // Dino Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(dino.x + dino.width + 8, dino.y + 13, 5, 0, Math.PI * 2);
        ctx.fill();

        // Feet (when jumping)
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(dino.x + 8, dino.y + dino.height - 8, 13, 8);
        ctx.fillRect(dino.x + 33, dino.y + dino.height - 8, 13, 8);

        // Draw Obstacles (Cacti Style)
        ctx.fillStyle = '#0ea5e9';
        obstacles.forEach(obs => {
            ctx.beginPath();
            ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
            ctx.fill();
            
            // Stylized spikes/arms
            ctx.fillRect(obs.x - 13, obs.y + 20, 13, 30);
            ctx.fillRect(obs.x + obs.width, obs.y + 13, 13, 25);
        });
    }

    function startGame() {
        // Fix: Make screen visible FIRST so resizeCanvas can get correct dimensions
        landingScreen.classList.remove('active');
        gameScreen.classList.add('active');
        
        // Wait a tiny bit for the layout change to take effect
        setTimeout(() => {
            resizeCanvas();
            resetGame();
            isGameRunning = true;
            update();
        }, 50);
    }

    function endGame() {
        isGameRunning = false;
        cancelAnimationFrame(frameId);
        gameOverOverlay.classList.remove('hidden');
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('dinoHighScore', highScore);
            highScoreEl.textContent = highScore;
        }
    }

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    exitBtn.addEventListener('click', () => {
        isGameRunning = false;
        cancelAnimationFrame(frameId);
        gameScreen.classList.remove('active');
        landingScreen.classList.add('active');
    });

    // Initial state
    ctx.font = '20px Outfit';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Nhấn START để chơi', canvas.width / 2 - 80, canvas.height / 2);
});

// Polyfill for roundRect (some older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}
