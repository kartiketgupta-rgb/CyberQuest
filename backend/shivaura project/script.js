let levels = [];
let index = 0;
let health = 100;
let time = 15;
let timer;

let shield = 3;
let shieldActive = false;
let shieldUsed = 0;
let playerName = "";
let userId = null;

// 🔥 Fetch questions from DB
fetch("https://cyberquest-9ig4.onrender.com/questions")
  .then(res => res.json())
  .then(data => {
    // Filter out duplicate questions based on question_text
    const uniqueQuestions = [];
    const seenQuestions = new Set();
    
    data.forEach(q => {
      if (!seenQuestions.has(q.question_text)) {
        seenQuestions.add(q.question_text);
        uniqueQuestions.push({
          q: q.question_text,
          options: [q.option1, q.option2, q.option3, q.option4],
          answer: q.correct_option - 1
        });
      }
    });
    
    levels = uniqueQuestions;
    
    // Shuffle questions to randomize order
    shuffleArray(levels);
    console.log("Unique Questions Loaded and Shuffled:", levels.length, "questions");
  });

// Function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 🚀 Start Game
function startGame() {
  const nameInput = document.getElementById("playerName");
  playerName = nameInput.value.trim();

  if (!playerName) {
    document.getElementById("message").innerText = "Please enter your name to begin.";
    return;
  }

  if (!levels.length) {
    document.getElementById("message").innerText = "Questions are still loading. Please wait a moment.";
    return;
  }

  // Reset game state
  resetGame();

  fetch("https://cyberquest-9ig4.onrender.com/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: playerName })
  })
    .then(res => res.json())
    .then(data => {
      userId = data.userId;
      document.getElementById("playerGreeting").innerText = `Welcome, ${playerName}!`;
      document.getElementById("playerGreeting").style.display = "block";
      document.getElementById("startBtn").style.display = "none";
      nameInput.style.display = "none";
      document.getElementById("gameControls").style.display = "flex";
      document.getElementById("question").style.display = "block";
      document.getElementById("options").style.display = "block";

      loadQuestion();
    })
    .catch(() => {
      document.getElementById("message").innerText = "Unable to create player profile. Check the backend server.";
    });
}

// Reset game state function
function resetGame() {
  index = 0;
  health = 100;
  time = 15;
  shield = 3;
  shieldActive = false;
  shieldUsed = 0;
  clearInterval(timer);
  
  // Shuffle questions for randomization each game
  if (levels.length > 0) {
    shuffleArray(levels);
  }
  
  // Reset UI elements
  document.getElementById("health").innerText = health;
  document.getElementById("time").innerText = time;
  document.getElementById("shield").innerText = shield;
  document.getElementById("shieldUsed").innerText = shieldUsed;
  document.getElementById("level").innerText = "1";
  document.getElementById("message").innerText = "";
}

// 📌 Load Question
function loadQuestion() {
  // Safety check to prevent accessing invalid indices
  if (index >= levels.length) {
    winGame();
    return;
  }

  document.getElementById("question").innerText = levels[index].q;
  document.getElementById("level").innerText = index + 1;
  document.getElementById("message").innerText = "";

  let html = "";
  levels[index].options.forEach((opt, i) => {
    html += `<button onclick="checkAnswer(${i})">${opt}</button>`;
  });

  document.getElementById("options").innerHTML = html;
  startTimer();
}

// ⏱ Timer
function startTimer() {
  clearInterval(timer);
  time = 15;
  document.getElementById("time").innerText = time;

  timer = setInterval(() => {
    time--;
    document.getElementById("time").innerText = time;

    if (time === 0) {
      clearInterval(timer);
      damage();
    }
  }, 1000);
}

// ✅ Check Answer
function checkAnswer(choice) {
  clearInterval(timer);

  if (choice === levels[index].answer) {
    document.getElementById("message").innerText = "✅ Attack Blocked!";
    next();
  } else {
    damage();
  }
}

// 🛡 Shield
function useShield() {
  if (shield > 0 && !shieldActive) {
    shieldActive = true;
    shield--;
    shieldUsed++;
    document.getElementById("shield").innerText = shield;
    document.getElementById("shieldUsed").innerText = shieldUsed;
    document.getElementById("message").innerText = "🛡️ Shield Activated!";
  } else {
    document.getElementById("message").innerText = "❌ No Shield Left!";
  }
}

// 💥 Damage
function damage() {
  if (shieldActive) {
    shieldActive = false;
    document.getElementById("message").innerText = "🛡️ Shield Protected You!";
    next();
    return;
  }

  health -= 20;
  document.getElementById("health").innerText = health;
  document.getElementById("message").innerText = "❌ System Damaged!";

  if (health <= 0) {
    gameOver();
  } else {
    next();
  }
}

// ➡ Next Question
function next() {
  setTimeout(() => {
    index++;
    if (index < levels.length) {
      loadQuestion();
    } else {
      winGame();
    }
  }, 800);
}

function saveScore() {
  if (!userId) return;
  const score = health;
  fetch("https://cyberquest-9ig4.onrender.com/save-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, score })
  })
    .then(() => console.log("Score saved", { userId, score }))
    .catch(err => console.error("Score save failed", err));
}

function showLeaderboard() {
  const leaderboardSection = document.getElementById("leaderboardSection");
  if (leaderboardSection) {
    leaderboardSection.style.display = "block";
  }
  fetchLeaderboard();
}

function fetchLeaderboard() {
  fetch("https://cyberquest-9ig4.onrender.com/scores")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#leaderboardTable tbody");
      if (!tbody) return;

      tbody.innerHTML = data.map(row => `
        <tr>
          <td>${row.name}</td>
          <td>${row.score}</td>
        </tr>
      `).join("");
    })
    .catch(err => {
      document.getElementById("message").innerText = "Unable to load leaderboard.";
      console.error(err);
    });
}

function showUserScoreboard() {
  if (!userId) return;
  
  fetch(`https://cyberquest-9ig4.onrender.com/user-scores/${userId}`)
    .then(res => res.json())
    .then(scores => {
      const scoreboardHTML = `
        <div class="scoreboard">
          <h2>Your Scoreboard</h2>
          <div class="current-score">
            <h3>Latest Score: ${health}%</h3>
          </div>
          <div class="previous-scores">
            <h3>Previous Scores:</h3>
            ${scores.length > 1 ? 
              `<table class="user-scores-table">
                <thead>
                  <tr><th>Score</th><th>Date</th></tr>
                </thead>
                <tbody>
                  ${scores.slice(1).map(score => `
                    <tr>
                      <td>${score.score}%</td>
                      <td>${new Date(score.date).toLocaleDateString()}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>` : 
              "<p>No previous scores yet.</p>"
            }
          </div>
          <div class="scoreboard-buttons">
            <button onclick="showLeaderboard()">View Global Leaderboard</button>
            <button onclick="location.reload()">Play Again</button>
          </div>
        </div>
      `;
      
      document.querySelector(".game-container").innerHTML = scoreboardHTML;
    })
    .catch(err => {
      console.error("Failed to load user scores:", err);
      // Fallback to basic end screen
      document.querySelector(".game-container").innerHTML = `
        <h1>🏆 YOU SAVED THE SYSTEM!</h1>
        <p>Final Health: ${health}%</p>
        <p>Score saved for ${playerName}</p>
        <button onclick="showLeaderboard()">View Leaderboard</button>
        <button onclick="location.reload()">Play Again</button>
      `;
    });
}

// 🏆 Win
function winGame() {
  saveScore();
  setTimeout(() => {
    showUserScoreboard();
  }, 1000);
}

// 💀 Game Over
function gameOver() {
  saveScore();
  setTimeout(() => {
    showUserScoreboard();
  }, 1000);
}