class FlappyParsleyGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Responsive Canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Game State
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.attemptsLeft = 5; // Default before sync

        // Physics (ADAPTIVE DIFFICULTY 😈 - FACILITATED FOR USERS)
        this.gravity = 0.65; // Slightly lower for more floaty feel
        this.jumpStrength = -8; // More controlled jumps

        // Initial "Easy" State
        this.speed = 5;
        this.pipeGap = 150;
        this.pipeInterval = 80;

        // Bird (The Parsley) - Responsive size
        const isMobile = window.innerWidth <= 768;
        this.bird = {
            x: isMobile ? 40 : 50,
            y: this.canvas.height / 2,
            radius: isMobile ? 18 : 12, // Larger on mobile for easier visibility
            velocity: 0,
            color: '#2ecc71',
            stroke: '#27ae60'
        };

        // Pipes
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeTimer = 0;

        // Assets (Drawing Style)
        this.colors = {
            sky: '#87CEEB',
            ground: '#3b7a57',
            pipe: '#27ae60',
            pipeBorder: '#1e8449',
            text: '#ffffff'
        };

        // Setup Secure Date & Attempts
        this.initGame();
    }

    initGame() {
        // 🔒 DEVICE FINGERPRINT GUARD: Block game if multi-account
        if (window.DeviceFingerprint && window.DeviceFingerprint.isAbusing()) {
            this.multiAccountBlocked = true;
            this.drawMultiAccountBlock();
            // Freeze the bird so no updates happen
            this.gameStarted = false;
            this.gameOver = true;
            this.attemptsLeft = 0;
            this.loop = this.loop.bind(this);
            requestAnimationFrame(() => this.drawMultiAccountBlock());
            return;
        }
        const status = checkAndIncrementAttempts(false);
        this.attemptsLeft = status.left;
        this.initInput();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    drawMultiAccountBlock() {
        if (!this.ctx) return;
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.fillText('🔒', this.canvas.width / 2, this.canvas.height / 2 - 60);
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 22px Cairo, Arial';
        this.ctx.fillText('اللعبة محظورة على هذا الجهاز', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillStyle = '#ffeaa7';
        this.ctx.font = '16px Cairo, Arial';
        this.ctx.fillText('تم اكتشاف استخدام حسابات متعددة', this.canvas.width / 2, this.canvas.height / 2 + 40);
        const original = window.DeviceFingerprint.getOriginalEmail();
        if (original) {
            this.ctx.fillStyle = '#dfe6e9';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`الحساب الأصلي: ${original}`, this.canvas.width / 2, this.canvas.height / 2 + 75);
        }
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        if (!this.gameStarted && this.bird) {
            this.bird.y = this.canvas.height / 2;
        }
    }

    initInput() {
        const jump = (e) => {
            if (e && e.cancelable) e.preventDefault();

            // Check limit before starting or restart
            if (!this.gameStarted || this.gameOver) {
                const status = checkAndIncrementAttempts(false);
                this.attemptsLeft = status.left;

                if (!status.allowed) {
                    this.gameOver = true;
                    // Force redraw to show limit message
                    return;
                }
            }

            if (this.gameOver) {
                this.reset();
                return;
            }
            if (!this.gameStarted) {
                this.gameStarted = true;
            }
            this.bird.velocity = this.jumpStrength;
        };

        this.canvas.addEventListener('mousedown', jump);
        this.canvas.addEventListener('touchstart', jump);

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') jump(e);
        });
    }

    reset() {
        // Prevent reset if 0 attempts
        if (this.attemptsLeft <= 0) return;

        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.pipeTimer = 0;

        // Reset Difficulty
        this.speed = 5;
        this.pipeGap = 150;
        this.pipeInterval = 80;

        document.getElementById('game-score').innerText = '0';
    }

    spawnPipe() {
        const minHeight = 50;
        const maxPipeHeight = this.canvas.height - this.pipeGap - minHeight - 50;
        const topHeight = Math.floor(Math.random() * (maxPipeHeight - minHeight + 1)) + minHeight;

        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            passed: false
        });
    }

    // NEW: Adaptive difficulty based on score
    adjustDifficulty() {
        if (this.score < 20) {
            // Level 1: Easy Warmup (0-20) 🟢
            // Slow speed, wide gaps. very easy to score.
            this.speed = 4;
            this.pipeGap = 180;
            this.pipeInterval = 90;
        } else if (this.score < 30) {
            // Level 2: The Acceleration (20-30) 🟡
            // Speed jumps, Gap shrinks.
            const progress = (this.score - 20); // 0 to 10
            this.speed = 5 + (progress * 0.3); // 5 -> 8
            this.pipeGap = 160 - (progress * 4); // 160 -> 120
            this.pipeInterval = 80 - progress; // 80 -> 70
        } else if (this.score < 50) {
            // Level 3: Hard Mode (30-50) 🔴
            const progress = (this.score - 30);
            this.speed = 8 + (progress * 0.15); // 8 -> 11
            this.pipeGap = 120 - (progress * 1.5); // 120 -> 90
            this.pipeInterval = 70 - progress; // 70 -> 50
        } else {
            // Level 4: God Mode (50+) ☠️
            const progress = (this.score - 50);
            this.speed = 11 + (progress * 0.1);
            this.pipeGap = Math.max(80, 90 - (progress * 0.5));
            this.pipeInterval = 50;
        }
    }

    update() {
        if (!this.gameStarted || this.gameOver) return;

        // Apply progressive difficulty
        this.adjustDifficulty();

        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        if (this.bird.y + this.bird.radius >= this.canvas.height - 20) {
            this.handleDeath();
        }
        if (this.bird.y - this.bird.radius <= 0) {
            this.bird.y = this.bird.radius;
            this.bird.velocity = 0;
        }

        this.pipeTimer++;
        if (this.pipeTimer > this.pipeInterval) {
            this.spawnPipe();
            this.pipeTimer = 0;
        }

        for (let i = 0; i < this.pipes.length; i++) {
            const p = this.pipes[i];
            p.x -= this.speed;

            const birdBox = {
                l: this.bird.x - this.bird.radius + 4,
                r: this.bird.x + this.bird.radius - 4,
                t: this.bird.y - this.bird.radius + 4,
                b: this.bird.y + this.bird.radius - 4
            };

            const topPipe = { l: p.x, r: p.x + this.pipeWidth, t: 0, b: p.topHeight };
            const bottomPipe = { l: p.x, r: p.x + this.pipeWidth, t: p.topHeight + this.pipeGap, b: this.canvas.height };

            if (this.checkCollision(birdBox, topPipe) || this.checkCollision(birdBox, bottomPipe)) {
                this.handleDeath();
            }

            if (!p.passed && p.x + this.pipeWidth < this.bird.x) {
                p.passed = true;
                this.scorePoint();
            }

            if (p.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
                i--;
            }
        }
    }

    handleDeath() {
        if (this.gameOver) return;
        this.gameOver = true;

        // DEDUCT ATTEMPT ON DEATH
        // We increment the 'used' attempts count
        const status = checkAndIncrementAttempts(true);
        this.attemptsLeft = status.left;

        console.log("Game Over. Attempts Left: " + this.attemptsLeft);
    }

    checkCollision(rect1, rect2) {
        return (rect1.l < rect2.r && rect1.r > rect2.l &&
            rect1.t < rect2.b && rect1.b > rect2.t);
    }

    scorePoint() {
        this.score++;
        document.getElementById('game-score').innerText = this.score;
        const earned = addSeedToUser();

        const overlay = document.createElement('div');
        if (earned) {
            overlay.innerText = '+1 🌿';
            overlay.style.cssText = `position:absolute; left:50%; top:20%; color:gold; font-size:24px; font-weight:bold; animation:floatUp 0.8s forwards; pointer-events:none;`;
        } else {
            overlay.innerText = 'Limit! (500)';
            overlay.style.cssText = `position:absolute; left:50%; top:20%; color:red; font-size:20px; font-weight:bold; animation:floatUp 0.8s forwards; pointer-events:none;`;
        }
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 800);
    }

    draw() {
        // ... (Same drawing logic, just update UI Text part) ...
        this.ctx.fillStyle = this.colors.sky;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

        this.ctx.fillStyle = this.colors.pipe;
        this.ctx.strokeStyle = this.colors.pipeBorder;
        this.ctx.lineWidth = 2;

        this.pipes.forEach(p => {
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.topHeight);
            this.ctx.strokeRect(p.x, -2, this.pipeWidth, p.topHeight);
            this.ctx.fillRect(p.x - 2, p.topHeight - 20, this.pipeWidth + 4, 20);
            this.ctx.strokeRect(p.x - 2, p.topHeight - 20, this.pipeWidth + 4, 20);

            const bottomY = p.topHeight + this.pipeGap;
            const bottomH = this.canvas.height - bottomY;
            this.ctx.fillRect(p.x, bottomY, this.pipeWidth, bottomH);
            this.ctx.strokeRect(p.x, bottomY, this.pipeWidth, bottomH + 2);

            this.ctx.fillRect(p.x - 2, bottomY, this.pipeWidth + 4, 20);
            this.ctx.strokeRect(p.x - 2, bottomY, this.pipeWidth + 4, 20);
        });

        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.bird.velocity * 0.1)));
        this.ctx.rotate(rotation);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.bird.color;
        this.ctx.fill();
        this.ctx.strokeStyle = this.bird.stroke;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#e8f5e9';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 2, 8, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(6, -4, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(8, -4, 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();

        // UI Text
        if (!this.gameStarted) {
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 4;
            this.ctx.font = 'bold 30px Roboto';
            this.ctx.textAlign = 'center';

            // Limit Check UI
            if (this.attemptsLeft <= 0) {
                // Dim background
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // Lock Icon
                this.ctx.font = '80px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("🔒", this.canvas.width / 2, this.canvas.height / 2 - 40);

                this.ctx.fillStyle = 'white';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 4;
                this.ctx.font = 'bold 30px Roboto';

                this.ctx.strokeText("Daily Limit Reached", this.canvas.width / 2, this.canvas.height / 2 + 20);
                this.ctx.fillText("Daily Limit Reached", this.canvas.width / 2, this.canvas.height / 2 + 20);

                this.ctx.font = '20px Roboto';
                this.ctx.fillStyle = '#ff4d4d'; // Red
                this.ctx.fillText("Come back tomorrow! (0/5)", this.canvas.width / 2, this.canvas.height / 2 + 60);
            } else {
                this.ctx.strokeText("Tap to Fly", this.canvas.width / 2, this.canvas.height / 2 - 20);
                this.ctx.fillText("Tap to Fly", this.canvas.width / 2, this.canvas.height / 2 - 20);
                this.ctx.font = '20px Roboto';
                this.ctx.fillText(`Daily Attempts: ${this.attemptsLeft}/5`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            }

        } else if (this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 4;
            this.ctx.font = 'bold 40px Roboto';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText("Game Over", this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillText("Game Over", this.canvas.width / 2, this.canvas.height / 2 - 20);

            this.ctx.font = '20px Roboto';
            if (this.attemptsLeft > 0) {
                this.ctx.fillText(`Tap to Restart (${this.attemptsLeft} Left)`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            } else {
                this.ctx.fillStyle = '#ff4d4d';
                this.ctx.fillText("No Attempts Left! 🔒", this.canvas.width / 2, this.canvas.height / 2 + 20);
            }
        }
    }

    loop() {
        if (this.multiAccountBlocked) {
            // Keep drawing the block screen (static, no updates)
            this.drawMultiAccountBlock();
            requestAnimationFrame(this.loop);
            return;
        }
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

// SECURE TIME & LIMIT MANAGER
function getSecureDate() {
    // Simplification for reliability: Use local date
    // Prevents API failures from resetting attempts
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function checkAndIncrementAttempts(increment = false) {
    const userStr = localStorage.getItem('baqdouns_current_user');
    if (!userStr) return { allowed: false, left: 0 };

    let user = JSON.parse(userStr);

    // Get Date
    const today = getSecureDate();

    // Reset if new day
    if (user.lastAttemptDate !== today) {
        user.dailyAttempts = 0;
        user.lastAttemptDate = today;
        user.dailyPoints = 0; // Reset seed limit too
    }

    const MAX_ATTEMPTS = 5;

    // Check Status BEFORE incrementing
    if (user.dailyAttempts >= MAX_ATTEMPTS) {
        // Ensure saved state reflects limit
        saveUser(user);
        return { allowed: false, left: 0 };
    }

    if (increment) {
        user.dailyAttempts = (user.dailyAttempts || 0) + 1;
        saveUser(user);
    }

    return { allowed: true, left: MAX_ATTEMPTS - (user.dailyAttempts || 0) };
}

function saveUser(user) {
    localStorage.setItem('baqdouns_current_user', JSON.stringify(user));
    const users = JSON.parse(localStorage.getItem('baqdouns_users') || '[]');
    const index = users.findIndex(u => u.email === user.email); // Match by email is safer
    if (index > -1) {
        users[index] = user;
        localStorage.setItem('baqdouns_users', JSON.stringify(users));
    }
}

function addSeedToUser() {
    const userStr = localStorage.getItem('baqdouns_current_user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);

    // 🔒 DEVICE FINGERPRINT GUARD: Block seeds if multi-account abuse
    if (window.DeviceFingerprint && window.DeviceFingerprint.isAbusing()) {
        console.warn('🔒 Multi-account detected: seed blocked for email', user.email);
        return false;
    }

    if ((user.dailyPoints || 0) >= 500) return false;

    user.points = (user.points || 0) + 1;
    user.dailyPoints = (user.dailyPoints || 0) + 1;
    saveUser(user);
    return true;
}
