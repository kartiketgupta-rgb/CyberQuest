const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({
  origin: "*"
}));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});
app.use(express.json({ limit: "1mb" }));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "cybershield"
});

let cachedQuestions = [];

db.connect(err => {
  if (err) { console.log("DB Connection Error:", err); return; }
  console.log("DB Connected");
  const sql = `SELECT question_id, question_text, option1, option2, option3, option4, correct_option, difficulty FROM questions ORDER BY question_id`;
  db.query(sql, (err, result) => {
    if (err) { console.error("Error loading questions:", err); return; }
    cachedQuestions = result;
    console.log("Questions cached:", cachedQuestions.length);
  });
});

function pickQuestions(userId, callback) {

  const difficultyConfig = {
    easy: 7,
    medium: 8,
    hard: 5
  };

  const query = `
    SELECT q.*
    FROM questions q
    LEFT JOIN question_history h
      ON h.question_id = q.question_id
      AND h.user_id = ?
    WHERE h.question_id IS NULL
  `;

  db.query(query, [userId], (err, available) => {

    if (err) {
      console.error("Question selection error:", err);
      return callback(err);
    }

    const selected = [];

    for (const [difficulty, required] of Object.entries(difficultyConfig)) {

      const pool = available.filter(
        q => q.difficulty === difficulty
      );

      // Shuffle questions
      pool.sort(() => Math.random() - 0.5);

      // Check enough unused questions
      if (pool.length < required) {

        return callback(
          new Error(
            `Not enough unused ${difficulty} questions`
          )
        );
      }

      selected.push(...pool.slice(0, required));
    }

    // Easy → Medium → Hard
    selected.sort((a, b) => {

      const order = {
        easy: 1,
        medium: 2,
        hard: 3
      };

      return order[a.difficulty] - order[b.difficulty];

    });

    console.log(
      `Selected questions: ${selected.length} | Easy: 7 | Medium: 8 | Hard: 5`
    );

    callback(null, selected);
  });
}

app.get("/questions", (req,res) => {
  const userId = Number(req.query.userId) || null;
  pickQuestions(userId, (err, questions) => {
    if (err) return res.status(500).json({error:"Unable to load questions"});
    res.json(questions.map(q=>({
      id:q.question_id, q:q.question_text, options:[q.option1,q.option2,q.option3,q.option4], answer:q.correct_option-1, difficulty:q.difficulty
    })));
  });
});

app.post("/questions/played", (req,res)=>{
  const {userId, questionIds=[]}=req.body;
  if (!userId || !Array.isArray(questionIds) || !questionIds.length) return res.status(400).json({error:"userId and questionIds are required"});
  const values=questionIds.map(id=>[userId,id]);
  db.query("INSERT IGNORE INTO question_history (user_id, question_id) VALUES ?",[values],(err)=>{
    if(err) return res.status(500).json({error:"Unable to save question history"});
    res.json({success:true});
  });
});

app.post("/create-user",(req,res)=>{
  const {name}=req.body;
  if(!name) return res.status(400).json({error:"Name required"});
  db.query("INSERT INTO users (name) VALUES (?)",[name],(err,result)=>{
    if(err) return res.status(500).json({error:"Unable to create player"});
    res.json({userId:result.insertId});
  });
});

app.post("/save-score", (req,res)=>{
  const {userId,score}=req.body;
  db.query("INSERT INTO scores (user_id, score) VALUES (?, ?)",[userId,score],(err)=>{
    if(err) return res.status(500).send("Error saving score");
    res.send("Saved");
  });
});

app.get("/leaderboard",(req,res)=>{
  const sql=`SELECT users.name,scores.score FROM scores JOIN users ON users.user_id=scores.user_id ORDER BY score DESC LIMIT 5`;
  db.query(sql,(err,result)=>{ if(err) return res.status(500).json({error:"Unable to load leaderboard"}); res.json(result); });
});

app.get("/scores",(req,res)=>{
  const sql=`SELECT users.name,scores.score FROM scores JOIN users ON users.user_id=scores.user_id ORDER BY score DESC`;
  db.query(sql,(err,result)=>{ if(err) return res.status(500).json({error:"Unable to load scores"}); res.json(result); });
});

app.get("/user-scores/:userId",(req,res)=>{
  const sql=`SELECT scores.score,scores.date FROM scores WHERE scores.user_id=? ORDER BY scores.date DESC`;
  db.query(sql,[req.params.userId],(err,result)=>{ if(err) return res.status(500).json({error:"Unable to load scores"}); res.json(result); });
});

app.post("/api/chat", async (req,res)=>{
  try {
    const {message,history=[]}=req.body;
    if(!message) return res.status(400).json({error:"Message is required"});
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,{
      method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:`You are CyberShield AI — a friendly, sharp cybersecurity expert built into CyberQuest. Keep responses 2-4 sentences unless asked for more, use simple language and 1-2 emojis. For malicious hacking requests, redirect to defensive learning. Cover phishing, malware, ransomware, passwords, MFA, VPNs, firewalls, encryption, privacy, web and network security.`}]},
        contents:[...history,{role:"user",parts:[{text:message}]}],generationConfig:{maxOutputTokens:350,temperature:.75}
      })
    });
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data.error?.message||"Gemini API error"});
    res.json({reply:data.candidates?.[0]?.content?.parts?.[0]?.text||"Something went wrong. Try again! 🔄"});
  } catch(error){ console.error("Gemini error:",error); res.status(500).json({error:"Failed to connect to Gemini"}); }
});

// ==========================================
// MULTIPLAYER - 1V1 CYBER BATTLE
// ==========================================

const rooms = new Map();

// Create a database user for multiplayer scoring.
function createMultiplayerUser(name, callback) {
  db.query("INSERT INTO users (name) VALUES (?)", [name], (err, result) => {
    if (err) {
      console.error("Multiplayer user creation error:", err);
      return callback(err);
    }
    callback(null, result.insertId);
  });
}

function saveMultiplayerScores(room) {
  if (!room || room.scoreSaved) return;
  room.scoreSaved = true;

  const values = room.players
    .filter(player => player.userId)
    .map(player => [player.userId, player.score]);

  if (!values.length) return;

  db.query("INSERT INTO scores (user_id, score) VALUES ?", [values], err => {
    if (err) {
      room.scoreSaved = false;
      console.error("Multiplayer score save error:", err);
      return;
    }
    console.log(`🏅 Multiplayer scores saved for ${values.length} players.`);
  });
}

function createRoomCode() {
  let roomCode;
  do {
    roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  } while (rooms.has(roomCode));
  return roomCode;
}

function publicPlayers(room) {
  return room.players.map(player => ({
    socketId: player.socketId,
    name: player.name,
    health: player.health,
    score: player.score,
    shield: player.shield,
    shieldActive: player.shieldActive
  }));
}

function sendCurrentQuestion(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.status !== "playing") return;

  const question = room.questions[room.questionIndex];

  if (!question) {
    finishMultiplayerBattle(roomCode);
    return;
  }

  room.answeredPlayers = new Set();

  io.to(roomCode).emit("new-question", {
    questionNumber: room.questionIndex + 1,
    totalQuestions: room.questions.length,
    question: {
      id: question.question_id,
      text: question.question_text,
      options: [
        question.option1,
        question.option2,
        question.option3,
        question.option4
      ],
      difficulty: question.difficulty
    }
  });

  console.log(`Question ${room.questionIndex + 1}/20 sent to room ${roomCode}`);
}

function finishMultiplayerBattle(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.status === "finished") return;

  room.status = "finished";

  clearTimeout(room.nextQuestionTimer);
  saveMultiplayerScores(room);

  let winner = null;
  let draw = false;

  const p1 = room.players[0];
  const p2 = room.players[1];

  if (p1 && p2) {
    if (p1.health > p2.health || (p1.health === p2.health && p1.score > p2.score)) {
      winner = p1;
    } else if (p2.health > p1.health || (p1.health === p2.health && p2.score > p1.score)) {
      winner = p2;
    } else {
      draw = true;
    }
  }

  io.to(roomCode).emit("battle-finished", {
    winner: winner ? {
      socketId: winner.socketId,
      name: winner.name
    } : null,
    draw,
    players: publicPlayers(room)
  });

  console.log(`🏆 Battle finished in room ${roomCode}`);
}


io.on("connection", socket => {
  console.log("Multiplayer connected:", socket.id);

  // ========================================
  // CREATE ROOM
  // ========================================

  socket.on("create-room", ({ playerName }) => {
    const name = String(playerName || "").trim().slice(0, 30);
    if (!name) {
      socket.emit("room-error", { message: "Player name is required." });
      return;
    }

    createMultiplayerUser(name, (err, userId) => {
      if (err) {
        socket.emit("room-error", { message: "Unable to create player." });
        return;
      }

      const roomCode = createRoomCode();

      rooms.set(roomCode, {
        players: [{
          socketId: socket.id,
          userId,
          name,
          health: 100,
          score: 0,
          shield: 3,
          shieldActive: false,
          rematchReady: false
        }],
        status: "waiting",
        questions: [],
        questionIndex: 0,
        answeredPlayers: new Set(),
        nextQuestionTimer: null,
        scoreSaved: false
      });

      socket.join(roomCode);

      socket.emit("room-created", {
        roomCode,
        playerName: name
      });

      console.log(`🏠 Room ${roomCode} created by ${name}`);
    });
  });


  // ========================================
  // JOIN ROOM
  // ========================================

  socket.on("join-room", ({ roomCode, playerName }) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const name = String(playerName || "").trim().slice(0, 30);

    if (!code || !name) {
      socket.emit("room-error", { message: "Room code and player name are required." });
      return;
    }

    const room = rooms.get(code);

    if (!room) {
      socket.emit("room-error", { message: "Room not found." });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("room-error", { message: "Room is already full." });
      return;
    }

    if (room.status !== "waiting") {
      socket.emit("room-error", { message: "Battle has already started." });
      return;
    }

    createMultiplayerUser(name, (err, userId) => {
      if (err) {
        socket.emit("room-error", { message: "Unable to create player." });
        return;
      }

      room.players.push({
        socketId: socket.id,
        userId,
        name,
        health: 100,
        score: 0,
        shield: 3,
        shieldActive: false,
        rematchReady: false
      });

      socket.join(code);

      io.to(code).emit("player-joined", {
        players: publicPlayers(room)
      });

      console.log(`⚔️ ${name} joined room ${code}`);
    });
  });


  // ========================================
  // START BATTLE
  // ========================================

  socket.on("start-battle", ({ roomCode }) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit("room-error", { message: "Room not found." });
      return;
    }

    if (!room.players.some(player => player.socketId === socket.id)) {
      socket.emit("room-error", { message: "You are not a member of this room." });
      return;
    }

    if (room.players.length !== 2) {
      socket.emit("room-error", { message: "Waiting for both players." });
      return;
    }

    if (room.status === "playing") return;

    if (cachedQuestions.length < 20) {
      socket.emit("room-error", { message: "Not enough questions available." });
      return;
    }

    const questionPool = [...cachedQuestions];
    questionPool.sort(() => Math.random() - 0.5);

    // Prefer the same difficulty balance as single player when the database allows it.
    const difficultyConfig = { easy: 7, medium: 8, hard: 5 };
    const balanced = [];
    const usedIds = new Set();

    for (const [difficulty, required] of Object.entries(difficultyConfig)) {
      const pool = questionPool.filter(q => q.difficulty === difficulty && !usedIds.has(q.question_id));
      for (const question of pool.slice(0, required)) {
        balanced.push(question);
        usedIds.add(question.question_id);
      }
    }

    if (balanced.length === 20) {
      room.questions = balanced;
    } else {
      room.questions = questionPool.slice(0, 20);
    }

    room.questionIndex = 0;
    room.answeredPlayers = new Set();
    room.status = "playing";
    room.nextQuestionTimer = null;

    room.players.forEach(player => {
      player.health = 100;
      player.score = 0;
      player.shield = 3;
      player.shieldActive = false;
      player.rematchReady = false;
    });
    room.scoreSaved = false;

    console.log(`⚡ Battle started in room ${code}`);

    io.to(code).emit("battle-started", {
      roomCode: code,
      players: publicPlayers(room)
    });

    setTimeout(() => sendCurrentQuestion(code), 500);
  });


  // ========================================
  // USE SHIELD
  // ========================================

  socket.on("use-shield", ({ roomCode }) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const room = rooms.get(code);

    if (!room || room.status !== "playing") return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (player.shield <= 0) {
      socket.emit("shield-update", {
        socketId: socket.id,
        success: false,
        message: "No shields left.",
        players: publicPlayers(room)
      });
      return;
    }

    if (player.shieldActive) {
      socket.emit("shield-update", {
        socketId: socket.id,
        success: false,
        message: "Shield is already active.",
        players: publicPlayers(room)
      });
      return;
    }

    player.shield--;
    player.shieldActive = true;

    io.to(code).emit("shield-update", {
      socketId: socket.id,
      success: true,
      message: `${player.name} activated a shield.`,
      players: publicPlayers(room)
    });
  });


  // ========================================
  // PLAYER ANSWER
  // ========================================

  socket.on("answer-question", ({ roomCode, answer }) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const room = rooms.get(code);

    if (!room || room.status !== "playing") return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (room.answeredPlayers.has(socket.id)) return;

    const question = room.questions[room.questionIndex];
    if (!question) return;

    room.answeredPlayers.add(socket.id);

    const correctAnswer = Number(question.correct_option) - 1;
    const selectedAnswer = Number(answer);
    const isCorrect = selectedAnswer === correctAnswer;

    let damageBlocked = false;
    let attackTarget = null;

    if (isCorrect) {
      player.score += 10;

      const opponent = room.players.find(p => p.socketId !== socket.id);
      attackTarget = opponent || null;

      if (opponent) {
        if (opponent.shieldActive) {
          opponent.shieldActive = false;
          damageBlocked = true;
        } else {
          opponent.health = Math.max(0, opponent.health - 20);
        }
      }
    } else {
      if (player.shieldActive) {
        player.shieldActive = false;
        damageBlocked = true;
      } else {
        player.health = Math.max(0, player.health - 20);
      }
    }

    io.to(code).emit("answer-result", {
      socketId: socket.id,
      correct: isCorrect,
      damageBlocked,
      message: isCorrect
        ? (damageBlocked ? `🛡️ ${player.name}'s attack was blocked!` : `⚔️ ${player.name} attacked!`)
        : (damageBlocked ? `🛡️ ${player.name}'s shield absorbed the damage!` : `💥 ${player.name} took damage!`),
      players: publicPlayers(room)
    });

    const deadPlayer = room.players.find(p => p.health <= 0);
    if (deadPlayer) {
      finishMultiplayerBattle(code);
      return;
    }

    if (room.answeredPlayers.size === 2) {
      room.answeredPlayers = new Set();
      room.questionIndex++;

      if (room.questionIndex >= room.questions.length) {
        finishMultiplayerBattle(code);
        return;
      }

      clearTimeout(room.nextQuestionTimer);
      room.nextQuestionTimer = setTimeout(() => {
        sendCurrentQuestion(code);
      }, 1000);
    }
  });


  // ========================================
  // REMATCH
  // ========================================

  socket.on("rematch-request", ({ roomCode }) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room || room.status !== "finished") return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    player.rematchReady = true;

    io.to(code).emit("rematch-status", {
      players: publicPlayers(room),
      readyCount: room.players.filter(p => p.rematchReady).length
    });

    if (room.players.length === 2 && room.players.every(p => p.rematchReady)) {
      room.status = "waiting";
      room.questions = [];
      room.questionIndex = 0;
      room.answeredPlayers = new Set();
      room.nextQuestionTimer = null;

      room.players.forEach(p => {
        p.health = 100;
        p.score = 0;
        p.shield = 3;
        p.shieldActive = false;
        p.rematchReady = false;
      });

      io.to(code).emit("rematch-ready", {
        roomCode: code,
        players: publicPlayers(room)
      });

      console.log(`🔄 Rematch ready in room ${code}`);
    }
  });

  // ========================================
  // DISCONNECT
  // ========================================

  socket.on("disconnect", () => {
    console.log("Multiplayer disconnected:", socket.id);

    for (const [roomCode, room] of rooms) {
      const playerIndex = room.players.findIndex(
        player => player.socketId === socket.id
      );

      if (playerIndex === -1) continue;

      room.players.splice(playerIndex, 1);
      clearTimeout(room.nextQuestionTimer);

      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`🗑️ Room ${roomCode} deleted`);
      } else {
        room.status = "waiting";
        io.to(roomCode).emit("player-left");
        console.log(`⚠️ Player left room ${roomCode}`);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on 3000");
});
