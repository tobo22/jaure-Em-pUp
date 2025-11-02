// (Previous code remains unchanged until spawnBoss function)
// Estados y variables globales
let gameState = "menu"; // menu, settings, credits, records, game, paused, dead, gameover, bossTransition, videoTransition
let player = { x: 0, y: 0, w: 80, h: 80, speed: 5 }; // Jugador 80x80 para imágenes
let playerCube = { w: 40, h: 40 }; // Cubo del jugador 40x40
let enemyCube = { w: 40, h: 40 }; // Cubo de enemigos 40x40
let bullets = [];
let enemies = [];
let kills = 0;
let lives = 3; // Vidas iniciales por defecto
let maxLives = 3; // Límite inicial de vidas, puede aumentar a 4 con power-up
let points = 0; // Puntos iniciales
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
let defaultKeys = { left: "A", right: "D", up: "W", down: "S", shoot: " ", sprint: "Shift", grenade: "Q" };
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
let bossSpheres = []; // Lista de esferas rojas para el ataque 2
let bossTargetAlerts = []; // Alertas para el ataque 1
let lastBossAttackTime = null; // Tiempo del último ataque del jefe
let enemySpawnInterval = null; // Intervalo para spawn de enemigos
let powerUpSpawnInterval = null; // Intervalo para spawn de power-ups
let fadeOpacity = 0; // Opacidad para el efecto de fade
let fadeStartTime = null; // Tiempo de inicio del fade
let wasBossActive = false; // Estado para rastrear si el jugador murió durante el jefe
let shakeTimeout = null; // Temporizador para el efecto de sacudida
let shakeIntensity = 5; // Intensidad de la sacudida en píxeles
let deathByBrown = false; // Bandera para muerte por marrón
let bossDefeated = false; // Bandera para derrota del jefe
let cheat912 = false; // Cheat para 150 points
let cheat22 = false; // Cheat para 22 points y 100% brown enemy spawn
let videoFadeOpacity = 0; // Opacidad para el degradado post-jefe
let videoFadeStartTime = null; // Tiempo de inicio del degradado
let videoElement = null; // Elemento de video dinámico
let isVideoPlaying = false; // Estado para controlar la reproducción del video
let sprintCharge = 1; // Carga de sprint (0 a 1)
let lastSprintTime = null; // Tiempo del último sprint
let sprintCooldown = 10000; // 10 segundos en ms
let isSprinting = false; // Indicador de sprint activo
let sprintDuration = 500; // Duración del sprint en ms (0.5 segundos)
let sprintStartTime = null; // Tiempo de inicio del sprint
let sprintSpeedMultiplier = 2; // Multiplicador de velocidad durante sprint
let currentAttackFinished = true; // ¿Terminó el ataque actual?
let grenades = 0;
let grenadeProjectiles = [];
let machinegunActive = false;
let machinegunEndTime = null;
let currentObjective = null;
let objectiveKills = 0;
let objectiveTimer = null;
let bossSphereAttackActive = false;
const BOSS_SPHERE_SPEED = 2;
const BOSS_SPHERE_RADIUS = 12;
const BOSS_SPHERE_DURATION = 10000;
const BOSS_SPHERE_DAMAGE = 1;
const BOSS_SPHERE_HP = 10;
const BOSS_SPHERE_COUNTS = { easy: 2, medium: 3, hard: 5 };
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
  boss: new Image(),
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
  pause: new Image(),
  metralleta: new Image(),
  machinegunBullet: new Image()
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
images.boss.src = 'boss.gif';
images.powerup_easy.src = 'marronaza.png';
images.powerup_medium.src = 'dito.png';
images.powerup_hard.src = 'nuu.png';
images.powerup_success_easy.src = 'jaure amor.png';
images.jaure_feliz.src = 'jaure feliz.png';
images.jaure_enojado.src = 'jaure triste.png';
images.jaure_muerto.src = 'jaure muerto.png';
images.bullet.src = 'pokebola.png';
images.mute.src = 'mute.png';
images.unmute.src = 'unmute.png';
images.pause.src = 'pause.png';
images.metralleta.src = 'metralleta.png';
images.machinegunBullet.src = 'balas.png';
// Precarga de sonidos
const sounds = {
  menu_song: new Audio(),
  gameover_song: new Audio(),
  low_kills_gameover_song: new Audio(),
  easy_song: new Audio(),
  medium_song: new Audio(),
  hard_song: new Audio(),
  epic_song: new Audio(),
  reggueton_gameover_song: new Audio() // Audio para muerte por marrón
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
    red: { hp: 1, ammoReward: 2, livesLost: 1, pointsGained: 1 },
    blue: { hp: 3, ammoReward: 4, livesLost: 3, pointsGained: 3 },
    purple: { hp: 3, ammoReward: 5, livesLost: 5, pointsGained: 3 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, pointsGained: 1 },
    boss: { hp: 30, ammoReward: 0, livesLost: 1, pointsGained: 30 }
  },
  medium: {
    red: { hp: 2, ammoReward: 2, livesLost: 1, pointsGained: 2 },
    blue: { hp: 5, ammoReward: 5, livesLost: 3, pointsGained: 5 },
    purple: { hp: 5, ammoReward: 7, livesLost: 5, pointsGained: 5 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, pointsGained: 1 },
    boss: { hp: 40, ammoReward: 0, livesLost: 1, pointsGained: 40 }
  },
  hard: {
    red: { hp: 3, ammoReward: 3, livesLost: 3, pointsGained: 3 },
    blue: { hp: 6, ammoReward: 6, livesLost: 5, pointsGained: 6 },
    purple: { hp: 8, ammoReward: 10, livesLost: 7, pointsGained: 8 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, pointsGained: 1 },
    boss: { hp: 50, ammoReward: 0, livesLost: 2, pointsGained: 50 }
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
  if (e.target.tagName !== "INPUT") { // Ignorar eventos de teclado si el target es un input
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
    } else if (gameState === "game" && e.key.toUpperCase() === keyBindings.grenade.toUpperCase() && grenades > 0) {
      grenades--;
      grenadeProjectiles.push({ x: player.x + (useTextures ? player.w : playerCube.w) / 2 - 8, y: player.y, w: 16, h: 16, speed: 7, previewTimeout: Date.now() + 1000 });
    }
  }
});
document.addEventListener("keyup", e => {
  keys[e.key] = false;
  if (e.key === keyBindings.shoot) {
    shootStartTime = null; // Reiniciar al soltar la tecla
    lastShotTime = null;
  }
  if (e.key === keyBindings.sprint) {
    isSprinting = false;
  }
});
window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => keys[key] = false);
  shootStartTime = null; // Reiniciar al perder foco
  lastShotTime = null;
  isSprinting = false;
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
const upBtn = document.getElementById("up");
const downBtn = document.getElementById("down");
const shootBtn = document.getElementById("shoot");
const powerUpBtn = document.getElementById("powerUp");
const sprintBtn = document.getElementById("sprint");
const grenadeBtn = document.getElementById("grenade");
leftBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  keys[keyBindings.left] = true;
});
leftBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys[keyBindings.left] = false;
});
rightBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  keys[keyBindings.right] = true;
});
rightBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys[keyBindings.right] = false;
});
upBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  keys[keyBindings.up] = true;
});
upBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys[keyBindings.up] = false;
});
downBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  keys[keyBindings.down] = true;
});
downBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys[keyBindings.down] = false;
});
shootBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (gameState === "game") shoot();
});
powerUpBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (gameState !== "game" || powerHandled || bossActive) return;
  const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
  const prevLives = lives;
  if (hasCollidedWithPowerUp && activePower) {
    const ammoReward = difficulty === "hard" ? 5 : 3; // 5 balas en difícil, 3 en otros
    ammo = Math.min(ammo + ammoReward, maxAmmo);
    lives = Math.min(lives + 1, maxLives);
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
sprintBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  keys[keyBindings.sprint] = true;
});
sprintBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys[keyBindings.sprint] = false;
  isSprinting = false;
});
grenadeBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (gameState === "game" && grenades > 0) {
    grenades--;
    grenadeProjectiles.push({ x: player.x + (useTextures ? player.w : playerCube.w) / 2 - 8, y: player.y, w: 16, h: 16, speed: 7, previewTimeout: Date.now() + 1000 });
  }
});
// Manejo de códigos
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const code = codeInput.value.trim();
    if (code === "912") {
      cheat912 = true;
      cheat22 = false; // Desactivar cheat22 si se activa 912
      cheatMessage.textContent = "cheat activao";
      cheatMessage.style.color = "green";
      cheatMessage.style.display = "block";
    } else if (code === "22") {
      cheat22 = true;
      cheat912 = false; // Desactivar cheat912 si se activa 22
      cheatMessage.textContent = "cheat activao";
      cheatMessage.style.color = "green";
      cheatMessage.style.display = "block";
    } else {
      cheatMessage.textContent = "Código incorrecto";
      cheatMessage.style.color = "red";
      cheatMessage.style.display = "block";
    }
    codeInput.value = ""; // Limpiar input después de enviar
  }
});
// --- MENÚS ---
const pauseMenu = document.createElement("div");
pauseMenu.id = "pauseMenu";
pauseMenu.className = "menu";
pauseMenu.innerHTML = `
  <h2>Pausa</h2>
  <p>Vidas: <span id="pauseLives"></span></p>
  <p>Puntos: <span id="pausePoints"></span></p>
  <p>Balas: <span id="pauseAmmo"></span></p>
  <p>Kills: <span id="pauseKills"></span></p>
  <button id="continueBtn">Continuar</button>
  <button id="backToMainMenuBtn">Volver al Menú</button>
`;
document.body.appendChild(pauseMenu);
document.getElementById("startBtn").onclick = () => {
  console.log("Botón Iniciar presionado. cheat22:", cheat22, "cheat912:", cheat912); // Depuración
  // Guardar estado de los cheats antes de resetear
  const isCheat912Active = cheat912;
  const isCheat22Active = cheat22;
  resetGame(); // Reiniciar el juego
  menu.style.display = 'none'; // Ocultar el menú
  // Restaurar estado de los cheats
  cheat912 = isCheat912Active;
  cheat22 = isCheat22Active;
  if (cheat912) {
    console.log("Aplicando cheat 912: points = 150, iniciando transición al jefe");
    points = 150;
    startBossTransition();
  } else if (cheat22) {
    console.log("Aplicando cheat 22: points = 22, iniciando juego normal");
    points = 22;
    // Forzar spawn de enemigo marrón inmediatamente
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
      pointsGained: stats.pointsGained,
      ammoReward: stats.ammoReward
    });
    showGame();
  } else {
    console.log("Iniciando juego sin cheats");
    showGame();
  }
};
document.getElementById("changeKeysBtn").onclick = () => showKeyMenu();
document.getElementById("creditsBtn").onclick = () => {
  gameState = "credits";
  menu.style.display = 'none';
  creditsMenu.style.display = 'block';
  cheatMessage.style.display = 'none'; // Ocultar mensaje al entrar
  codeInput.value = ''; // Limpiar input al entrar
  codeInput.focus(); // Forzar foco en el input
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
pauseMenu.querySelector("#backToMainMenuBtn").onclick = () => {
  // Resetear cheats antes de volver al menú
  cheat912 = false;
  cheat22 = false;
  showMenu();
};
document.getElementById("difficultySelect").onchange = (e) => {
  difficulty = e.target.value;
  localStorage.setItem("difficulty", difficulty);
  if (gameState === "game") playMusic(true);
};
let changingKey = null;
document.getElementById("leftKeyBtn").onclick = () => waitKey("left", document.getElementById("leftKeyBtn"));
document.getElementById("rightKeyBtn").onclick = () => waitKey("right", document.getElementById("rightKeyBtn"));
document.getElementById("upKeyBtn").onclick = () => waitKey("up", document.getElementById("upKeyBtn"));
document.getElementById("downKeyBtn").onclick = () => waitKey("down", document.getElementById("downKeyBtn"));
document.getElementById("shootKeyBtn").onclick = () => waitKey("shoot", document.getElementById("shootKeyBtn"));
document.getElementById("sprintKeyBtn").onclick = () => waitKey("sprint", document.getElementById("sprintKeyBtn"));
document.getElementById("grenadeKeyBtn").onclick = () => waitKey("grenade", document.getElementById("grenadeKeyBtn"));
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
  document.getElementById("upKeyBtn").textContent = "Arriba: " + (keyBindings.up === " " ? "Espacio" : keyBindings.up);
  document.getElementById("downKeyBtn").textContent = "Abajo: " + (keyBindings.down === " " ? "Espacio" : keyBindings.down);
  document.getElementById("shootKeyBtn").textContent = "Disparo: " + (keyBindings.shoot === " " ? "Espacio" : keyBindings.shoot);
  document.getElementById("sprintKeyBtn").textContent = "Sprint: " + (keyBindings.sprint === " " ? "Espacio" : keyBindings.sprint);
  document.getElementById("grenadeKeyBtn").textContent = "Granada: " + (keyBindings.grenade === " " ? "Espacio" : keyBindings.grenade);
  document.getElementById("textureToggleBtn").textContent = `Texturas: ${useTextures ? "Sí" : "No"}`;
}
function updateRecordsList() {
  const list = document.getElementById("recordsList");
  list.innerHTML = "";
  records.sort((a, b) => {
    if (a.score === "boss" && b.score !== "boss") return -1;
    if (b.score === "boss" && a.score === "boss") return 1;
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
  document.getElementById("pausePoints").textContent = points;
  document.getElementById("pauseAmmo").textContent = ammo === Infinity ? "∞" : ammo;
  document.getElementById("pauseKills").textContent = kills;
  if (currentSound) currentSound.pause();
}
function showGameOverMenu() {
  gameState = "gameover";
  gameOverMenu.style.display = 'block';
  document.getElementById("finalStats").textContent = `Vidas: ${lives} | Puntos: ${points} | Balas: ${ammo === Infinity ? "∞" : ammo} | Kills: ${kills}`;
  cheat912 = false; // Resetear cheat 912 al terminar la partida
  cheat22 = false; // Resetear cheat 22 al terminar la partida
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
function generateObjective() {
  const levelEnemies = {
    easy: [
      {enemy: "red", amount: Math.floor(Math.random() * 8) + 3, reward: "grenade", name: "spikes (el de pelo negro)"},
      {enemy: "blue", amount: Math.floor(Math.random() * 8) + 3, reward: "machinegun", name: "jets (el pelado)"},
      {enemy: "purple", amount: Math.floor(Math.random() * 8) + 3, reward: "machinegun", name: "eins (el perro)"}
    ],
    medium: [
      {enemy: "red", amount: Math.floor(Math.random() * 8) + 3, reward: "grenade", name: "ratatas (la rata violeta)"},
      {enemy: "blue", amount: Math.floor(Math.random() * 8) + 3, reward: "machinegun", name: "ratikates (rata gorda)"},
      {enemy: "purple", amount: Math.floor(Math.random() * 8) + 3, reward: "machinegun", name: "bicho rapido (el amarillo)"}
    ],
    hard: [
      {enemy: "red", amount: Math.floor(Math.random() * 8) + 3, reward: "grenade", name: "hollows (el bicho chiquito)"},
      {enemy: "blue", amount: Math.floor(Math.random() * 8) + 3, reward: "machinegun", name: "hollow knights (el bicho no tan chiquito)"},
      {enemy: "purple", amount: Math.floor(Math.random() * 8) + 3, reward: "machinegun", name: "hornets (el bicho rojo)"}
    ]
  };
  const options = levelEnemies[difficulty];
  currentObjective = options[Math.floor(Math.random() * options.length)];
  objectiveKills = 0;
}
function resetGame() {
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
  bullets = [];
  enemies = [];
  powerUps = [];
  kills = 0;
  lives = 3;
  maxLives = 3;
  points = 0;
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
  bossSpheres = [];
  bossTargetAlerts = [];
  lastBossAttackTime = null;
  shakeTimeout = null; // Reiniciar sacudida
  deathByBrown = false; // Reiniciar bandera de muerte por marrón
  bossDefeated = false; // Reiniciar bandera de jefe derrotado
  powerUpBtn.style.display = "none";
  sprintCharge = 1;
  lastSprintTime = null;
  isSprinting = false;
  sprintStartTime = null;
  currentAttackFinished = true;
  grenades = 0;
  grenadeProjectiles = [];
  machinegunActive = false;
  machinegunEndTime = null;
  currentObjective = null;
  objectiveKills = 0;
  objectiveTimer = null;
  bossSphereAttackActive = false;
  generateObjective();
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
  kills = 0;
  lives = difficulty === "easy" ? 5 : 3; // 5 vidas en fácil, 3 en medio/difícil
  maxLives = difficulty === "easy" ? 5 : 3;
  points = 150;
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
  bossSpheres = [];
  bossTargetAlerts = [];
  lastBossAttackTime = null;
  shakeTimeout = null; // Reiniciar sacudida
  deathByBrown = false; // Reiniciar bandera de muerte por marrón
  bossDefeated = false; // Reiniciar bandera de jefe derrotado
  powerUpBtn.style.display = "none";
  sprintCharge = 1;
  lastSprintTime = null;
  isSprinting = false;
  sprintStartTime = null;
  currentAttackFinished = true;
  grenades = 0;
  grenadeProjectiles = [];
  machinegunActive = false;
  machinegunEndTime = null;
  currentObjective = null;
  objectiveKills = 0;
  objectiveTimer = null;
  bossSphereAttackActive = false;
  generateObjective();
  // Iniciar transición al jefe
  gameState = "bossTransition";
  fadeOpacity = 0;
  fadeStartTime = Date.now();
  // Detener intervalos normales
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (powerUpSpawnInterval) clearInterval(powerUpSpawnInterval);
}
function shoot() {
  if (ammo > 0 || ammo === Infinity || machinegunActive) {
    bullets.push({ x: player.x + (useTextures ? player.w : playerCube.w) / 2 - 8, y: player.y, w: 16, h: 16, speed: 7 });
    if (!machinegunActive && ammo !== Infinity) ammo--;
    lastShotTime = Date.now(); // Actualizar tiempo del último disparo
  }
}
function spawnEnemy() {
  if (gameState !== "game" || bossActive) return;
  let type;
  if (cheat22) {
    type = "brown"; // Forzar enemigos marrones si cheat22 está activo
  } else {
    type = "red";
    if (points >= 10 && Math.random() < 0.3) type = "blue";
    if (Math.random() < 0.1) type = "purple";
    if (points === 22 && Math.random() < 0.02) type = "brown"; // Mantener probabilidad baja si cheat22 no está activo
  }
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
    pointsGained: stats.pointsGained,
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
    x: canvas.width / 2 - 100, // Centrar el jefe (ajustado para tamaño más grande)
    y: 50, // Posicionado para visibilidad
    w: 50, // Tamaño más grande para el GIF animado
    h: 50, // Tamaño más grande para el GIF animado
    speed: 0, // Sin movimiento vertical
    type: "boss",
    hp: stats.hp,
    maxHp: stats.hp,
    livesLost: stats.livesLost,
    pointsGained: stats.pointsGained,
    ammoReward: stats.ammoReward,
    direction: 1, // Para movimiento horizontal
    sideSpeed: 2 // Velocidad horizontal original
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
      damage,
      hitPlayer: false
    });
  });
  lastBossAttackTime = Date.now();
  console.log("Boss launching attack type: wall");
}
function spawnTargetedBossAttack() {
  if (gameState !== "game" || !bossActive) return;
  const damage = difficulty === "hard" ? 2 : 1;
  // Ráfaga de 5 ataques
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const targetX = player.x; // Posición actual del jugador en cada disparo
      const targetY = player.y;
      // Mostrar alerta 500ms antes
      bossTargetAlerts.push({
        x: targetX,
        y: targetY,
        w: useTextures ? player.w : playerCube.w,
        h: useTextures ? player.h : playerCube.h,
        startTime: Date.now(),
        duration: 500 // Aparece más rápido
      });
      // Programar el ataque después de 500ms, fijo (sin movimiento)
      setTimeout(() => {
        bossAttacks.push({
          x: targetX,
          y: targetY,
          w: useTextures ? player.w : playerCube.w,
          h: useTextures ? player.h : playerCube.h,
          speed: 0, // No baja, se solidifica
          damage,
          duration: 2000, // Dura 2 segundos antes de desaparecer
          startTime: Date.now(),
          hitPlayer: false
        });
      }, 500);
    }, i * 200); // Ráfaga con 200ms entre cada uno
  }
  lastBossAttackTime = Date.now();
  console.log("Boss launching attack type: targeted");
}
function spawnBossSpheres() {
  const boss = enemies.find(e => e.type === "boss");
  if (!boss || gameState !== "game" || !bossActive || bossSphereAttackActive) return;

  bossSpheres = [];
  bossSphereAttackActive = true;

  const count = BOSS_SPHERE_COUNTS[difficulty];
  const spacing = canvas.width / (count + 1);
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const x = i * spacing;
    const y = BOSS_SPHERE_RADIUS; // Appear at top

    // Initial direction towards player
    const playerCenterX = player.x + (useTextures ? player.w : playerCube.w) / 2;
    const playerCenterY = player.y + (useTextures ? player.h : playerCube.h) / 2;
    const dx = playerCenterX - x;
    const dy = playerCenterY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let vx = (dx / dist) * BOSS_SPHERE_SPEED;
    let vy = (dy / dist) * BOSS_SPHERE_SPEED;

    bossSpheres.push({
      x,
      y,
      vx,
      vy,
      radius: BOSS_SPHERE_RADIUS,
      hp: BOSS_SPHERE_HP,
      maxHp: BOSS_SPHERE_HP,
      createdAt: now,
      lastUpdate: now,
      alive: true
    });
  }

  lastBossAttackTime = Date.now();
  console.log("Boss launching attack type: spheres");
}
function updateBossSpheres() {
  if (!bossActive) return;

  const now = Date.now();
  bossSpheres = bossSpheres.filter(sphere => {
    if (!sphere.alive) return false;

    const delta = (now - sphere.lastUpdate) / 1000;
    sphere.hp -= delta;
    sphere.lastUpdate = now;

    if (sphere.hp <= 0) {
      return false;
    }

    // Follow player
    const playerCenterX = player.x + (useTextures ? player.w : playerCube.w) / 2;
    const playerCenterY = player.y + (useTextures ? player.h : playerCube.h) / 2;
    const dx = playerCenterX - sphere.x;
    const dy = playerCenterY - sphere.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      sphere.vx = (dx / dist) * BOSS_SPHERE_SPEED;
      sphere.vy = (dy / dist) * BOSS_SPHERE_SPEED;
    }

    sphere.x += sphere.vx;
    sphere.y += sphere.vy;

    // Bounce on walls
    if (sphere.x - sphere.radius < 0) {
      sphere.x = sphere.radius;
      sphere.vx = -sphere.vx;
    } else if (sphere.x + sphere.radius > canvas.width) {
      sphere.x = canvas.width - sphere.radius;
      sphere.vx = -sphere.vx;
    }
    if (sphere.y - sphere.radius < 0) {
      sphere.y = sphere.radius;
      sphere.vy = -sphere.vy;
    } else if (sphere.y + sphere.radius > canvas.height) {
      sphere.y = canvas.height - sphere.radius;
      sphere.vy = -sphere.vy;
    }

    // Collision with player
    const pw = useTextures ? player.w : playerCube.w;
    const ph = useTextures ? player.h : playerCube.h;
    if (player.x < sphere.x + sphere.radius && player.x + pw > sphere.x - sphere.radius &&
        player.y < sphere.y + sphere.radius && player.y + ph > sphere.y - sphere.radius) {
      lives = Math.max(0, lives - BOSS_SPHERE_DAMAGE);
      flashTimeout = Date.now() + 1000;
      flashColor = "red";
      playerTempImage = "jaure_enojado";
      colorChangeTimeout = Date.now() + 1000;
      return false;
    }

    return true;
  });

  // Repulsion between spheres
  for (let i = 0; i < bossSpheres.length; i++) {
    for (let j = i + 1; j < bossSpheres.length; j++) {
      const s1 = bossSpheres[i];
      const s2 = bossSpheres[j];
      const dx = s1.x - s2.x;
      const dy = s1.y - s2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = 2 * BOSS_SPHERE_RADIUS + 10; // Margin
      if (dist < minDist && dist > 0) {
        const pushX = (dx / dist) * (minDist - dist) / 2;
        const pushY = (dy / dist) * (minDist - dist) / 2;
        s1.x += pushX;
        s1.y += pushY;
        s2.x -= pushX;
        s2.y -= pushY;
      }
    }
  }

  if (bossSpheres.length === 0 && bossSphereAttackActive) {
    bossSphereAttackActive = false;
    currentAttackFinished = true;
  }
}
function drawBossSpheres() {
  bossSpheres.forEach(sphere => {
    if (!sphere.alive) return;

    ctx.beginPath();
    ctx.arc(sphere.x, sphere.y, sphere.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();

    // Health bar if damaged
    if (sphere.hp < sphere.maxHp) {
      const healthRatio = sphere.hp / sphere.maxHp;
      const barWidth = sphere.radius * 2 * healthRatio;
      const barHeight = 5;
      const barX = sphere.x - sphere.radius;
      const barY = sphere.y - sphere.radius - 5;
      const red = Math.floor(255 * (1 - healthRatio));
      const green = Math.floor(255 * healthRatio);
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
      ctx.fillRect(barX, barY, barWidth, barHeight);
    }
  });
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
function playEndVideo() {
  if (isVideoPlaying) return;
  isVideoPlaying = true;
  // Crear elemento de video
  videoElement = document.createElement("video");
  videoElement.id = "endVideo";
  videoElement.src = "end.mp4";
  videoElement.style.position = "absolute";
  videoElement.style.top = "0";
  videoElement.style.left = "0";
  videoElement.style.width = "100vw";
  videoElement.style.height = "100vh";
  videoElement.style.objectFit = "cover"; // Asegurar que cubra toda la pantalla
  videoElement.style.zIndex = "1000"; // Mostrar sobre el canvas
  document.body.appendChild(videoElement);
  // Reproducir video
  videoElement.play().catch(e => console.error("Error reproduciendo end.mp4:", e));
  // Cuando termine el video, volver al menú principal
  videoElement.onended = () => {
    videoElement.remove(); // Eliminar el elemento de video
    videoElement = null;
    isVideoPlaying = false;
    videoFadeOpacity = 0;
    videoFadeStartTime = null;
    gameState = "menu";
    menu.style.display = "block";
    playMusic(true); // Reproducir música del menú
  };
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
        lives = Math.max(0, lives - 1); // Perder vida si no se presiona ninguna tecla
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
      } else if (p.y >= canvas.height) {
        powerUps.splice(i, 1); // Eliminar power-up si llega al fondo
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
        lives = Math.min(lives + 1, maxLives);
        playerTempImage = difficulty === "easy" ? "powerup_success_easy" : "jaure_feliz";
        colorChangeTimeout = Date.now() + 1000;
        if (!useTextures) {
          playerFlash = { color: "green", timeout: Date.now() + 1000 };
        }
      } else if (e.key !== "Escape" && e.key !== keyBindings.shoot && e.key !== keyBindings.left && e.key !== keyBindings.right && e.key !== keyBindings.up && e.key !== keyBindings.down) {
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
      lives = Math.max(0, lives - 1); // Perder vida si no se presiona ninguna tecla
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
      maxLives = difficulty === "easy" ? 5 : 3;
      ammo = Infinity;
      enemies = [];
      powerUps = [];
      fadeOpacity = 0; // Limpiar fade
      fadeStartTime = null;
      playMusic(true); // Iniciar epic_song.mp3
      spawnBoss(); // Modificación: Aparece el jefe después de la transición
    }
    return;
  }
  if (gameState !== "game") return;
  // Manejo de sprint
  if (keys[keyBindings.sprint] && sprintCharge >= 1 && (keys[keyBindings.left] || keys[keyBindings.right] || keys[keyBindings.up] || keys[keyBindings.down])) {
    isSprinting = true;
    sprintStartTime = Date.now();
    sprintCharge = 0;
    lastSprintTime = Date.now();
  }
  if (isSprinting && Date.now() - sprintStartTime < sprintDuration) {
    player.speed *= sprintSpeedMultiplier;
  } else {
    isSprinting = false;
  }
  if (keys[keyBindings.left] && player.x > 0) player.x -= player.speed;
  if (keys[keyBindings.right] && player.x + (useTextures ? player.w : playerCube.w) < canvas.width) player.x += player.speed;
  if (keys[keyBindings.up] && player.y > 0) player.y -= player.speed;
  if (keys[keyBindings.down] && player.y + (useTextures ? player.h : playerCube.h) < canvas.height) player.y += player.speed;
  // Resetear velocidad después de sprint
  player.speed = 5;
  // Recarga de sprint
  if (lastSprintTime && sprintCharge < 1) {
    const elapsed = Date.now() - lastSprintTime;
    sprintCharge = Math.min(elapsed / sprintCooldown, 1);
  }
  // Manejo del disparo continuo
  if (keys[keyBindings.shoot] && (ammo > 0 || ammo === Infinity)) {
    const now = Date.now();
    // Disparar inmediatamente al presionar o después de 1 segundo para disparo continuo
    if (shootStartTime && (now - shootStartTime >= 200)) {
      // Disparo continuo con cadencia de 300ms
      if (!lastShotTime || (now - lastShotTime >= 115)) {
        shoot();
      }
    }
  }
  // Activar modo jefe a los 150 points
  if (points >= 150 && !bossActive && !cheat912) { // Evitar transición si cheat912 está activo
    startBossTransition();
  }
  // Manejo de metralleta temporal
  if (machinegunActive && Date.now() > machinegunEndTime) {
    machinegunActive = false;
  }
  // Manejo de objetivos
  if (!currentObjective && objectiveTimer && Date.now() > objectiveTimer) {
    generateObjective();
    objectiveTimer = null;
  }
  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > 0);
  grenadeProjectiles.forEach(g => g.y -= g.speed);
  grenadeProjectiles = grenadeProjectiles.filter(g => g.y > 0);
  enemies.forEach(en => {
    if (en.type !== "boss") {
      en.y += en.speed;
      // Acercarse lentamente al jugador
      const dx = player.x - en.x;
      const dist = Math.abs(dx);
      if (dist > 0) {
        en.x += (dx / dist) * 0.5; // Velocidad horizontal lenta (0.5)
      }
      if (en.type === "purple") {
        en.x += en.sideSpeed * en.direction;
        if (en.x <= 0 || en.x + (useTextures ? en.w : enemyCube.w) >= canvas.width) en.direction *= -1;
      }
    } else {
      // Movimiento original del jefe: solo horizontal
      en.x += en.sideSpeed * en.direction;
      if (en.x <= 0 || en.x + (useTextures ? en.w : enemyCube.w) >= canvas.width) en.direction *= -1;
    }
  });
  // Manejo de ataques del jefe
  if (bossActive && currentAttackFinished &&
      (!lastBossAttackTime || Date.now() - lastBossAttackTime >= 2000)) {
    let attackType = Math.floor(Math.random() * 3);
    // Si es spheres (2) y hay bolitas vivas, cambiar a otro
    if (attackType === 2 && bossSpheres.length > 0) {
      attackType = Math.floor(Math.random() * 2); // 0 o 1
    }
    currentAttackFinished = false; // Bloquear hasta terminar
    if (attackType === 0) {
      shakeTimeout = Date.now() + 1000; // Sacudida de 1 segundo
      spawnBossAttack();
    } else if (attackType === 1) {
      spawnTargetedBossAttack();
    } else if (attackType === 2) {
      spawnBossSpheres();
    }
  }
// Actualizar y eliminar ataques del jefe (iteración segura)
for (let i = bossAttacks.length - 1; i >= 0; i--) {
  const a = bossAttacks[i];
  if (a.speed > 0) {
    a.y += a.speed;
  } else if (a.duration && Date.now() - a.startTime > a.duration) {
    bossAttacks.splice(i, 1);
  }
}
  bossAttacks = bossAttacks.filter(a => a.y < canvas.height || (a.speed === 0 && a.duration && Date.now() - a.startTime <= a.duration)); // Eliminar ataques al llegar al fondo o expirar
  if (bossAttacks.length === 0 && !currentAttackFinished && bossActive && bossSpheres.length === 0 && bossTargetAlerts.length === 0) {
    currentAttackFinished = true; // Ataque estándar terminó
  }
  // Actualizar alertas de targeted attack
  bossTargetAlerts = bossTargetAlerts.filter(alert => Date.now() - alert.startTime < alert.duration);
  if (bossTargetAlerts.length === 0 && bossAttacks.length === 0 && !currentAttackFinished && bossActive && bossSpheres.length === 0) {
    currentAttackFinished = true; // Targeted terminó
  }
  updateBossSpheres();
  const prevLives = lives;
  enemies = enemies.filter(en => {
    if (en.type !== "boss" && en.y >= canvas.height) {
      return false;
    }
    return true;
  });
  // Colisión de ataques del jefe con el jugador
  bossAttacks.forEach((a, i) => {
    if (player.x < a.x + a.w && player.x + (useTextures ? player.w : playerCube.w) > a.x &&
        player.y < a.y + a.h && player.y + (useTextures ? player.h : playerCube.h) > a.y && !a.hitPlayer) {
      lives = Math.max(0, lives - a.damage);
      a.hitPlayer = true;
      if (a.speed === 0) {
        bossAttacks.splice(i, 1); // Eliminar ataque fijo después de daño
      }
      if (lives < prevLives && !flashTimeout) {
        flashTimeout = Date.now() + 1000;
        flashColor = "red";
        playerTempImage = "jaure_enojado"; // Usar jaure_enojado como triste cuando pierde vida
        colorChangeTimeout = Date.now() + 1000;
      }
    }
  });
  let collidingEnemies = [];
  enemies.forEach(en => {
    const pw = useTextures ? player.w : playerCube.w;
    const ph = useTextures ? player.h : playerCube.h;
    const ew = useTextures ? en.w : enemyCube.w;
    const eh = useTextures ? en.h : enemyCube.h;
    if (player.x < en.x + ew && player.x + pw > en.x &&
        player.y < en.y + eh && player.y + ph > en.y) {
      collidingEnemies.push(en);
    }
  });
  collidingEnemies.forEach(en => {
    if (en.type === "brown") {
      deathByBrown = true;
      flashColor = "brown";
      gameState = "dead";
      playMusic(true);
      deathTimeout = Date.now() + 2000;
    } else {
      lives = Math.max(0, lives - en.livesLost);
      if (lives <= 0) {
        gameState = "dead";
        playerTempImage = "jaure_muerto";
        deathTimeout = Date.now() + 2000;
      }
      if (!flashTimeout) {
        flashTimeout = Date.now() + 1000;
        flashColor = "red";
        playerTempImage = "jaure_enojado"; // Usar jaure_enojado como triste cuando pierde vida
        colorChangeTimeout = Date.now() + 1000;
      }
    }
    if (en.type !== "boss") {
      const index = enemies.indexOf(en);
      if (index > -1) enemies.splice(index, 1);
    }
  });
  if (lives < prevLives && !flashTimeout) {
    flashTimeout = Date.now() + 1000;
    flashColor = "red";
    playerTempImage = "jaure_enojado"; // Usar jaure_enojado como triste cuando pierde vida
    colorChangeTimeout = Date.now() + 1000;
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
          points += en.pointsGained;
          if (en.type === "brown") { enemies.splice(ei, 1); return; }
          if (en.type === "boss") {
            bossDefeated = true; // Marcar jefe derrotado
            gameState = "dead";
            playerTempImage = null; // Mostrar "<null>" sin sprite
            deathTimeout = Date.now() + 2000;
            // Detener la música actual
            if (currentSound) {
              currentSound.pause();
              currentSound.currentTime = 0;
              currentSound = null;
            }
            enemies.splice(ei, 1);
            currentAttackFinished = true;
            return;
          }
          if (currentObjective && en.type === currentObjective.enemy) {
            objectiveKills++;
            if (objectiveKills >= currentObjective.amount) {
              if (currentObjective.reward === "grenade") {
                grenades += 3;
              } else {
                machinegunActive = true;
                machinegunEndTime = Date.now() + 15000;
              }
              currentObjective = null;
              objectiveTimer = Date.now() + 60000;
            }
          }
          enemies.splice(ei, 1);
          kills++;
          ammo = ammo === Infinity ? Infinity : Math.min(ammo + en.ammoReward, maxAmmo);
          if (points === 22 && (cheat22 || Math.random() < 0.02) && !bossActive) {
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
              pointsGained: stats.pointsGained,
              ammoReward: stats.ammoReward
            });
          }
        }
      }
    });
  });
  // Colisiones de balas con esferas
  bullets.forEach((b, bi) => {
    bossSpheres.forEach((sphere) => {
      if (sphere.alive && b.x < sphere.x + sphere.radius && b.x + b.w > sphere.x - sphere.radius &&
          b.y < sphere.y + sphere.radius && b.y + b.h > sphere.y - sphere.radius) {
        sphere.hp -= 1; // Daño por bala
        bulletsToRemove.add(bi);
        if (sphere.hp <= 0) {
          sphere.alive = false;
        }
      }
    });
  });
  bullets = bullets.filter((_, bi) => !bulletsToRemove.has(bi));
  // Colisiones de granadas
  let grenadesToRemove = new Set();
  grenadeProjectiles.forEach((g, gi) => {
    let hit = false;
    enemies.forEach((en, ei) => {
      const enWidth = useTextures ? en.w : enemyCube.w;
      const enHeight = useTextures ? en.h : enemyCube.h;
      if (g.x < en.x + enWidth && g.x + g.w > en.x && g.y < en.y + enHeight && g.y + g.h > en.y) {
        grenadesToRemove.add(gi);
        hit = true;
        const maxAmmo = difficulty === "medium" ? 20 : (difficulty === "hard" ? 15 : 30);
        if (en.type === "boss") {
          en.hp -= 10; // Daño especial al boss
        } else {
          let toRemove = [ei];
          enemies.forEach((e, idx) => {
            if (idx !== ei && Math.hypot(e.x - en.x, e.y - en.y) < 50 && toRemove.length < 3) {
              toRemove.push(idx);
            }
          });
          toRemove.sort((a, b) => b - a);
          toRemove.forEach(idx => {
            let killedEn = enemies[idx];
            if (currentObjective && killedEn.type === currentObjective.enemy) {
              objectiveKills++;
            }
            kills++;
            points += killedEn.pointsGained;
            ammo = ammo === Infinity ? Infinity : Math.min(ammo + killedEn.ammoReward, maxAmmo);
            enemies.splice(idx, 1);
          });
        }
      }
    });
    if (hit && currentObjective && objectiveKills >= currentObjective.amount) {
      if (currentObjective.reward === "grenade") {
        grenades += 3;
      } else {
        machinegunActive = true;
        machinegunEndTime = Date.now() + 15000;
      }
      currentObjective = null;
      objectiveTimer = Date.now() + 60000;
    }
  });
  grenadeProjectiles = grenadeProjectiles.filter((_, gi) => !grenadesToRemove.has(gi));
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
  // Efecto de fade para la transición al video
  if (gameState === "videoTransition") {
    ctx.fillStyle = `rgba(0, 0, 0, ${videoFadeOpacity})`;
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
  // Imagen de metralleta al lado del jugador si activa
  if (machinegunActive && useTextures && images.metralleta.complete) {
    ctx.drawImage(images.metralleta, player.x + (useTextures ? player.w : playerCube.w), player.y, 40, 40);
  }
  // Barra de sprint (amarilla)
  const barWidth = (useTextures ? player.w : playerCube.w) * sprintCharge;
  const barHeight = 5;
  const barX = player.x;
  const barY = player.y - 10;
  ctx.fillStyle = "yellow";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  // Balas
  bullets.forEach(b => {
    let bulletImage = images.bullet;
    if (machinegunActive && images.machinegunBullet.complete) {
      bulletImage = images.machinegunBullet;
    }
    if (useTextures && bulletImage.complete) {
      ctx.drawImage(bulletImage, b.x, b.y, b.w, b.h);
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  });
  // Granadas (usa la misma imagen que balas por defecto)
  grenadeProjectiles.forEach(g => {
    if (useTextures && images.bullet.complete) {
      ctx.drawImage(images.bullet, g.x, g.y, g.w, g.h);
    } else {
      ctx.fillStyle = "orange";
      ctx.fillRect(g.x, g.y, g.w, g.h);
    }
  });
  // Preview de onda expansiva
  grenadeProjectiles.forEach(g => {
    if (Date.now() < g.previewTimeout) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(g.x + g.w / 2, g.y + g.h / 2, 50, 0, 2 * Math.PI);
      ctx.stroke();
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
  // Alertas de targeted attack
  bossTargetAlerts.forEach(alert => {
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Alerta roja semitransparente
    ctx.fillRect(alert.x, alert.y, alert.w, alert.h);
  });
  // Esferas rojas
  drawBossSpheres();
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
  // Mensaje de objetivo
  if (!bossActive && currentObjective) {
    ctx.fillStyle = "violet";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Derrota a ${objectiveKills} / ${currentObjective.amount} de ${currentObjective.name} por ${currentObjective.reward === "grenade" ? "3 granadas" : "una metralleta"}`, canvas.width / 2, 20);
    ctx.textAlign = "left";
  }
  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Kills: " + kills, 10, 20);
  ctx.fillText("Points: " + points, 10, 40);
  if (points >= 150 || cheat912) { // Mostrar corazones si cheat912 está activo
    const heartSize = 24;
    ctx.font = `${heartSize}px Arial`;
    for (let i = 0; i < maxLives; i++) {
      ctx.fillText(i < lives ? "❤️" : "🖤", 10 + i * (heartSize + 5), 60);
    }
  } else {
    ctx.font = "16px Arial";
    ctx.fillText("Lives: " + lives, 10, 60);
    ctx.fillText("Ammo: " + ammo, 10, 80);
    ctx.fillText("Grenades: " + grenades, 10, 100);
    ctx.fillText(levelNames[difficulty], 10, 120);
  }
  ctx.textAlign = "right";
  ctx.fillText(`FPS: ${fps}`, canvas.width - 10, 20);
  ctx.textAlign = "left";
  // Contador para metralleta
  if (machinegunActive) {
    const remaining = Math.ceil((machinegunEndTime - Date.now()) / 1000);
    ctx.fillText(`Metralleta: ${remaining}s`, 10, 140);
  }
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
      ctx.fillText("⏸️", pauseButton.x + pauseButton.w / 2, pauseButton.y + muteButton.h / 2 + 6);
      ctx.textAlign = "left";
    }
  }
  // --- Detectar clicks escalados según el tamaño del canvas ---
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect(); // posición real del canvas en la pantalla
  const scaleX = canvas.width / rect.width; // relación horizontal entre canvas y pantalla
  const scaleY = canvas.height / rect.height; // relación vertical
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  // Detectar si se clickeó el botón de mute
  if (
    mouseX >= muteButton.x &&
    mouseX <= muteButton.x + muteButton.w &&
    mouseY >= muteButton.y &&
    mouseY <= muteButton.y + muteButton.h
  ) {
    isMuted = !isMuted;
    // ejecutar acción
  }
  // Detectar si se clickeó el botón de pausa
  if (
    gameState === "game" &&
    mouseX >= pauseButton.x &&
    mouseX <= pauseButton.x + pauseButton.w &&
    mouseY >= pauseButton.y &&
    mouseY <= pauseButton.y + pauseButton.h
  ) {
    togglePause();
  }
});
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
      if (bossDefeated) {
        // Iniciar degradado a negro
        if (!videoFadeStartTime) {
          videoFadeStartTime = Date.now();
          videoFadeOpacity = 0;
        }
        gameState = "videoTransition"; // Nuevo estado para manejar el degradado y video
        deathTimeout = null;
      } else {
        showGameOverMenu();
        deathTimeout = null;
      }
    }
  } else if (gameState === "gameover") {
    drawGame();
  } else if (gameState === "videoTransition") {
    drawGame();
    const fadeDuration = 3000; // 3 segundos para el degradado
    const elapsed = Date.now() - videoFadeStartTime;
    videoFadeOpacity = Math.min(elapsed / fadeDuration, 1); // Incrementar opacidad de 0 a 1
    if (elapsed >= fadeDuration && !isVideoPlaying) {
      // Iniciar reproducción del video
      playEndVideo();
    }
  }
  requestAnimationFrame(loop);
}
loop(performance.now());