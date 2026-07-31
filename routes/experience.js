const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { all, get, run } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Multer storage for Resume PDF upload
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    cb(null, 'resume-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume uploads!'), false);
    }
  }
});

// GET /api/experience - Public list
router.get('/', async (req, res) => {
  try {
    const experiences = await all('SELECT * FROM experiences ORDER BY display_order ASC, start_date DESC');
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiences.' });
  }
});

// GET /api/experience/download-resume - Stream/Download PDF with custom date filename
router.get('/download-resume', async (req, res) => {
  try {
    const settingsRows = await all('SELECT key, value FROM settings');
    const settingsMap = {};
    settingsRows.forEach(r => settingsMap[r.key] = r.value);

    const resumePathRelative = settingsMap.resume_url || '';
    if (!resumePathRelative) {
      return res.status(404).send('No resume uploaded yet.');
    }

    const fullPath = path.join(__dirname, '..', resumePathRelative);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('Resume file not found on server.');
    }

    const todayStr = new Date().toISOString().split('T')[0]; // "2026-07-31"
    const authorName = settingsMap.name || 'Jericho Falsario';
    const downloadFileName = `${authorName}_Resume_${todayStr}.pdf`;

    res.download(fullPath, downloadFileName);
  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).send('Error downloading resume.');
  }
});

// POST /api/experience - Create (Admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, title, organization, location, start_date, end_date, description, display_order } = req.body;
    if (!title || !organization) {
      return res.status(400).json({ error: 'Title and organization are required.' });
    }

    const result = await run(
      'INSERT INTO experiences (type, title, organization, location, start_date, end_date, description, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [type || 'work', title, organization, location || '', start_date || '', end_date || '', description || '', display_order || 0]
    );

    const newExp = await get('SELECT * FROM experiences WHERE id = ?', [result.lastID]);
    res.status(201).json(newExp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experience.' });
  }
});

// PUT /api/experience/:id - Update (Admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, organization, location, start_date, end_date, description, display_order } = req.body;

    await run(
      'UPDATE experiences SET type = ?, title = ?, organization = ?, location = ?, start_date = ?, end_date = ?, description = ?, display_order = ? WHERE id = ?',
      [type || 'work', title, organization, location || '', start_date || '', end_date || '', description || '', display_order || 0, id]
    );

    const updated = await get('SELECT * FROM experiences WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experience.' });
  }
});

// DELETE /api/experience/:id - Delete (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM experiences WHERE id = ?', [id]);
    res.json({ message: 'Experience item deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experience.' });
  }
});

// POST /api/experience/upload-resume - Upload Resume PDF (Admin)
router.post('/upload-resume', authenticateToken, uploadResume.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF resume file provided.' });
    }

    const resumeUrl = '/uploads/' + req.file.filename;
    
    // Save to settings table under key 'resume_url'
    await run('INSERT INTO settings (key, value) VALUES (?, ?)', ['resume_url', resumeUrl]);

    res.json({ message: 'Resume uploaded successfully!', resumeUrl });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload resume.' });
  }
});

module.exports = router;
