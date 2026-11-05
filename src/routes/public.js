const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

// Cache for active posts
let postCache = null;
let cacheTime = 0;
const CACHE_TTL = parseInt(process.env.POST_CACHE_TTL) || 5 * 60 * 1000; // 5 minutes

function getCurrentTime() {
  return new Date().toISOString();
}

function getActivePosts(db) {
  return new Promise((resolve, reject) => {
    const now = getCurrentTime();
    db.all(
      `SELECT id, title, content, image_path, start_time, end_time 
       FROM posts 
       WHERE active = 1 
       AND start_time <= ? 
       AND end_time > ? 
       ORDER BY start_time ASC`,
      [now, now],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

// Get active posts (with caching)
router.get('/posts/active', async (req, res) => {
  try {
    const now = Date.now();
    
    // Use cache if available and not expired
    if (postCache && (now - cacheTime) < CACHE_TTL) {
      return res.json({ posts: postCache });
    }
    
    const db = getDb();
    const posts = await getActivePosts(db);
    
    // Update cache
    postCache = posts;
    cacheTime = now;
    
    res.json({ posts });
  } catch (err) {
    console.error('Error fetching active posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by ID
router.get('/posts/:id', (req, res) => {
  const db = getDb();
  db.get(
    'SELECT id, title, content, image_path, start_time, end_time FROM posts WHERE id = ? AND active = 1',
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(row);
    }
  );
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
