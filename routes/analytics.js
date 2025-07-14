const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getClientAnalytics,
  getTechnicianAnalytics,
  getRevenueAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalClients:
 *                           type: number
 *                         totalPools:
 *                           type: number
 *                         totalVisits:
 *                           type: number
 *                         totalRevenue:
 *                           type: number
 *                     visitStats:
 *                       type: array
 *                     revenueStats:
 *                       type: object
 *                     monthlyRevenue:
 *                       type: array
 *                     technicianPerformance:
 *                       type: array
 *                     serviceTypeStats:
 *                       type: array
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/dashboard', protect, authorize('admin'), getDashboardAnalytics);

/**
 * @swagger
 * /api/analytics/clients:
 *   get:
 *     summary: Get client analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
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
 *         description: Client analytics data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/clients', protect, authorize('admin'), getClientAnalytics);

/**
 * @swagger
 * /api/analytics/technicians:
 *   get:
 *     summary: Get technician analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Technician analytics data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/technicians', protect, authorize('admin'), getTechnicianAnalytics);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *         description: Group revenue data by time period
 *     responses:
 *       200:
 *         description: Revenue analytics data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */
router.get('/revenue', protect, authorize('admin'), getRevenueAnalytics);

module.exports = router; 