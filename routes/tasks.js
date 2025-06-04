const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getTasks, 
  getTask, 
  updateTask, 
  deleteTask, 
  completeTask,
  syncTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { taskValidationRules, validate } = require('../middleware/validation');

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - poolId
 *               - scheduledDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               poolId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               recurrence:
 *                 type: string
 *                 enum: [none, daily, weekly, biweekly, monthly]
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/', protect, taskValidationRules(), validate, createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: poolId
 *         schema:
 *           type: string
 *         description: Filter by pool ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
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
 *         description: List of tasks
 */
router.get('/', protect, getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get single task
 *     tags: [Tasks]
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
 *         description: Task details
 */
router.get('/:id', protect, getTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
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
 *         description: Task updated successfully
 */
router.put('/:id', protect, updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
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
 *         description: Task deleted successfully
 */
router.delete('/:id', protect, deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   put:
 *     summary: Mark task as completed
 *     tags: [Tasks]
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
 *         description: Task marked as completed
 */
router.put('/:id/complete', protect, completeTask);

/**
 * @swagger
 * /api/tasks/sync:
 *   post:
 *     summary: Sync tasks between client and server
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tasks
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *               lastSyncTimestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Tasks synced successfully
 */
router.post('/sync', protect, syncTasks);

module.exports = router;