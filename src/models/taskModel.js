const db = require('../config/databaseAdapter');

class Task {
  static async create({ title, description, status = 'pending', priority = 'medium', user_id }) {
    return await db.createTask({ title, description, status, priority, user_id });
  }

  static async findById(id) {
    return await db.getTaskById(id);
  }

  static async findAll() {
    return await db.getTasks();
  }

  static async findByUserId(userId) {
    return await db.getTasksByUserId(userId);
  }

  static async update(id, { title, description, status, priority }) {
    return await db.updateTask(id, { title, description, status, priority });
  }

  static async delete(id) {
    return await db.deleteTask(id);
  }

  static async getStats(userId = null) {
    return await db.getTaskStats(userId);
  }

  static async search(query, userId = null) {
    const tasks = userId ? await db.getTasksByUserId(userId) : await db.getTasks();
    const searchTerm = query.toLowerCase();
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm) || 
      (task.description && task.description.toLowerCase().includes(searchTerm))
    );
  }

  static async filter({ status, priority, userId = null }) {
    let tasks = userId ? await db.getTasksByUserId(userId) : await db.getTasks();
    
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }
    
    if (priority) {
      tasks = tasks.filter(task => task.priority === priority);
    }
    
    return tasks;
  }
}

module.exports = Task;
