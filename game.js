// Estados y variables globales
let gameState = "menu"; // menu, keybinds, credits, game, paused, dead, gameover
let player = { x: 0, y: 0, w: 80, h: 80, speed: 5 }; // Jugador 80x80
let bullets = [];
let enemies = [];
let kills = 0;
let lives = 3;
let ammo = 10;
let powerUps = [];
let activePower = null;
let powerTimeout = null;
let powerHandled = false;
let hasCollidedWithPowerUp = false;
let colorChangeTimeout = null;
let playerColor = "yellow"; // yellow, sad (solo para placeholder si falta jaure_muerto.png)
let playerTempImage = null; // null, "powerup_success_easy", "jaure_feliz", "jaure_enojado", "jaure_muerto"
let flashTimeout = null;
let flashColor = null; // "red" o "brown"
let keys = {};
let defaultKeys = { left: "ArrowLeft", right: "ArrowRight", shoot: " " };
let keyBindings = JSON.parse(localStorage.getItem("keyBindings")) || defaultKeys;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let difficulty = localStorage.getItem("difficulty") || "easy"; // Por defecto: fácil
let deathTimeout = null; // Temporizador para el estado dead
let failedImages = []; // Rastrear imágenes fallidas
let failedSounds = []; // Rastrear audios fallidos
let lastFrameTime = performance.now(); // Para calcular FPS
let fps = 0; // FPS actual
let currentSound = null; // Audio actual en reproducción
let lastPlayedSound = null; // Última canción reproducida para comparar al reanudar
let isMuted = false; // Estado de mute

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Precarga de imágenes
const images = {
  background_easy: new Image(),
  background_medium: new Image(),
  background_hard: new Image(),
  player_easy: new Image(),
  player_medium: new Image(),
  player_hard: new Image(),
  red_easy: new Image(),
  red_medium: new Image(),
  red_hard: new Image(),
  blue_easy: new Image(),
  blue_medium: new Image(),
  blue_hard: new Image(),
  purple_easy: new Image(),
  purple_medium: new Image(),
  purple_hard: new Image(),
  brown: new Image(),
  powerup_easy: new Image(),
  powerup_medium: new Image(),
  powerup_hard: new Image(),
  powerup_success_easy: new Image(), // Para jaure amor.png
  jaure_feliz: new Image(),
  jaure_enojado: new Image(),
  jaure_muerto: new Image(),
  bullet: new Image()
};
images.background_easy.src = 'easy.png';
images.background_medium.src = 'inter.png';
images.background_hard.src = 'hard.png';
images.player_easy.src = 'bauti pelotudo.png';
images.player_medium.src = 'bauti pelotudo.png';
images.player_hard.src = 'bauti pelotudo.png';
images.red_easy.src = 'spike.png';
images.red_medium.src = 'ratata.png';
images.red_hard.src = 'caballero.png';
images.blue_easy.src = 'jet.png';
images.blue_medium.src = 'raticate.png';
images.blue_hard.src = 'hollow knight.png';
images.purple_easy.src = 'ein.png';
images.purple_medium.src = 'rapido.png';
images.purple_hard.src = 'hornet.png';
images.brown.src = 'orgullo peruano.png';
images.powerup_easy.src = 'marronaza.png';
images.powerup_medium.src = 'dito.png';
images.powerup_hard.src = 'nuu.png';
images.powerup_success_easy.src = 'jaure amor.png';
images.jaure_feliz.src = 'jaure feliz.png';
images.jaure_enojado.src = 'jaure enojado.png';
images.jaure_muerto.src = 'jaure muerto.png';
images.bullet.src = 'pokebola.png';

// Precarga de sonidos
const sounds = {
  menu_song: new Audio(),
  gameover_song: new Audio(),
  easy_song: new Audio(),
  medium_song: new Audio(),
  hard_song: new Audio()
};
sounds.menu_song.src = 'menu song.mp3';
sounds.gameover_song.src = 'gameover song.mp3';
sounds.easy_song.src = 'easy song.mp3';
sounds.medium_song.src = 'medium song.mp3';
sounds.hard_song.src = 'hard song.mp3';

// Asegurar que todas las imágenes y sonidos estén cargados o fallen antes de empezar
let imagesLoaded = 0;
let soundsLoaded = 0;
const totalImages = Object.keys(images).length;
const totalSounds = Object.keys(sounds).length;
const totalAssets = totalImages + totalSounds;

for (let key in images) {
  images[key].onload = () => {
    imagesLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true); // Iniciar música del menú al cargar
      loop(); // Iniciar el juego
    }
  };
  images[key].onerror = () => {
    console.error(`Error cargando imagen: ${images[key].src}`);
    failedImages.push(images[key].src); // Rastrear imagen fallida
    imagesLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true); // Iniciar música del menú al cargar
      loop(); // Iniciar el juego
    }
  };
}

for (let key in sounds) {
  sounds[key].oncanplaythrough = () => {
    sounds[key].loop = true; // Configurar bucle para todos los sonidos
    soundsLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true); // Iniciar música del menú al cargar
      loop(); // Iniciar el juego
    }
  };
  sounds[key].onerror = () => {
    console.error(`Error cargando audio: ${sounds[key].src}`);
    failedSounds.push(sounds[key].src); // Rastrear audio fallido
    soundsLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true); // Iniciar música del menú al cargar
      loop(); // Iniciar el juego
    }
  };
}

// Botón de mute
const muteBtn = document.getElementById("muteBtn");
muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
  if (isMuted) {
    if (currentSound) currentSound.pause();
  } else {
    if (currentSound) currentSound.play().catch(e => console.error(`Error reproduciendo ${currentSound.src}:`, e));
  }
});

// Función para reproducir música según el estado
function playMusic(shouldResetMusic = false) {
  // Determinar la canción esperada según el estado
  let expectedSound = null;
  if (gameState === "menu" || gameState === "keybinds" || gameState === "credits") {
    expectedSound = sounds.menu_song;
  } else if (gameState === "gameover" || gameState === "dead") {
    expectedSound = sounds.gameover_song;
  } else if (gameState === "game" || gameState === "paused") {
    expectedSound = sounds[`${difficulty}_song`];
  }

  // Pausar la música actual si es diferente o si se fuerza reinicio
  if (currentSound && (currentSound !== expectedSound || shouldResetMusic)) {
    currentSound.pause();
    currentSound.currentTime = 0;
    currentSound = null;
  }

  // Actualizar currentSound si cambió
  if (expectedSound && currentSound !== expectedSound) {
    currentSound = expectedSound;
    lastPlayedSound = expectedSound; // Guardar para reanudar desde pausa
  }

  // Reproducir la música si no está en pausa y no está mute
  if (currentSound && gameState !== "paused" && !isMuted) {
    currentSound.play().catch(e => console.error(`Error reproduciendo ${currentSound.src}:`, e));
  }
}

// Nombres de los niveles
const levelNames = {
  easy: "Nivel Agua (facil)",
  medium: "Nivel Café (medio)",
  hard: "Nivel Alcohol (dificil)"
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

// Ajustar canvas responsive en móvil
function resizeCanvas() {
  if (window.innerWidth <= 768) {
    canvas.width = Math.min(window.innerWidth, 800);
    canvas.height = window.innerHeight - (window.matchMedia("(orientation: landscape)").matches ? 80 : 100);
    player.y = canvas.height - 120; // Ajustado para h = 80
    player.x = Math.min(player.x, canvas.width - player.w); // Asegurar que no salga del canvas
  } else {
    canvas.width = 600;
    canvas.height = 600;
  }
  // Inicializar posición del jugador
  player.x = canvas.width / 2 - 40; // Ajustado para w = 80
  player.y = canvas.height - 120; // Ajustado para h = 80
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Input
document.addEventListener("keydown", e => {
  e.preventDefault(); // Evitar comportamientos no deseados
  keys[e.key] = true;
  if (gameState === "game" && e.key === "Escape") {
    gameState = "paused";
    showPauseMenu();
  } else if (gameState === "paused" && e.key === "Escape") {
    gameState = "game";
    pauseMenu.style.display = "none";
    playMusic(); // Reanudar música sin reinicio
  }
});
document.addEventListener("keyup", e => {
  keys[e.key] = false; // Asegurar que se limpia
});
window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => keys[key] = false); // Limpiar teclas al perder foco
});

// Detectar móvil
const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
if (isMobile) {
  document.getElementById("changeKeysBtn").style.display = 'none';
}

// Controles móviles
const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const shootBtn = document.getElementById("shoot");
const powerUpBtn = document.getElementById("powerUp");

leftBtn.addEventListener("touchstart", () => keys[keyBindings.left] = true);
leftBtn.addEventListener("touchend", () => {
  keys[keyBindings.left] = false; // Asegurar limpieza
});
rightBtn.addEventListener("touchstart", () => keys[keyBindings.right] = true);
rightBtn.addEventListener("touchend", () => keys[keyBindings.right] = false);
shootBtn.addEventListener("touchstart", () => { if (gameState === "game") shoot(); });

// Botón de power-up
powerUpBtn.addEventListener("touchstart", () => {
  if (gameState !== "game" || powerHandled) return;
  const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
  const prevLives = lives;
  if (hasCollidedWithPowerUp && activePower) {
    ammo = Math.min(ammo + 3, maxAmmo); // +3 balas si acierta
    playerTempImage = difficulty === "easy" ? "powerup_success_easy" : "jaure_feliz"; // jaure amor.png en easy, jaure feliz.png en medium/hard
    colorChangeTimeout = Date.now() + 1000; // 1 segundo
  } else {
    lives -= 1; // -1 vida si tocas sin colisionar
    playerTempImage = "jaure_enojado"; // Mostrar jaure enojado.png
    colorChangeTimeout = Date.now() + 1000; // 1 segundo
    if (lives < prevLives && !flashTimeout) {
      flashTimeout = Date.now() + 1000;
      flashColor = "red";
    }
  }
  powerUps = [];
  activePower = null;
  powerHandled = true;
  hasCollidedWithPowerUp = false;
  powerUpBtn.style.display = "none";
});

// --- MENÚS ---
const menu = document.getElementById("menu");
const keyMenu = document.getElementById("keyMenu");
const creditsMenu = document.getElementById("creditsMenu");
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
document.getElementById("creditsBtn").onclick = () => {
  gameState = "credits";
  menu.style.display = 'none';
  creditsMenu.style.display = 'block';
  playMusic(); // Mantener música del menú sin reinicio
};
document.getElementById("backToMenuBtn").onclick = () => showMenu();
document.getElementById("retryBtn").onclick = () => { resetGame(); showGame(); };
document.getElementById("backMenuBtn").onclick = () => showMenu();
document.getElementById("backFromCreditsBtn").onclick = () => showMenu();
pauseMenu.querySelector("#continueBtn").onclick = () => {
  gameState = "game";
  pauseMenu.style.display = "none";
  playMusic(); // Reanudar música sin reinicio
};
pauseMenu.querySelector("#backToMainMenuBtn").onclick = () => showMenu();

// Selector de dificultad
document.getElementById("difficultySelect").onchange = (e) => {
  difficulty = e.target.value;
  localStorage.setItem("difficulty", difficulty);
  if (gameState === "game") playMusic(true); // Forzar reinicio si cambia dificultad en juego
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
    e.preventDefault(); // Evitar comportamientos no deseados
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
  creditsMenu.style.display = 'none';
  pauseMenu.style.display = 'none';
  gameOverMenu.style.display = 'none';
  highScoreDisplay.textContent = `Récord Personal de Kills: ${highScore}`; // Mostrar récord personal
  document.getElementById("difficultySelect").value = difficulty; // Restaurar dificultad seleccionada
  playMusic(); // Mantener música del menú sin reinicio
}

function showKeyMenu() {
  gameState = "keybinds";
  menu.style.display = 'none';
  keyMenu.style.display = 'block';
  updateKeyButtons();
  playMusic(); // Mantener música del menú sin reinicio
}

function showGame() {
  gameState = "game";
  menu.style.display = 'none';
  keyMenu.style.display = 'none';
  creditsMenu.style.display = 'none';
  pauseMenu.style.display = 'none';
  gameOverMenu.style.display = 'none';
  playMusic(true); // Forzar reinicio al iniciar juego
}

function showPauseMenu() {
  pauseMenu.style.display = 'block';
  document.getElementById("pauseLives").textContent = lives;
  document.getElementById("pauseAmmo").textContent = ammo;
  document.getElementById("pauseKills").textContent = kills;
  if (currentSound) currentSound.pause(); // Pausar música en pausa
}

function showGameOverMenu() {
  gameState = "gameover";
  gameOverMenu.style.display = 'block';
  document.getElementById("finalStats").textContent = `Vidas: ${lives} | Balas: ${ammo} | Kills: ${kills}`;
  playMusic(true); // Forzar reinicio al entrar en game over
}

// --- RESET ---
function resetGame() {
  player.x = canvas.width / 2 - 40; // Ajustado para w = 80
  player.y = canvas.height - 120; // Ajustado para h = 80
  bullets = [];
  enemies = [];
  powerUps = [];
  kills = 0;
  lives = 3;
  ammo = 10;
  activePower = null;
  powerTimeout = null;
  powerHandled = false;
  hasCollidedWithPowerUp = false;
  colorChangeTimeout = null;
  playerColor = "yellow"; // Resetear a yellow para placeholder
  playerTempImage = null; // Resetear imagen temporal
  flashTimeout = null;
  flashColor = null;
  deathTimeout = null; // Resetear temporizador de muerte
  powerUpBtn.style.display = "none";
}

// --- DISPARAR ---
function shoot() {
  if (ammo > 0) {
    bullets.push({ x: player.x + player.w / 2 - 8, y: player.y, w: 16, h: 16, speed: 7 }); // Balas 16x16
    ammo--;
  }
}

// --- SPAWN ENEMIGOS ---
function spawnEnemy() {
  if (gameState !== "game") return;

  let type = kills >= 50 ? "blue" : "red";
  if (kills >= 10 && kills < 50 && Math.random() < 0.3) type = "blue";
  if (kills >= 50 && Math.random() < 0.1) type = "purple";
  if (kills === 22 && Math.random() < 0.02) type = "brown";

  const stats = enemyStats[difficulty][type];
  enemies.push({
    x: Math.random() * (canvas.width - 60), // Ajustado para w = 60
    y: -60, // Ajustado para h = 60
    w: 60, // Enemigos 60x60
    h: 60,
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

// --- SPAWN POWER-UP ---
function spawnPowerUp() {
  if (gameState !== "game") return;
  let x = Math.random() * (canvas.width - 50); // Ajustado para w = 50
  let y = -50; // Ajustado para h = 50
  let randomKey = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  powerUps.push({ x, y, w: 50, h: 50, key: randomKey, active: true, speed: 2 }); // Power-ups 50x50
}
setInterval(spawnPowerUp, 10000);

// --- POWER-UPS ---
function handlePowerUps() {
  powerUps.forEach((p, i) => {
    p.y += p.speed;
    if (p.active &&
        player.x < p.x + p.w && player.x + player.w > p.x &&
        player.y < p.y + p.h && player.y + player.h > p.y) {
      activePower = p;
      p.active = false;
      powerTimeout = Date.now() + 1500; // 1.5 segundos
      powerHandled = false;
      hasCollidedWithPowerUp = true;
      if (isMobile) powerUpBtn.style.display = "inline-block";
    }
    if (!p.active && Date.now() > powerTimeout || p.y >= canvas.height) {
      if (!p.active && !powerHandled && hasCollidedWithPowerUp) {
        const prevLives = lives;
        lives -= 1;
        playerTempImage = "jaure_enojado"; // Mostrar jaure enojado.png
        colorChangeTimeout = Date.now() + 1000; // 1 segundo
        if (lives < prevLives && !flashTimeout) {
          flashTimeout = Date.now() + 1000;
          flashColor = "red";
        }
      }
      powerUps.splice(i, 1);
      activePower = null;
      powerHandled = true;
      hasCollidedWithPowerUp = false;
      powerUpBtn.style.display = "none";
    }
  });

  if (activePower && !powerHandled && !isMobile) {
    document.onkeydown = (e) => {
      console.log(`Tecla presionada: ${e.key}, Power-up key: ${activePower.key}`);
      if (gameState !== "game") return;
      const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
      const prevLives = lives;
      if (e.key.toUpperCase() === activePower.key) {
        console.log("Power-up acertado!");
        ammo = Math.min(ammo + 3, maxAmmo);
        playerTempImage = difficulty === "easy" ? "powerup_success_easy" : "jaure_feliz"; // jaure amor.png en easy, jaure feliz.png en medium/hard
        colorChangeTimeout = Date.now() + 1000; // 1 segundo
      } else if (e.key !== "Escape") {
        console.log("Power-up fallado!");
        lives -= 1;
        playerTempImage = "jaure_enojado"; // Mostrar jaure enojado.png
        colorChangeTimeout = Date.now() + 1000; // 1 segundo
        if (lives < prevLives && !flashTimeout) {
          flashTimeout = Date.now() + 1000;
          flashColor = "red";
        }
      }
      powerUps = [];
      activePower = null;
      powerHandled = true;
      document.onkeydown = null;
    };
  }

  if (activePower && Date.now() > powerTimeout && !powerHandled) {
    if (hasCollidedWithPowerUp) {
      console.log("Power-up expirado sin acción");
      const prevLives = lives;
      lives -= 1;
      playerTempImage = "jaure_enojado"; // Mostrar jaure enojado.png
      colorChangeTimeout = Date.now() + 1000; // 1 segundo
      if (lives < prevLives && !flashTimeout) {
        flashTimeout = Date.now() + 1000;
        flashColor = "red";
      }
    }
    powerUps = [];
    activePower = null;
    powerHandled = true;
    document.onkeydown = null;
    powerUpBtn.style.display = "none";
  }
}

// --- UPDATE ---
function updateGame() {
  if (gameState !== "game") return; // No actualizar en estado dead

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

  const prevLives = lives;
  enemies = enemies.filter(en => {
    if (en.y >= canvas.height) {
      lives = Math.max(0, lives - en.livesLost);
      if (en.type === "brown") { 
        flashColor = "brown"; 
        gameState = "dead"; 
        playMusic(true); // Forzar reinicio al morir por enemigo brown
      }
      return false;
    }
    return true;
  });

  if (lives < prevLives && !flashTimeout) {
    flashTimeout = Date.now() + 1000;
    flashColor = "red";
  }

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
          if (kills === 22 && Math.random() < 0.02) {
            const stats = enemyStats[difficulty].brown;
            enemies.push({
              x: Math.random() * (canvas.width - 60), // Ajustado para w = 60
              y: -60, // Ajustado para h = 60
              w: 60, // Enemigos 60x60
              h: 60,
              speed: 2,
              type: "brown",
              hp: stats.hp,
              maxHp: stats.hp,
              livesLost: stats.livesLost,
              livesGained: 0,
              ammoReward: stats.ammoReward
            });
          }
        }
      }
    });
  });

  bullets = bullets.filter((_, bi) => !bulletsToRemove.has(bi));

  handlePowerUps();

  if (colorChangeTimeout && Date.now() > colorChangeTimeout) {
    playerTempImage = null; // Volver a textura normal
    colorChangeTimeout = null;
  }

  if (lives <= 0) {
    gameState = "dead";
    playerTempImage = "jaure_muerto"; // Mostrar jaure muerto.png
    deathTimeout = Date.now() + 2000; // Mostrar por 2 segundos
    powerUpBtn.style.display = "none";
    playMusic(true); // Forzar reinicio al morir
  }
}

// --- DRAW ---
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo según dificultad
  const backgroundImage = images[`background_${difficulty}`];
  if (backgroundImage && backgroundImage.complete) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Mensaje de advertencia si faltan imágenes o sonidos
  if ((failedImages.length > 0 || failedSounds.length > 0) && imagesLoaded + soundsLoaded === totalAssets) {
    ctx.fillStyle = "red";
    ctx.font = "20px Arial";
    ctx.fillText("Advertencia: No se cargaron algunos assets", 10, canvas.height - 50);
    ctx.font = "16px Arial";
    if (failedImages.length > 0) {
      ctx.fillText(`Imágenes faltantes: ${failedImages.join(", ")}`, 10, canvas.height - 30);
    }
    if (failedSounds.length > 0) {
      ctx.fillText(`Sonidos faltantes: ${failedSounds.join(", ")}`, 10, canvas.height - 10);
    }
  }

  // Efecto de tinte (rojo o marrón)
  if (flashTimeout && Date.now() < flashTimeout) {
    ctx.fillStyle = flashColor === "red" ? "rgba(255, 0, 0, 0.5)" : "rgba(139, 69, 19, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (flashTimeout && Date.now() >= flashTimeout) {
    flashTimeout = null;
    flashColor = null;
  }

  // Jugador
  let playerImage = images[`player_${difficulty}`];
  if (gameState === "dead" && images.jaure_muerto?.complete) {
    playerImage = images.jaure_muerto; // Usar jaure muerto.png en estado dead
  } else if (playerTempImage && images[playerTempImage]?.complete) {
    playerImage = images[playerTempImage]; // Usar jaure amor.png, jaure feliz.png o jaure enojado.png
  }
  if (playerImage && playerImage.complete) {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h); // Usa w: 80, h: 80
  } else {
    ctx.fillStyle = gameState === "dead" ? "blue" : "yellow"; // Azul solo para dead si falta jaure_muerto.png
    ctx.fillRect(player.x, player.y, player.w, player.h); // Usa w: 80, h: 80
  }

  // Balas
  bullets.forEach(b => {
    if (images.bullet.complete) {
      ctx.drawImage(images.bullet, b.x, b.y, b.w, b.h); // Usa pokebola.png, w: 16, h: 16
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(b.x, b.y, b.w, b.h); // Placeholder blanco si falta pokebola.png
    }
  });

  // Enemigos con barras de vida
  enemies.forEach(en => {
    const enemyImageKey = en.type === "brown" ? "brown" : `${en.type}_${difficulty}`;
    const enemyImage = images[enemyImageKey];
    if (enemyImage && enemyImage.complete) {
      ctx.drawImage(enemyImage, en.x, en.y, en.w, en.h); // Usa w: 60, h: 60
    } else {
      ctx.fillStyle = en.type;
      ctx.fillRect(en.x, en.y, en.w, en.h); // Usa w: 60, h: 60
    }

    if (en.hp > 0) {
      const healthRatio = en.hp / en.maxHp;
      const barWidth = en.w * healthRatio; // Ajustado para w = 60
      const barHeight = 5;
      const barX = en.x;
      const barY = en.y - 10;
      const red = Math.floor(255 * (1 - healthRatio));
      const green = Math.floor(255 * healthRatio);
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
      ctx.fillRect(barX, barY, barWidth, barHeight);
    }
  });

  // Power-ups
  powerUps.forEach(p => {
    const powerupImage = images[`powerup_${difficulty}`];
    if (powerupImage && powerupImage.complete) {
      ctx.drawImage(powerupImage, p.x, p.y, p.w, p.h); // Usa w: 50, h: 50
    } else {
      ctx.fillStyle = "cyan";
      ctx.fillRect(p.x, p.y, p.w, p.h); // Usa w: 50, h: 50
    }
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(p.key, p.x + 14, p.y + 34); // Ajustado para 50x50
  });

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Kills: " + kills, 10, 20);
  ctx.fillText("Lives: " + lives, 10, 40);
  ctx.fillText("Ammo: " + ammo, 10, 60);
  ctx.fillText(levelNames[difficulty], 10, 80);
  // FPS
  ctx.textAlign = "right";
  ctx.fillText(`FPS: ${fps}`, canvas.width - 10, 20);
  ctx.textAlign = "left"; // Restaurar alineación
}

// --- LOOP ---
function loop(timestamp) {
  if (imagesLoaded + soundsLoaded < totalAssets) return;
  // Calcular FPS
  const now = performance.now();
  const delta = (now - lastFrameTime) / 1000; // Tiempo entre frames en segundos
  fps = Math.round(1 / delta); // FPS = 1 / tiempo por frame
  lastFrameTime = now;

  if (gameState === "game") {
    updateGame();
    drawGame();
  } else if (gameState === "paused") {
    drawGame();
  } else if (gameState === "dead") {
    drawGame();
    if (deathTimeout && Date.now() > deathTimeout) {
      showGameOverMenu();
      deathTimeout = null;
    }
  } else if (gameState === "gameover") {
    drawGame();
  }
  requestAnimationFrame(loop);
}

loop(performance.now());