const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../db/init');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const {
  completeAuthorization,
  getAuthorizationUrl,
  isKeycloakEnabled
} = require('../utils/keycloak');

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Try again later.' }
});

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../data/uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Login endpoint
router.get('/login', authRateLimit, async (req, res, next) => {
  if (!isKeycloakEnabled()) {
    return res.status(404).json({ error: 'Keycloak login is not configured' });
  }

  try {
    const { url, state } = await getAuthorizationUrl();
    const secure = process.env.KEYCLOAK_CALLBACK_URL.startsWith('https://');
    res.cookie('keycloak_state', state, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/admin/callback',
      maxAge: 10 * 60 * 1000
    });
    res.redirect(url);
  } catch (err) {
    next(err);
  }
});

router.get('/callback', authRateLimit, async (req, res, next) => {
  const cookieOptions = {
    httpOnly: true,
    secure: (process.env.KEYCLOAK_CALLBACK_URL || '').startsWith('https://'),
    sameSite: 'lax',
    path: '/api/admin/callback'
  };
  try {
    const user = await completeAuthorization(req);
    const token = generateToken(user.id, user.username, 'keycloak');
    res.clearCookie('keycloak_state', cookieOptions);
    res.redirect(`/admin#token=${encodeURIComponent(token)}`);
  } catch (err) {
    res.clearCookie('keycloak_state', cookieOptions);
    if (err.message === 'User is not a member of an allowed Keycloak group') {
      return res.status(403).send('You are not allowed to access this application.');
    }
    next(err);
  }
});

router.get('/auth/config', (req, res) => {
  res.json({ keycloakEnabled: isKeycloakEnabled() });
});

router.post('/login', authRateLimit, (req, res) => {
  if (isKeycloakEnabled()) {
    return res.status(403).json({ error: 'Sign in through Keycloak' });
  }

  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const db = getDb();
  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id, user.username);
    res.json({ token, userId: user.id });
  });
});

// List all posts
router.get('/posts', authenticateToken, (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  
  db.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    db.get('SELECT COUNT(*) as count FROM posts', (err, countRow) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        posts: rows,
        total: countRow.count,
        page,
        pageSize: limit
      });
    });
  });
});

// Get single post
router.get('/posts/:id', authenticateToken, (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(row);
  });
});

// Create post
router.post('/posts', authenticateToken, upload.single('image'), (req, res) => {
  const { title, content, startTime, endTime } = req.body;
  
  if (!title || !content || !startTime || !endTime) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'Title, content, startTime, and endTime are required' });
  }
  
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  if (endDate <= startDate) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'End time must be after start time' });
  }
  
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const db = getDb();
  
  db.run(
    'INSERT INTO posts (title, content, image_path, start_time, end_time, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [title, content, imagePath, startTime, endTime, req.userName || String(req.userId)],
    function(err) {
      if (err) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, message: 'Post created successfully' });
    }
  );
});

// Update post
router.put('/posts/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { title, content, startTime, endTime } = req.body;
  const db = getDb();
  
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!post) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const newTitle = title || post.title;
    const newContent = content || post.content;
    const newStartTime = startTime || post.start_time;
    const newEndTime = endTime || post.end_time;
    let newImagePath = post.image_path;
    
    if (req.file) {
      if (post.image_path) {
        const oldPath = path.join(uploadDir, path.basename(post.image_path));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      newImagePath = `/uploads/${req.file.filename}`;
    }
    
    const endDate = new Date(newEndTime);
    const startDate = new Date(newStartTime);
    
    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    db.run(
      'UPDATE posts SET title = ?, content = ?, image_path = ?, start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newTitle, newContent, newImagePath, newStartTime, newEndTime, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Post updated successfully' });
      }
    );
  });
});

// Delete post
router.delete('/posts/:id', authenticateToken, (req, res) => {
  const db = getDb();
  
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.image_path) {
      const imagePath = path.join(uploadDir, path.basename(post.image_path));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Post deleted successfully' });
    });
  });
});

module.exports = router;
