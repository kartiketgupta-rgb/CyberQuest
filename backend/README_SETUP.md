# CyberQuest upgraded setup

1. Create/update the MySQL database by running `setup.sql`.
2. Run the seed script: `node seed_questions.js` (after `npm install`).
3. Put your Gemini key in `.env` as `GEMINI_API_KEY=...`. Never commit `.env`.
4. Start backend: `npm start`.
5. Open `frontend/index.html` with Live Server.

The question bank contains 1,200 seeded cybersecurity questions (300 each: easy, medium, hard, expert). Each game selects 5 from each tier and records the selected question IDs for the player.
