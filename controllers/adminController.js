// Save this as controllers/adminController.js
const User = require('../models/User');

// @desc    Add a new user (admin only)
// @route   POST /api/admin/users
// @access  Admin
exports.addUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role, phone, consentGiven } = req.body;
    
    // Check if user already exists with username
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'User with this username already exists'
      });
    }
    
    // Check if user already exists with email (if email is provided)
    if (email) {
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      password, // Will be hashed by the pre-save hook in the User model
      role: role || 'user', // Default to 'user' if not specified
      phone,
      consentGiven: consentGiven || false,
      consentDate: consentGiven ? Date.now() : null
    });
    
    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      consentGiven: user.consentGiven,
      consentDate: user.consentDate,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { name, username, email, role, phone, consentGiven } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (consentGiven !== undefined) {
      updateData.consentGiven = consentGiven;
      updateData.consentDate = consentGiven ? Date.now() : null;
    }
    
    // Check for username conflicts if username is being updated
    if (username && username !== user.username) {
      const existingUserByUsername = await User.findOne({ username });
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          message: 'User with this username already exists'
        });
      }
    }
    
    // Check for email conflicts if email is being updated
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};