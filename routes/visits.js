const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createVisit,
  getVisits,
  getVisit,
  updateVisit,
  deleteVisit,
  approveVisit,
  declineVisit,
  rescheduleVisit,
  completeVisit,
  cancelVisit,
  getVisitStats
} = require('../controllers/visitController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules for visit creation
const visitValidationRules = () => [
  body('poolId')
    .isMongoId()
    .withMessage('Valid pool ID is required'),
  body('requestedDate')
    .isISO8601()
    .withMessage('Valid requested date is required'),
  body('preferredTimeSlot')
    .isIn(['morning', 'afternoon', 'evening', 'any'])
    .withMessage('Preferred time slot must be morning, afternoon, evening, or any'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('contactPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
];

// Validation rules for visit approval
const approvalValidationRules = () => [
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  body('scheduledTimeSlot')
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('Scheduled time slot must be morning, afternoon, or evening'),
  body('assignedTechnician')
    .optional()
    .isMongoId()
    .withMessage('Valid technician ID is required'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Estimated duration must be between 15 and 480 minutes'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes must be less than 1000 characters')
];

// Validation rules for visit decline
const declineValidationRules = () => [
  body('declineReason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Decline reason must be between 5 and 500 characters')
];

// Validation rules for visit reschedule
const rescheduleValidationRules = () => [
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  body('scheduledTimeSlot')
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('Scheduled time slot must be morning, afternoon, or evening'),
  body('rescheduleReason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reschedule reason must be between 5 and 500 characters')
];

/**
 * @swagger
 * /api/visits:
 *   post:
 *     summary: Create a new visit request
 *     tags: [Visits]
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
 *               - requestedDate
 *               - reason
 *             properties:
 *               poolId:
 *                 type: string
 *                 description: ID of the pool for the visit
 *               requestedDate:
 *                 type: string
 *                 format: date-time
 *                 description: Requested date for the visit
 *               preferredTimeSlot:
 *                 type: string
 *                 enum: [morning, afternoon, evening, any]
 *                 default: any
 *               reason:
 *                 type: string
 *                 description: Reason for the visit request
 *               description:
 *                 type: string
 *                 description: Additional description
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               contactPhone:
 *                 type: string
 *                 description: Contact phone number
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               specialInstructions:
 *                 type: string
 *                 description: Special instructions for the visit
 *     responses:
 *       201:
 *         description: Visit request created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized to request visit for this pool
 *       404:
 *         description: Pool not found
 */
router.post('/', protect, visitValidationRules(), validate, createVisit);

/**
 * @swagger
 * /api/visits:
 *   get:
 *     summary: Get all visits for user
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, declined, rescheduled, completed, cancelled]
 *         description: Filter by visit status
 *       - in: query
 *         name: poolId
 *         schema:
 *           type: string
 *         description: Filter by pool ID
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of visits with pagination
 */
router.get('/', protect, getVisits);

/**
 * @swagger
 * /api/visits/stats:
 *   get:
 *     summary: Get visit statistics (Admin only)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Visit statistics
 *       403:
 *         description: Not authorized as admin
 */
router.get('/stats', protect, authorize('admin'), getVisitStats);

/**
 * @swagger
 * /api/visits/{id}:
 *   get:
 *     summary: Get single visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     responses:
 *       200:
 *         description: Visit details
 *       403:
 *         description: Not authorized to view this visit
 *       404:
 *         description: Visit not found
 */
router.get('/:id', protect, getVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   put:
 *     summary: Update visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Visit updated successfully
 *       400:
 *         description: Cannot update visit in current status
 *       403:
 *         description: Not authorized to update this visit
 *       404:
 *         description: Visit not found
 */
router.put('/:id', protect, updateVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   delete:
 *     summary: Delete visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     responses:
 *       200:
 *         description: Visit deleted successfully
 *       400:
 *         description: Cannot delete visit in current status
 *       403:
 *         description: Not authorized to delete this visit
 *       404:
 *         description: Visit not found
 */
router.delete('/:id', protect, deleteVisit);

/**
 * @swagger
 * /api/visits/{id}/approve:
 *   put:
 *     summary: Approve visit request (Admin only)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledDate
 *               - scheduledTimeSlot
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               scheduledTimeSlot:
 *                 type: string
 *                 enum: [morning, afternoon, evening]
 *               assignedTechnician:
 *                 type: string
 *               adminNotes:
 *                 type: string
 *               estimatedDuration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Visit approved successfully
 *       400:
 *         description: Visit is not pending approval
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Visit not found
 */
router.put('/:id/approve', protect, authorize('admin'), approvalValidationRules(), validate, approveVisit);

/**
 * @swagger
 * /api/visits/{id}/decline:
 *   put:
 *     summary: Decline visit request (Admin only)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - declineReason
 *             properties:
 *               declineReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visit declined successfully
 *       400:
 *         description: Visit is not pending approval
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Visit not found
 */
router.put('/:id/decline', protect, authorize('admin'), declineValidationRules(), validate, declineVisit);

/**
 * @swagger
 * /api/visits/{id}/reschedule:
 *   put:
 *     summary: Reschedule visit (Admin only)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledDate
 *               - scheduledTimeSlot
 *               - rescheduleReason
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               scheduledTimeSlot:
 *                 type: string
 *                 enum: [morning, afternoon, evening]
 *               rescheduleReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visit rescheduled successfully
 *       400:
 *         description: Visit cannot be rescheduled
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Visit not found
 */
router.put('/:id/reschedule', protect, authorize('admin'), rescheduleValidationRules(), validate, rescheduleVisit);

/**
 * @swagger
 * /api/visits/{id}/complete:
 *   put:
 *     summary: Complete visit (Admin only)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     responses:
 *       200:
 *         description: Visit completed successfully
 *       400:
 *         description: Visit cannot be completed
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Visit not found
 */
router.put('/:id/complete', protect, authorize('admin'), completeVisit);

/**
 * @swagger
 * /api/visits/{id}/cancel:
 *   put:
 *     summary: Cancel visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     responses:
 *       200:
 *         description: Visit cancelled successfully
 *       400:
 *         description: Visit cannot be cancelled
 *       403:
 *         description: Not authorized to cancel this visit
 *       404:
 *         description: Visit not found
 */
router.put('/:id/cancel', protect, cancelVisit);

module.exports = router; 