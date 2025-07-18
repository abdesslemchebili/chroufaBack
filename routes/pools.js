const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPool,
  getPools,
  getPool,
  updatePool,
  deletePool,
  updateStatus
} = require('../controllers/poolController');
const { protect } = require('../middleware/auth');
const { 
  poolValidationRules, 
  poolUpdateValidationRules,
  validate 
} = require('../middleware/validation');

/**
 * @swagger
 * /api/pools:
 *   post:
 *     summary: Create a new pool
 *     tags: [Pools]
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
 *               - address
 *               - owner
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Pool name
 *                 example: "Backyard Pool"
 *               address:
 *                 type: string
 *                 description: Street address
 *                 example: "123 Main Street"
 *               owner:
 *                 type: string
 *                 description: ID of the pool owner
 *                 example: "60d21b4667d0d8992e610c85"
 *               type:
 *                 type: string
 *                 enum: [residential, commercial, public]
 *                 description: Type of pool
 *                 example: "residential"
 *               size:
 *                 type: object
 *                 description: Pool size (optional)
 *                 properties:
 *                   value:
 *                     type: number
 *                     example: 500
 *                   unit:
 *                     type: string
 *                     enum: [sqft, sqm]
 *                     default: "sqft"
 *                     example: "sqft"
 *               volume:
 *                 type: object
 *                 description: Pool volume (optional)
 *                 properties:
 *                   value:
 *                     type: number
 *                     example: 15000
 *                   unit:
 *                     type: string
 *                     enum: [gallons, liters]
 *                     default: "gallons"
 *                     example: "gallons"
 *     responses:
 *       201:
 *         description: Pool created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     owner:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Pool owner not found
 */
router.post('/', protect, poolValidationRules(), validate, createPool);

/**
 * @swagger
 * /api/pools:
 *   get:
 *     summary: Get all pools for user
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pools
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       owner:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getPools);

/**
 * @swagger
 * /api/pools/{id}:
 *   get:
 *     summary: Get single pool
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pool ID
 *     responses:
 *       200:
 *         description: Pool details
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Pool not found
 */
router.get('/:id', protect, getPool);

/**
 * @swagger
 * /api/pools/{id}:
 *   put:
 *     summary: Update pool
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pool ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Pool name
 *               address:
 *                 type: string
 *                 description: Street address
 *               owner:
 *                 type: string
 *                 description: ID of the new pool owner (optional)
 *                 example: "60d21b4667d0d8992e610c85"
 *               type:
 *                 type: string
 *                 enum: [residential, commercial, public]
 *                 description: Pool type
 *               size:
 *                 type: object
 *                 description: Pool size
 *               volume:
 *                 type: object
 *                 description: Pool volume
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 description: Pool status
 *     responses:
 *       200:
 *         description: Pool updated successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Pool not found
 */
router.put('/:id', protect, poolUpdateValidationRules(), validate, updatePool);

/**
 * @swagger
 * /api/pools/{id}:
 *   delete:
 *     summary: Delete pool
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pool ID
 *     responses:
 *       200:
 *         description: Pool deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Pool not found
 */
router.delete('/:id', protect, deletePool);

/**
 * @swagger
 * /api/pools/{id}/status:
 *   put:
 *     summary: Update pool status
 *     tags: [Pools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pool ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 description: New pool status
 *     responses:
 *       200:
 *         description: Pool status updated successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Pool not found
 */
router.put('/:id/status', protect, updateStatus);

module.exports = router; 