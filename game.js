// variableeees
let gameState = "menu";
let player = { x: 0, y: 0, w: 80, h: 80, speed: 5 }; 
let playerCube = { w: 40, h: 40 };
let enemyCube = { w: 40, h: 40 };
let bullets = [];
let enemies = [];
let kills = 0;
let lives = 3;
let maxLives = { easy: 20, medium: 15, hard: 10 };
let powerUps = [];
let activePower = null;
let powerTimeout = null;
let powerHandled = false;
let hasCollidedWithPowerUp = false;
let colorChangeTimeout = null;
let playerColor = "yellow";
let playerTempImage = null;
let flashTimeout = null;
let flashColor = null;
let playerFlash = null;
let keys = {};
let defaultKeys = { left: "ArrowLeft", right: "ArrowRight", shoot: " " };
let keyBindings = JSON.parse(localStorage.getItem("keyBindings")) || defaultKeys;
let difficulty = localStorage.getItem("difficulty") || "easy";
let records = JSON.parse(localStorage.getItem("records")) || [];
let deathTimeout = null;
let failedImages = [];
let failedSounds = [];
let lastFrameTime = performance.now(); 
let fps = 0;
let currentSound = null;
let lastPlayedSound = null;
let isMuted = false;
let shootStartTime = null;
let lastShotTime = null;
let useTextures = JSON.parse(localStorage.getItem("useTextures")) ?? true;
let bossActive = false; 
let bossAttacks = [];
let lastBossAttackTime = null;
let enemySpawnInterval = null;
let powerUpSpawnInterval = null;
let fadeOpacity = 0;
let fadeStartTime = null;
let wasBossActive = false;
let shakeTimeout = null;
let shakeIntensity = 5;
let deathByBrown = false;
let bossDefeated = false;
let cheat912 = false;
let cheat22 = false;
let videoFadeOpacity = 0;
let videoFadeStartTime = null;
let videoElement = null;
let isVideoPlaying = false;

// pantalla del juego
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// botones mute y menu
const muteButton = { x: 0, y: 0, w: 32, h: 32 };
const pauseButton = { x: 0, y: 0, w: 32, h: 32 }; 

// variables de imagenes
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
images.boss.src = 'boss.gif';
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

// variables de sonidos
const sounds = {
  menu_song: new Audio(),
  gameover_song: new Audio(),
  low_kills_gameover_song: new Audio(),
  easy_song: new Audio(),
  medium_song: new Audio(),
  hard_song: new Audio(),
  epic_song: new Audio(),
  reggueton_gameover_song: new Audio()
};
sounds.menu_song.src = 'menu song.mp3';
sounds.gameover_song.src = 'gameover song.mp3';
sounds.low_kills_gameover_song.src = 'reggueton gameover song.mp3';
sounds.easy_song.src = 'easy song.mp3';
sounds.medium_song.src = 'medium song.mp3';
sounds.hard_song.src = 'hard song.mp3';
sounds.epic_song.src = 'epic song.mp3';
sounds.reggueton_gameover_song.src = 'reggueton gameover song.mp3';

// mensaje de error para falta de material
let imagesLoaded = 0;
let soundsLoaded = 0;
const totalImages = Object.keys(images).length;
const totalSounds = Object.keys(sounds).length;
const totalAssets = totalImages + totalSounds;

// music menu
for (let key in images) {
  images[key].onload = () => {
    imagesLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true);
      loop();
    }
  };
  // mensaje de error (se carga igual el juego)
  images[key].onerror = () => {
    console.error(`Error cargando imagen: ${images[key].src}`);
    failedImages.push(images[key].src);
    imagesLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true);
      loop();
    }
  };
}

// loop para todos los sonidos
for (let key in sounds) {
  sounds[key].oncanplaythrough = () => {
    sounds[key].loop = true;
    soundsLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true);
      loop();
    }
  };
  sounds[key].onerror = () => {
    console.error(`Error cargando audio: ${sounds[key].src}`);
    failedSounds.push(sounds[key].src); 
    soundsLoaded++;
    if (imagesLoaded + soundsLoaded === totalAssets) {
      playMusic(true); 
      loop();
    }
  };
}

// distinto sonido segun estado de juego <(:)>
function playMusic(shouldResetMusic = false) {
  let expectedSound = null;
  if (gameState === "menu" || gameState === "settings" || gameState === "credits" || gameState === "records") {
    expectedSound = sounds.menu_song;
  } else if (gameState === "gameover" || gameState === "dead") {
    if (deathByBrown) {
      expectedSound = sounds.reggueton_gameover_song;
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

// nombres de niveles
const levelNames = {
  easy: "Nivel Agua (facil)",
  medium: "Nivel Café (medio)",
  hard: "Nivel Alcohol (dificil)"
};

// estadisticas de enemigos por nivel
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
    boss: { hp: 40, ammoReward: 0, livesLost: 0, livesGained: 0 }
  },
  hard: {
    red: { hp: 3, ammoReward: 3, livesLost: 3, livesGained: 0 },
    blue: { hp: 6, ammoReward: 6, livesLost: 5, livesGained: 1 },
    purple: { hp: 8, ammoReward: 10, livesLost: 7, livesGained: 2 },
    brown: { hp: 1, ammoReward: 2, livesLost: 0, livesGained: 0 },
    boss: { hp: 50, ammoReward: 0, livesLost: 0, livesGained: 0 }
  }
};

// botones para movil (espero que jara no lo rompa)
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
  
  muteButton.x = canvas.width - muteButton.w - 10;
  muteButton.y = canvas.height - muteButton.h - 10; 
  pauseButton.x = 10; 
  pauseButton.y = canvas.height - pauseButton.h - 10;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// botones pc
document.addEventListener("keydown", e => {
  if (e.target.tagName !== "INPUT") { 
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
      shootStartTime = Date.now();
      shoot();
    }
  }
});
document.addEventListener("keyup", e => {
  keys[e.key] = false;
  if (e.key === keyBindings.shoot) {
    shootStartTime = null; 
    lastShotTime = null;
  }
});
window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => keys[key] = false);
  shootStartTime = null;
  lastShotTime = null;
});

// decectar clics en botones 
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // funcion boton mute
  if (x >= muteButton.x && x <= muteButton.x + muteButton.w &&
      y >= muteButton.y && y <= muteButton.y + muteButton.h) {
    isMuted = !isMuted;
    if (isMuted) {
      if (currentSound) currentSound.pause();
    } else {
      if (currentSound) currentSound.play().catch(e => console.error(`Error reproduciendo ${currentSound.src}:`, e));
    }
  }

  // botonsin de pausa
  if (gameState === "game" &&
      x >= pauseButton.x && x <= pauseButton.x + pauseButton.w &&
      y >= pauseButton.y && y <= pauseButton.y + pauseButton.h) {
    gameState = "paused";
    showPauseMenu();
  }
});

// inpedir copiar los botones de movil
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  // mute movil
  if (x >= muteButton.x && x <= muteButton.x + muteButton.w &&
      y >= muteButton.y && y <= muteButton.y + muteButton.h) {
    isMuted = !isMuted;
    if (isMuted) {
      if (currentSound) currentSound.pause();
    } else {
      if (currentSound) currentSound.play().catch(e => console.error(`Error reproduciendo ${currentSound.src}:`, e));
    }
  }

  // menu movil
  if (gameState === "game" &&
      x >= pauseButton.x && x <= pauseButton.x + pauseButton.w &&
      y >= pauseButton.y && y <= pauseButton.y + pauseButton.h) {
    gameState = "paused";
    showPauseMenu();
  }
});

// decetar movil (esto lo hizo la ia no voy a mentir)
const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
if (isMobile) {
  document.getElementById("changeKeysBtn").style.display = 'none';
}

// variables de botones moviles
const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const shootBtn = document.getElementById("shoot");
const powerUpBtn = document.getElementById("powerUp");

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
    const ammoReward = difficulty === "hard" ? 5 : 3;
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

// cheats a lo san andreas
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const code = codeInput.value.trim();
    if (code === "912") {
      cheat912 = true;
      cheat22 = false;
      cheatMessage.textContent = "cheat activao";
      cheatMessage.style.color = "green";
      cheatMessage.style.display = "block";
    } else if (code === "22") {
      cheat22 = true;
      cheat912 = false;
      cheatMessage.textContent = "cheat activao";
      cheatMessage.style.color = "green";
      cheatMessage.style.display = "block";
    } else {
      cheatMessage.textContent = "Código incorrecto";
      cheatMessage.style.color = "red";
      cheatMessage.style.display = "block";
    }
    codeInput.value = "";
  }
});

// menus principales
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

document.getElementById("startBtn").onclick = () => {
  console.log("Botón Iniciar presionado. cheat22:", cheat22, "cheat912:", cheat912); // Depuración
  const isCheat912Active = cheat912;
  const isCheat22Active = cheat22;
  resetGame();
  menu.style.display = 'none'; 
  cheat912 = isCheat912Active;
  cheat22 = isCheat22Active;
  if (cheat912) {
    console.log("Aplicando cheat 912: kills = 150, iniciando transición al jefe");
    kills = 150;
    startBossTransition();
  } else if (cheat22) {
    console.log("Aplicando cheat 22: kills = 22, iniciando juego normal");
    kills = 22;
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
  cheatMessage.style.display = 'none';
  codeInput.value = ''; 
  codeInput.focus();
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
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
};
pauseMenu.querySelector("#continueBtn").onclick = () => {
  gameState = "game";
  pauseMenu.style.display = "none";
  playMusic();
};
pauseMenu.querySelector("#backToMainMenuBtn").onclick = () => {
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

// cambiar orden de teclas
function updateKeyButtons() {
  document.getElementById("leftKeyBtn").textContent = "Izquierda: " + (keyBindings.left === " " ? "Espacio" : keyBindings.left);
  document.getElementById("rightKeyBtn").textContent = "Derecha: " + (keyBindings.right === " " ? "Espacio" : keyBindings.right);
  document.getElementById("shootKeyBtn").textContent = "Disparo: " + (keyBindings.shoot === " " ? "Espacio" : keyBindings.shoot);
  document.getElementById("textureToggleBtn").textContent = `Texturas: ${useTextures ? "Sí" : "No"}`;
}

// lista de records
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
      p.style.color = "yellow";
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

// lo que el nombre dice pero en español
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

// mostrar botones en movil
function showKeyMenu() {
  gameState = "settings";
  menu.style.display = 'none';
  keyMenu.style.display = 'block';
  updateKeyButtons();
  playMusic();
}

// yatusabe (mostrar el juego por si no sabe)
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

// menu de pausa
function showPauseMenu() {
  pauseMenu.style.display = 'block';
  document.getElementById("pauseLives").textContent = lives;
  document.getElementById("pauseAmmo").textContent = ammo === Infinity ? "∞" : ammo;
  document.getElementById("pauseKills").textContent = kills;
  if (currentSound) currentSound.pause();
}

// game over :(
function showGameOverMenu() {
  gameState = "gameover";
  gameOverMenu.style.display = 'block';
  document.getElementById("finalStats").textContent = `Vidas: ${lives} | Balas: ${ammo === Infinity ? "∞" : ammo} | Kills: ${kills}`;
  cheat912 = false; 
  cheat22 = false; 
  playMusic(true);

  // solicitar nombre para guardar rrecord (solo si superas las 2 kills bot)
  if (kills > 0 || bossDefeated) {
    let name = prompt("felicidades? creo... nose guarda tu nombre:");
    if (name) {
      const score = bossDefeated ? "boss" : kills; 
      records.push({ name, difficulty, score });
      localStorage.setItem("records", JSON.stringify(records));
    }
  }
}

// reiniciar juego
function resetGame() {
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
  bullets = [];
  enemies = [];
  powerUps = [];
  kills = 0;
  lives = 3;
  maxLives = { easy: 20, medium: 15, hard: 10 };
  ammo = 10;
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
  shootStartTime = null;
  lastShotTime = null;
  bossActive = false;
  wasBossActive = false;
  bossAttacks = [];
  lastBossAttackTime = null;
  shakeTimeout = null;
  deathByBrown = false;
  bossDefeated = false;
  powerUpBtn.style.display = "none";
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (powerUpSpawnInterval) clearInterval(powerUpSpawnInterval);
  enemySpawnInterval = setInterval(spawnEnemy, 1500);
  powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);
}

// re-intentar vs el jefe
function resetToBoss() {
  player.x = canvas.width / 2 - (useTextures ? player.w : playerCube.w) / 2;
  player.y = canvas.height - (useTextures ? player.h : playerCube.h) - 40;
  bullets = [];
  enemies = [];
  powerUps = [];
  kills = 150; 
  lives = difficulty === "easy" ? 5 : 3; 
  maxLives = { easy: 5, medium: 3, hard: 3 };
  ammo = Infinity;
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
  shootStartTime = null;
  lastShotTime = null; 
  bossActive = false; 
  wasBossActive = true;
  bossAttacks = [];
  lastBossAttackTime = null;
  shakeTimeout = null;
  deathByBrown = false;
  bossDefeated = false; 
  powerUpBtn.style.display = "none";
  gameState = "bossTransition";
  fadeOpacity = 0;
  fadeStartTime = Date.now();
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (powerUpSpawnInterval) clearInterval(powerUpSpawnInterval);
}

// funcionamiento del disparo
function shoot() {
  if (ammo > 0 || ammo === Infinity) {
    bullets.push({ x: player.x + (useTextures ? player.w : playerCube.w) / 2 - 8, y: player.y, w: 16, h: 16, speed: 7 });
    if (ammo !== Infinity) ammo--;
    lastShotTime = Date.now(); 
  }
}

// spawn de enemigos (probabilidades y eso)
function spawnEnemy() {
  if (gameState !== "game" || bossActive) return;

  let type;
  if (cheat22) {
    type = "brown";
  } else {
    type = kills >= 50 ? "blue" : "red";
    if (kills >= 10 && kills < 50 && Math.random() < 0.3) type = "blue";
    if (kills >= 50 && Math.random() < 0.1) type = "purple";
    if (kills === 22 && Math.random() < 0.02) type = "brown";
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

// funciones del jefe
function spawnBoss() {
  const stats = enemyStats[difficulty].boss;
  enemies.push({
    x: canvas.width / 2 - 100,
    y: 50,
    w: 50,
    h: 50, 
    speed: 0, 
    type: "boss",
    hp: stats.hp,
    maxHp: stats.hp,
    livesLost: stats.livesLost,
    livesGained: stats.livesGained,
    ammoReward: stats.ammoReward,
    direction: 1,
    sideSpeed: 2 
  });
}

// ataque del jefe >:(((
function spawnBossAttack() {
  if (gameState !== "game" || !bossActive) return;
  const laneWidth = canvas.width / 3;
  const lanes = [0, 1, 2];
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

// intervalos entre apariciones
enemySpawnInterval = setInterval(spawnEnemy, 1500);
powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);

// la trancision epica al boss
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

  // variables ultra complejas para el video
  videoElement = document.createElement("video");
  videoElement.id = "endVideo";
  videoElement.src = "end.mp4";
  videoElement.style.position = "absolute";
  videoElement.style.top = "0";
  videoElement.style.left = "0";
  videoElement.style.width = "100vw";
  videoElement.style.height = "100vh";
  videoElement.style.objectFit = "cover";
  videoElement.style.zIndex = "1000";
  document.body.appendChild(videoElement);

  // reproducir video del final
  videoElement.play().catch(e => console.error("Error reproduciendo end.mp4:", e));

  // back to meniu
  videoElement.onended = () => {
    videoElement.remove(); 
    videoElement = null;
    isVideoPlaying = false;
    videoFadeOpacity = 0;
    videoFadeStartTime = null;
    gameState = "menu";
    menu.style.display = "block";
    playMusic(true);
  };
}

// todo el quilombo de funcionamiento para el power up
function handlePowerUps() {
  if (bossActive) return; 
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
      } else if (p.y >= canvas.height) {
        powerUps.splice(i, 1);
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
        const ammoReward = difficulty === "hard" ? 5 : 3;
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

// estado jefe
function updateGame() {
  if (gameState === "bossTransition") {
    const fadeDuration = 3000;
    const elapsed = Date.now() - fadeStartTime;
    fadeOpacity = Math.min(elapsed / fadeDuration, 1);
    if (elapsed >= fadeDuration) {
      gameState = "game";
      bossActive = true;
      wasBossActive = true; 
      lives = difficulty === "easy" ? 5 : 3;
      maxLives = { easy: 5, medium: 3, hard: 3 };
      ammo = Infinity;
      enemies = [];
      powerUps = [];
      spawnBoss();
      fadeOpacity = 0;
      fadeStartTime = null;
      playMusic(true);
    }
    return;
  }

  if (gameState !== "game") return;

  if (keys[keyBindings.left] && player.x > 0) player.x -= player.speed;
  if (keys[keyBindings.right] && player.x + (useTextures ? player.w : playerCube.w) < canvas.width) player.x += player.speed;

  // mantener el disparo
  if (keys[keyBindings.shoot] && (ammo > 0 || ammo === Infinity)) {
    const now = Date.now();
    if (shootStartTime && (now - shootStartTime >= 200)) {
      if (!lastShotTime || (now - lastShotTime >= 115)) {
        shoot();
      }
    }
  }

  // activar modo jefe a los 150 kills
  if (kills >= 150 && !bossActive && !cheat912) {
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
      en.x += en.sideSpeed * en.direction;
      if (en.x <= 0 || en.x + (useTextures ? en.w : enemyCube.w) >= canvas.width) en.direction *= -1;
    }
  });

  if (bossActive && (!lastBossAttackTime || Date.now() - lastBossAttackTime >= 2000)) {
    shakeTimeout = Date.now() + 1000;
    spawnBossAttack();
  }

  bossAttacks.forEach(a => a.y += a.speed);
  bossAttacks = bossAttacks.filter(a => a.y < canvas.height); // eliminar ataques al llegar al fondo (muy importante)

  const prevLives = lives;
  enemies = enemies.filter(en => {
    if (en.type !== "boss" && en.y >= canvas.height) {
      lives = Math.max(0, lives - en.livesLost);
      if (en.type === "brown") {
        deathByBrown = true;
        flashColor = "brown";
        gameState = "dead";
        playMusic(true);
      }
      return false;
    }
    return true;
  });

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
            bossDefeated = true;
            gameState = "dead";
            playerTempImage = null;
            deathTimeout = Date.now() + 2000;
            if (currentSound) {
              currentSound.pause();
              currentSound.currentTime = 0;
              currentSound = null;
            }
            enemies.splice(ei, 1);
            return;
          }
          enemies.splice(ei, 1);
          kills++;
          ammo = ammo === Infinity ? Infinity : Math.min(ammo + en.ammoReward, maxAmmo);
          if (kills === 22 && (cheat22 || Math.random() < 0.02) && !bossActive) {
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
    shakeTimeout = null;
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // efecto de terremoto
  if (shakeTimeout && Date.now() <= shakeTimeout) {
    ctx.save();
    const offsetX = (Math.random() - 0.5) * 2 * shakeIntensity;
    const offsetY = (Math.random() - 0.5) * 2 * shakeIntensity;
    ctx.translate(offsetX, offsetY);
  }

  // backgranund (fondo en español de argentina (y toda latinoamerica))
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

  // fondo marron para easter egg
  if ((gameState === "dead" || gameState === "gameover") && deathByBrown) {
    ctx.fillStyle = "rgba(139, 69, 19, 1)"; // Marrón opaco
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // alerta falta de assets
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

  // ni idea lo hizo jaure
  if (flashTimeout && Date.now() < flashTimeout) {
    ctx.fillStyle = flashColor === "red" ? "rgba(255, 0, 0, 0.5)" : "rgba(139, 69, 19, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (flashTimeout && Date.now() >= flashTimeout) {
    flashTimeout = null;
    flashColor = null;
  }

  // trancision al jefe
  if (gameState === "bossTransition") {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (shakeTimeout) ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }

  // trancision al video
  if (gameState === "videoTransition") {
    ctx.fillStyle = `rgba(0, 0, 0, ${videoFadeOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (shakeTimeout) ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }

  // el pj
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
    if (playerFlash && Date.now() < playerFlash.timeout) {
      ctx.fillStyle = playerFlash.color === "green" ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)";
      ctx.fillRect(player.x, player.y, playerCube.w, playerCube.h);
    }
  }

  // balas
  bullets.forEach(b => {
    if (useTextures && images.bullet.complete) {
      ctx.drawImage(images.bullet, b.x, b.y, b.w, b.h);
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  });

  // enemigos
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

  // ataques del jefe
  bossAttacks.forEach(a => {
    ctx.fillStyle = "red";
    ctx.fillRect(a.x, a.y, a.w, a.h);
  });

  // power ups
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
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2; 
    ctx.strokeText(p.key, p.x + 14, p.y + 34);
    ctx.fillText(p.key, p.x + 14, p.y + 34); 
  });

  // Cartel "<null>" al killear al jefe
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

  // HUD (lo hizo jaure)
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Kills: " + kills, 10, 20);
  if (kills >= 150 || cheat912) {
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

  //diseño de boton mute
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; 
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

  // diseño boton menu
  if (gameState === "game") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
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
  if (shakeTimeout && Date.now() <= shakeTimeout) {
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// juego infinitooooo (masomenos)
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
        gameState = "videoTransition";
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
    const fadeDuration = 3000;
    const elapsed = Date.now() - videoFadeStartTime;
    videoFadeOpacity = Math.min(elapsed / fadeDuration, 1);
    if (elapsed >= fadeDuration && !isVideoPlaying) {
      playEndVideo();
    }
  }
  requestAnimationFrame(loop);
}

loop(performance.now());