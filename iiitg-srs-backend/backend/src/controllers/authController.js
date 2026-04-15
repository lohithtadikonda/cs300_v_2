const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function login(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ FIX: use password_hash instead of password
    if (user.password_hash) {
      if (user.password_hash !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      // fallback (demo users)
      if (password !== "demo") {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    return res.json({
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNo: user.roll_no,
        department: user.department
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { login };