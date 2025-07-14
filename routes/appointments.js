const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getClientAppointments,
  getTechnicianAppointments,
  getAvailableTechnicians
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules for appointment creation
const appointmentValidationRules = () => [
  body('poolId')
    .isMongoId()
    .withMessage('Valid pool ID is required'),
  body('serviceType')
    .isIn(['cleaning', 'chemical_check', 'equipment_maintenance', 'inspection', 'repair', 'other'])
    .withMessage('Valid service type is required'),
  body('frequency')
    .isIn(['one_time', 'weekly', 'biweekly', 'monthly', 'quarterly'])
    .withMessage('Valid frequency is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('preferredTimeSlot')
    .isIn(['morning', 'afternoon', 'evening', 'any'])
    .withMessage('Valid time slot is required'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Estimated duration must be between 15 and 480 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special instructions must be less than 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters (e.g., USD)'),
  body('assignedTechnician')
    .optional()
    .isMongoId()
    .withMessage('Valid technician ID is required'),
  body('clientId')
    .optional()
    .isMongoId()
    .withMessage('Valid client ID is required')
];

// Validation rules for appointment update
const appointmentUpdateValidationRules = () => [
  body('serviceType')
    .optional()
    .isIn(['cleaning', 'chemical_check', 'equipment_maintenance', 'inspection', 'repair', 'other'])
    .withMessage('Valid service type is required'),
  body('frequency')
    .optional()
    .isIn(['one_time', 'weekly', 'biweekly', 'monthly', 'quarterly'])
    .withMessage('Valid frequency is required'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('preferredTimeSlot')
    .optional()
    .isIn(['morning', 'afternoon', 'evening', 'any'])
    .withMessage('Valid time slot is required'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Estimated duration must be between 15 and 480 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special instructions must be less than 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters (e.g., USD)'),
  body('assignedTechnician')
    .optional()
    .isMongoId()
    .withMessage('Valid technician ID is required')
];

// Validation rules for status update
const statusValidationRules = () => [
  body('status')
    .isIn(['active', 'paused', 'cancelled', 'completed'])
    .withMessage('Valid status is required')
];

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
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
 *               - serviceType
 *               - frequency
 *               - startDate
 *               - preferredTimeSlot
 *             properties:
 *               poolId:
 *                 type: string
 *                 description: ID of the pool
 *               serviceType:
 *                 type: string
 *                 enum: [cleaning, chemical_check, equipment_maintenance, inspection, repair, other]
 *               frequency:
 *                 type: string
 *                 enum: [one_time, weekly, biweekly, monthly, quarterly]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               preferredTimeSlot:
 *                 type: string
 *                 enum: [morning, afternoon, evening, any]
 *               estimatedDuration:
 *                 type: number
 *                 description: Duration in minutes
 *               notes:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 example: USD
 *               assignedTechnician:
 *                 type: string
 *               clientId:
 *                 type: string
 *                 description: Required for admin users
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Pool not found
 */
router.post('/', protect, appointmentValidationRules(), validate, createAppointment);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, cancelled, completed]
 *         description: Filter by appointment status
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client ID (admin only)
 *       - in: query
 *         name: technicianId
 *         schema:
 *           type: string
 *         description: Filter by technician ID
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
 *         description: List of appointments
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getAppointments);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get single appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to access this appointment
 *       404:
 *         description: Appointment not found
 */
router.get('/:id', protect, getAppointment);

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceType:
 *                 type: string
 *                 enum: [cleaning, chemical_check, equipment_maintenance, inspection, repair, other]
 *               frequency:
 *                 type: string
 *                 enum: [one_time, weekly, biweekly, monthly, quarterly]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               preferredTimeSlot:
 *                 type: string
 *                 enum: [morning, afternoon, evening, any]
 *               estimatedDuration:
 *                 type: number
 *               notes:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               assignedTechnician:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to update this appointment
 *       404:
 *         description: Appointment not found
 */
router.put('/:id', protect, appointmentUpdateValidationRules(), validate, updateAppointment);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   put:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
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
 *                 enum: [active, paused, cancelled, completed]
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to update this appointment
 *       404:
 *         description: Appointment not found
 */
router.put('/:id/status', protect, statusValidationRules(), validate, updateAppointmentStatus);

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to delete this appointment
 *       404:
 *         description: Appointment not found
 */
router.delete('/:id', protect, deleteAppointment);

/**
 * @swagger
 * /api/appointments/client/{clientId}:
 *   get:
 *     summary: Get appointments for a specific client (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, cancelled, completed]
 *         description: Filter by appointment status
 *     responses:
 *       200:
 *         description: Client appointments
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/client/:clientId', protect, authorize('admin'), getClientAppointments);

/**
 * @swagger
 * /api/appointments/technician/{technicianId}:
 *   get:
 *     summary: Get appointments for a specific technician (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Technician ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, cancelled, completed]
 *         description: Filter by appointment status
 *     responses:
 *       200:
 *         description: Technician appointments
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/technician/:technicianId', protect, authorize('admin'), getTechnicianAppointments);

/**
 * @swagger
 * /api/appointments/technicians:
 *   get:
 *     summary: Get available technicians (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available technicians
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/technicians', protect, authorize('admin'), getAvailableTechnicians);

module.exports = router; 