import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const db = new Database("moelife.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    food TEXT,
    foodOption TEXT,
    exercise TEXT,
    exerciseOption TEXT,
    feeling TEXT,
    feelingNote TEXT,
    feedback TEXT
  );
  CREATE TABLE IF NOT EXISTS weight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    weight REAL
  );
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    animal TEXT,
    personality TEXT,
    weightFrequency INTEGER
  );
  INSERT OR IGNORE INTO config (id, animal, personality, weightFrequency) VALUES (1, 'cat', 'happy', 7);
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM daily_logs ORDER BY date DESC").all();
    res.json(logs);
  });

  app.post("/api/logs", (req, res) => {
    const { date, food, foodOption, exercise, exerciseOption, feeling, feelingNote, feedback } = req.body;
    const stmt = db.prepare(`
      INSERT INTO daily_logs (date, food, foodOption, exercise, exerciseOption, feeling, feelingNote, feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        food=excluded.food,
        foodOption=excluded.foodOption,
        exercise=excluded.exercise,
        exerciseOption=excluded.exerciseOption,
        feeling=excluded.feeling,
        feelingNote=excluded.feelingNote,
        feedback=excluded.feedback
    `);
    stmt.run(date, food, foodOption, exercise, exerciseOption, feeling, feelingNote, feedback);
    res.json({ success: true });
  });

  app.get("/api/weight", (req, res) => {
    const weights = db.prepare("SELECT * FROM weight_logs ORDER BY date DESC").all();
    res.json(weights);
  });

  app.post("/api/weight", (req, res) => {
    const { date, weight } = req.body;
    const stmt = db.prepare(`
      INSERT INTO weight_logs (date, weight)
      VALUES (?, ?)
      ON CONFLICT(date) DO UPDATE SET weight=excluded.weight
    `);
    stmt.run(date, weight);
    res.json({ success: true });
  });

  app.get("/api/config", (req, res) => {
    const config = db.prepare("SELECT * FROM config WHERE id = 1").get();
    res.json(config);
  });

  app.post("/api/config", (req, res) => {
    const { animal, personality, weightFrequency } = req.body;
    const stmt = db.prepare(`
      UPDATE config SET animal = ?, personality = ?, weightFrequency = ? WHERE id = 1
    `);
    stmt.run(animal, personality, weightFrequency);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
