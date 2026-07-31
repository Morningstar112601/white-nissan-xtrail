const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const { initDb } = require('./database/db');
const seedDb = require('./database/seed');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const skillRoutes = require('./routes/skills');
const experienceRoutes = require('./routes/experience');
const contactRoutes = require('./routes/contact');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static directories
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve root static site files
app.use(express.static(__dirname));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);

// Fallback route for Admin Single Page App
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await initDb();
    await seedDb();
    
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Jericho Falsario's Portfolio Server running!`);
      console.log(`🌐 Public Website:  http://localhost:${PORT}`);
      console.log(`🔐 Admin Control:   http://localhost:${PORT}/admin`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start portfolio server:', error);
  }
}

startServer();
