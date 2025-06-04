const express = require('express');
const router = express.Router();
const { 
  addUser, 
  getUsers, 
  deleteUser 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { userValidationRules, validate } = require('../middleware/validation');

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Add a new user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               phone:
 *                 type: string
 *               consentGiven:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or user already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.post('/users', protect, authorize('admin'), userValidationRules(), validate, addUser);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/users', protect, authorize('admin'), getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;