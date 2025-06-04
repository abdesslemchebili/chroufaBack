const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPool,
  getPools,
  getPool,
  updatePool,
  deletePool,
  updateEquipment,
  updateChemicalLevels,
  updateStatus
} = require('../controllers/poolController');
const { protect, authorize } = require('../middleware/auth');
const { 
  poolValidationRules, 
  equipmentValidationRules, 
  chemicalLevelsValidationRules,
  validate 
} = require('../middleware/validation');

/**
 * @swagger
 * /api/pools:
 *   post:
 *     summary: Create a new pool and assign to user (Admin only)
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
 *               - specifications
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to assign the pool to
 *               name:
 *                 type: string
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - state
 *                   - zipCode
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               specifications:
 *                 type: object
 *                 required:
 *                   - type
 *                   - volume
 *                   - surfaceArea
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [residential, commercial, public]
 *                   volume:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: number
 *                       unit:
 *                         type: string
 *                         enum: [gallons, liters]
 *                   surfaceArea:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: number
 *                       unit:
 *                         type: string
 *                         enum: [sqft, sqm]
 *     responses:
 *       201:
 *         description: Pool created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: User not found
 */
router.post('/', protect, authorize('admin'), poolValidationRules(), validate, createPool);

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
 */
router.get('/', getPools);

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
 *       404:
 *         description: Pool not found
 */
router.get('/:id', getPool);

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
 *               address:
 *                 type: object
 *               specifications:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *     responses:
 *       200:
 *         description: Pool updated successfully
 *       404:
 *         description: Pool not found
 */
router.put('/:id', protect, poolValidationRules(), validate, updatePool);

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
 *       404:
 *         description: Pool not found
 */
router.delete('/:id', protect, deletePool);

/**
 * @swagger
 * /api/pools/{id}/equipment:
 *   put:
 *     summary: Update pool equipment
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
 *               - equipment
 *             properties:
 *               equipment:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - name
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [pump, filter, heater, chlorinator, other]
 *                     name:
 *                       type: string
 *                     model:
 *                       type: string
 *                     serialNumber:
 *                       type: string
 *                     installationDate:
 *                       type: string
 *                       format: date
 *                     lastServiceDate:
 *                       type: string
 *                       format: date
 *     responses:
 *       200:
 *         description: Pool equipment updated successfully
 *       404:
 *         description: Pool not found
 */
router.put('/:id/equipment', protect, equipmentValidationRules(), validate, updateEquipment);

/**
 * @swagger
 * /api/pools/{id}/chemical-levels:
 *   put:
 *     summary: Update chemical levels ideal ranges
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
 *               - idealRanges
 *             properties:
 *               idealRanges:
 *                 type: object
 *                 properties:
 *                   chlorine:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *                   pH:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *                   alkalinity:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *     responses:
 *       200:
 *         description: Chemical levels updated successfully
 *       404:
 *         description: Pool not found
 */
router.put('/:id/chemical-levels', protect, chemicalLevelsValidationRules(), validate, updateChemicalLevels);

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
 *     responses:
 *       200:
 *         description: Pool status updated successfully
 *       404:
 *         description: Pool not found
 */
router.put('/:id/status', protect, [
  body('status').isIn(['active', 'inactive', 'maintenance'])
], validate, updateStatus);

module.exports = router; 