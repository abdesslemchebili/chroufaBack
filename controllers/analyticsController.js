const Visit = require('../models/Visit');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Pool = require('../models/Pool');
const Task = require('../models/Task');
const Record = require('../models/Record');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin only)
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get total clients
    const totalClients = await User.countDocuments({ role: 'user' });
    
    // Get total pools
    const totalPools = await Pool.countDocuments();
    
    // Get visit statistics
    const visitStats = await Visit.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get revenue statistics
    const revenueStats = await Invoice.aggregate([
      { $match: { ...dateFilter, status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageInvoice: { $avg: '$total' },
          totalInvoices: { $sum: 1 }
        }
      }
    ]);
    
    // Get monthly revenue for chart
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { ...dateFilter, status: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get technician performance
    const technicianPerformance = await Visit.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: '$assignedTechnician',
          completedVisits: { $sum: 1 },
          totalDuration: { $sum: '$estimatedDuration' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'technician'
        }
      },
      {
        $project: {
          technicianName: { $arrayElemAt: ['$technician.name', 0] },
          completedVisits: 1,
          totalDuration: 1,
          averageDuration: { $divide: ['$totalDuration', '$completedVisits'] }
        }
      }
    ]);
    
    // Get service type distribution
    const serviceTypeStats = await Visit.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalClients,
          totalPools,
          totalVisits: visitStats.reduce((sum, stat) => sum + stat.count, 0),
          totalRevenue: revenueStats[0]?.totalRevenue || 0
        },
        visitStats,
        revenueStats: revenueStats[0] || { totalRevenue: 0, averageInvoice: 0, totalInvoices: 0 },
        monthlyRevenue,
        technicianPerformance,
        serviceTypeStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client analytics
// @route   GET /api/analytics/clients
// @access  Private (Admin only)
exports.getClientAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get client statistics with visit and revenue data
    const clientStats = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $lookup: {
          from: 'visits',
          localField: '_id',
          foreignField: 'client',
          as: 'visits'
        }
      },
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'client',
          as: 'invoices'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalVisits: { $size: '$visits' },
          completedVisits: {
            $size: {
              $filter: {
                input: '$visits',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$invoices',
                    cond: { $eq: ['$$this.status', 'paid'] }
                  }
                },
                as: 'invoice',
                in: '$$invoice.total'
              }
            }
          },
          lastVisit: { $max: '$visits.createdAt' },
          averageInvoiceValue: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$invoices',
                    cond: { $eq: ['$$this.status', 'paid'] }
                  }
                },
                as: 'invoice',
                in: '$$invoice.total'
              }
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);
    
    const totalClients = await User.countDocuments({ role: 'user' });
    
    res.status(200).json({
      success: true,
      data: {
        clients: clientStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalClients,
          pages: Math.ceil(totalClients / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technician analytics
// @route   GET /api/analytics/technicians
// @access  Private (Admin only)
exports.getTechnicianAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get technician performance metrics
    const technicianStats = await User.aggregate([
      { $match: { role: 'admin' } },
      {
        $lookup: {
          from: 'visits',
          localField: '_id',
          foreignField: 'assignedTechnician',
          as: 'assignedVisits'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalAssigned: { $size: '$assignedVisits' },
          completedVisits: {
            $size: {
              $filter: {
                input: '$assignedVisits',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          pendingVisits: {
            $size: {
              $filter: {
                input: '$assignedVisits',
                cond: { $eq: ['$$this.status', 'pending'] }
              }
            }
          },
          completionRate: {
            $cond: {
              if: { $gt: [{ $size: '$assignedVisits' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$assignedVisits',
                            cond: { $eq: ['$$this.status', 'completed'] }
                          }
                        }
                      },
                      { $size: '$assignedVisits' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          },
          averageDuration: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$assignedVisits',
                    cond: { $eq: ['$$this.status', 'completed'] }
                  }
                },
                as: 'visit',
                in: '$$visit.estimatedDuration'
              }
            }
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: technicianStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private (Admin only)
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    let groupStage = {};
    if (groupBy === 'month') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        }
      };
    } else if (groupBy === 'week') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        }
      };
    } else if (groupBy === 'day') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
      };
    }
    
    // Get revenue by time period
    const revenueByPeriod = await Invoice.aggregate([
      { $match: { ...dateFilter, status: 'paid' } },
      {
        $group: {
          ...groupStage,
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
          averageInvoice: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);
    
    // Get revenue by payment method
    const revenueByPaymentMethod = await Invoice.aggregate([
      { $match: { ...dateFilter, status: 'paid' } },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get outstanding invoices
    const outstandingInvoices = await Invoice.aggregate([
      { $match: { ...dateFilter, status: { $in: ['sent', 'overdue'] } } },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        revenueByPeriod,
        revenueByPaymentMethod,
        outstandingInvoices: outstandingInvoices[0] || { totalOutstanding: 0, count: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
}; 