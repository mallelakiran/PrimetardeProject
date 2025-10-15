// Netlify Blobs database implementation for serverless deployment
const { getStore } = require('@netlify/blobs');

class NetlifyDatabase {
  constructor() {
    this.store = getStore('primetrade-db');
  }

  // Initialize with default data
  async initialize() {
    try {
      const users = await this.store.get('users');
      if (!users) {
        // Create initial users
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('Admin123', 12);
        const userPassword = await bcrypt.hash('User123', 12);
        
        const initialUsers = [
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

        await this.store.set('users', JSON.stringify(initialUsers));
        await this.store.set('user_counter', '2');
        
        // Create initial tasks
        const initialTasks = [
          {
            id: 1,
            title: 'Complete project documentation',
            description: 'Write comprehensive documentation for the task management system',
            status: 'in_progress',
            priority: 'high',
            user_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Learn React hooks',
            description: 'Study and practice React hooks for better state management',
            status: 'pending',
            priority: 'medium',
            user_id: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        await this.store.set('tasks', JSON.stringify(initialTasks));
        await this.store.set('task_counter', '2');
        
        console.log('✅ Netlify database initialized with demo data');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Netlify database:', error);
      throw error;
    }
  }

  // User operations
  async getUsers() {
    const users = await this.store.get('users');
    return users ? JSON.parse(users) : [];
  }

  async getUserById(id) {
    const users = await this.getUsers();
    return users.find(user => user.id === parseInt(id));
  }

  async getUserByEmail(email) {
    const users = await this.getUsers();
    return users.find(user => user.email === email);
  }

  async getUserByUsername(username) {
    const users = await this.getUsers();
    return users.find(user => user.username === username);
  }

  async createUser(userData) {
    const users = await this.getUsers();
    const counter = await this.store.get('user_counter');
    const newId = parseInt(counter || '0') + 1;

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const newUser = {
      id: newId,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.push(newUser);
    await this.store.set('users', JSON.stringify(users));
    await this.store.set('user_counter', newId.toString());

    return { ...newUser, password: undefined };
  }

  async updateUser(id, userData) {
    const users = await this.getUsers();
    const userIndex = users.findIndex(user => user.id === parseInt(id));
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      updated_at: new Date().toISOString()
    };

    await this.store.set('users', JSON.stringify(users));
    return { ...users[userIndex], password: undefined };
  }

  async deleteUser(id) {
    const users = await this.getUsers();
    const filteredUsers = users.filter(user => user.id !== parseInt(id));
    await this.store.set('users', JSON.stringify(filteredUsers));
    return true;
  }

  // Task operations
  async getTasks() {
    const tasks = await this.store.get('tasks');
    return tasks ? JSON.parse(tasks) : [];
  }

  async getTaskById(id) {
    const tasks = await this.getTasks();
    return tasks.find(task => task.id === parseInt(id));
  }

  async getTasksByUserId(userId) {
    const tasks = await this.getTasks();
    return tasks.filter(task => task.user_id === parseInt(userId));
  }

  async createTask(taskData) {
    const tasks = await this.getTasks();
    const counter = await this.store.get('task_counter');
    const newId = parseInt(counter || '0') + 1;

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

    tasks.push(newTask);
    await this.store.set('tasks', JSON.stringify(tasks));
    await this.store.set('task_counter', newId.toString());

    return newTask;
  }

  async updateTask(id, taskData) {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === parseInt(id));
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...taskData,
      updated_at: new Date().toISOString()
    };

    await this.store.set('tasks', JSON.stringify(tasks));
    return tasks[taskIndex];
  }

  async deleteTask(id) {
    const tasks = await this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== parseInt(id));
    await this.store.set('tasks', JSON.stringify(filteredTasks));
    return true;
  }

  // Statistics
  async getUserStats() {
    const users = await this.getUsers();
    return {
      total: users.length,
      admins: users.filter(user => user.role === 'admin').length,
      users: users.filter(user => user.role === 'user').length
    };
  }

  async getTaskStats(userId = null) {
    const tasks = userId ? await this.getTasksByUserId(userId) : await this.getTasks();
    
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

module.exports = new NetlifyDatabase();
