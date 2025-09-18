// Estados y variables globales
let gameState = "menu"; // menu, settings, credits, records, game, paused, dead, gameover, bossTransition
let player = { x: 0, y: 0, w: 80, h: 80, speed: 5 }; // Jugador 80x80 para imágenes
let playerCube = { w: 40, h: 40 }; // Cubo del jugador 40x40
let enemyCube = { w: 40, h: 40 }; // Cubo de enemigos 40x40
let bullets = [];
let enemies = [];
let kills = 0;
let lives = 3; // Vidas iniciales por defecto
let maxLives = { easy: 20, medium: 15, hard: 10 }; // Límite de vidas por dificultad
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
let flashColor = null; // "red" o "brown" para flashes de pantalla completa
let playerFlash = null; // { color: "green"|"red", timeout: number } para flashes del jugador en modo cubo
let keys = {};
let defaultKeys = { left: "ArrowLeft", right: "ArrowRight", shoot: " " };
let keyBindings = JSON.parse(localStorage.getItem("keyBindings")) || defaultKeys;
let difficulty = localStorage.getItem("difficulty") || "easy"; // Por defecto: fácil
let records = JSON.parse(localStorage.getItem("records")) || []; // Lista de récords
let deathTimeout = null; // Temporizador para el estado dead
let failedImages = []; // Rastrear imágenes fallidas
let failedSounds = []; // Rastrear audios fallidos
let lastFrameTime = performance.now(); // Para calcular FPS
let fps = 0; // FPS actual
let currentSound = null; // Audio actual en reproducción
let lastPlayedSound = null; // Última canción reproducida para comparar al reanudar
let isMuted = false; // Estado de mute
let shootStartTime = null; // Tiempo cuando se comienza a presionar la tecla de disparo
let lastShotTime = null; // Tiempo del último disparo para controlar la cadencia
let useTextures = JSON.parse(localStorage.getItem("useTextures")) ?? true; // Texturas activadas por defecto
let bossActive = false; // Indicador de modo jefe
let bossAttacks = []; // Lista de ataques del jefe
let lastBossAttackTime = null; // Tiempo del último ataque del jefe
let enemySpawnInterval = null; // Intervalo para spawn de enemigos
let powerUpSpawnInterval = null; // Intervalo para spawn de power-ups
let fadeOpacity = 0; // Opacidad para el efecto de fade
let fadeStartTime = null; // Tiempo de inicio del fade
let wasBossActive = false; // Estado para rastrear si el jugador murió durante el jefe
let shakeTimeout = null; // Temporizador para el efecto de sacudida
let shakeIntensity = 5; // Intensidad de la sacudida en píxeles
let deathByBrown = false; // Bandera para muerte por enemigo marrón
let bossDefeated = false; // Bandera para derrota del jefe

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Definir áreas de los botones en el canvas
const muteButton = { x: 0, y: 0, w: 32, h: 32 }; // Aumentado a 32x32px
const pauseButton = { x: 0, y: 0, w: 32, h: 32 }; // Aumentado a 32x32px

// Precarga de imágenes
const images = {
  background_easy: new Image(),
  background_medium: new Image(),
  background_hard: new Image(),
  background_end: new Image(),
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
  boss: new Image(), // Imagen para el jefe
  powerup_easy: new Image(),
  powerup_medium: new Image(),
  powerup_hard: new Image(),
  powerup_success_easy: new Image(),
  jaure_feliz: new Image(),
  jaure_enojado: new Image(),
  jaure_muerto: new Image(),
  bullet: new Image(),
  mute: new Image(),
  unmute: new Image(),
  pause: new Image()
};
images.background_easy.src = 'easy.png';
images.background_medium.src = 'inter.png';
images.background_hard.src = 'hard.png';
images.background_end.src = 'end.png';
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
images.boss.src = 'boss.png'; // Nueva imagen para el jefe
images.powerup_easy.src = 'marronaza.png';
images.powerup_medium.src = 'dito.png';
images.powerup_hard.src = 'nuu.png';
images.powerup_success_easy.src = 'jaure amor.png';
images.jaure_feliz.src = 'jaure feliz.png';
images.jaure_enojado.src = 'jaure enojado.png';
images.jaure_muerto.src = 'jaure muerto.png';
images.bullet.src = 'pokebola.png';
images.mute.src = 'mute.png';
images.unmute.src = 'unmute.png';
images.pause.src = 'pause.png';

// Precarga de sonidos
const sounds = {
  menu_song: new Audio(),
  gameover_song: new Audio(),
  low_kills_gameover_song: new Audio(),
  easy_song: new Audio(),
  medium_song: new Audio(),
  hard_song: new Audio(),
  epic_song: new Audio(),
  reggueton_gameover_song: new Audio() // Nuevo audio para muerte por marrón
};
sounds.menu_song.src = 'menu song.mp3';
sounds.gameover_song.src = 'gameover song.mp3';
sounds.low_kills_gameover_song.src = 'reggueton gameover song.mp3';
sounds.easy_song.src = 'easy song.mp3';
sounds.medium_song.src = 'medium song.mp3';
sounds.hard_song.src = 'hard song.mp3';
sounds.epic_song.src = 'epic song.mp3';
sounds.reggueton_gameover_song.src = 'reggueton gameover song.mp3';

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

// Función para reproducir música según el estado
function playMusic(shouldResetMusic = false) {
  let expectedSound = null;
  if (gameState === "menu" || gameState === "settings" || gameState === "credits" || gameState === "records") {
    expectedSound = sounds.menu_song;
  } else if (gameState === "gameover" || gameState === "dead") {
    if (deathByBrown) {
      expectedSound = sounds.reggueton_gameover_song; // Reproducir reggaeton si muerte por marrón
    } else {
      expectedSound = kills < 2 ? sounds.low_kills_gameover_song : sounds.gameover_song;
    }
  } else if (gameState === "game" || gameState === "paused" || gameState === "bossTransition") {
    expectedSound = bossActive ? sounds.epic_song : sounds[`${difficulty}_song`];
  }

  if (currentSound && (currentSound !== expectedSound || shouldResetMusic)) {
    currentSound.pause();
    currentSound.currentTime = 0;
    currentSound = null;
  }

  if (expectedSound && currentSound !== expectedSound) {
    currentSound = expectedSound;
    lastPlayedSound = expectedSound;
  }

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
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 },
    boss: { hp: 30, ammoReward: 0, livesLost: 0, livesGained: 0 }
  },
  medium: {
    red: { hp: 2, ammoReward: 2, livesLost: 1, livesGained: 0 },
    blue: { hp: 5, ammoReward: 5, livesLost: 3, livesGained: 1 },
    purple: { hp: 5, ammoReward: 7, livesLost: 5, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 },
    boss: { hp: 30, ammoReward: 0, livesLost: 0, livesGained: 0 }
  },
  hard: {
    red: { hp: 3, ammoReward: 3, livesLost: 3, livesGained: 0 },
    blue: { hp: 6, ammoReward: 6, livesLost: 5, livesGained: 1 },
    purple: { hp: 8, ammoReward: 10, livesLost: 7, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 },
    boss: { hp: 30, ammoReward: 0, livesLost: 0, livesGained: 0 }
  }
};

// Ajustar canvas responsive en móvil
function resizeCanvas() {
  if (window.innerWidth <= 768) {
    canvas.width = Math.min(window.innerWidth, 800);
    canvas.height = window.innerHeight - (window.matchMedia("(orientation: landscape)").matches ? 80 : 100);
    player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
    player.x = Math.min(player.x, canvas.width - (useTextures ? player.w : playerCube.w));
  } else {
    canvas.width = 600;
    canvas.height = 600;
  }
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
  // Actualizar posiciones de los botones
  muteButton.x = canvas.width - muteButton.w - 10; // 10px desde el borde derecho
  muteButton.y = canvas.height - muteButton.h - 10; // 10px desde el borde inferior
  pauseButton.x = 10; // 10px desde el borde izquierdo
  pauseButton.y = canvas.height - pauseButton.h - 10; // 10px desde el borde inferior
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Input
document.addEventListener("keydown", e => {
  e.preventDefault();
  keys[e.key] = true;
  if (gameState === "game" && e.key === "Escape") {
    gameState = "paused";
    showPauseMenu();
  } else if (gameState === "paused" && e.key === "Escape") {
    gameState = "game";
    pauseMenu.style.display = "none";
    playMusic();
  } else if (gameState === "game" && e.key === keyBindings.shoot && !shootStartTime) {
    shootStartTime = Date.now(); // Registrar tiempo inicial del disparo
    shoot(); // Disparar inmediatamente al presionar
  }
});
document.addEventListener("keyup", e => {
  keys[e.key] = false;
  if (e.key === keyBindings.shoot) {
    shootStartTime = null; // Reiniciar al soltar la tecla
    lastShotTime = null;
  }
});
window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => keys[key] = false);
  shootStartTime = null; // Reiniciar al perder foco
  lastShotTime = null;
});

// Detectar clics/toques en los botones del canvas
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Botón de mute
  if (x >= muteButton.x && x <= muteButton.x + muteButton.w &&
      y >= muteButton.y && y <= muteButton.y + muteButton.h) {
    isMuted = !isMuted;
    if (isMuted) {
      if (currentSound) currentSound.pause();
    } else {
      if (currentSound) currentSound.play().catch(e => console.error(`Error reproduciendo ${currentSound.src}:`, e));
    }
  }

  // Botón de pausa (solo en gameState === "game")
  if (gameState === "game" &&
      x >= pauseButton.x && x <= pauseButton.x + pauseButton.w &&
      y >= pauseButton.y && y <= pauseButton.y + pauseButton.h) {
    gameState = "paused";
    showPauseMenu();
  }
});

// Detectar toques en móviles
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Evitar comportamientos no deseados
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  // Botón de mute
  if (x >= muteButton.x && x <= muteButton.x + muteButton.w &&
      y >= muteButton.y && y <= muteButton.y + muteButton.h) {
    isMuted = !isMuted;
    if (isMuted) {
      if (currentSound) currentSound.pause();
    } else {
      if (currentSound) currentSound.play().catch(e => console.error(`Error reproduciendo ${currentSound.src}:`, e));
    }
  }

  // Botón de pausa (solo en gameState === "game")
  if (gameState === "game" &&
      x >= pauseButton.x && x <= pauseButton.x + pauseButton.w &&
      y >= pauseButton.y && y <= pauseButton.y + pauseButton.h) {
    gameState = "paused";
    showPauseMenu();
  }
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
  keys[keyBindings.left] = false;
});
rightBtn.addEventListener("touchstart", () => keys[keyBindings.right] = true);
rightBtn.addEventListener("touchend", () => {
  keys[keyBindings.right] = false;
});
shootBtn.addEventListener("touchstart", () => { if (gameState === "game") shoot(); });

powerUpBtn.addEventListener("touchstart", () => {
  if (gameState !== "game" || powerHandled || bossActive) return;
  const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
  const prevLives = lives;
  if (hasCollidedWithPowerUp && activePower) {
    const ammoReward = difficulty === "hard" ? 5 : 3; // 5 balas en difícil, 3 en otros
    ammo = Math.min(ammo + ammoReward, maxAmmo);
    playerTempImage = difficulty === "easy" ? "powerup_success_easy" : "jaure_feliz";
    colorChangeTimeout = Date.now() + 1000;
    if (!useTextures) {
      playerFlash = { color: "green", timeout: Date.now() + 1000 };
    }
  } else {
    lives = Math.max(0, lives - 1);
    playerTempImage = "jaure_enojado";
    colorChangeTimeout = Date.now() + 1000;
    if (!useTextures) {
      playerFlash = { color: "red", timeout: Date.now() + 1000 };
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

const recordsMenu = document.getElementById("recordsMenu");

document.getElementById("startBtn").onclick = () => { resetGame(); showGame(); };
document.getElementById("changeKeysBtn").onclick = () => showKeyMenu();
document.getElementById("creditsBtn").onclick = () => {
  gameState = "credits";
  menu.style.display = 'none';
  creditsMenu.style.display = 'block';
  playMusic();
};
document.getElementById("recordsBtn").onclick = () => {
  gameState = "records";
  menu.style.display = 'none';
  recordsMenu.style.display = 'block';
  updateRecordsList();
  playMusic();
};
document.getElementById("backToMenuBtn").onclick = () => showMenu();
document.getElementById("retryBtn").onclick = () => {
  if (wasBossActive) {
    resetToBoss();
  } else {
    resetGame();
  }
  showGame();
};
document.getElementById("backMenuBtn").onclick = () => showMenu();
document.getElementById("backFromCreditsBtn").onclick = () => showMenu();
document.getElementById("backToMenuFromRecords").onclick = () => showMenu();
document.getElementById("deleteAllRecordsBtn").onclick = () => {
  if (confirm("¿Estás seguro de que quieres borrar todos los récords?")) {
    records = [];
    localStorage.setItem("records", JSON.stringify(records));
    updateRecordsList();
  }
};
document.getElementById("resetKeysBtn").onclick = () => {
  if (confirm("¿Estás seguro de que quieres resetear los controles a los valores predeterminados?")) {
    keyBindings = { ...defaultKeys };
    localStorage.setItem("keyBindings", JSON.stringify(keyBindings));
    updateKeyButtons();
  }
};
document.getElementById("textureToggleBtn").onclick = () => {
  useTextures = !useTextures;
  localStorage.setItem("useTextures", JSON.stringify(useTextures));
  document.getElementById("textureToggleBtn").textContent = `Texturas: ${useTextures ? "Sí" : "No"}`;
  // Reajustar posición del jugador al cambiar texturas
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
};
pauseMenu.querySelector("#continueBtn").onclick = () => {
  gameState = "game";
  pauseMenu.style.display = "none";
  playMusic();
};
pauseMenu.querySelector("#backToMainMenuBtn").onclick = () => showMenu();

document.getElementById("difficultySelect").onchange = (e) => {
  difficulty = e.target.value;
  localStorage.setItem("difficulty", difficulty);
  if (gameState === "game") playMusic(true);
};

let changingKey = null;
document.getElementById("leftKeyBtn").onclick = () => waitKey("left", document.getElementById("leftKeyBtn"));
document.getElementById("rightKeyBtn").onclick = () => waitKey("right", document.getElementById("rightKeyBtn"));
document.getElementById("shootKeyBtn").onclick = () => waitKey("shoot", document.getElementById("shootKeyBtn"));

function waitKey(action, button) {
  if (changingKey) return;
  changingKey = action;
  document.getElementById("keyPrompt").style.display = "block";
  button.textContent = "Presiona una tecla...";
  window.onkeydown = (e) => {
    e.preventDefault();
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
  document.getElementById("textureToggleBtn").textContent = `Texturas: ${useTextures ? "Sí" : "No"}`;
}

function updateRecordsList() {
  const list = document.getElementById("recordsList");
  list.innerHTML = "";
  records.sort((a, b) => {
    if (a.score === "boss" && b.score !== "boss") return -1;
    if (b.score === "boss" && a.score !== "boss") return 1;
    if (a.score === "boss" && b.score === "boss") return 0;
    return b.score - a.score;
  });
  records.forEach((r, index) => {
    const recordDiv = document.createElement("div");
    recordDiv.style.display = "flex";
    recordDiv.style.alignItems = "center";
    recordDiv.style.marginBottom = "10px";
    const p = document.createElement("p");
    p.textContent = r.score === "boss" ? `${r.name} - ${levelNames[r.difficulty]} - boss` : `${r.name} - ${levelNames[r.difficulty]}: ${r.score}`;
    if (r.score === "boss") {
      p.style.color = "yellow"; // Color amarillo para récords de jefe
    }
    p.style.marginRight = "10px";
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Borrar";
    deleteBtn.onclick = () => {
      if (confirm(`¿Estás seguro de que quieres borrar el récord de ${r.name}?`)) {
        records.splice(index, 1);
        localStorage.setItem("records", JSON.stringify(records));
        updateRecordsList();
      }
    };
    recordDiv.appendChild(p);
    recordDiv.appendChild(deleteBtn);
    list.appendChild(recordDiv);
  });
}

function showMenu() {
  gameState = "menu";
  menu.style.display = 'block';
  keyMenu.style.display = 'none';
  creditsMenu.style.display = 'none';
  recordsMenu.style.display = 'none';
  pauseMenu.style.display = 'none';
  gameOverMenu.style.display = 'none';
  document.getElementById("difficultySelect").value = difficulty;
  playMusic();
}

function showKeyMenu() {
  gameState = "settings";
  menu.style.display = 'none';
  keyMenu.style.display = 'block';
  updateKeyButtons();
  playMusic();
}

function showGame() {
  gameState = "game";
  menu.style.display = 'none';
  keyMenu.style.display = 'none';
  creditsMenu.style.display = 'none';
  recordsMenu.style.display = 'none';
  pauseMenu.style.display = 'none';
  gameOverMenu.style.display = 'none';
  playMusic(true);
}

function showPauseMenu() {
  pauseMenu.style.display = 'block';
  document.getElementById("pauseLives").textContent = lives;
  document.getElementById("pauseAmmo").textContent = ammo === Infinity ? "∞" : ammo;
  document.getElementById("pauseKills").textContent = kills;
  if (currentSound) currentSound.pause();
}

function showGameOverMenu() {
  gameState = "gameover";
  gameOverMenu.style.display = 'block';
  document.getElementById("finalStats").textContent = `Vidas: ${lives} | Balas: ${ammo === Infinity ? "∞" : ammo} | Kills: ${kills}`;
  playMusic(true);

  // Solicitar nombre para guardar récord solo si kills > 0 o jefe derrotado
  if (kills > 0 || bossDefeated) {
    let name = prompt("felicidades? creo... nose guarda tu nombre:");
    if (name) {
      const score = bossDefeated ? "boss" : kills; // Guardar "boss" si jefe derrotado
      records.push({ name, difficulty, score });
      localStorage.setItem("records", JSON.stringify(records));
    }
  }
}

function resetGame() {
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
  bullets = [];
  enemies = [];
  powerUps = [];
  kills = 200; // Iniciar con 0 kills para juego normal
  lives = 3; // Iniciar con 3 vidas
  maxLives = { easy: 20, medium: 15, hard: 10 }; // Límites de vidas normales
  ammo = 10; // Munición inicial normal
  activePower = null;
  powerTimeout = null;
  powerHandled = false;
  hasCollidedWithPowerUp = false;
  colorChangeTimeout = null;
  playerColor = "yellow";
  playerTempImage = null;
  flashTimeout = null;
  flashColor = null;
  playerFlash = null;
  deathTimeout = null;
  shootStartTime = null; // Reiniciar tiempo de disparo
  lastShotTime = null; // Reiniciar tiempo del último disparo
  bossActive = false;
  wasBossActive = false; // Reiniciar estado del jefe
  bossAttacks = [];
  lastBossAttackTime = null;
  shakeTimeout = null; // Reiniciar sacudida
  deathByBrown = false; // Reiniciar bandera de muerte por marrón
  bossDefeated = false; // Reiniciar bandera de jefe derrotado
  powerUpBtn.style.display = "none";
  // Restablecer intervalos
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (powerUpSpawnInterval) clearInterval(powerUpSpawnInterval);
  enemySpawnInterval = setInterval(spawnEnemy, 1500);
  powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);
}

function resetToBoss() {
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
  bullets = [];
  enemies = [];
  powerUps = [];
  kills = 200; // Iniciar con 200 kills para el jefe
  lives = difficulty === "easy" ? 5 : 3; // 5 vidas en fácil, 3 en medio/difícil
  maxLives = { easy: 5, medium: 3, hard: 3 }; // Límites de vidas para el jefe
  ammo = Infinity; // Munición infinita
  activePower = null;
  powerTimeout = null;
  powerHandled = false;
  hasCollidedWithPowerUp = false;
  colorChangeTimeout = null;
  playerColor = "yellow";
  playerTempImage = null;
  flashTimeout = null;
  flashColor = null;
  playerFlash = null;
  deathTimeout = null;
  shootStartTime = null; // Reiniciar tiempo de disparo
  lastShotTime = null; // Reiniciar tiempo del último disparo
  bossActive = false; // Se activará después de la transición
  wasBossActive = true; // Mantener el estado para el retry
  bossAttacks = [];
  lastBossAttackTime = null;
  shakeTimeout = null; // Reiniciar sacudida
  deathByBrown = false; // Reiniciar bandera de muerte por marrón
  bossDefeated = false; // Reiniciar bandera de jefe derrotado
  powerUpBtn.style.display = "none";
  // Iniciar transición al jefe
  gameState = "bossTransition";
  fadeOpacity = 0;
  fadeStartTime = Date.now();
  // Detener intervalos normales
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (powerUpSpawnInterval) clearInterval(powerUpSpawnInterval);
}

function shoot() {
  if (ammo > 0 || ammo === Infinity) {
    bullets.push({ x: player.x + (useTextures ? player.w : playerCube.w) / 2 - 8, y: player.y, w: 16, h: 16, speed: 7 });
    if (ammo !== Infinity) ammo--;
    lastShotTime = Date.now(); // Actualizar tiempo del último disparo
  }
}

function spawnEnemy() {
  if (gameState !== "game" || bossActive) return;

  let type = kills >= 50 ? "blue" : "red";
  if (kills >= 10 && kills < 50 && Math.random() < 0.3) type = "blue";
  if (kills >= 50 && Math.random() < 0.1) type = "purple";
  if (kills === 22 && Math.random() < 0.02) type = "brown";

  const stats = enemyStats[difficulty][type];
  enemies.push({
    x: Math.random() * (canvas.width - (useTextures ? 60 : enemyCube.w)),
    y: -(useTextures ? 60 : enemyCube.h),
    w: 60,
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

function spawnPowerUp() {
  if (gameState !== "game" || bossActive) return;
  let x = Math.random() * (canvas.width - 50);
  let y = -50;
  let randomKey = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  powerUps.push({ x, y, w: 50, h: 50, key: randomKey, active: true, speed: 2 });
}

function spawnBoss() {
  const stats = enemyStats[difficulty].boss;
  enemies.push({
    x: canvas.width / 2 - 60,
    y: 50, // Más abajo para que la barra de vida sea visible
    w: 60,
    h: 60,
    speed: 0,
    type: "boss",
    hp: stats.hp,
    maxHp: stats.hp,
    livesLost: stats.livesLost,
    livesGained: stats.livesGained,
    ammoReward: stats.ammoReward,
    direction: 1, // Para movimiento horizontal
    sideSpeed: 2 // Velocidad horizontal
  });
}

function spawnBossAttack() {
  if (gameState !== "game" || !bossActive) return;
  const laneWidth = canvas.width / 3;
  const lanes = [0, 1, 2];
  // Seleccionar 2 carriles aleatorios
  const selectedLanes = [];
  while (selectedLanes.length < 2) {
    const randomIndex = Math.floor(Math.random() * lanes.length);
    selectedLanes.push(lanes.splice(randomIndex, 1)[0]);
  }
  const damage = difficulty === "hard" ? 2 : 1;
  selectedLanes.forEach(lane => {
    bossAttacks.push({
      x: lane * laneWidth,
      y: 0,
      w: laneWidth,
      h: 50,
      speed: 5,
      damage
    });
  });
  lastBossAttackTime = Date.now();
}

// Iniciar intervalos
enemySpawnInterval = setInterval(spawnEnemy, 1500);
powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);

function startBossTransition() {
  gameState = "bossTransition";
  fadeOpacity = 0;
  fadeStartTime = Date.now();
  enemies = [];
  powerUps = [];
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (powerUpSpawnInterval) clearInterval(powerUpSpawnInterval);
}

function handlePowerUps() {
  if (bossActive) return; // No manejar power-ups durante el jefe
  powerUps.forEach((p, i) => {
    p.y += p.speed;
    if (p.active &&
        player.x < p.x + p.w && player.x + (useTextures ? player.w : playerCube.w) > p.x &&
        player.y < p.y + p.h && player.y + (useTextures ? player.h : playerCube.h) > p.y) {
      activePower = p;
      p.active = false;
      powerTimeout = Date.now() + 1500;
      powerHandled = false;
      hasCollidedWithPowerUp = true;
      if (isMobile) powerUpBtn.style.display = "inline-block";
    }
    if (!p.active && Date.now() > powerTimeout || p.y >= canvas.height) {
      if (!p.active && !powerHandled && hasCollidedWithPowerUp) {
        const prevLives = lives;
        lives = Math.max(0, lives - 1);
        playerTempImage = "jaure_enojado";
        colorChangeTimeout = Date.now() + 1000;
        if (!useTextures) {
          playerFlash = { color: "red", timeout: Date.now() + 1000 };
        }
        powerUps.splice(i, 1);
        activePower = null;
        powerHandled = true;
        hasCollidedWithPowerUp = false;
        powerUpBtn.style.display = "none";
      }
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
        const ammoReward = difficulty === "hard" ? 5 : 3; // 5 balas en difícil, 3 en otros
        ammo = Math.min(ammo + ammoReward, maxAmmo);
        playerTempImage = difficulty === "easy" ? "powerup_success_easy" : "jaure_feliz";
        colorChangeTimeout = Date.now() + 1000;
        if (!useTextures) {
          playerFlash = { color: "green", timeout: Date.now() + 1000 };
        }
      } else if (e.key !== "Escape" && e.key !== keyBindings.shoot && e.key !== keyBindings.left && e.key !== keyBindings.right) {
        console.log("Power-up fallado!");
        lives = Math.max(0, lives - 1);
        playerTempImage = "jaure_enojado";
        colorChangeTimeout = Date.now() + 1000;
        if (!useTextures) {
          playerFlash = { color: "red", timeout: Date.now() + 1000 };
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
      lives = Math.max(0, lives - 1);
      playerTempImage = "jaure_enojado";
      colorChangeTimeout = Date.now() + 1000;
      if (!useTextures) {
        playerFlash = { color: "red", timeout: Date.now() + 1000 };
      }
    }
    powerUps = [];
    activePower = null;
    powerHandled = true;
    document.onkeydown = null;
    powerUpBtn.style.display = "none";
  }
}

function updateGame() {
  if (gameState === "bossTransition") {
    const fadeDuration = 3000; // 3 segundos para el fade
    const elapsed = Date.now() - fadeStartTime;
    fadeOpacity = Math.min(elapsed / fadeDuration, 1); // Incrementar opacidad de 0 a 1
    if (elapsed >= fadeDuration) {
      // Finalizar transición
      gameState = "game";
      bossActive = true;
      wasBossActive = true; // Marcar que estamos en el jefe
      lives = difficulty === "easy" ? 5 : 3;
      maxLives = { easy: 5, medium: 3, hard: 3 }; // Actualizar límites de vidas
      ammo = Infinity;
      enemies = [];
      powerUps = [];
      spawnBoss();
      fadeOpacity = 0; // Limpiar fade
      fadeStartTime = null;
      playMusic(true); // Iniciar epic_song.mp3
    }
    return;
  }

  if (gameState !== "game") return;

  if (keys[keyBindings.left] && player.x > 0) player.x -= player.speed;
  if (keys[keyBindings.right] && player.x + (useTextures ? player.w : playerCube.w) < canvas.width) player.x += player.speed;

  // Manejo del disparo continuo
  if (keys[keyBindings.shoot] && (ammo > 0 || ammo === Infinity)) {
    const now = Date.now();
    // Disparar inmediatamente al presionar o después de 1 segundo para disparo continuo
    if (shootStartTime && (now - shootStartTime >= 1000)) {
      // Disparo continuo con cadencia de 300ms
      if (!lastShotTime || (now - lastShotTime >= 300)) {
        shoot();
      }
    }
  }

  // Activar modo jefe a los 200 kills
  if (kills >= 200 && !bossActive) {
    startBossTransition();
  }

  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > 0);

  enemies.forEach(en => {
    if (en.type !== "boss") {
      en.y += en.speed;
      if (en.type === "purple") {
        en.x += en.sideSpeed * en.direction;
        if (en.x <= 0 || en.x + (useTextures ? en.w : enemyCube.w) >= canvas.width) en.direction *= -1;
      }
    } else {
      // Movimiento horizontal del jefe
      en.x += en.sideSpeed * en.direction;
      if (en.x <= 0 || en.x + (useTextures ? en.w : enemyCube.w) >= canvas.width) en.direction *= -1;
    }
  });

  // Manejo de ataques del jefe con sacudida
  if (bossActive && (!lastBossAttackTime || Date.now() - lastBossAttackTime >= 2000)) {
    // Iniciar sacudida antes del ataque
    shakeTimeout = Date.now() + 1000; // Sacudida de 1 segundo
    spawnBossAttack();
  }

  // Actualizar y filtrar ataques del jefe
  bossAttacks.forEach(a => a.y += a.speed);
  bossAttacks = bossAttacks.filter(a => a.y < canvas.height); // Eliminar ataques al llegar al fondo

  const prevLives = lives;
  enemies = enemies.filter(en => {
    if (en.type !== "boss" && en.y >= canvas.height) {
      lives = Math.max(0, lives - en.livesLost);
      if (en.type === "brown") {
        deathByBrown = true; // Marcar muerte por marrón
        flashColor = "brown";
        gameState = "dead";
        playMusic(true);
      }
      return false;
    }
    return true;
  });

  // Colisión de ataques del jefe con el jugador
  bossAttacks.forEach((a, i) => {
    if (player.x < a.x + a.w && player.x + (useTextures ? player.w : playerCube.w) > a.x &&
        player.y < a.y + a.h && player.y + (useTextures ? player.h : playerCube.h) > a.y) {
      lives = Math.max(0, lives - a.damage);
      bossAttacks.splice(i, 1);
      if (lives < prevLives && !flashTimeout) {
        flashTimeout = Date.now() + 1000;
        flashColor = "red";
      }
    }
  });

  if (lives < prevLives && !flashTimeout) {
    flashTimeout = Date.now() + 1000;
    flashColor = "red";
  }

  let bulletsToRemove = new Set();
  bullets.forEach((b, bi) => {
    enemies.forEach((en, ei) => {
      const enWidth = useTextures ? en.w : enemyCube.w;
      const enHeight = useTextures ? en.h : enemyCube.h;
      if (b.x < en.x + enWidth && b.x + b.w > en.x && b.y < en.y + enHeight && b.y + b.h > en.y) {
        en.hp--;
        bulletsToRemove.add(bi);
        if (en.hp <= 0) {
          const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
          lives = Math.min(lives + en.livesGained, maxLives[difficulty]); // Respetar límite de vidas
          if (en.type === "brown") { enemies.splice(ei, 1); return; }
          if (en.type === "boss") {
            bossDefeated = true; // Marcar jefe derrotado
            gameState = "dead";
            playerTempImage = "jaure_muerto";
            deathTimeout = Date.now() + 2000;
            playMusic(true);
            enemies.splice(ei, 1);
            return;
          }
          enemies.splice(ei, 1);
          kills++;
          ammo = ammo === Infinity ? Infinity : Math.min(ammo + en.ammoReward, maxAmmo);
          if (kills === 22 && Math.random() < 0.02 && !bossActive) {
            const stats = enemyStats[difficulty].brown;
            enemies.push({
              x: Math.random() * (canvas.width - (useTextures ? 60 : enemyCube.w)),
              y: -(useTextures ? 60 : enemyCube.h),
              w: 60,
              h: 60,
              speed: 2,
              type: "brown",
              hp: stats.hp,
              maxHp: stats.hp,
              livesLost: 0,
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
    playerTempImage = null;
    colorChangeTimeout = null;
  }

  if (playerFlash && Date.now() > playerFlash.timeout) {
    playerFlash = null;
  }

  if (lives <= 0) {
    gameState = "dead";
    playerTempImage = "jaure_muerto";
    deathTimeout = Date.now() + 2000;
    powerUpBtn.style.display = "none";
    playMusic(true);
  }

  if (shakeTimeout && Date.now() > shakeTimeout) {
    shakeTimeout = null; // Finalizar sacudida
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Aplicar efecto de sacudida si está activo
  if (shakeTimeout && Date.now() <= shakeTimeout) {
    ctx.save(); // Guardar estado del canvas
    const offsetX = (Math.random() - 0.5) * 2 * shakeIntensity;
    const offsetY = (Math.random() - 0.5) * 2 * shakeIntensity;
    ctx.translate(offsetX, offsetY);
  }

  // Fondo
  if (useTextures) {
    const backgroundImage = bossActive ? images.background_end : images[`background_${difficulty}`];
    if (backgroundImage && backgroundImage.complete) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Fondo marrón si muerte por marrón
  if ((gameState === "dead" || gameState === "gameover") && deathByBrown) {
    ctx.fillStyle = "rgba(139, 69, 19, 1)"; // Marrón opaco
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Mensaje de assets fallidos
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

  // Efecto de flash de pantalla completa
  if (flashTimeout && Date.now() < flashTimeout) {
    ctx.fillStyle = flashColor === "red" ? "rgba(255, 0, 0, 0.5)" : "rgba(139, 69, 19, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (flashTimeout && Date.now() >= flashTimeout) {
    flashTimeout = null;
    flashColor = null;
  }

  // Efecto de fade para la transición al jefe
  if (gameState === "bossTransition") {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (shakeTimeout) ctx.restore(); // Restaurar si hay sacudida
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Resetear transformación
    return; // No dibujar nada más durante la transición
  }

  // Jugador
  if (useTextures) {
    let playerImage = images[`player_${difficulty}`];
    if (gameState === "dead" && images.jaure_muerto?.complete) {
      playerImage = images.jaure_muerto;
    } else if (playerTempImage && images[playerTempImage]?.complete) {
      playerImage = images[playerTempImage];
    }
    if (playerImage && playerImage.complete) {
      ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
    } else {
      ctx.fillStyle = gameState === "dead" ? "blue" : "yellow";
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }
  } else {
    ctx.fillStyle = gameState === "dead" ? "blue" : "yellow";
    ctx.fillRect(player.x, player.y, playerCube.w, playerCube.h);
    // Flash del jugador solo en modo cubo
    if (playerFlash && Date.now() < playerFlash.timeout) {
      ctx.fillStyle = playerFlash.color === "green" ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)";
      ctx.fillRect(player.x, player.y, playerCube.w, playerCube.h);
    }
  }

  // Balas
  bullets.forEach(b => {
    if (useTextures && images.bullet.complete) {
      ctx.drawImage(images.bullet, b.x, b.y, b.w, b.h);
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  });

  // Enemigos
  enemies.forEach(en => {
    const enWidth = useTextures ? en.w : enemyCube.w;
    const enHeight = useTextures ? en.h : enemyCube.h;
    if (useTextures) {
      const enemyImageKey = en.type === "brown" ? "brown" : en.type === "boss" ? "boss" : `${en.type}_${difficulty}`;
      const enemyImage = images[enemyImageKey];
      if (enemyImage && enemyImage.complete) {
        ctx.drawImage(enemyImage, en.x, en.y, en.w, en.h);
      } else {
        ctx.fillStyle = en.type === "boss" ? "red" : en.type;
        ctx.fillRect(en.x, en.y, en.w, en.h);
      }
    } else {
      ctx.fillStyle = en.type === "boss" ? "red" : en.type;
      ctx.fillRect(en.x, en.y, enemyCube.w, enemyCube.h);
    }

    if (en.hp > 0) {
      const healthRatio = en.hp / en.maxHp;
      const barWidth = (useTextures ? en.w : enemyCube.w) * healthRatio;
      const barHeight = 5;
      const barX = en.x;
      const barY = en.y - 10;
      const red = Math.floor(255 * (1 - healthRatio));
      const green = Math.floor(255 * healthRatio);
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
      ctx.fillRect(barX, barY, barWidth, barHeight);
    }
  });

  // Ataques del jefe
  bossAttacks.forEach(a => {
    ctx.fillStyle = "red";
    ctx.fillRect(a.x, a.y, a.w, a.h);
  });

  // Power-ups
  powerUps.forEach(p => {
    if (useTextures) {
      const powerupImage = images[`powerup_${difficulty}`];
      if (powerupImage && powerupImage.complete) {
        ctx.drawImage(powerupImage, p.x, p.y, p.w, p.h);
      } else {
        ctx.fillStyle = "cyan";
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    } else {
      ctx.fillStyle = "cyan";
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black"; // Borde negro
    ctx.lineWidth = 2; // Ancho del borde
    ctx.strokeText(p.key, p.x + 14, p.y + 34); // Dibujar borde
    ctx.fillText(p.key, p.x + 14, p.y + 34); // Dibujar texto
  });

  // Cartel "<null>" al derrotar al jefe
  if (gameState === "dead" && bossDefeated) {
    ctx.font = "48px Arial";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.textAlign = "center";
    ctx.strokeText("<null>", canvas.width / 2, canvas.height / 2);
    ctx.fillText("<null>", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
  }

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Kills: " + kills, 10, 20);
  if (kills >= 200) {
    const heartSize = 24;
    ctx.font = `${heartSize}px Arial`;
    for (let i = 0; i < maxLives[difficulty]; i++) {
      ctx.fillText(i < lives ? "❤️" : "🖤", 10 + i * (heartSize + 5), 40);
    }
  } else {
    ctx.font = "16px Arial";
    ctx.fillText("Lives: " + lives, 10, 40);
    ctx.fillText("Ammo: " + ammo, 10, 60);
    ctx.fillText(levelNames[difficulty], 10, 80);
  }
  ctx.textAlign = "right";
  ctx.fillText(`FPS: ${fps}`, canvas.width - 10, 20);
  ctx.textAlign = "left";

  // Dibujar botones en el canvas
  // Botón de mute
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Fondo blanco semitransparente
  ctx.fillRect(muteButton.x - 2, muteButton.y - 2, muteButton.w + 4, muteButton.h + 4);
  if (useTextures) {
    const muteImage = isMuted ? images.unmute : images.mute;
    if (muteImage && muteImage.complete) {
      ctx.drawImage(muteImage, muteButton.x, muteButton.y, muteButton.w, muteButton.h);
    } else {
      ctx.fillStyle = "gray";
      ctx.fillRect(muteButton.x, muteButton.y, muteButton.w, muteButton.h);
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(isMuted ? "🔇" : "🔊", muteButton.x + muteButton.w / 2, muteButton.y + muteButton.h / 2 + 6);
      ctx.textAlign = "left";
    }
  } else {
    ctx.fillStyle = "gray";
    ctx.fillRect(muteButton.x, muteButton.y, muteButton.w, muteButton.h);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(isMuted ? "🔇" : "🔊", muteButton.x + muteButton.w / 2, muteButton.y + muteButton.h / 2 + 6);
    ctx.textAlign = "left";
  }

  // Botón de pausa (solo en gameState === "game")
  if (gameState === "game") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Fondo blanco semitransparente
    ctx.fillRect(pauseButton.x - 2, pauseButton.y - 2, pauseButton.w + 4, pauseButton.h + 4);
    if (useTextures && images.pause && images.pause.complete) {
      ctx.drawImage(images.pause, pauseButton.x, pauseButton.y, pauseButton.w, pauseButton.h);
    } else {
      ctx.fillStyle = "gray";
      ctx.fillRect(pauseButton.x, pauseButton.y, pauseButton.w, pauseButton.h);
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("⏸️", pauseButton.x + pauseButton.w / 2, pauseButton.y + pauseButton.h / 2 + 6);
      ctx.textAlign = "left";
    }
  }

  // Restaurar canvas si hubo sacudida
  if (shakeTimeout && Date.now() <= shakeTimeout) {
    ctx.restore();
  }

  // Resetear transformación para asegurar posición original
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function loop(timestamp) {
  if (imagesLoaded + soundsLoaded < totalAssets) return;
  const now = performance.now();
  const delta = (now - lastFrameTime) / 1000;
  fps = Math.round(1 / delta);
  lastFrameTime = now;

  if (gameState === "game" || gameState === "bossTransition") {
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