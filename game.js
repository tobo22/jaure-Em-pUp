const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustamos canvas
canvas.width = 600;
canvas.height = 600;

// Estados
let gameState = "menu"; // menu, keybinds, game, paused, gameover

// Persistencia de teclas
let defaultKeys = { left: "ArrowLeft", right: "ArrowRight", shoot: " " };
let keyBindings = JSON.parse(localStorage.getItem("keyBindings")) || defaultKeys;

// Record
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

// Dificultad
let difficulty = localStorage.getItem("difficulty") || "easy";

const levelNames = {
  easy: "Nivel Agua",
  medium: "Nivel Café",
  hard: "Nivel Alcohol"
};

// Stats enemigos
const enemyStats = {
  easy: {
    red: { hp: 1, ammoReward: 2, livesLost: 1, livesGained: 0 },
    blue: { hp: 3, ammoReward: 4, livesLost: 3, livesGained: 1 },
    purple: { hp: 3, ammoReward: 5, livesLost: 5, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 }
  },
  medium: {
    red: { hp: 2, ammoReward: 2, livesLost: 1, livesGained: 0 },
    blue: { hp: 5, ammoReward: 5, livesLost: 3, livesGained: 1 },
    purple: { hp: 5, ammoReward: 7, livesLost: 5, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 }
  },
  hard: {
    red: { hp: 3, ammoReward: 3, livesLost: 3, livesGained: 0 },
    blue: { hp: 6, ammoReward: 6, livesLost: 5, livesGained: 1 },
    purple: { hp: 8, ammoReward: 10, livesLost: 7, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 }
  }
};

// Jugador
let player = { x: canvas.width/2 - 15, y: canvas.height - 60, w: 30, h: 30, speed: 5 };
let playerColor = "yellow";
let colorTimeout = null;

// Stats
let bullets = [];
let enemies = [];
let kills = 0;
let lives = 3;
let ammo = 10;

// Power-ups
let powerUps = [];
let activePower = null, powerTimeout = null, powerHandled = false;

// Fondo rojo al perder vidas
let flashTimeout = null;

// Input
let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (gameState === "game" && e.key === "Escape") {
    gameState = "paused";
    showPauseMenu();
  } else if (gameState === "paused" && e.key === "Escape") {
    gameState = "game";
    pauseMenu.style.display = "none";
  }
});
document.addEventListener("keyup", e => keys[e.key] = false);

// Android
const isAndroid = /Android/i.test(navigator.userAgent);
if (isAndroid) document.getElementById("changeKeysBtn").style.display = 'none';

// Controles móviles
const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const shootBtn = document.getElementById("shoot");
const powerUpBtn = document.getElementById("powerUp");

leftBtn.addEventListener("touchstart", () => keys[keyBindings.left] = true);
leftBtn.addEventListener("touchend", () => keys[keyBindings.left] = false);
rightBtn.addEventListener("touchstart", () => keys[keyBindings.right] = true);
rightBtn.addEventListener("touchend", () => keys[keyBindings.right] = false);
shootBtn.addEventListener("touchstart", () => { if (gameState === "game") shoot(); });

// Botón power-up en Android
powerUpBtn.addEventListener("touchstart", () => {
  if (gameState !== "game" || !activePower || powerHandled) return;
  const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
  ammo = Math.min(ammo + 3, maxAmmo);
  flashPlayer("green"); // correcto
  powerUps = [];
  activePower = null;
  powerHandled = true;
  powerUpBtn.style.display = "none";
});

// --- MENÚS ---
const menu = document.getElementById("menu");
const keyMenu = document.getElementById("keyMenu");
const credits = document.getElementById("credits");
const highScoreDisplay = document.getElementById("highScore");
const pauseMenu = document.createElement("div");
pauseMenu.id = "pauseMenu";
pauseMenu.className = "menu";
pauseMenu.innerHTML = `
  <h2>Pausa</h2>
  <p>Vidas: <span id="pauseLives"></span></p>
  <p>Balas: <span id="pauseAmmo"></span></p>
  <p>Kills: <span id="pauseKills"></span></p>
  <button id="continueBtn">Continuar</button>
  <button id="backToMainMenuBtn">Volver al Menú</button>
`;
document.body.appendChild(pauseMenu);

const gameOverMenu = document.getElementById("gameOverMenu");

// Botones menú
document.getElementById("startBtn").onclick = () => { resetGame(); showGame(); };
document.getElementById("changeKeysBtn").onclick = () => showKeyMenu();
document.getElementById("creditsBtn").onclick = () => { credits.style.display = 'block'; };
document.getElementById("backToMenuBtn").onclick = () => showMenu();
document.getElementById("retryBtn").onclick = () => { resetGame(); showGame(); };
document.getElementById("backMenuBtn").onclick = () => showMenu();
pauseMenu.querySelector("#continueBtn").onclick = () => {
  gameState = "game";
  pauseMenu.style.display = "none";
};
pauseMenu.querySelector("#backToMainMenuBtn").onclick = () => showMenu();

document.getElementById("difficultySelect").onchange = (e) => {
  difficulty = e.target.value;
  localStorage.setItem("difficulty", difficulty);
};

// --- TECLAS PERSONALIZADAS ---
let changingKey = null;
function waitKey(action, button) {
  if (changingKey) return;
  changingKey = action;
  document.getElementById("keyPrompt").style.display = "block";
  button.textContent = "Presiona una tecla...";
  window.onkeydown = (e) => {
    if (Object.values(keyBindings).includes(e.key) && keyBindings[action] !== e.key) {
      alert("¡Esa tecla ya está asignada!");
      return;
    }
    keyBindings[action] = e.key;
    localStorage.setItem("keyBindings", JSON.stringify(keyBindings));
    updateKeyButtons();
    document.getElementById("keyPrompt").style.display = "none";
    window.onkeydown = null;
    changingKey = null;
  };
}
document.getElementById("leftKeyBtn").onclick = () => waitKey("left", document.getElementById("leftKeyBtn"));
document.getElementById("rightKeyBtn").onclick = () => waitKey("right", document.getElementById("rightKeyBtn"));
document.getElementById("shootKeyBtn").onclick = () => waitKey("shoot", document.getElementById("shootKeyBtn"));

function updateKeyButtons() {
  document.getElementById("leftKeyBtn").textContent = "Izquierda: " + (keyBindings.left === " " ? "Espacio" : keyBindings.left);
  document.getElementById("rightKeyBtn").textContent = "Derecha: " + (keyBindings.right === " " ? "Espacio" : keyBindings.right);
  document.getElementById("shootKeyBtn").textContent = "Disparo: " + (keyBindings.shoot === " " ? "Espacio" : keyBindings.shoot);
}

// --- MENÚS ---
function showMenu() {
  gameState = "menu";
  menu.style.display = 'block';
  keyMenu.style.display = 'none';
  credits.style.display = 'none';
  pauseMenu.style.display = 'none';
  gameOverMenu.style.display = 'none';
  highScoreDisplay.textContent = `Récord Personal de Kills: ${highScore}`;
  document.getElementById("difficultySelect").value = difficulty;
}
function showKeyMenu() { gameState = "keybinds"; menu.style.display = 'none'; keyMenu.style.display = 'block'; updateKeyButtons(); }
function showGame() { gameState = "game"; menu.style.display = 'none'; keyMenu.style.display = 'none'; credits.style.display = 'none'; pauseMenu.style.display = 'none'; gameOverMenu.style.display = 'none'; }
function showPauseMenu() { pauseMenu.style.display = 'block'; document.getElementById("pauseLives").textContent = lives; document.getElementById("pauseAmmo").textContent = ammo; document.getElementById("pauseKills").textContent = kills; }
function showGameOverMenu() { gameOverMenu.style.display = 'block'; document.getElementById("finalStats").textContent = `Vidas: ${lives} | Balas: ${ammo} | Kills: ${kills}`; }

// --- RESET ---
function resetGame() {
  player.x = canvas.width/2 - 15;
  bullets = [];
  enemies = [];
  powerUps = [];
  kills = 0;
  lives = 3;
  ammo = 10;
  activePower = null;
  powerTimeout = null;
  powerHandled = false;
  flashTimeout = null;
  canvas.style.background = "black";
  powerUpBtn.style.display = "none";
}

// --- SHOOT ---
function shoot() {
  if (ammo > 0) {
    bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 10, speed: 7 });
    ammo--;
  }
}

// --- ENEMIGOS ---
function spawnEnemy() {
  if (gameState !== "game") return;
  let type = kills >= 50 ? "blue" : "red";
  if (kills >= 10 && kills < 50 && Math.random() < 0.3) type = "blue";
  if (kills >= 50 && Math.random() < 0.1) type = "purple";
  if (kills === 22 && Math.random() < 0.02) type = "brown";
  const stats = enemyStats[difficulty][type];
  enemies.push({
    x: Math.random()*(canvas.width-30),
    y: -30,
    w: 30,
    h: 30,
    speed: type === "purple" ? 1 : 2,
    type,
    hp: stats.hp,
    maxHp: stats.hp,
    livesLost: stats.livesLost,
    livesGained: stats.livesGained,
    ammoReward: stats.ammoReward,
    direction: type === "purple" ? 1 : 0,
    sideSpeed: type === "purple" ? 1 : 0
  });
}
setInterval(spawnEnemy, 1500);

// --- POWER-UPS ---
function spawnPowerUp() {
  if (gameState !== "game") return;
  let x = Math.random()*(canvas.width-30);
  let y = -30;
  let randomKey = String.fromCharCode(65 + Math.floor(Math.random()*26));
  powerUps.push({ x, y, w:30, h:30, key: randomKey, active: true, speed: 2 });
}
setInterval(spawnPowerUp, 10000);

function handlePowerUps() {
  powerUps.forEach((p, i) => {
    p.y += p.speed;
    if (p.active && player.x < p.x + p.w && player.x + player.w > p.x && player.y < p.y + p.h && player.y + player.h > p.y) {
      activePower = p;
      p.active = false;
      powerTimeout = Date.now() + 1000;
      powerHandled = false;
      if (isAndroid) powerUpBtn.style.display = "inline-block";
    }
    if (!p.active && Date.now() > powerTimeout || p.y >= canvas.height) {
      powerUps.splice(i, 1);
      activePower = null;
      powerHandled = true;
      powerUpBtn.style.display = "none";
    }
  });
  if (activePower && !powerHandled && !isAndroid) {
    document.onkeydown = (e) => {
      if (gameState !== "game") return;
      const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
      if (e.key.toUpperCase() === activePower.key) {
        ammo = Math.min(ammo + 3, maxAmmo);
        flashPlayer("green");
      } else if (e.key !== "Escape") {
        lives -= 1;
        flashPlayer("red");
      }
      powerUps = [];
      activePower = null;
      powerHandled = true;
      document.onkeydown = null;
    };
  }
  if (activePower && Date.now() > powerTimeout && !powerHandled) {
    powerUps = [];
    activePower = null;
    powerHandled = true;
    document.onkeydown = null;
    powerUpBtn.style.display = "none";
  }
}

// --- FLASH PLAYER ---
function flashPlayer(color) {
  playerColor = color;
  clearTimeout(colorTimeout);
  colorTimeout = setTimeout(() => playerColor = "yellow", 1000);
}

// --- UPDATE ---
function updateGame() {
  if (keys[keyBindings.left] && player.x > 0) player.x -= player.speed;
  if (keys[keyBindings.right] && player.x + player.w < canvas.width) player.x += player.speed;
  if (keys[keyBindings.shoot]) { shoot(); keys[keyBindings.shoot] = false; }

  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > 0);

  enemies.forEach(en => {
    en.y += en.speed;
    if (en.type === "purple") {
      en.x += en.sideSpeed * en.direction;
      if (en.x <= 0 || en.x + en.w >= canvas.width) en.direction *= -1;
    }
  });

  enemies = enemies.filter(en => {
    if (en.y >= canvas.height) {
      lives = Math.max(0, lives - en.livesLost);
      if (en.type === "brown") { canvas.style.background = "brown"; gameState = "gameover"; }
      return false;
    }
    return true;
  });

  let bulletsToRemove = new Set();
  bullets.forEach((b, bi) => {
    enemies.forEach((en, ei) => {
      if (b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y) {
        en.hp--;
        bulletsToRemove.add(bi);
        if (en.hp <= 0) {
          const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
          lives += en.livesGained;
          enemies.splice(ei, 1);
          kills++;
          ammo = Math.min(ammo + en.ammoReward, maxAmmo);
          if (kills > highScore) {
            highScore = kills;
            localStorage.setItem("highScore", highScore);
          }
        }
      }
    });
  });
  bullets = bullets.filter((_, i) => !bulletsToRemove.has(i));

  handlePowerUps();

  if (lives <= 0) gameState = "gameover";
}

// --- DRAW ---
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = playerColor;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  bullets.forEach(b => { ctx.fillStyle = "white"; ctx.fillRect(b.x, b.y, b.w, b.h); });

  enemies.forEach(en => {
    ctx.fillStyle = en.type === "red" ? "red" : en.type === "blue" ? "blue" : en.type === "purple" ? "purple" : "brown";
    ctx.fillRect(en.x, en.y, en.w, en.h);
    ctx.fillStyle = "lime";
    ctx.fillRect(en.x, en.y - 5, (en.w * en.hp)/en.maxHp, 4);
  });

  powerUps.forEach(p => {
    ctx.fillStyle = "limegreen";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(p.key, p.x + 8, p.y + 20);
  });

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Vidas: " + lives, 10, 20);
  ctx.fillText("Balas: " + ammo, 10, 40);
  ctx.fillText("Kills: " + kills, 10, 60);
  ctx.fillText(levelNames[difficulty], canvas.width - 130, 20);
  ctx.fillText("Récord: " + highScore, canvas.width - 130, 40);
}

// --- LOOP ---
function gameLoop() {
  if (gameState === "game") {
    updateGame();
    drawGame();
  } else if (gameState === "gameover") {
    showGameOverMenu();
  }
  requestAnimationFrame(gameLoop);
}
gameLoop();

// Menú inicial
showMenu();
