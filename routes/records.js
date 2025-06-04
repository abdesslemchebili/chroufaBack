const express = require('express');
const router = express.Router();
const { 
  createRecord, 
  getRecords, 
  getRecord, 
  updateRecord, 
  deleteRecord,
  syncRecords
} = require('../controllers/recordController');
const { protect } = require('../middleware/auth');
const { recordValidationRules, validate } = require('../middleware/validation');

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new maintenance record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - poolId
 *               - type
 *               - description
 *             properties:
 *               poolId:
 *                 type: string
 *               taskId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [chemical, cleaning, repair, inspection, other]
 *               description:
 *                 type: string
 *               measurements:
 *                 type: object
 *                 properties:
 *                   chlorine:
 *                     type: number
 *                   pH:
 *                     type: number
 *                   alkalinity:
 *                     type: number
 *                   temperature:
 *                     type: number
 *               productsUsed:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *               notes:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Record created successfully
 */
router.post('/', protect, recordValidationRules(), validate, createRecord);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Get all records for user
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: poolId
 *         schema:
 *           type: string
 *         description: Filter by pool ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by record type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of records
 */
router.get('/', protect, getRecords);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get single record
 *     tags: [Records]
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
 *         description: Record details
 */
router.get('/:id', protect, getRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update record
 *     tags: [Records]
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
 *         description: Record updated successfully
 */
router.put('/:id', protect, updateRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Delete record
 *     tags: [Records]
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
 *         description: Record deleted successfully
 */
router.delete('/:id', protect, deleteRecord);

/**
 * @swagger
 * /api/records/sync:
 *   post:
 *     summary: Sync records between client and server
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Records synced successfully
 */
router.post('/sync', protect, syncRecords);

module.exports = router;