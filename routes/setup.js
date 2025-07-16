const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @swagger
 * /api/setup/admin:
 *   post:
 *     summary: Create admin user
 *     tags: [Setup]
 *     description: This endpoint creates an admin user. Can be used multiple times to create additional admin users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Admin's full name
 *                 example: Admin User
 *               username:
 *                 type: string
 *                 description: Admin's username (3-30 characters, letters, numbers, underscores only)
 *                 example: admin
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address (optional)
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin's password
 *                 example: admin123
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin user created successfully. You can now log in.
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: Admin User
 *                     username:
 *                       type: string
 *                       example: admin
 *                     email:
 *                       type: string
 *                       example: admin@example.com
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid input data
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error creating admin user
 *                 error:
 *                   type: string
 */
router.post('/admin', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    // Check if admin with username already exists
    const existingAdmin = await User.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this username already exists'
      });
    }
    
    // Check if admin with email already exists (if email is provided)
    if (email) {
      const existingAdminByEmail = await User.findOne({ email });
      if (existingAdminByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this email already exists'
        });
      }
    }
    
    // Create admin user
    const admin = await User.create({
      name,
      username,
      email,
      password, // Will be hashed by the pre-save hook
      role: 'admin',
      consentGiven: true,
      consentDate: Date.now()
    });
    
    // Remove password from response
    admin.password = undefined;
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully.',
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
      error: error.message
    });
  }
});

module.exports = router;
