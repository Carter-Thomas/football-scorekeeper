// server.js - Migrated to Turso (serverless SQLite)
const express = require('express');
const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Turso database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Helper function to run database queries
const runQuery = async (sql, params = []) => {
  try {
    const result = await db.execute({
      sql: sql,
      args: params
    });
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Helper function to get single row
const getQuery = async (sql, params = []) => {
  try {
    const result = await db.execute({
      sql: sql,
      args: params
    });
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database get error:', error.message);
    throw error;
  }
};

// Helper function to get all rows
const allQuery = async (sql, params = []) => {
  try {
    const result = await db.execute({
      sql: sql,
      args: params
    });
    return result.rows;
  } catch (error) {
    console.error('Database all error:', error.message);
    throw error;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('Initializing Turso database...');

    // Users table
    await runQuery(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'scorekeeper',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Games table
    await runQuery(`CREATE TABLE IF NOT EXISTS games (
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
    await runQuery(`CREATE TABLE IF NOT EXISTS plays (
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

    for (const user of defaultUsers) {
      const existingUser = await getQuery('SELECT id FROM users WHERE username = ?', [user.username]);
      
      if (!existingUser) {
        const hash = await bcrypt.hash(user.password, 10);
        await runQuery('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
          [user.username, hash, user.role]);
        console.log(`Created default user: ${user.username}`);
      }
    }

    // Create default game if none exists
    const activeGame = await getQuery('SELECT id FROM games WHERE game_status = "active"');
    if (!activeGame) {
      const result = await runQuery(`INSERT INTO games (home_team, away_team) VALUES (?, ?)`, 
        ['Home Team', 'Away Team']);
      console.log('Created default game with ID:', result.lastInsertRowid);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
};

// Initialize database on startup
initializeDatabase();

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
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
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
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Game routes
app.get('/api/game', async (req, res) => {
  try {
    const game = await getQuery('SELECT * FROM games WHERE game_status = "active" ORDER BY id DESC LIMIT 1');
    console.log('Fetched game data:', game ? `ID ${game.id}` : 'No active game');
    res.json(game || {});
  } catch (error) {
    console.error('Database error fetching game:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/game/:id', authenticateToken, async (req, res) => {
  try {
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
    
    const result = await runQuery(query, values);
    
    console.log(`Database updated successfully. Changes: ${result.rowsAffected}`);
    
    if (result.rowsAffected === 0) {
      console.warn('No rows were updated - game ID might not exist');
    }
    
    res.json({ success: true, changes: result.rowsAffected });
  } catch (error) {
    console.error('Database update error:', error.message);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.post('/api/game/reset', authenticateToken, async (req, res) => {
  try {
    console.log('Game reset requested by user:', req.user.username);
    
    const game = await getQuery('SELECT id FROM games WHERE game_status = "active" ORDER BY id DESC LIMIT 1');
    
    if (game) {
      console.log('Archiving current game ID:', game.id);
      
      // Archive current game
      await runQuery('UPDATE games SET game_status = "completed" WHERE id = ?', [game.id]);
      
      // Delete plays for current game
      await runQuery('DELETE FROM plays WHERE game_id = ?', [game.id]);
    }
    
    // Create new game
    const result = await runQuery(`INSERT INTO games (home_team, away_team) VALUES (?, ?)`, 
      ['Home Team', 'Away Team']);
    
    console.log('Created new game with ID:', result.lastInsertRowid);
    res.json({ success: true, gameId: result.lastInsertRowid });
  } catch (error) {
    console.error('Error during game reset:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Plays routes
app.get('/api/plays/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    console.log('Fetching plays for game ID:', gameId);
    
    const plays = await allQuery(`SELECT * FROM plays WHERE game_id = ? ORDER BY id DESC`, [gameId]);
    
    console.log(`Found ${plays.length} plays for game ${gameId}`);
    res.json(plays);
  } catch (error) {
    console.error('Database error fetching plays:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/plays', authenticateToken, async (req, res) => {
  try {
    const { game_id, play_text, team, quarter, game_time, possession } = req.body;
    console.log('Adding play to game', game_id, ':', play_text, 'Team:', team);
    
    const result = await runQuery(`INSERT INTO plays (game_id, play_text, team, quarter, game_time, possession) VALUES (?, ?, ?, ?, ?, ?)`,
      [game_id, play_text, team, quarter, game_time, possession]);
    
    console.log('Added play with ID:', result.lastInsertRowid);
    
    // Return the created play
    const play = await getQuery('SELECT * FROM plays WHERE id = ?', [result.lastInsertRowid]);
    res.json(play);
  } catch (error) {
    console.error('Database error adding play:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/plays/:id', authenticateToken, async (req, res) => {
  try {
    const playId = req.params.id;
    console.log('Deleting play with ID:', playId);
    
    // First check if the play exists
    const play = await getQuery('SELECT * FROM plays WHERE id = ?', [playId]);
    
    if (!play) {
      console.log('Play not found with ID:', playId);
      return res.status(404).json({ error: 'Play not found' });
    }
    
    // Delete the play
    const result = await runQuery('DELETE FROM plays WHERE id = ?', [playId]);
    
    console.log(`Successfully deleted play ${playId}. Changes: ${result.rowsAffected}`);
    
    if (result.rowsAffected === 0) {
      console.warn('No rows were deleted - play might not exist');
      return res.status(404).json({ error: 'Play not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Play deleted successfully',
      deletedId: playId,
      changes: result.rowsAffected 
    });
  } catch (error) {
    console.error('Database error deleting play:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Debug route to check current game state
app.get('/api/debug/game', async (req, res) => {
  try {
    const game = await getQuery('SELECT * FROM games WHERE game_status = "active" ORDER BY id DESC LIMIT 1');
    res.json({
      game: game,
      timestamp: new Date().toISOString(),
      serverTime: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Debug route to check all games
app.get('/api/debug/all-games', async (req, res) => {
  try {
    const games = await allQuery('SELECT * FROM games ORDER BY id DESC');
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// User management routes (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const users = await allQuery('SELECT id, username, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    console.error('Database error fetching users:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { username, password, role } = req.body;
    console.log('Creating new user:', username, 'with role:', role);
    
    const hash = await bcrypt.hash(password, 10);
    
    const result = await runQuery('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, role]);
    
    console.log('Created user with ID:', result.lastInsertRowid);
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('Username already exists:', req.body.username);
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Database error creating user:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve React app (for production) - only for non-API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes or static files
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return res.status(404).json({ error: 'Not found' });
  }
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
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🏈 Football Scorekeeper running on port ${PORT}`);
  console.log(`📊 Database: Turso (${process.env.TURSO_DATABASE_URL ? 'Connected' : 'Not configured'})`);
  console.log(`🔑 Admin: admin/football2024`);
  console.log(`👨‍💼 Coach: coach/score123`);
  console.log(`🐛 Debug endpoints:`);
  console.log(`   GET /api/debug/game - Current game state`);
  console.log(`   GET /api/debug/all-games - All games`);
});