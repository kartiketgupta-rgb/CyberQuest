// ==========================================
// CYBERQUEST GAME.JS
// SINGLE PLAYER + 1V1 MULTIPLAYER
// CLEAN VERSION
// ==========================================


// ==========================================
// SINGLE PLAYER VARIABLES
// ==========================================

let levels = [];
let index = 0;

let health = 100;

let time = 60;
let timer = null;

let shield = 3;
let shieldActive = false;
let shieldUsed = 0;

let playerName = "";
let userId = null;

let timedMode = true;
let paused = false;
let gameStarted = false;
let answering = false;

const DIFFICULTIES = ["easy", "medium", "hard"];


// ==========================================
// SINGLE PLAYER UI
// ==========================================

function updateHealthBar() {

  const healthElement =
    document.getElementById("health");

  const bar =
    document.getElementById("healthBar");

  if (healthElement) {
    healthElement.innerText = health;
  }

  if (bar) {
    bar.style.width = health + "%";
  }
}


function updateTimerRing(current) {

  const ring =
    document.getElementById("timerRing");

  if (!ring) return;

  const pct =
    Math.max(
      0,
      Math.min(
        100,
        (current / 60) * 100
      )
    );

  ring.style.background =
    `conic-gradient(
      #06b6d4 ${pct}%,
      rgba(255,255,255,.07) 0%
    )`;

  const span =
    ring.querySelector("span");

  if (span) {

    span.style.color =
      current <= 10
        ? "#fca5a5"
        : "#67e8f9";
  }
}


function updateShieldIcons() {

  document
    .querySelectorAll(".shield-icon")
    .forEach((icon, i) => {

      icon.classList.toggle(
        "spent",
        i >= shield
      );

    });
}


function setModeUI() {

  const label =
    document.getElementById("modeLabel");

  if (label) {

    label.innerText =
      timedMode
        ? "60s / question"
        : "No time limit";
  }

  const timerCard =
    document.getElementById("timerCard");

  if (timerCard) {

    timerCard.style.opacity =
      timedMode
        ? "1"
        : ".45";
  }
}


// ==========================================
// START SINGLE PLAYER GAME
// ==========================================

async function startGame() {

  const nameInput =
    document.getElementById("playerName");

  if (!nameInput) return;

  playerName =
    nameInput.value.trim();

  if (!playerName) {

    const message =
      document.getElementById("message");

    if (message) {

      message.innerText =
        "⚠️ Enter your name to begin.";
    }

    return;
  }


  timedMode =
    document
      .getElementById("timedMode")
      ?.checked ?? true;


  const message =
    document.getElementById("message");

  if (message) {

    message.innerText =
      "Loading a fresh 20-question challenge…";
  }


  try {

    const response =
      await fetch(
        "http://localhost:3000/create-user",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            name: playerName
          })
        }
      );


    const user =
      await response.json();

    if (!response.ok) {

      throw new Error(
        user.error ||
        "Unable to create player"
      );
    }


    userId =
      user.userId;


    const questionResponse =
      await fetch(
        `http://localhost:3000/questions?userId=${userId}`
      );


    const data =
      await questionResponse.json();

    if (!questionResponse.ok) {

      throw new Error(
        data.error ||
        "Unable to load questions"
      );
    }


    levels = data;


    if (levels.length < 20) {

      throw new Error(
        "Question bank needs at least 20 unused questions."
      );
    }


    index = 0;
    health = 100;
    shield = 3;
    shieldUsed = 0;
    shieldActive = false;
    paused = false;
    gameStarted = true;
    answering = false;


    const greeting =
      document.getElementById(
        "playerGreeting"
      );

    if (greeting) {

      greeting.innerText =
        `Welcome, ${playerName} 👋`;

      greeting.style.display =
        "block";
    }


    const startButton =
      document.getElementById(
        "startBtn"
      );

    if (startButton) {

      startButton.style.display =
        "none";
    }


    nameInput.style.display =
      "none";


    const modeControls =
      document.getElementById(
        "modeControls"
      );

    if (modeControls) {

      modeControls.style.display =
        "none";
    }

    // Hide the multiplayer lobby during a single-player game.
    // Otherwise the multiplayer card stays between the HUD and
    // the question area, making the questions appear far below.
    const multiplayerCard =
      document.getElementById(
        "multiplayerCard"
      );

    if (multiplayerCard) {

      multiplayerCard.style.display =
        "none";
    }


    const gameControls =
      document.getElementById(
        "gameControls"
      );

    if (gameControls) {

      gameControls.style.display =
        "flex";
    }


    const question =
      document.getElementById(
        "question"
      );

    if (question) {

      question.style.display =
        "block";
    }


    const options =
      document.getElementById(
        "options"
      );

    if (options) {

      options.style.display =
        "grid";
    }


    const pauseButton =
      document.getElementById(
        "pauseBtn"
      );

    if (pauseButton) {

      pauseButton.style.display =
        timedMode
          ? "inline-flex"
          : "none";
    }


    updateHealthBar();


    const shieldText =
      document.getElementById(
        "shield"
      );

    if (shieldText) {

      shieldText.innerText =
        shield;
    }


    const shieldUsedText =
      document.getElementById(
        "shieldUsed"
      );

    if (shieldUsedText) {

      shieldUsedText.innerText =
        "0";
    }


    updateShieldIcons();

    loadQuestion();

  } catch (error) {

    console.error(error);

    if (message) {

      message.innerText =
        "⚠️ " + error.message;
    }
  }
}


// ==========================================
// LOAD QUESTION
// ==========================================

function loadQuestion() {

  if (!levels[index]) return;

  answering = false;
  paused = false;

  clearInterval(timer);


  const item =
    levels[index];


  const question =
    document.getElementById(
      "question"
    );

  if (question) {

    question.innerHTML =

      `<span class="difficulty-badge ${item.difficulty}">
        ${String(item.difficulty).toUpperCase()}
      </span>
      <span>${item.q}</span>`;
  }


  const level =
    document.getElementById(
      "level"
    );

  if (level) {

    level.innerText =
      `${index + 1} / 20`;
  }


  const message =
    document.getElementById(
      "message"
    );

  if (message) {

    message.innerText = "";
  }


  const options =
    item.options.map(
      (text, i) => ({
        text,
        i
      })
    );


  options.sort(
    () =>
      Math.random() - 0.5
  );


  const optionsContainer =
    document.getElementById(
      "options"
    );

  if (optionsContainer) {

    optionsContainer.innerHTML =

      options
        .map(
          option =>

            `<button onclick="checkAnswer(${option.i})">
              ${option.text}
            </button>`
        )
        .join("");
  }


  const pauseButton =
    document.getElementById(
      "pauseBtn"
    );

  if (pauseButton) {

    pauseButton.innerText =
      "⏸ Pause";

    pauseButton.disabled =
      !timedMode;
  }


  startTimer();
}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

  clearInterval(timer);


  if (!timedMode) {

    time = 60;

    const timeElement =
      document.getElementById(
        "time"
      );

    if (timeElement) {

      timeElement.innerText =
        "∞";
    }

    return;
  }


  time = 60;


  const timeElement =
    document.getElementById(
      "time"
    );

  if (timeElement) {

    timeElement.innerText =
      time;
  }


  updateTimerRing(time);


  timer =
    setInterval(() => {

      if (paused) return;

      time--;


      if (timeElement) {

        timeElement.innerText =
          time;
      }


      updateTimerRing(time);


      if (time <= 0) {

        clearInterval(timer);

        damage(
          "⏰ Time's up!"
        );
      }

    }, 1000);
}


// ==========================================
// PAUSE
// ==========================================

function togglePause() {

  if (
    !gameStarted ||
    !timedMode
  ) {
    return;
  }


  paused =
    !paused;


  const pauseButton =
    document.getElementById(
      "pauseBtn"
    );

  if (pauseButton) {

    pauseButton.innerText =
      paused
        ? "▶ Resume"
        : "⏸ Pause";
  }


  const message =
    document.getElementById(
      "message"
    );

  if (message) {

    message.innerText =
      paused
        ? "⏸ Game paused"
        : "▶ Game resumed";
  }


  document
    .querySelectorAll(
      "#options button"
    )
    .forEach(button => {

      button.disabled =
        paused;
    });


  const shieldButton =
    document.getElementById(
      "shieldBtn"
    );

  if (shieldButton) {

    shieldButton.disabled =
      paused;
  }
}


// ==========================================
// CHECK ANSWER
// ==========================================

function checkAnswer(choice) {

  if (
    paused ||
    answering ||
    !levels[index]
  ) {
    return;
  }


  answering = true;

  clearInterval(timer);


  if (
    choice ===
    levels[index].answer
  ) {

    const message =
      document.getElementById(
        "message"
      );

    if (message) {

      message.innerText =
        "✅ Attack Blocked!";
    }

    next();

  } else {

    damage(
      "💥 System Damaged!"
    );
  }
}


// ==========================================
// SHIELD
// ==========================================

function useShield() {

  if (paused) return;


  if (
    shield > 0 &&
    !shieldActive
  ) {

    shieldActive = true;

    shield--;

    shieldUsed++;


    const shieldText =
      document.getElementById(
        "shield"
      );

    if (shieldText) {

      shieldText.innerText =
        shield;
    }


    const shieldUsedText =
      document.getElementById(
        "shieldUsed"
      );

    if (shieldUsedText) {

      shieldUsedText.innerText =
        shieldUsed;
    }


    const message =
      document.getElementById(
        "message"
      );

    if (message) {

      message.innerText =
        "🛡️ Shield Activated! It will absorb the next hit.";
    }


    updateShieldIcons();

  } else {

    const message =
      document.getElementById(
        "message"
      );

    if (message) {

      message.innerText =
        shield <= 0
          ? "❌ No shields left!"
          : "🛡️ Shield is already active.";
    }
  }
}


// ==========================================
// DAMAGE
// ==========================================

function damage(
  msg = "💥 System Damaged!"
) {

  if (!answering) {

    answering = true;
  }


  if (shieldActive) {

    shieldActive = false;


    const message =
      document.getElementById(
        "message"
      );

    if (message) {

      message.innerText =
        "🛡️ Shield absorbed the hit!";
    }


    next();

    return;
  }


  health =
    Math.max(
      0,
      health - 20
    );


  updateHealthBar();


  const message =
    document.getElementById(
      "message"
    );

  if (message) {

    message.innerText =
      msg;
  }


  if (health <= 0) {

    gameOver();

  } else {

    next();
  }
}


// ==========================================
// NEXT QUESTION
// ==========================================

function next() {

  setTimeout(() => {

    index++;


    if (index < 20) {

      loadQuestion();

    } else {

      winGame();
    }

  }, 650);
}


// ==========================================
// MARK QUESTIONS PLAYED
// ==========================================

async function markPlayed() {

  if (!userId) return;


  const ids =
    levels.map(
      question => question.id
    );


  try {

    await fetch(
      "http://localhost:3000/questions/played",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          userId,
          questionIds: ids
        })
      }
    );

  } catch (error) {

    console.error(
      "History save failed",
      error
    );
  }
}


// ==========================================
// SAVE SCORE
// ==========================================

function saveScore() {

  if (!userId) return;


  fetch(
    "http://localhost:3000/save-score",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        userId,
        score: health
      })
    }
  )
  .catch(console.error);
}


// ==========================================
// LEADERBOARD
// ==========================================

function showLeaderboard() {

  document
    .getElementById(
      "leaderboard"
    )
    ?.scrollIntoView({
      behavior: "smooth"
    });


  fetchLeaderboard();
}


function fetchLeaderboard() {

  fetch(
    "http://localhost:3000/scores"
  )

    .then(
      response =>
        response.json()
    )

    .then(data => {

      const tbody =
        document.querySelector(
          "#leaderboardTable tbody"
        );


      if (!tbody) return;


      tbody.innerHTML =

        data
          .map(
            (row, i) =>

              `<tr>
                <td>${i + 1}</td>
                <td>${row.name}</td>
                <td>${row.score}</td>
              </tr>`
          )
          .join("");

    })

    .catch(error => {

      console.error(
                "Leaderboard error:",
        error
      );
    });
}


// ==========================================
// FINISH SCREEN
// ==========================================

async function finishScreen(
  title,
  icon,
  color
) {

  clearInterval(timer);

  await markPlayed();

  saveScore();


  const container =
    document.querySelector(
      ".game-container"
    );


  if (!container) return;


  container.innerHTML =

    `<div style="
      text-align:center;
      padding:20px 0;
    ">

      <div style="
        font-size:68px;
        margin-bottom:18px;
      ">
        ${icon}
      </div>

      <h1 style="color:${color};">
        ${title}
      </h1>

      <p style="
        margin-top:14px;
        font-size:16px;
      ">
        Final Health:
        <strong>${health}%</strong>
      </p>

      <p>
        20-question run completed for
        <strong>${playerName}</strong>
      </p>

      <div class="end-buttons">

        <button
          class="btn-leaderboard"
          onclick="showLeaderboard()"
        >
          🏅 Leaderboard
        </button>

        <button
          class="btn-retry btn-retry-win"
          onclick="location.reload()"
        >
          ↩ New Challenge
        </button>

      </div>

    </div>`;
}


function winGame() {

  finishScreen(
    "SYSTEM SAVED",
    "🏆",
    "#34d399"
  );
}


function gameOver() {

  finishScreen(
    "SYSTEM HACKED",
    "💀",
    "#ef4444"
  );
}


// ======================================================
// ======================================================
// MULTIPLAYER - 1V1 BATTLE
// ======================================================
// ======================================================

let socket = null;
let multiplayerRoomCode = null;
let multiplayerPlayerName = "";
let isRoomCreator = false;
let multiplayerBattleStarted = false;
let multiplayerPlayers = [];
let multiplayerQuestion = null;
let multiplayerQuestionNumber = 0;
let multiplayerTotalQuestions = 20;
let multiplayerAnswered = false;
let multiplayerTimer = null;
let multiplayerTimeLeft = 60;
let multiplayerShield = 3;
let multiplayerShieldActive = false;
let multiplayerScore = 0;


// ==========================================
// GET MULTIPLAYER ELEMENTS
// ==========================================

function getRoomStatus() {
  return document.getElementById("roomStatus");
}

function getRoomInput() {
  return document.getElementById("roomCodeInput");
}

function getMultiplayerLobby() {
  return document.getElementById("multiplayerLobby");
}

function getMultiplayerGame() {
  return document.getElementById("multiplayerGame");
}


// ==========================================
// SAFE HTML TEXT
// ==========================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ==========================================
// RENDER PLAYERS IN LOBBY
// ==========================================

function renderMultiplayerPlayers(players = []) {
  const player1 = document.getElementById("player1");
  const player2 = document.getElementById("player2");

  if (player1) {
    player1.innerText = players[0]
      ? `🛡️ ${players[0].name} — Player 1`
      : "🛡️ Waiting for Player 1...";
  }

  if (player2) {
    player2.innerText = players[1]
      ? `⚔️ ${players[1].name} — Player 2`
      : "⚔️ Waiting for Player 2...";
  }
}


function renderWaitingRoom(players = []) {
  multiplayerPlayers = players;
  renderMultiplayerPlayers(players);

  const status = getRoomStatus();
  if (!status) return;

  const room = multiplayerRoomCode || "-----";
  const player1 = players[0]?.name || "Waiting for Player 1...";
  const player2 = players[1]?.name || "Waiting for Player 2...";

  if (players.length < 2) {
    status.innerHTML = `
      <div class="mp-room-box">
        <p>🏠 Room: <strong>${escapeHtml(room)}</strong></p>
        <p>🛡️ ${escapeHtml(player1)} — Player 1</p>
        <p>⚔️ ${escapeHtml(player2)}</p>
        <p style="color:#facc15;">🟡 Waiting for Player 2...</p>
      </div>`;
    return;
  }

  status.innerHTML = `
    <div class="mp-room-box">
      <p>🏠 Room: <strong>${escapeHtml(room)}</strong></p>
      <p style="color:#4ade80;">🟢 Both players connected!</p>
      <p>🛡️ ${escapeHtml(player1)} — Player 1</p>
      <p>⚔️ ${escapeHtml(player2)} — Player 2</p>
      <p style="color:#67e8f9;">⚔️ Ready for battle</p>
    </div>`;

  const startButton = document.getElementById("startBattleBtn");
  if (startButton) {
    startButton.style.display = "inline-block";
    startButton.disabled = false;
    startButton.innerText = "⚡ START BATTLE";
  }
}


// ==========================================
// UPDATE MULTIPLAYER HEALTH / SCORE
// ==========================================

function updateMultiplayerPlayers(players = []) {
  multiplayerPlayers = players;

  const p1 = players[0];
  const p2 = players[1];

  const p1Name = document.getElementById("mpPlayer1Name");
  const p2Name = document.getElementById("mpPlayer2Name");
  const p1Health = document.getElementById("mpPlayer1Health");
  const p2Health = document.getElementById("mpPlayer2Health");
  const p1Text = document.getElementById("mpPlayer1HealthText");
  const p2Text = document.getElementById("mpPlayer2HealthText");

  if (p1) {
    if (p1Name) p1Name.innerText = `🛡️ ${p1.name}`;
    if (p1Health) p1Health.style.width = `${Math.max(0, p1.health)}%`;
    if (p1Text) p1Text.innerText = p1.health;
  }

  if (p2) {
    if (p2Name) p2Name.innerText = `⚔️ ${p2.name}`;
    if (p2Health) p2Health.style.width = `${Math.max(0, p2.health)}%`;
    if (p2Text) p2Text.innerText = p2.health;
  }

  const me = players.find(player => player.socketId === socket?.id);
  if (me) {
    multiplayerShield = Number(me.shield ?? multiplayerShield);
    multiplayerShieldActive = Boolean(me.shieldActive);
    multiplayerScore = Number(me.score ?? multiplayerScore);
  }

  updateMultiplayerShieldUI();
}


function updateMultiplayerShieldUI() {
  let shieldButton = document.getElementById("mpShieldBtn");
  let scoreElement = document.getElementById("mpScore");

  const message = document.getElementById("mpMessage");
  if (message && !shieldButton) {
    const controls = document.createElement("div");
    controls.id = "mpControls";
    controls.style.cssText = "display:flex;gap:10px;justify-content:center;align-items:center;margin-top:12px;flex-wrap:wrap;";
    controls.innerHTML = `
      <button id="mpShieldBtn" type="button" onclick="useMultiplayerShield()"
        style="padding:9px 16px;cursor:pointer;">
        🛡️ SHIELD (${multiplayerShield})
      </button>
      <span id="mpScore" style="font-weight:700;">Score: ${multiplayerScore}</span>
    `;
    message.insertAdjacentElement("afterend", controls);
    shieldButton = document.getElementById("mpShieldBtn");
    scoreElement = document.getElementById("mpScore");
  }

  if (shieldButton) {
    shieldButton.innerText = multiplayerShieldActive
      ? "🛡️ SHIELD ACTIVE"
      : `🛡️ SHIELD (${multiplayerShield})`;
    shieldButton.disabled = multiplayerShield <= 0 || multiplayerShieldActive || !multiplayerBattleStarted || multiplayerAnswered;
  }

  if (scoreElement) {
    scoreElement.innerText = `Score: ${multiplayerScore}`;
  }
}


// ==========================================
// CONNECT MULTIPLAYER
// ==========================================

function connectMultiplayer() {
  if (socket && (socket.connected || socket.connecting)) {
    return socket;
  }

  console.log("Connecting to multiplayer server...");

  socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"]
  });

  socket.on("connect", () => {
    console.log("⚡ Multiplayer connected:", socket.id);
  });

  socket.on("connect_error", error => {
    console.error("Multiplayer connection error:", error);

    const status = getRoomStatus();
    if (status) {
      status.innerHTML = `
        <p style="color:#f87171;">
          ⚠️ Multiplayer server connection failed. Make sure backend is running on port 3000.
        </p>`;
    }
  });


  // ========================================
  // ROOM CREATED
  // ========================================

  socket.on("room-created", data => {
    multiplayerRoomCode = String(data.roomCode).toUpperCase();
    multiplayerPlayerName = data.playerName || multiplayerPlayerName;
    isRoomCreator = true;
    multiplayerBattleStarted = false;
    multiplayerAnswered = false;

    console.log("🏠 Room created:", multiplayerRoomCode);

    const roomInput = getRoomInput();
    if (roomInput) roomInput.value = multiplayerRoomCode;

    const status = getRoomStatus();
    if (status) {
      status.innerHTML = `
        <div class="mp-room-box">
          <p>🏠 Room Created: <strong>${escapeHtml(multiplayerRoomCode)}</strong></p>
          <p>🛡️ ${escapeHtml(multiplayerPlayerName)} — Player 1</p>
          <p style="color:#facc15;">🟡 Waiting for Player 2...</p>
          <p>Share this 5-character code with Player 2.</p>
        </div>`;
    }

    renderMultiplayerPlayers([{ name: multiplayerPlayerName }]);
  });


  // ========================================
  // PLAYER JOINED
  // ========================================

  socket.on("player-joined", data => {
    const players = Array.isArray(data?.players) ? data.players : [];

    if (!multiplayerRoomCode) {
      multiplayerRoomCode = getRoomInput()?.value.trim().toUpperCase() || null;
    }

    console.log("👥 Players connected:", players);
    renderWaitingRoom(players);
  });


  // ========================================
  // ROOM ERROR
  // ========================================

  socket.on("room-error", data => {
    console.error("Room error:", data);

    const status = getRoomStatus();
    if (status) {
      status.innerHTML = `
        <p style="color:#f87171;">⚠️ ${escapeHtml(data?.message || "Room error.")}</p>`;
    }

    const button = document.getElementById("startBattleBtn");
    if (button) {
      button.disabled = false;
      button.innerText = "⚡ START BATTLE";
    }
  });


  // ========================================
  // PLAYER LEFT
  // ========================================

  socket.on("player-left", () => {
    clearInterval(multiplayerTimer);
    multiplayerBattleStarted = false;
    multiplayerAnswered = false;

    const game = getMultiplayerGame();
    if (game) game.style.display = "none";

    const lobby = getMultiplayerLobby();
    if (lobby) lobby.style.display = "block";

    const status = getRoomStatus();
    if (status) {
      status.innerHTML = `
        <p style="color:#f87171;">⚠️ Your opponent left the room.</p>`;
    }

    renderMultiplayerPlayers([]);
  });


  // ========================================
  // BATTLE STARTED
  // ========================================

  socket.on("battle-started", data => {
    multiplayerBattleStarted = true;
    multiplayerAnswered = false;
    multiplayerQuestion = null;
    multiplayerQuestionNumber = 0;
    multiplayerTotalQuestions = 20;
    multiplayerShield = 3;
    multiplayerShieldActive = false;
    multiplayerScore = 0;

    if (data?.roomCode) {
      multiplayerRoomCode = String(data.roomCode).toUpperCase();
    }

    if (Array.isArray(data?.players)) {
      updateMultiplayerPlayers(data.players);
    }

    console.log("⚡ Battle started:", multiplayerRoomCode);

    const lobby = getMultiplayerLobby();
    const game = getMultiplayerGame();

    if (lobby) lobby.style.display = "none";
    if (game) game.style.display = "block";

    const title = document.getElementById("battleTitle");
    if (title) title.innerText = "⚔️ LIVE CYBER BATTLE";

    const status = document.getElementById("battleStatus");
    if (status) status.innerHTML = "🟢 Battle started — waiting for question...";

    const message = document.getElementById("mpMessage");
    if (message) message.innerText = "Get ready! Answer faster than your opponent.";

    updateMultiplayerShieldUI();
  });


  // ========================================
  // NEW QUESTION
  // ========================================

  socket.on("new-question", data => {
    if (!multiplayerBattleStarted) return;

    clearInterval(multiplayerTimer);
    multiplayerAnswered = false;
    multiplayerQuestion = data?.question || null;
    multiplayerQuestionNumber = Number(data?.questionNumber || 1);
    multiplayerTotalQuestions = Number(data?.totalQuestions || 20);
    multiplayerTimeLeft = 60;

    if (!multiplayerQuestion) return;

    renderMultiplayerQuestion();
    startMultiplayerTimer();
    updateMultiplayerShieldUI();
  });


  // ========================================
  // ANSWER RESULT
  // ========================================

  socket.on("answer-result", data => {
    if (!data) return;

    if (Array.isArray(data.players)) {
      updateMultiplayerPlayers(data.players);
    }

    const message = document.getElementById("mpMessage");
    const opponentStatus = document.getElementById("opponentStatus");
    const isMe = data.socketId === socket?.id;

    if (message && isMe) {
      if (data.correct) {
        message.innerText = "✅ Correct! You attacked your opponent!";
      } else {
        message.innerText = "💥 Wrong answer! Your system took damage.";
      }
    }

    if (opponentStatus && !isMe) {
      opponentStatus.innerText = data.correct
        ? "🔥 Opponent answered correctly and attacked!"
        : "🛡️ Opponent answered incorrectly and took damage.";
    }

    const players = Array.isArray(data.players) ? data.players : multiplayerPlayers;
    const me = players.find(player => player.socketId === socket?.id);
    if (me) {
      multiplayerScore = Number(me.score || 0);
      multiplayerShield = Number(me.shield ?? multiplayerShield);
      multiplayerShieldActive = Boolean(me.shieldActive);
    }

    updateMultiplayerShieldUI();
  });


  // ========================================
  // BATTLE FINISHED
  // ========================================

  // ========================================
  // SHIELD UPDATE
  // ========================================

  socket.on("shield-update", handleMultiplayerShieldUpdate);


  socket.on("rematch-status", data => {
    const status = getRoomStatus();
    const readyCount = Number(data?.readyCount || 0);
    if (status) {
      status.innerHTML = `<p style="color:#67e8f9;">🔄 Rematch requests: ${readyCount}/2</p>`;
    }
  });

  socket.on("rematch-ready", data => {
    multiplayerBattleStarted = false;
    multiplayerAnswered = false;
    multiplayerPlayers = Array.isArray(data?.players) ? data.players : [];
    multiplayerRoomCode = String(data?.roomCode || multiplayerRoomCode || "").toUpperCase();

    const game = getMultiplayerGame();
    const lobby = getMultiplayerLobby();
    if (game) game.style.display = "none";
    if (lobby) lobby.style.display = "block";

    renderWaitingRoom(multiplayerPlayers);

    const status = getRoomStatus();
    if (status) {
      status.innerHTML = `<div class="mp-room-box"><p style="color:#34d399;">🔄 Rematch ready!</p><p>Both players are ready. Start the next battle.</p></div>`;
    }
  });

  socket.on("battle-finished", data => {
    clearInterval(multiplayerTimer);
    multiplayerBattleStarted = false;
    multiplayerAnswered = true;

    if (Array.isArray(data?.players)) {
      updateMultiplayerPlayers(data.players);
    }

    const game = getMultiplayerGame();
    if (!game) return;

    const winner = data?.winner;
    const draw = data?.draw;

    let resultTitle = "BATTLE OVER";
    let resultIcon = "⚔️";
    let resultColor = "#67e8f9";

    if (draw) {
      resultTitle = "DRAW!";
      resultIcon = "🤝";
    } else if (winner?.socketId === socket?.id) {
      resultTitle = "YOU WIN!";
      resultIcon = "🏆";
      resultColor = "#34d399";
    } else {
      resultTitle = "YOU LOST!";
      resultIcon = "💀";
      resultColor = "#f87171";
    }

    const playersHtml = (data?.players || []).map((player, i) => `
      <div style="margin:8px 0;padding:10px;border-radius:10px;background:rgba(255,255,255,.05);">
        ${i === 0 ? "🛡️" : "⚔️"} <strong>${escapeHtml(player.name)}</strong>
        — Health: <strong>${player.health}%</strong>
        — Score: <strong>${player.score}</strong>
      </div>`).join("");

    game.innerHTML = `
      <div style="text-align:center;padding:22px 10px;">
        <div style="font-size:64px;">${resultIcon}</div>
        <h2 style="color:${resultColor};margin:10px 0;">${resultTitle}</h2>
        <p>Cyber Battle completed.</p>
        <div style="margin:18px auto;max-width:520px;text-align:left;">
          ${playersHtml}
        </div>
        <button type="button" onclick="requestRematch()" style="padding:11px 20px;cursor:pointer;">
          🔄 PLAY AGAIN
        </button>
      </div>`;
  });

  return socket;
}


// ==========================================
// REQUEST REMATCH
// ==========================================

function requestRematch() {
  if (!socket || !socket.connected) {
    alert("Multiplayer connection is not ready.");
    return;
  }

  if (!multiplayerRoomCode) {
    alert("Room code is not available.");
    return;
  }

  const game = getMultiplayerGame();
  if (game) {
    const button = game.querySelector("button");
    if (button) {
      button.disabled = true;
      button.innerText = "⏳ WAITING FOR OPPONENT...";
    }
  }

  const status = getRoomStatus();
  if (status) {
    status.innerHTML = `<p style="color:#67e8f9;">🔄 Waiting for the other player to choose Play Again...</p>`;
  }

  socket.emit("rematch-request", { roomCode: multiplayerRoomCode });
}


// ==========================================
// SHOW JOIN ROOM
// ==========================================

function showJoinRoom() {
  const area = document.getElementById("joinRoomArea");

  if (!area) {
    console.error("joinRoomArea not found");
    return;
  }

  area.style.display = area.style.display === "block" ? "none" : "block";

  const input = getRoomInput();
  if (input) {
    input.maxLength = 5;
    input.minLength = 5;
    input.autocomplete = "off";
    input.focus();
  }
}


// ==========================================
// CREATE ROOM
// ==========================================

function createRoom() {
  const nameInput = document.getElementById("playerName");
  multiplayerPlayerName = nameInput?.value.trim() || "";

  if (!multiplayerPlayerName) {
    alert("Please enter your name first.");
    return;
  }

  isRoomCreator = true;
  multiplayerBattleStarted = false;

  const socketInstance = connectMultiplayer();
  if (!socketInstance) {
    alert("Multiplayer connection could not start.");
    return;
  }

  const emitCreateRoom = () => {
    console.log("Creating room for:", multiplayerPlayerName);
    socketInstance.emit("create-room", {
      playerName: multiplayerPlayerName
    });
  };

  if (socketInstance.connected) {
    emitCreateRoom();
    return;
  }

  const status = getRoomStatus();
  if (status) {
    status.innerHTML = `<p style="color:#facc15;">🟡 Connecting to multiplayer server...</p>`;
  }

  socketInstance.once("connect", emitCreateRoom);
}


// ==========================================
// JOIN ROOM
// ==========================================

function joinRoom() {
  const nameInput = document.getElementById("playerName");
  multiplayerPlayerName = nameInput?.value.trim() || "";

  if (!multiplayerPlayerName) {
    alert("Please enter your name first.");
    return;
  }

  const roomInput = getRoomInput();
  if (!roomInput) {
    alert("Room code input not found.");
    return;
  }

  const roomCode = roomInput.value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);

  roomInput.value = roomCode;

  if (roomCode.length !== 5) {
    alert("Room code must be exactly 5 characters.");
    roomInput.focus();
    return;
  }

  multiplayerRoomCode = roomCode;
  isRoomCreator = false;
  multiplayerBattleStarted = false;

  const socketInstance = connectMultiplayer();
  if (!socketInstance) {
    alert("Multiplayer connection could not start.");
    return;
  }

  const emitJoinRoom = () => {
    console.log("Joining room:", roomCode, "as", multiplayerPlayerName);
    socketInstance.emit("join-room", {
      roomCode,
      playerName: multiplayerPlayerName
    });
  };

  if (socketInstance.connected) {
    emitJoinRoom();
    return;
  }

  const status = getRoomStatus();
  if (status) {
    status.innerHTML = `<p style="color:#facc15;">🟡 Connecting to multiplayer server...</p>`;
  }

  socketInstance.once("connect", emitJoinRoom);
}


// ==========================================
// START BATTLE
// ==========================================

function startBattle() {
  console.log("START BATTLE clicked");

  if (!socket) {
    alert("Multiplayer connection not ready.");
    return;
  }

  if (!socket.connected) {
    alert("Multiplayer is not connected yet.");
    return;
  }

  const roomCode = (
    multiplayerRoomCode ||
    getRoomInput()?.value ||
    ""
  ).trim().toUpperCase();

  if (roomCode.length !== 5) {
    alert("Room code is not available.");
    return;
  }

  if (multiplayerBattleStarted) return;

  multiplayerRoomCode = roomCode;

  const button = document.getElementById("startBattleBtn");
  if (button) {
    button.disabled = true;
    button.innerText = "⚡ STARTING...";
  }

  console.log("Starting battle in room:", roomCode);

  socket.emit("start-battle", { roomCode });
}


// ==========================================
// ANSWER MULTIPLAYER QUESTION
// ==========================================

function answerMultiplayerQuestion(choice) {
  if (!socket || !socket.connected) return;
  if (!multiplayerBattleStarted || multiplayerAnswered) return;
  if (!multiplayerQuestion) return;

  multiplayerAnswered = true;
  clearInterval(multiplayerTimer);

  document
    .querySelectorAll("#mpOptions button")
    .forEach(button => {
      button.disabled = true;
    });

  updateMultiplayerShieldUI();

  socket.emit("answer-question", {
    roomCode: multiplayerRoomCode,
    answer: Number(choice)
  });

  const opponentStatus = document.getElementById("opponentStatus");
  if (opponentStatus) {
    opponentStatus.innerText = "⏳ Answer submitted. Waiting for opponent...";
  }
}


// ==========================================
// MULTIPLAYER TIMER
// ==========================================

function startMultiplayerTimer() {
  clearInterval(multiplayerTimer);
  multiplayerTimeLeft = 60;
  updateMultiplayerTimerUI();

  multiplayerTimer = setInterval(() => {
    if (multiplayerAnswered || !multiplayerBattleStarted) return;

    multiplayerTimeLeft--;
    updateMultiplayerTimerUI();

    if (multiplayerTimeLeft <= 0) {
      clearInterval(multiplayerTimer);
      answerMultiplayerQuestion(-1);
    }
  }, 1000);
}


function updateMultiplayerTimerUI() {
  const status = document.getElementById("battleStatus");
  if (!status) return;

  const difficulty = multiplayerQuestion?.difficulty
    ? String(multiplayerQuestion.difficulty).toUpperCase()
    : "";

  status.innerHTML = `
    🟢 Question ${multiplayerQuestionNumber} / ${multiplayerTotalQuestions}
    &nbsp; | &nbsp; ⏱️ <strong>${multiplayerTimeLeft}s</strong>
    ${difficulty ? `&nbsp; | &nbsp; <span>${escapeHtml(difficulty)}</span>` : ""}`;
}


// ==========================================
// RENDER MULTIPLAYER QUESTION
// ==========================================

function renderMultiplayerQuestion() {
  const questionElement = document.getElementById("mpQuestion");
  const optionsElement = document.getElementById("mpOptions");
  const message = document.getElementById("mpMessage");
  const opponentStatus = document.getElementById("opponentStatus");

  if (!questionElement || !optionsElement || !multiplayerQuestion) return;

  questionElement.innerHTML = `
    <span class="difficulty-badge ${escapeHtml(multiplayerQuestion.difficulty || "medium")}">
      ${escapeHtml(String(multiplayerQuestion.difficulty || "medium").toUpperCase())}
    </span>
    <span>${escapeHtml(multiplayerQuestion.text)}</span>`;

  const options = Array.isArray(multiplayerQuestion.options)
    ? multiplayerQuestion.options.map((text, index) => ({ text, index }))
    : [];

  // Shuffle only the visual order. The original option index is preserved.
  options.sort(() => Math.random() - 0.5);

  optionsElement.innerHTML = options.map(option => `
    <button type="button" onclick="answerMultiplayerQuestion(${option.index})">
      ${escapeHtml(option.text)}
    </button>`).join("");

  if (message) message.innerText = "Choose the correct answer to attack your opponent.";
  if (opponentStatus) opponentStatus.innerText = "🟢 Opponent is answering...";

  updateMultiplayerShieldUI();
}


// ==========================================
// MULTIPLAYER SHIELD
// ==========================================

function useMultiplayerShield() {
  if (!socket || !socket.connected) return;
  if (!multiplayerBattleStarted || multiplayerAnswered) return;
  if (multiplayerShield <= 0 || multiplayerShieldActive) return;

  socket.emit("use-shield", {
    roomCode: multiplayerRoomCode
  });
}


// ==========================================
// SHIELD RESULT
// ==========================================

function handleMultiplayerShieldUpdate(data) {
  if (!data) return;

  if (Array.isArray(data.players)) {
    updateMultiplayerPlayers(data.players);
  }

  const message = document.getElementById("mpMessage");
  if (data.socketId === socket?.id && message) {
    message.innerText = data.success
      ? "🛡️ Shield activated! It will absorb the next hit."
      : `⚠️ ${data.message || "Unable to use shield."}`;
  }

  updateMultiplayerShieldUI();
}


// ==========================================
// ROOM CODE INPUT SETUP
// ==========================================

function setupRoomCodeInput() {
  const roomInput = getRoomInput();
  if (!roomInput) return;

  roomInput.maxLength = 5;
  roomInput.minLength = 5;
  roomInput.autocomplete = "off";
  roomInput.style.textTransform = "uppercase";

  roomInput.addEventListener("input", () => {
    roomInput.value = roomInput.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);
  });
}


// ==========================================
// DOM LOADED
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
  fetchLeaderboard();
  setModeUI();
  setupRoomCodeInput();

  // Connect only when a multiplayer action is used.
  console.log("CyberQuest loaded successfully.");
});
