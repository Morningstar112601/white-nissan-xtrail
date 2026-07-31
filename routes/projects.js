const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { all, get, run } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Configure Multer for multiple project images
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/projects - Public list
router.get('/', async (req, res) => {
  try {
    const projects = await all('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
    // Normalize image list for each project
    const normalized = projects.map(p => {
      let imagesList = [];
      if (p.images) {
        try {
          imagesList = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        } catch(e) {
          imagesList = p.images.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (p.image_url) {
        imagesList = [p.image_url];
      }
      return {
        ...p,
        images: imagesList,
        image_url: imagesList[0] || 'assets/images/default-project.jpg'
      };
    });
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// GET /api/projects/:id - Single project
router.get('/:id', async (req, res) => {
  try {
    const project = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    
    let imagesList = [];
    if (project.images) {
      try {
        imagesList = typeof project.images === 'string' ? JSON.parse(project.images) : project.images;
      } catch(e) {
        imagesList = project.images.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (project.image_url) {
      imagesList = [project.image_url];
    }
    
    res.json({
      ...project,
      images: imagesList,
      image_url: imagesList[0] || 'assets/images/default-project.jpg'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// POST /api/projects - Create project (Admin) with multiple images
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, detailed_desc, tags, live_url, github_url, is_featured, display_order } = req.body;
    let uploadedImages = [];

    if (req.files && req.files.length) {
      uploadedImages = req.files.map(f => '/uploads/' + f.filename);
    }
    
    // Also include any manually entered URLs
    if (req.body.image_urls) {
      const extraUrls = String(req.body.image_urls).split(',').map(u => u.trim()).filter(Boolean);
      uploadedImages = [...uploadedImages, ...extraUrls];
    }

    if (uploadedImages.length === 0 && req.body.image_url) {
      uploadedImages = [req.body.image_url];
    }

    const primaryImage = uploadedImages[0] || '';
    const imagesJson = JSON.stringify(uploadedImages);

    const result = await run(
      `INSERT INTO projects (title, description, detailed_desc, image_url, images, tags, live_url, github_url, is_featured, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        detailed_desc || '',
        primaryImage,
        imagesJson,
        tags || '',
        live_url || '#',
        github_url || '#',
        is_featured ? 1 : 0,
        display_order || 0
      ]
    );

    const newProject = await get('SELECT * FROM projects WHERE id = ?', [result.lastID]);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id - Update project (Admin) with multiple images
router.put('/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Project not found.' });

    const { title, description, detailed_desc, tags, live_url, github_url, is_featured, display_order } = req.body;
    
    let existingImages = [];
    if (existing.images) {
      try { existingImages = JSON.parse(existing.images); } catch(e) {}
    } else if (existing.image_url) {
      existingImages = [existing.image_url];
    }

    let newUploadedImages = [];
    if (req.files && req.files.length) {
      newUploadedImages = req.files.map(f => '/uploads/' + f.filename);
    }

    if (req.body.image_urls) {
      const extraUrls = String(req.body.image_urls).split(',').map(u => u.trim()).filter(Boolean);
      newUploadedImages = [...newUploadedImages, ...extraUrls];
    }

    const finalImages = newUploadedImages.length ? newUploadedImages : existingImages;
    const primaryImage = finalImages[0] || existing.image_url;
    const imagesJson = JSON.stringify(finalImages);

    await run(
      `UPDATE projects 
       SET title = ?, description = ?, detailed_desc = ?, image_url = ?, images = ?, tags = ?, live_url = ?, github_url = ?, is_featured = ?, display_order = ?
       WHERE id = ?`,
      [
        title || existing.title,
        description || existing.description,
        detailed_desc !== undefined ? detailed_desc : existing.detailed_desc,
        primaryImage,
        imagesJson,
        tags !== undefined ? tags : existing.tags,
        live_url !== undefined ? live_url : existing.live_url,
        github_url !== undefined ? github_url : existing.github_url,
        is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
        display_order !== undefined ? display_order : existing.display_order,
        id
      ]
    );

    const updated = await get('SELECT * FROM projects WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id - Delete project (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
