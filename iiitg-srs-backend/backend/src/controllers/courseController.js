const db = require('../config/db');

async function getAllCourses(req, res) {
  try {
    const result = await db.query('SELECT * FROM courses WHERE is_active = true ORDER BY department, semester, code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function createCourse(req, res) {
  try {
    const { code, name, credits, department, semester } = req.body;
    const result = await db.query(
      'INSERT INTO courses (code, name, credits, department, semester) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [code, name, credits, department, semester]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Course code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const { code, name, credits, department, semester, is_active } = req.body;
    const result = await db.query(
      'UPDATE courses SET code=$1, name=$2, credits=$3, department=$4, semester=$5, is_active=$6 WHERE id=$7 RETURNING *',
      [code, name, credits, department, semester, is_active, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteCourse(req, res) {
  try {
    await db.query('UPDATE courses SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Course deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAllCourses, createCourse, updateCourse, deleteCourse };
