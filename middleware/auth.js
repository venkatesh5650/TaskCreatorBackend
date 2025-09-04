// middleware/auth.js

const jwt = require("jsonwebtoken");
require("dotenv").config();

function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]; // expects "Bearer <token>"

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  const jwtToken = token.split(" ")[1]; // remove "Bearer "

  try {
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.user = decoded; // attach user data {id, role}
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
