// Simple in-memory database for quick Netlify deployment
const bcrypt = require('bcryptjs');

class MemoryDatabase {
  constructor() {
    this.users = [];
    this.tasks = [];
    this.userCounter = 0;
    this.taskCounter = 0;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('🔄 Initializing memory database...');
    
    try {
      // Create initial admin user
      const adminPassword = await bcrypt.hash('Admin123', 12);
      const userPassword = await bcrypt.hash('User123', 12);
      
      this.users = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@primetrade.ai',
          password: adminPassword,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          username: 'user',
          email: 'user@primetrade.ai',
          password: userPassword,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      this.tasks = [
        {
          id: 1,
          title: 'Welcome to Primetrade',
          description: 'This is a demo task to get you started',
          status: 'pending',
          priority: 'medium',
          user_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      this.userCounter = 2;
      this.taskCounter = 1;
      this.initialized = true;
      
      console.log('✅ Memory database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize memory database:', error);
      throw error;
    }
  }

  // User operations
  async getUsers() {
    return this.users.map(user => ({ ...user, password: undefined }));
  }

  async getUserById(id) {
    return this.users.find(user => user.id === parseInt(id));
  }

  async getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async getUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }

  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const newId = ++this.userCounter;

    const newUser = {
      id: newId,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.users.push(newUser);
    return { ...newUser, password: undefined };
  }

  async updateUser(id, userData) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    if (userIndex === -1) throw new Error('User not found');

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updated_at: new Date().toISOString()
    };

    return { ...this.users[userIndex], password: undefined };
  }

  async deleteUser(id) {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== parseInt(id));
    return this.users.length < initialLength;
  }

  // Task operations
  async getTasks() {
    return this.tasks.map(task => ({
      ...task,
      username: this.users.find(u => u.id === task.user_id)?.username || 'Unknown'
    }));
  }

  async getTaskById(id) {
    const task = this.tasks.find(task => task.id === parseInt(id));
    if (!task) return null;
    
    return {
      ...task,
      username: this.users.find(u => u.id === task.user_id)?.username || 'Unknown'
    };
  }

  async getTasksByUserId(userId) {
    return this.tasks
      .filter(task => task.user_id === parseInt(userId))
      .map(task => ({
        ...task,
        username: this.users.find(u => u.id === task.user_id)?.username || 'Unknown'
      }));
  }

  async createTask(taskData) {
    const newId = ++this.taskCounter;

    const newTask = {
      id: newId,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      user_id: parseInt(taskData.user_id),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.tasks.push(newTask);
    
    return {
      ...newTask,
      username: this.users.find(u => u.id === newTask.user_id)?.username || 'Unknown'
    };
  }

  async updateTask(id, taskData) {
    const taskIndex = this.tasks.findIndex(task => task.id === parseInt(id));
    if (taskIndex === -1) throw new Error('Task not found');

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...taskData,
      updated_at: new Date().toISOString()
    };

    return {
      ...this.tasks[taskIndex],
      username: this.users.find(u => u.id === this.tasks[taskIndex].user_id)?.username || 'Unknown'
    };
  }

  async deleteTask(id) {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== parseInt(id));
    return this.tasks.length < initialLength;
  }

  // Statistics
  async getUserStats() {
    return {
      total: this.users.length,
      admins: this.users.filter(user => user.role === 'admin').length,
      users: this.users.filter(user => user.role === 'user').length
    };
  }

  async getTaskStats(userId = null) {
    const tasks = userId ? this.tasks.filter(t => t.user_id === parseInt(userId)) : this.tasks;
    
    return {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        in_progress: tasks.filter(task => task.status === 'in_progress').length,
        completed: tasks.filter(task => task.status === 'completed').length
      },
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length
      }
    };
  }
}

module.exports = new MemoryDatabase();
