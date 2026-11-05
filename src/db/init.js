const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/infoboard.db');

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database at', dbPath);
      }
    });
  }
  return db;
}

function initializeDb() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.serialize(() => {
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.exec(schema, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database schema initialized');
          
          // Create default admin user if it doesn't exist
          const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
          const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
          
          db.get('SELECT * FROM admin_users WHERE username = ?', [defaultUsername], (err, row) => {
            if (err) {
              reject(err);
            } else if (!row) {
              const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
              db.run(
                'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
                [defaultUsername, hashedPassword],
                (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    console.log(`Default admin user created: ${defaultUsername}`);
                    resolve(db);
                  }
                }
              );
            } else {
              console.log('Admin user already exists');
              resolve(db);
            }
          });
        }
      });
    });
  });
}

function closeDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDb,
  initializeDb,
  closeDb
};
