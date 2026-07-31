const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { all, run } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// ── Photo upload setup ────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    cb(null, 'profile-' + Date.now() + path.extname(file.originalname).toLowerCase());
  }
});
const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPG, PNG, WEBP, GIF).'), false);
    }
  }
});

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

// POST /api/settings/upload-photo - Upload profile photo (Admin)
router.post('/upload-photo', authenticateToken, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    const photoUrl = '/uploads/' + req.file.filename;
    await run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      ['photo_url', photoUrl, photoUrl]
    );
    res.json({ message: 'Photo uploaded successfully!', photoUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload photo.' });
  }
});

module.exports = router;


