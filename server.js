// server.js - Enhanced with better database handling and debugging
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database with better configuration
const dbPath = path.join(__dirname, 'football.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database:', dbPath);
  }
});

// Configure SQLite for better performance and concurrency
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA synchronous = NORMAL;");
db.run("PRAGMA cache_size = 1000000;");
db.run("PRAGMA temp_store = memory;");

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'scorekeeper',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Games table
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    quarter INTEGER DEFAULT 1,
    time_left INTEGER DEFAULT 900,
    is_clock_running BOOLEAN DEFAULT FALSE,
    down INTEGER DEFAULT 1,
    distance INTEGER DEFAULT 10,
    yard_line INTEGER DEFAULT 50,
    possession TEXT DEFAULT 'home',
    home_timeouts INTEGER DEFAULT 3,
    away_timeouts INTEGER DEFAULT 3,
    game_status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Plays table
  db.run(`CREATE TABLE IF NOT EXISTS plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    play_text TEXT NOT NULL,
    team TEXT,
    quarter INTEGER NOT NULL,
    game_time INTEGER NOT NULL,
    possession TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games (id)
  )`);

  // Create default users if they don't exist
  const defaultUsers = [
    { username: 'admin', password: 'football2024', role: 'admin' },
    { username: 'coach', password: 'score123', role: 'scorekeeper' }
  ];

  defaultUsers.forEach(user => {
    db.get('SELECT id FROM users WHERE username = ?', [user.username], (err, row) => {
      if (!row) {
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (!err) {
            db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
              [user.username, hash, user.role], function(err) {
                if (err) {
                  console.error('Error creating default user:', err.message);
                } else {
                  console.log(`Created default user: ${user.username}`);
                }
              });
          }
        });
      }
    });
  });

  // Create default game if none exists
  db.get('SELECT id FROM games WHERE game_status = "active"', (err, row) => {
    if (!row) {
      db.run(`INSERT INTO games (home_team, away_team) VALUES (?, ?)`, 
        ['Home Team', 'Away Team'], function(err) {
          if (err) {
            console.error('Error creating default game:', err.message);
          } else {
            console.log('Created default game with ID:', this.lastID);
          }
        });
    }
  });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for username:', username);

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error during login:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) {
        console.log('Invalid password for user:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Successful login for user:', username);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    });
  });
});

// Game routes
app.get('/api/game', (req, res) => {
  const query = 'SELECT * FROM games WHERE game_status = "active" ORDER BY id DESC LIMIT 1';
  
  db.get(query, (err, game) => {
    if (err) {
      console.error('Database error fetching game:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('Fetched game data:', game ? `ID ${game.id}` : 'No active game');
    res.json(game || {});
  });
});

app.put('/api/game/:id', authenticateToken, (req, res) => {
  const gameId = req.params.id;
  const updates = req.body;
  
  console.log(`Update request for game ${gameId}:`, updates);
  
  const allowedFields = [
    'home_team', 'away_team', 'home_score', 'away_score', 'quarter', 
    'time_left', 'is_clock_running', 'down', 'distance', 'yard_line', 
    'possession', 'home_timeouts', 'away_timeouts'
  ];
  
  const updateFields = [];
  const values = [];
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });
  
  if (updateFields.length === 0) {
    console.log('No valid fields to update');
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(gameId);
  
  const query = `UPDATE games SET ${updateFields.join(', ')} WHERE id = ?`;
  
  console.log('Executing update query:', query);
  console.log('With values:', values);
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Database update error:', err.message);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    
    console.log(`Database updated successfully. Changes: ${this.changes}, Last ID: ${this.lastID}`);
    
    if (this.changes === 0) {
      console.warn('No rows were updated - game ID might not exist');
    }
    
    res.json({ success: true, changes: this.changes });
  });
});

app.post('/api/game/reset', authenticateToken, (req, res) => {
  console.log('Game reset requested by user:', req.user.username);
  
  db.get('SELECT id FROM games WHERE game_status = "active" ORDER BY id DESC LIMIT 1', (err, game) => {
    if (err) {
      console.error('Database error during reset:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (game) {
      console.log('Archiving current game ID:', game.id);
      
      // Archive current game
      db.run('UPDATE games SET game_status = "completed" WHERE id = ?', [game.id], (err) => {
        if (err) {
          console.error('Error archiving game:', err.message);
        }
      });
      
      // Delete plays for current game
      db.run('DELETE FROM plays WHERE game_id = ?', [game.id], (err) => {
        if (err) {
          console.error('Error deleting plays:', err.message);
        }
      });
    }
    
    // Create new game
    db.run(`INSERT INTO games (home_team, away_team) VALUES (?, ?)`, 
      ['Home Team', 'Away Team'], function(err) {
        if (err) {
          console.error('Error creating new game:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Created new game with ID:', this.lastID);
        res.json({ success: true, gameId: this.lastID });
      });
  });
});

// Plays routes
app.get('/api/plays/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  console.log('Fetching plays for game ID:', gameId);
  
  db.all(`SELECT * FROM plays WHERE game_id = ? ORDER BY id DESC`, [gameId], (err, plays) => {
    if (err) {
      console.error('Database error fetching plays:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log(`Found ${plays.length} plays for game ${gameId}`);
    res.json(plays);
  });
});

app.post('/api/plays', authenticateToken, (req, res) => {
  const { game_id, play_text, team, quarter, game_time, possession } = req.body;
  console.log('Adding play to game', game_id, ':', play_text, 'Team:', team);
  
  db.run(`INSERT INTO plays (game_id, play_text, team, quarter, game_time, possession) VALUES (?, ?, ?, ?, ?, ?)`,
    [game_id, play_text, team, quarter, game_time, possession], function(err) {
      if (err) {
        console.error('Database error adding play:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('Added play with ID:', this.lastID);
      
      // Return the created play
      db.get('SELECT * FROM plays WHERE id = ?', [this.lastID], (err, play) => {
        if (err) {
          console.error('Database error fetching new play:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(play);
      });
    });
});

app.delete('/api/plays/:id', authenticateToken, (req, res) => {
  const playId = req.params.id;
  console.log('Deleting play with ID:', playId);
  
  // First check if the play exists
  db.get('SELECT * FROM plays WHERE id = ?', [playId], (err, play) => {
    if (err) {
      console.error('Database error checking play:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!play) {
      console.log('Play not found with ID:', playId);
      return res.status(404).json({ error: 'Play not found' });
    }
    
    // Delete the play
    db.run('DELETE FROM plays WHERE id = ?', [playId], function(err) {
      if (err) {
        console.error('Database error deleting play:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log(`Successfully deleted play ${playId}. Changes: ${this.changes}`);
      
      if (this.changes === 0) {
        console.warn('No rows were deleted - play might not exist');
        return res.status(404).json({ error: 'Play not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Play deleted successfully',
        deletedId: playId,
        changes: this.changes 
      });
    });
  });
});

// Debug route to check current game state
app.get('/api/debug/game', (req, res) => {
  db.get('SELECT * FROM games WHERE game_status = "active" ORDER BY id DESC LIMIT 1', (err, game) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({
      game: game,
      timestamp: new Date().toISOString(),
      serverTime: Date.now()
    });
  });
});

// Debug route to check all games
app.get('/api/debug/all-games', (req, res) => {
  db.all('SELECT * FROM games ORDER BY id DESC', (err, games) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(games);
  });
});

// User management routes (admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  db.all('SELECT id, username, role, created_at FROM users', (err, users) => {
    if (err) {
      console.error('Database error fetching users:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

app.post('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { username, password, role } = req.body;
  console.log('Creating new user:', username, 'with role:', role);
  
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Password hashing error:', err.message);
      return res.status(500).json({ error: 'Password hashing failed' });
    }
    
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, role], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            console.log('Username already exists:', username);
            return res.status(400).json({ error: 'Username already exists' });
          }
          console.error('Database error creating user:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Created user with ID:', this.lastID);
        res.json({ success: true, userId: this.lastID });
      });
  });
});

// Serve React app (for production)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`🏈 Football Scorekeeper running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`🔑 Admin: admin/football2024`);
  console.log(`👨‍💼 Coach: coach/score123`);
  console.log(`🐛 Debug endpoints:`);
  console.log(`   GET /api/debug/game - Current game state`);
  console.log(`   GET /api/debug/all-games - All games`);
});