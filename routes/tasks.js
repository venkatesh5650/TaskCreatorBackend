const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const db = new sqlite3.Database("./agh_tasks.db");

// ================= GET ALL TASKS (Manager only) =================
// GET /tasks
router.get("/", authMiddleware, (req, res) => {
  let query;
  let params = [];

  if (req.user.role === "manager") {
    // Manager sees all tasks
    query = `SELECT * FROM tasks`;
  } else {
    // Intern sees only their tasks
    query = `SELECT * FROM tasks WHERE assignedUserId = ?`;
    params = [req.user.id];
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ================= GET USER-SPECIFIC TASKS =================
router.get("/user/:id", authMiddleware, (req, res) => {
  const userId = req.params.id;

  // Interns can only view their own tasks
  if (req.user.role === "intern" && req.user.id != userId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const query = `SELECT * FROM tasks WHERE assignedUserId = ?`;
  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ================= CREATE TASK =================
router.post("/create", authMiddleware, (req, res) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ error: "Only managers can create tasks" });
  }

  const { title, description, deadline, assignedUserId } = req.body;

  const query = `INSERT INTO tasks (title, description, deadline, status, assignedUserId) 
                 VALUES (?,?,?,?,?)`;

  db.run(
    query,
    [title, description, deadline, "To Do", assignedUserId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Task created successfully", taskId: this.lastID });
    }
  );
});

// ================= UPDATE TASK =================
// PUT /tasks/:id/status
// ================= UPDATE TASK STATUS =================
// PUT /tasks/:id/status
router.put("/:id/status", authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const { status } = req.body;

  // Get the task first
  const query = `SELECT * FROM tasks WHERE id = ?`;
  db.get(query, [taskId], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (req.user.role === "manager") {
      // Manager can update any task
      const updateQuery = `UPDATE tasks SET status = ? WHERE id = ?`;
      db.run(updateQuery, [status, taskId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Task status updated by manager" });
      });
    } else if (req.user.role === "intern") {
      // Intern can update only their assigned task
      if (task.assignedUserId !== req.user.id) {
        return res.status(403).json({ error: "Access denied: Not your task" });
      }

      const updateQuery = `UPDATE tasks SET status = ? WHERE id = ?`;
      db.run(updateQuery, [status, taskId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Task status updated by intern" });
      });
    } else {
      res.status(403).json({ error: "Unauthorized role" });
    }
  });
});

// ================= DELETE TASK =================
router.delete("/delete/:id", authMiddleware, (req, res) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ error: "Only managers can delete tasks" });
  }

  const taskId = req.params.id;

  const query = `DELETE FROM tasks WHERE id = ?`;
  db.run(query, [taskId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Task deleted successfully" });
  });
});

// ================= GET ALL INTERNS (Manager only) =================
router.get("/interns", authMiddleware, (req, res) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ error: "Only managers can view interns" });
  }

  const query = `SELECT id, name, email FROM users WHERE role = 'intern'`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
