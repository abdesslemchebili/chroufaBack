const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoiceStatus,
  getInvoiceStats,
  sendInvoiceReminder
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules for invoice creation
const invoiceValidationRules = () => [
  body('visitId')
    .isMongoId()
    .withMessage('Valid visit ID is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item description must be between 1 and 200 characters'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a positive number'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Validation rules for status update
const statusValidationRules = () => [
  body('status')
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'check'])
    .withMessage('Invalid payment method')
];

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create a new invoice (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitId
 *               - items
 *             properties:
 *               visitId:
 *                 type: string
 *                 description: ID of the completed visit
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               tax:
 *                 type: number
 *                 default: 0
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Visit not found
 */
router.post('/', protect, authorize('admin'), invoiceValidationRules(), validate, createInvoice);

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, paid, overdue, cancelled]
 *         description: Filter by invoice status
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client ID (admin only)
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
 *         description: List of invoices
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getInvoices);

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get single invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to access this invoice
 *       404:
 *         description: Invoice not found
 */
router.get('/:id', protect, getInvoice);

/**
 * @swagger
 * /api/invoices/{id}/status:
 *   put:
 *     summary: Update invoice status (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
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
 *                 enum: [draft, sent, paid, overdue, cancelled]
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, bank_transfer, check]
 *     responses:
 *       200:
 *         description: Invoice status updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Invoice not found
 */
router.put('/:id/status', protect, authorize('admin'), statusValidationRules(), validate, updateInvoiceStatus);

/**
 * @swagger
 * /api/invoices/stats:
 *   get:
 *     summary: Get invoice statistics (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Invoice statistics
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/stats', protect, authorize('admin'), getInvoiceStats);

/**
 * @swagger
 * /api/invoices/{id}/remind:
 *   post:
 *     summary: Send invoice reminder (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice reminder sent successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Invoice not found
 */
router.post('/:id/remind', protect, authorize('admin'), sendInvoiceReminder);

module.exports = router; 