const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./agh_tasks.db", (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("✅ SQLite DB Connected");
});

// Users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('manager','intern')) NOT NULL
)`);

// Tasks table
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('To Do','In Progress','Done')) DEFAULT 'To Do',
  deadline TEXT,
  assignedUserId INTEGER,
  FOREIGN KEY (assignedUserId) REFERENCES users(id)
)`);

module.exports = db;
