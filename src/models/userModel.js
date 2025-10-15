const db = require('../config/databaseAdapter');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password, role = 'user' }) {
    return await db.createUser({ username, email, password, role });
  }

  static async findById(id) {
    const user = await db.getUserById(id);
    if (user && user.password) {
      delete user.password; // Don't return password
    }
    return user;
  }

  static async findByEmail(email) {
    return await db.getUserByEmail(email);
  }

  static async findByUsername(username) {
    return await db.getUserByUsername(username);
  }

  static async findAll() {
    return await db.getUsers();
  }

  static async update(id, { username, email }) {
    return await db.updateUser(id, { username, email });
  }

  static async delete(id) {
    return await db.deleteUser(id);
  }

  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return await db.updateUser(id, { password: hashedPassword });
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getStats() {
    return await db.getUserStats();
  }
}

module.exports = User;
