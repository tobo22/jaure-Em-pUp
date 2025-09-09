const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustamos canvas más ancho
canvas.width = 600;
canvas.height = 600;

// Estados
let gameState = "menu"; // menu, keybinds, game, paused, gameover

// Persistencia de teclas
let defaultKeys = { left: "ArrowLeft", right: "ArrowRight", shoot: " " };
let keyBindings = JSON.parse(localStorage.getItem("keyBindings")) || defaultKeys;

// Persistencia de record de kills
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

// Persistencia de dificultad
let difficulty = localStorage.getItem("difficulty") || "easy"; // Por defecto: fácil

// Nombres de los niveles
const levelNames = {
  easy: "Nivel Agua",
  medium: "Nivel Café",
  hard: "Nivel Alcohol"
};

// Estadísticas de enemigos por dificultad
const enemyStats = {
  easy: {
    red: { hp: 1, ammoReward: 2, livesLost: 1, livesGained: 0 },
    blue: { hp: 3, ammoReward: 4, livesLost: 3, livesGained: 1 },
    purple: { hp: 3, ammoReward: 5, livesLost: 5, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 } // Juan
  },
  medium: {
    red: { hp: 2, ammoReward: 2, livesLost: 1, livesGained: 0 },
    blue: { hp: 5, ammoReward: 5, livesLost: 3, livesGained: 1 },
    purple: { hp: 5, ammoReward: 7, livesLost: 5, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 } // Juan
  },
  hard: {
    red: { hp: 3, ammoReward: 3, livesLost: 3, livesGained: 0 },
    blue: { hp: 6, ammoReward: 6, livesLost: 5, livesGained: 1 },
    purple: { hp: 8, ammoReward: 10, livesLost: 7, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 } // Juan
  }
};

// Jugador
let player = { x: canvas.width/2 - 15, y: canvas.height - 60, w: 30, h: 30, speed: 5 };

// Stats
let bullets = [];
let enemies = [];
let kills = 0;
let lives = 3;
let ammo = 10;

// Power-ups
let powerUps = [];
let activePower = null, powerTimeout = null, powerHandled = false;

// Color change for power-up
let colorChangeTimeout = null;
let playerColor = "yellow"; // Color por defecto

// Efecto de fondo rojo
let flashTimeout = null;

// Input
let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (gameState === "game" && e.key === "Escape") {
    gameState = "paused";
    showPauseMenu();
  }
});
document.addEventListener("keyup", e => keys[e.key] = false);

// Detectar Android
const isAndroid = /Android/i.test(navigator.userAgent);
if (isAndroid) {
  document.getElementById("changeKeysBtn").style.display = 'none';
}

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

// Botones
document.getElementById("startBtn").onclick = () => { resetGame(); showGame(); };
document.getElementById("changeKeysBtn").onclick = () => showKeyMenu();
document.getElementById("creditsBtn").onclick = () => { credits.style.display = 'block'; };
document.getElementById("backToMenuBtn").onclick = () => showMenu();
document.getElementById("retryBtn").onclick = () => { resetGame(); showGame(); };
document.getElementById("backMenuBtn").onclick = () => showMenu();

// Selector de dificultad
document.getElementById("difficultySelect").onchange = (e) => {
  difficulty = e.target.value;
  localStorage.setItem("difficulty", difficulty);
};

// Cambiar teclas
let changingKey = null;
document.getElementById("leftKeyBtn").onclick = () => waitKey("left", document.getElementById("leftKeyBtn"));
document.getElementById("rightKeyBtn").onclick = () => waitKey("right", document.getElementById("rightKeyBtn"));
document.getElementById("shootKeyBtn").onclick = () => waitKey("shoot", document.getElementById("shootKeyBtn"));

function waitKey(action, button) {
  if (changingKey) return; // Evitar múltiples cambios simultáneos
  changingKey = action;
  document.getElementById("keyPrompt").style.display = "block";
  button.textContent = "Presiona una tecla...";
  window.onkeydown = (e) => {
    // Evitar que la misma tecla se asigne a múltiples acciones
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

function updateKeyButtons() {
  document.getElementById("leftKeyBtn").textContent = "Izquierda: " + (keyBindings.left === " " ? "Espacio" : keyBindings.left);
  document.getElementById("rightKeyBtn").textContent = "Derecha: " + (keyBindings.right === " " ? "Espacio" : keyBindings.right);
  document.getElementById("shootKeyBtn").textContent = "Disparo: " + (keyBindings.shoot === " " ? "Espacio" : keyBindings.shoot);
}

function showMenu() {
  gameState = "menu";
  menu.style.display = 'block';
  keyMenu.style.display = 'none';
  credits.style.display = 'none';
  pauseMenu.style.display = 'none';
  gameOverMenu.style.display = 'none';
  highScoreDisplay.textContent = `Récord Personal de Kills: ${highScore}`; // Mostrar récord personal
  document.getElementById("difficultySelect").value = difficulty; // Restaurar dificultad seleccionada
}

function showKeyMenu() {
  gameState = "keybinds";
  menu.style.display = 'none';
  keyMenu.style.display = 'block';
  updateKeyButtons();
}

function showGame() {
  gameState = "game";
  menu.style.display = 'none';
  keyMenu.style.display = 'none';
  credits.style.display = 'none';
  pauseMenu.style.display = 'none';
  gameOverMenu.style.display = 'none';
}

function showPauseMenu() {
  pauseMenu.style.display = 'block';
  document.getElementById("pauseLives").textContent = lives;
  document.getElementById("pauseAmmo").textContent = ammo;
  document.getElementById("pauseKills").textContent = kills;
}

function showGameOverMenu() {
  gameOverMenu.style.display = 'block';
  document.getElementById("finalStats").textContent = `Vidas: ${lives} | Balas: ${ammo} | Kills: ${kills}`;
}

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
  colorChangeTimeout = null;
  playerColor = "yellow";
  flashTimeout = null;
  canvas.style.background = "black"; // Restaurar fondo
}

// --- DISPARAR ---
function shoot() {
  if (ammo > 0) {
    bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 10, speed: 7 });
    ammo--;
  }
}

// --- SPAWN ENEMIGOS ---
function spawnEnemy() {
  if (gameState !== "game") return;

  let type = kills >= 50 ? "blue" : "red";
  if (kills >= 10 && kills < 50 && Math.random() < 0.3) type = "blue";

  // Generar enemigo violeta después de 50 kills
  if (kills >= 50 && Math.random() < 0.1) {
    type = "purple";
  }

  // Generar enemigo marrón (Juan) en 22 kills
  if (kills === 22 && Math.random() < 0.02) {
    type = "brown";
  }

  const stats = enemyStats[difficulty][type];
  enemies.push({
    x: Math.random()*(canvas.width-30),
    y: -30,
    w: 30,
    h: 30,
    speed: type === "purple" ? 1 : 2,
    type,
    hp: stats.hp,
    maxHp: stats.hp, // Guardar HP inicial para la barra de vida
    livesLost: stats.livesLost,
    livesGained: stats.livesGained,
    ammoReward: stats.ammoReward,
    direction: type === "purple" ? 1 : 0, // Para movimiento lateral
    sideSpeed: type === "purple" ? 1 : 0 // Velocidad lateral lenta
  });
}
setInterval(spawnEnemy, 1500);

// --- SPAWN POWER-UP ---
function spawnPowerUp() {
  if (gameState !== "game") return;
  let x = Math.random()*(canvas.width-30);
  let y = -30; // Comienza desde la parte superior
  let randomKey = String.fromCharCode(65 + Math.floor(Math.random()*26));
  powerUps.push({ x, y, w:30, h:30, key: randomKey, active: true, speed: 2 });
}
setInterval(spawnPowerUp, 10000);

// --- POWER-UPS ---
function handlePowerUps() {
  powerUps.forEach((p, i) => {
    // Mover power-up hacia abajo
    p.y += p.speed;

    // colisión jugador
    if (p.active &&
        player.x < p.x + p.w && player.x + player.w > p.x &&
        player.y < p.y + p.h && player.y + player.h > p.y) {
      activePower = p;
      p.active = false;
      powerTimeout = Date.now() + 1000;
      powerHandled = false;
    }

    // expira o sale de la pantalla
    if (!p.active && Date.now() > powerTimeout || p.y >= canvas.height) {
      powerUps.splice(i, 1);
      activePower = null;
      powerHandled = true;
    }
  });

  if (activePower && !powerHandled) {
    document.onkeydown = (e) => {
      if (gameState !== "game") return;
      const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
      const prevLives = lives; // Guardar vidas antes del cambio
      if (e.key.toUpperCase() === activePower.key) {
        ammo = Math.min(ammo + 3, maxAmmo); // +3 balas si acierta
        playerColor = "green"; // Cambiar a verde si acierta
        colorChangeTimeout = Date.now() + 2000;
      } else if (e.key !== "Escape") { // Ignorar Escape para evitar penalización
        lives -= 1; // -1 vida si falla
        playerColor = "red"; // Cambiar a rojo si falla
        colorChangeTimeout = Date.now() + 2000;
      }
      // Activar efecto de fondo rojo si se perdió vida
      if (lives < prevLives && !flashTimeout) {
        flashTimeout = Date.now() + 1000;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(255, 0, 0, 0.8)");
        gradient.addColorStop(1, "rgba(100, 0, 0, 0.8)");
        canvas.style.background = gradient;
        setTimeout(() => {
          canvas.style.background = "black";
          flashTimeout = null;
        }, 1000);
      }
      powerUps = [];
      activePower = null;
      powerHandled = true;
      document.onkeydown = null;
    };
  }

  // Si expira el tiempo y no se presionó ninguna tecla, volver a amarillo
  if (activePower && Date.now() > powerTimeout && !powerHandled) {
    powerUps = [];
    activePower = null;
    powerHandled = true;
    document.onkeydown = null;
    playerColor = "yellow";
  }
}

// --- UPDATE ---
function updateGame() {
  // Movimiento jugador
  if (keys[keyBindings.left] && player.x > 0) player.x -= player.speed;
  if (keys[keyBindings.right] && player.x + player.w < canvas.width) player.x += player.speed;
  if (keys[keyBindings.shoot]) { shoot(); keys[keyBindings.shoot] = false; }

  // Balas
  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > 0);

  // Enemigos
  enemies.forEach(en => {
    en.y += en.speed;
    if (en.type === "purple") {
      en.x += en.sideSpeed * en.direction;
      if (en.x <= 0 || en.x + en.w >= canvas.width) en.direction *= -1; // Cambiar dirección al tocar bordes
    }
  });

  // Filtrar enemigos que pasan
  const prevLives = lives; // Guardar vidas antes del cambio
  enemies = enemies.filter(en => {
    if (en.y >= canvas.height) {
      lives = Math.max(0, lives - en.livesLost);
      if (en.type === "brown") { canvas.style.background = "brown"; gameState = "gameover"; }
      return false;
    }
    return true;
  });

  // Activar efecto de fondo rojo si se perdió vida
  if (lives < prevLives && !flashTimeout) {
    flashTimeout = Date.now() + 1000;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(255, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(100, 0, 0, 0.8)");
    canvas.style.background = gradient;
    setTimeout(() => {
      canvas.style.background = "black";
      flashTimeout = null;
    }, 1000);
  }

  // colisiones balas-enemigos
  let bulletsToRemove = new Set();
  bullets.forEach((b, bi) => {
    enemies.forEach((en, ei) => {
      if (b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y) {
        en.hp--;
        bulletsToRemove.add(bi);
        if (en.hp <= 0) {
          const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
          lives += en.livesGained;
          if (en.type === "brown") { enemies.splice(ei, 1); return; }
          enemies.splice(ei, 1);
          kills++;
          ammo = Math.min(ammo + en.ammoReward, maxAmmo);
          if (kills > highScore) {
            highScore = kills;
            localStorage.setItem("highScore", highScore);
          }
          // Spawn brown (juan) with 2% chance exactly at 22 kills
          if (kills === 22 && Math.random() < 0.02) {
            const stats = enemyStats[difficulty].brown;
            enemies.push({
              x: Math.random()*(canvas.width-30),
              y: -30,
              w: 30,
              h: 30,
              speed: 2,
              type: "brown",
              hp: stats.hp,
              maxHp: stats.hp,
              livesLost: stats.livesLost,
              livesGained: stats.livesGained,
              ammoReward: stats.ammoReward
            });
          }
        }
      }
    });
  });

  // Eliminar balas después de procesar todas las colisiones
  bullets = bullets.filter((_, bi) => !bulletsToRemove.has(bi));

  handlePowerUps();

  // Volver al color por defecto (amarillo) después de que expire el cambio de color
  if (colorChangeTimeout && Date.now() > colorChangeTimeout) {
    playerColor = "yellow";
    colorChangeTimeout = null;
  }

  if (lives <= 0) {
    gameState = "gameover";
    showGameOverMenu();
  }
}

// --- DRAW ---
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jugador
  ctx.fillStyle = playerColor;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // Balas
  ctx.fillStyle = "white";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // Enemigos con barras de vida
  enemies.forEach(en => {
    // Dibujar enemigo
    if (en.type === "red") ctx.fillStyle = "red";
    else if (en.type === "blue") ctx.fillStyle = "blue";
    else if (en.type === "brown") ctx.fillStyle = "brown";
    else if (en.type === "purple") ctx.fillStyle = "purple";
    ctx.fillRect(en.x, en.y, en.w, en.h);

    // Dibujar barra de vida
    if (en.hp > 0) {
      const healthRatio = en.hp / en.maxHp;
      const barWidth = en.w * healthRatio;
      const barHeight = 5;
      const barX = en.x;
      const barY = en.y - 10;
      // Color de la barra: verde (1) a rojo (0)
      const red = Math.floor(255 * (1 - healthRatio));
      const green = Math.floor(255 * healthRatio);
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
      ctx.fillRect(barX, barY, barWidth, barHeight);
    }
  });

  // Power-ups
  powerUps.forEach(p => {
    ctx.fillStyle = "green";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(p.key, p.x + 8, p.y + 20);
  });

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Kills: " + kills, 10, 20);
  ctx.fillText("Lives: " + lives, 10, 40);
  ctx.fillText("Ammo: " + ammo, 10, 60);
  ctx.fillText(levelNames[difficulty], 10, 80); // Mostrar nivel de dificultad
}

// --- LOOP ---
function loop() {
  if (gameState === "game") { updateGame(); drawGame(); }
  else if (gameState === "paused") { drawGame(); } // Keep game state visible behind pause menu
  else if (gameState === "gameover") { drawGame(); } // Keep game state visible behind game over menu
  requestAnimationFrame(loop);
}

loop();