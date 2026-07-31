const express = require('express');
const router = express.Router();
const { all, run } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/settings - Public site settings
router.get('/', async (req, res) => {
  try {
    const rows = await all('SELECT key, value FROM settings');
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.key] = r.value;
    });
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch site settings.' });
  }
});

// PUT /api/settings - Update site settings (Admin)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const settingsObj = req.body; // e.g. { name: '...', hero_headline: '...' }
    for (const [key, value] of Object.entries(settingsObj)) {
      await run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'Settings saved successfully.' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

module.exports = router;
