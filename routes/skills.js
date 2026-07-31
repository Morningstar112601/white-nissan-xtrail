const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/skills - Public list
router.get('/', async (req, res) => {
  try {
    const skills = await all('SELECT * FROM skills ORDER BY display_order ASC, category ASC');
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills.' });
  }
});

// POST /api/skills - Create skill (Admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, name, percentage, display_order } = req.body;
    if (!category || !name || percentage === undefined) {
      return res.status(400).json({ error: 'Category, name, and percentage are required.' });
    }

    const result = await run(
      'INSERT INTO skills (category, name, percentage, display_order) VALUES (?, ?, ?, ?)',
      [category, name, percentage, display_order || 0]
    );

    const newSkill = await get('SELECT * FROM skills WHERE id = ?', [result.lastID]);
    res.status(201).json(newSkill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create skill.' });
  }
});

// PUT /api/skills/:id - Update skill (Admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name, percentage, display_order } = req.body;

    await run(
      'UPDATE skills SET category = ?, name = ?, percentage = ?, display_order = ? WHERE id = ?',
      [category, name, percentage, display_order || 0, id]
    );

    const updated = await get('SELECT * FROM skills WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update skill.' });
  }
});

// DELETE /api/skills/:id - Delete skill (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM skills WHERE id = ?', [id]);
    res.json({ message: 'Skill deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
});

module.exports = router;
