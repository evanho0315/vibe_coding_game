// 遊戲變數
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const messageElement = document.getElementById('gameMessage');

// 音效系統
const sounds = {
    background: new Audio('/client/public/sounds/background.mp3'),
    hit: new Audio('/client/public/sounds/hit.mp3'),
    success: new Audio('/client/public/sounds/success.mp3'),
    fail: new Audio('/client/public/sounds/hit.mp3') // 使用hit音效作為失敗音效
};

// 創建音效池避免音效被截斷
const hitSounds = [];
for (let i = 0; i < 5; i++) {
    const hitSound = new Audio('/client/public/sounds/hit.mp3');
    hitSound.volume = 0.7;
    hitSound.preload = 'auto';
    hitSounds.push(hitSound);
}

// 設置音效
sounds.background.loop = true;
sounds.background.volume = 0.3;
sounds.background.preload = 'auto';
sounds.hit.volume = 0.7;
sounds.hit.preload = 'auto';
sounds.success.volume = 0.8;
sounds.success.preload = 'auto';
sounds.fail.volume = 0.5;
sounds.fail.preload = 'auto';

// 預載入所有音效
Object.values(sounds).forEach(sound => sound.load());

// 播放音效函數
function playSound(soundName) {
    try {
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Audio play failed:', e));
        }
    } catch (e) {
        console.log('Sound error:', e);
    }
}

// 開始背景音樂
function startBackgroundMusic() {
    try {
        sounds.background.play().catch(e => console.log('Background music failed:', e));
    } catch (e) {
        console.log('Background music error:', e);
    }
}

// 停止背景音樂
function stopBackgroundMusic() {
    sounds.background.pause();
    sounds.background.currentTime = 0;
}

// 遊戲狀態
let gameState = 'waiting'; // waiting, playing, gameOver, win
let score = 0;
let lives = 3;

// 球物件
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 8,
    dx: 0,
    dy: 0,
    speed: 4,
    onPaddle: true
};

// 平板物件
const paddle = {
    x: canvas.width / 2 - 75,
    y: canvas.height - 20,
    width: 150,
    height: 15,
    speed: 8
};

// 磚塊設定
const brickRows = 6;
const brickCols = 10;
const brickWidth = 75;
const brickHeight = 25;
const brickPadding = 5;
const brickOffsetTop = 80;
const brickOffsetLeft = 10;

// 磚塊顏色陣列
const brickColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
];

let bricks = [];

// 鍵盤狀態
const keys = {
    left: false,
    right: false,
    space: false
};

// 初始化磚塊
function initBricks() {
    bricks = [];
    for (let row = 0; row < brickRows; row++) {
        for (let col = 0; col < brickCols; col++) {
            const brick = {
                x: col * (brickWidth + brickPadding) + brickOffsetLeft,
                y: row * (brickHeight + brickPadding) + brickOffsetTop,
                width: brickWidth,
                height: brickHeight,
                color: brickColors[row],
                visible: true
            };
            bricks.push(brick);
        }
    }
}

// 重置遊戲
function resetGame() {
    score = 0;
    lives = 3;
    gameState = 'waiting';
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = 0;
    ball.dy = 0;
    ball.onPaddle = true;
    paddle.x = canvas.width / 2 - paddle.width / 2;
    initBricks();
    updateUI();
    hideMessage();
    stopBackgroundMusic();
}

// 重置球到平板上
function resetBall() {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    ball.dx = 0;
    ball.dy = 0;
    ball.onPaddle = true;
    gameState = 'waiting';
}

// 發射球
function launchBall() {
    if (ball.onPaddle) {
        ball.onPaddle = false;
        ball.dy = -ball.speed;
        ball.dx = (Math.random() - 0.5) * ball.speed;
        gameState = 'playing';
        startBackgroundMusic();
        playSound('hit');
    }
}

// 更新UI
function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

// 顯示訊息
function showMessage(text, className = '') {
    messageElement.textContent = text;
    messageElement.className = `game-message ${className}`;
    messageElement.classList.remove('hidden');
}

// 隱藏訊息
function hideMessage() {
    messageElement.classList.add('hidden');
}

// 碰撞檢測
function detectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 球與磚塊碰撞
function ballBrickCollision() {
    for (let i = 0; i < bricks.length; i++) {
        const brick = bricks[i];
        if (brick.visible) {
            const ballRect = {
                x: ball.x - ball.radius,
                y: ball.y - ball.radius,
                width: ball.radius * 2,
                height: ball.radius * 2
            };
            
            if (detectCollision(ballRect, brick)) {
                brick.visible = false;
                score++;
                updateUI();
                playSound('hit');
                
                // 計算球應該從哪個方向反彈
                const ballCenterX = ball.x;
                const ballCenterY = ball.y;
                const brickCenterX = brick.x + brick.width / 2;
                const brickCenterY = brick.y + brick.height / 2;
                
                const dx = ballCenterX - brickCenterX;
                const dy = ballCenterY - brickCenterY;
                
                // 判斷碰撞面
                if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
                    ball.dx = -ball.dx; // 左右反彈
                } else {
                    ball.dy = -ball.dy; // 上下反彈
                }
                
                break;
            }
        }
    }
}

// 球與平板碰撞
function ballPaddleCollision() {
    const ballRect = {
        x: ball.x - ball.radius,
        y: ball.y - ball.radius,
        width: ball.radius * 2,
        height: ball.radius * 2
    };
    
    if (detectCollision(ballRect, paddle) && ball.dy > 0) {
        ball.dy = -ball.dy;
        playSound('hit');
        
        // 根據球碰到平板的位置調整角度
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = ball.speed * (hitPos - 0.5) * 2;
    }
}

// 檢查勝利條件
function checkWin() {
    const visibleBricks = bricks.filter(brick => brick.visible);
    if (visibleBricks.length === 0) {
        gameState = 'win';
        stopBackgroundMusic();
        playSound('success');
        showMessage('You Win!', 'win');
    }
}

// 更新遊戲邏輯
function update() {
    // 更新平板位置（不論遊戲狀態都可以移動）
    if (keys.left && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keys.right && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
    
    // 球在平板上時跟隨平板移動（不論遊戲狀態）
    if (ball.onPaddle) {
        ball.x = paddle.x + paddle.width / 2;
    }
    
    if (gameState !== 'playing') return;
    
    // 更新球位置
    if (!ball.onPaddle) {
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // 球與邊界碰撞
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.dx = -ball.dx;
        }
        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
        }
        
        // 球掉到底部
        if (ball.y - ball.radius > canvas.height) {
            lives--;
            updateUI();
            
            if (lives > 0) {
                resetBall();
            } else {
                gameState = 'gameOver';
                stopBackgroundMusic();
                showMessage('Game Over', 'lose');
            }
        }
        
        // 碰撞檢測
        ballBrickCollision();
        ballPaddleCollision();
        checkWin();
    }
}

// 繪製函數
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawPaddle() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // 添加漸變效果
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBricks() {
    bricks.forEach(brick => {
        if (brick.visible) {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // 添加邊框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
    });
}

function drawStartMessage() {
    if (gameState === 'waiting') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按空格鍵開始遊戲', canvas.width / 2, canvas.height / 2);
        
        // 添加控制說明
        ctx.font = '18px Arial';
        ctx.fillText('使用 ← → 方向鍵控制平板', canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('按下空格鍵發射球', canvas.width / 2, canvas.height / 2 + 65);
    }
}

// 主繪製函數
function draw() {
    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製遊戲元素
    drawBricks();
    drawPaddle();
    drawBall();
    drawStartMessage();
}

// 遊戲主循環
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 鍵盤事件處理
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'ArrowLeft':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
            keys.right = true;
            e.preventDefault();
            break;
        case 'Space':
            if (gameState === 'waiting') {
                launchBall();
            } else if (gameState === 'gameOver' || gameState === 'win') {
                resetGame();
            }
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
    }
});

// 防止空格鍵滾動頁面
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

// 初始化遊戲
function init() {
    resetGame();
    gameLoop();
}

// 啟動遊戲
init();
