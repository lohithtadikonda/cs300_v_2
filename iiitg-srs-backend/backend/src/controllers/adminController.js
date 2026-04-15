const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function getSettings(req, res) {
  try {
    const result = await db.query('SELECT * FROM system_settings');
    const settings = {};

    result.rows.forEach(r => {
      settings[r.key] = r.value;
    });

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateSettings(req, res) {
  try {
    const { key, value } = req.body;

    await db.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value] // ✅ FIX: removed JSON.stringify
    );

    res.json({ message: 'Setting updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getAllUsers(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, roll_no, department, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, roll_no, department } = req.body;

    const hash = await bcrypt.hash(password || 'demo', 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, roll_no, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role`,
      [name, email, hash, role, roll_no, department]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getAllUsers,
  createUser
};