const User = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/responseUtils');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    successResponse(res, { users }, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get all users error:', error);
    errorResponse(res, 'Failed to retrieve users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    successResponse(res, { user }, 'User retrieved successfully');
  } catch (error) {
    console.error('Get user by ID error:', error);
    errorResponse(res, 'Failed to retrieve user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await User.findByEmail(email);
      if (emailExists && emailExists.id !== parseInt(id)) {
        return errorResponse(res, 'Email already taken', 400);
      }
    }
    
    // Check if username is already taken by another user
    if (username !== existingUser.username) {
      const usernameExists = await User.findByUsername(username);
      if (usernameExists && usernameExists.id !== parseInt(id)) {
        return errorResponse(res, 'Username already taken', 400);
      }
    }
    
    const updatedUser = await User.update(id, { username, email });
    successResponse(res, { user: updatedUser }, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    errorResponse(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }
    
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    await User.delete(id);
    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, 'Failed to delete user', 500);
  }
};

const getUserStats = async (req, res) => {
  try {
    const stats = await User.getStats();
    successResponse(res, { stats }, 'User statistics retrieved successfully');
  } catch (error) {
    console.error('Get user stats error:', error);
    errorResponse(res, 'Failed to retrieve user statistics', 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
};
