const express = require('express');
const router = express.Router();
const { 
  createGuide, 
  getGuides, 
  getGuide, 
  updateGuide, 
  deleteGuide 
} = require('../controllers/troubleshootingController');
const { protect } = require('../middleware/auth');
const { guideValidationRules, validate } = require('../middleware/validation');

/**
 * @swagger
 * /api/troubleshooting:
 *   get:
 *     summary: Get all troubleshooting guides
 *     tags: [Troubleshooting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by text
 *     responses:
 *       200:
 *         description: List of troubleshooting guides
 */
router.get('/', protect, getGuides);

/**
 * @swagger
 * /api/troubleshooting/{id}:
 *   get:
 *     summary: Get single troubleshooting guide
 *     tags: [Troubleshooting]
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
 *         description: Guide details
 */
router.get('/:id', protect, getGuide);

/**
 * @swagger
 * /api/troubleshooting/{id}:
 *   put:
 *     summary: Update troubleshooting guide
 *     tags: [Troubleshooting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Guide updated successfully
 */
router.put('/:id', protect, updateGuide);

/**
 * @swagger
 * /api/troubleshooting/{id}:
 *   delete:
 *     summary: Delete troubleshooting guide
 *     tags: [Troubleshooting]
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
 *         description: Guide deleted successfully
 */
router.delete('/:id', protect, deleteGuide);

module.exports = router;