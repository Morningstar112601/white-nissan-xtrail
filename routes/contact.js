const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/contact - Public contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message content are required.' });
    }

    const result = await run(
      'INSERT INTO messages (sender_name, sender_email, subject, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), (subject || 'General Inquiry').trim(), message.trim()]
    );

    res.status(201).json({ message: 'Thank you! Your message has been sent successfully.' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// GET /api/contact - Admin Inbox List
router.get('/', authenticateToken, async (req, res) => {
  try {
    const messages = await all('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
});

// PUT /api/contact/:id/read - Mark as Read (Admin)
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('UPDATE messages SET is_read = 1 WHERE id = ?', [id]);
    res.json({ message: 'Message marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

// DELETE /api/contact/:id - Delete Message (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ message: 'Message deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

module.exports = router;
