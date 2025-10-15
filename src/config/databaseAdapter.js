// Database adapter that switches between SQLite (local) and Netlify Blobs (production)

const isNetlify = process.env.NETLIFY === 'true';

let db;

if (isNetlify) {
  // Use Memory Database for production (quick fix)
  db = require('./memoryDatabase');
} else {
  // Use SQLite for local development
  const sqlite = require('./database');
  
  // Wrap SQLite functions to match the interface
  db = {
    async initialize() {
      return sqlite.initializeDatabase();
    },

    async getUserById(id) {
      return sqlite.getRow('SELECT * FROM users WHERE id = ?', [id]);
    },

    async getUserByEmail(email) {
      return sqlite.getRow('SELECT * FROM users WHERE email = ?', [email]);
    },

    async getUserByUsername(username) {
      return sqlite.getRow('SELECT * FROM users WHERE username = ?', [username]);
    },

    async getUsers() {
      return sqlite.getAllRows('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    },

    async createUser(userData) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const result = await sqlite.runQuery(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [userData.username, userData.email, hashedPassword, userData.role || 'user']
      );

      return {
        id: result.lastID,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user'
      };
    },

    async updateUser(id, userData) {
      await sqlite.runQuery(
        'UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userData.username, userData.email, id]
      );
      
      return this.getUserById(id);
    },

    async deleteUser(id) {
      await sqlite.runQuery('DELETE FROM users WHERE id = ?', [id]);
      return true;
    },

    async getTasks() {
      return sqlite.getAllRows(`
        SELECT t.*, u.username 
        FROM tasks t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `);
    },

    async getTaskById(id) {
      return sqlite.getRow(`
        SELECT t.*, u.username 
        FROM tasks t 
        LEFT JOIN users u ON t.user_id = u.id 
        WHERE t.id = ?
      `, [id]);
    },

    async getTasksByUserId(userId) {
      return sqlite.getAllRows(`
        SELECT t.*, u.username 
        FROM tasks t 
        LEFT JOIN users u ON t.user_id = u.id 
        WHERE t.user_id = ? 
        ORDER BY t.created_at DESC
      `, [userId]);
    },

    async createTask(taskData) {
      const result = await sqlite.runQuery(
        'INSERT INTO tasks (title, description, status, priority, user_id) VALUES (?, ?, ?, ?, ?)',
        [taskData.title, taskData.description, taskData.status, taskData.priority, taskData.user_id]
      );

      return this.getTaskById(result.lastID);
    },

    async updateTask(id, taskData) {
      await sqlite.runQuery(
        'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [taskData.title, taskData.description, taskData.status, taskData.priority, id]
      );
      
      return this.getTaskById(id);
    },

    async deleteTask(id) {
      await sqlite.runQuery('DELETE FROM tasks WHERE id = ?', [id]);
      return true;
    },

    async getUserStats() {
      const total = await sqlite.getRow('SELECT COUNT(*) as count FROM users');
      const admins = await sqlite.getRow('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
      const users = await sqlite.getRow('SELECT COUNT(*) as count FROM users WHERE role = "user"');
      
      return {
        total: total.count,
        admins: admins.count,
        users: users.count
      };
    },

    async getTaskStats(userId = null) {
      const baseQuery = userId ? 'FROM tasks WHERE user_id = ?' : 'FROM tasks';
      const params = userId ? [userId] : [];

      const total = await sqlite.getRow(`SELECT COUNT(*) as count ${baseQuery}`, params);
      
      const byStatus = {
        pending: (await sqlite.getRow(`SELECT COUNT(*) as count ${baseQuery} AND status = 'pending'`, [...params])).count,
        in_progress: (await sqlite.getRow(`SELECT COUNT(*) as count ${baseQuery} AND status = 'in_progress'`, [...params])).count,
        completed: (await sqlite.getRow(`SELECT COUNT(*) as count ${baseQuery} AND status = 'completed'`, [...params])).count
      };

      const byPriority = {
        low: (await sqlite.getRow(`SELECT COUNT(*) as count ${baseQuery} AND priority = 'low'`, [...params])).count,
        medium: (await sqlite.getRow(`SELECT COUNT(*) as count ${baseQuery} AND priority = 'medium'`, [...params])).count,
        high: (await sqlite.getRow(`SELECT COUNT(*) as count ${baseQuery} AND priority = 'high'`, [...params])).count
      };

      return {
        total: total.count,
        byStatus,
        byPriority
      };
    }
  };
}

module.exports = db;
