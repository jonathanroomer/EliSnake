const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const keyCanvas = document.getElementById('key-canvas');
const keyCtx = keyCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');

const gridSize = 20;
const tileCount = 20;
canvas.width = canvas.height = gridSize * tileCount;
keyCanvas.width = 200;
keyCanvas.height = canvas.height;

const snakeLength = 5;
let foods = [];
const maxFoods = 10;
const minFoods = 5;
const minRedApples = 1;

let snake = Array(snakeLength).fill().map((_, i) => ({ x: 10 - i, y: 10 }));
let dx = 1;
let dy = 0;
let score = 5;
let gameLoop;
let gameSpeed = 200;
let isPaused = false;

const foodImages = {};
const foodTypes = {
    RED_APPLE: { imageSrc: 'images/red_apple.png', points: 1 },
    GREEN_APPLE: { imageSrc: 'images/green_apple.png', points: -1 },
    ORANGE: { imageSrc: 'images/orange.png', points: 0, effect: 'slow' },
    BANANA: { imageSrc: 'images/banana.png', points: 0, effect: 'fast' }
};

const snakeImages = {};
const snakeImageSources = {
    head: 'images/head.png',
    body1: 'images/body3.png',
    body2: 'images/body1.png',
    body3: 'images/body2.png',
    tail: 'images/tail.png'
};

function preloadImages() {
    const foodImagePromises = Object.values(foodTypes).map(food => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = food.imageSrc;
            foodImages[food.imageSrc] = img;
        });
    });

    const snakeImagePromises = Object.entries(snakeImageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
            snakeImages[key] = img;
        });
    });

    return Promise.all([...foodImagePromises, ...snakeImagePromises]);
}

function startGame() {
    resetGame();
    gameLoop = setInterval(update, gameSpeed);
    messageElement.textContent = '';
}

function resetGame() {
    snake = Array(snakeLength).fill().map((_, i) => ({ x: 10 - i, y: 10 }));
    dx = 1;
    dy = 0;
    score = 5;
    gameSpeed = 200;
    foods = [];
    while (foods.length < minFoods) {
        spawnFood();
    }
    clearInterval(gameLoop);
    updateScore();
    clearCanvas();
    drawSnake();
    drawFoods();
}

function update() {
    if (isPaused) return;

    const oldHead = snake[0];
    const newHead = { 
        x: (oldHead.x + dx + tileCount) % tileCount, 
        y: (oldHead.y + dy + tileCount) % tileCount 
    };

    // Check if the snake has gone through a wall
    if (Math.abs(newHead.x - oldHead.x) > 1 || Math.abs(newHead.y - oldHead.y) > 1) {
        score -= 2;
        updateScore();
    }

    snake.unshift(newHead);
    snake.pop();

    for (let i = foods.length - 1; i >= 0; i--) {
        if (newHead.x === foods[i].x && newHead.y === foods[i].y) {
            handleFoodCollision(foods[i]);
            foods.splice(i, 1);
        }
    }

    if (isGameOver()) {
        endGame();
        return;
    }

    // Ensure minimum number of foods and at least one red apple
    while (foods.length < minFoods || foods.filter(food => food.imageSrc.includes('red')).length < minRedApples) {
        spawnFood();
    }

    clearCanvas();
    drawSnake();
    drawFoods();
}

function handleFoodCollision(food) {
    score += food.points;
    updateScore();

    if (food.effect === 'slow') {
        gameSpeed = 300;
        setTimeout(() => gameSpeed = 200, 5000);
    } else if (food.effect === 'fast') {
        gameSpeed = 100;
        setTimeout(() => gameSpeed = 200, 5000);
    }

    clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
    spawnFood();
}

function drawFoods() {
    foods.forEach(food => {
        const img = foodImages[food.imageSrc];
        ctx.drawImage(img, food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    });
}

function spawnFood() {
    if (foods.length >= maxFoods) return;

    const redAppleCount = foods.filter(food => food.imageSrc.includes('red')).length;
    let foodType;

    if (redAppleCount < minRedApples) {
        foodType = foodTypes.RED_APPLE;
    } else {
        const availableTypes = Object.entries(foodTypes);
        foodType = availableTypes[Math.floor(Math.random() * availableTypes.length)][1];
    }

    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            ...foodType
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
             foods.some(food => food.x === newFood.x && food.y === newFood.y));

    foods.push(newFood);
}

function isGameOver() {
    return score <= 0 || score >= 30;
}

function endGame() {
    clearInterval(gameLoop);
    messageElement.textContent = score >= 30 ? 'You won! Press Enter to play again.' : 'Game Over! Press Enter to try again.';
}

function clearCanvas() {
    ctx.fillStyle = 'white'; // White background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach((segment, index) => {
        let img;
        if (index === 0) {
            img = snakeImages.head;
        } else if (index === snake.length - 1) {
            img = snakeImages.tail;
        } else {
            img = snakeImages[`body${(index % 3) + 1}`];
        }

        // Calculate rotation based on direction
        let rotation = 0;
        if (index === 0) {
            if (dx === 1) rotation = 0;
            else if (dx === -1) rotation = Math.PI;
            else if (dy === -1) rotation = -Math.PI / 2;
            else if (dy === 1) rotation = Math.PI / 2;
        } else {
            const prev = snake[index - 1];
            const curr = segment;
            if (prev.x < curr.x) rotation = 0;
            else if (prev.x > curr.x) rotation = Math.PI;
            else if (prev.y < curr.y) rotation = Math.PI / 2;
            else if (prev.y > curr.y) rotation = -Math.PI / 2;
        }

        ctx.save();
        ctx.translate(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2);
        ctx.rotate(rotation);
        ctx.drawImage(img, -gridSize / 2, -gridSize / 2, gridSize, gridSize);
        ctx.restore();
    });
}

function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
    scoreElement.style.color = '#6b0884'; // Purple text
    scoreElement.style.fontFamily = '"Comic Sans MS", "Comic Sans", cursive';
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': if (dy === 0) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (dy === 0) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (dx === 0) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx === 0) { dx = 1; dy = 0; } break;
        case ' ': isPaused = !isPaused; break;
        case 'Escape': clearInterval(gameLoop); messageElement.textContent = 'Game exited. Press Enter to start a new game.'; break;
        case 'Enter': if (!gameLoop || isGameOver()) startGame(); break;
        case 'Backspace': resetGame(); break;
    }
});

function drawKey() {
    keyCtx.clearRect(0, 0, keyCanvas.width, keyCanvas.height);
    keyCtx.fillStyle = '#00f4cb2c'; // Sky blue background
    keyCtx.fillRect(0, 0, keyCanvas.width, keyCanvas.height);
    
    const keyX = 10;
    const keyY = 20;
    const lineHeight = 30;
    const imageSize = 25;

    keyCtx.fillStyle = '#6b0884'; // Purple text
    keyCtx.font = '16px "Comic Sans MS", "Comic Sans", cursive';
    keyCtx.textAlign = 'left';

    keyCtx.fillText('Key:', keyX, keyY);
    
    const keyInfo = [
        { imageSrc: 'images/red_apple.png', text: 'Red = 1 point' },
        { imageSrc: 'images/green_apple.png', text: 'Green = -1 point' },
        { imageSrc: 'images/orange.png', text: 'Orange = Go slower' },
        { imageSrc: 'images/banana.png', text: 'Yellow = Go faster' }
    ];

    keyInfo.forEach((item, index) => {
        const img = foodImages[item.imageSrc];
        keyCtx.drawImage(img, keyX, keyY + (index + 1) * lineHeight, imageSize, imageSize);
        keyCtx.fillStyle = '#6b0884'; // Purple text
        keyCtx.fillText(item.text, keyX + imageSize + 10, keyY + (index + 1) * lineHeight + 18);
    });
}

window.onload = function() {
    preloadImages().then(() => {
        resetGame();
        drawKey();
        messageElement.textContent = 'Press Enter to start the game.';
        messageElement.style.color = '#6b0884'; // Purple text
        messageElement.style.fontFamily = '"Comic Sans MS", "Comic Sans", cursive';
    }).catch(error => {
        console.error('Failed to load images:', error);
        messageElement.textContent = 'Failed to load game resources. Please refresh the page.';
    });
};