const Visit = require('../models/Visit');
const User = require('../models/User');
const Pool = require('../models/Pool');
const notificationService = require('../services/notificationService');

// @desc    Create a new visit request
// @route   POST /api/visits
// @access  Private (Client)
exports.createVisit = async (req, res, next) => {
  try {
    const {
      poolId,
      requestedDate,
      preferredTimeSlot,
      reason,
      description,
      contactPhone,
      contactEmail,
      specialInstructions,
      priority
    } = req.body;

    // Check if pool exists and belongs to the user
    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    // Verify pool belongs to the requesting user (unless admin)
    if (req.user.role !== 'admin' && pool.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to request visit for this pool'
      });
    }

    const visit = await Visit.create({
      client: req.user.id,
      pool: poolId,
      requestedDate,
      preferredTimeSlot,
      reason,
      description,
      contactPhone: contactPhone || req.user.phone,
      contactEmail: contactEmail || req.user.email,
      specialInstructions,
      priority
    });

    // Populate client and pool details
    await visit.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address' }
    ]);

    // Send notification to admin about new visit request
    try {
      await notificationService.sendVisitRequestNotification(visit);
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Visit request created successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all visits for user
// @route   GET /api/visits
// @access  Private
exports.getVisits = async (req, res, next) => {
  try {
    const { status, poolId, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    
    // Filter by user role
    if (req.user.role === 'admin') {
      // Admin can see all visits
    } else {
      // Regular users can only see their own visits
      query.client = req.user.id;
    }

    if (status) query.status = status;
    if (poolId) query.pool = poolId;
    
    if (startDate || endDate) {
      query.requestedDate = {};
      if (startDate) query.requestedDate.$gte = new Date(startDate);
      if (endDate) query.requestedDate.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'client', select: 'name email phone' },
        { path: 'pool', select: 'name address' },
        { path: 'assignedTechnician', select: 'name email phone' }
      ],
      sort: { createdAt: -1 }
    };

    const visits = await Visit.paginate(query, options);

    res.status(200).json({
      success: true,
      data: visits.docs,
      pagination: {
        page: visits.page,
        limit: visits.limit,
        totalDocs: visits.totalDocs,
        totalPages: visits.totalPages,
        hasNextPage: visits.hasNextPage,
        hasPrevPage: visits.hasPrevPage
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single visit
// @route   GET /api/visits/:id
// @access  Private
exports.getVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id).populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address specifications' },
      { path: 'assignedTechnician', select: 'name email phone' }
    ]);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && visit.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this visit'
      });
    }

    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update visit (client can only update certain fields)
// @route   PUT /api/visits/:id
// @access  Private
exports.updateVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && visit.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this visit'
      });
    }

    // Clients can only update certain fields and only if status is pending
    if (req.user.role !== 'admin') {
      if (visit.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update visit that is not pending'
        });
      }

      // Only allow updating certain fields for clients
      const allowedFields = ['requestedDate', 'preferredTimeSlot', 'reason', 'description', 'contactPhone', 'contactEmail', 'specialInstructions'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      Object.assign(visit, updateData);
    } else {
      // Admin can update all fields
      Object.assign(visit, req.body);
    }

    await visit.save();

    // Populate references
    await visit.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address' },
      { path: 'assignedTechnician', select: 'name email phone' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Visit updated successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete visit
// @route   DELETE /api/visits/:id
// @access  Private
exports.deleteVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && visit.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this visit'
      });
    }

    // Only allow deletion if status is pending or cancelled
    if (!['pending', 'cancelled'].includes(visit.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete visit that is not pending or cancelled'
      });
    }

    await visit.remove();

    res.status(200).json({
      success: true,
      message: 'Visit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve visit request (Admin only)
// @route   PUT /api/visits/:id/approve
// @access  Private (Admin)
exports.approveVisit = async (req, res, next) => {
  try {
    const { scheduledDate, scheduledTimeSlot, assignedTechnician, adminNotes, estimatedDuration } = req.body;

    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (visit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Visit is not pending approval'
      });
    }

    // Update visit with approval details
    visit.status = 'approved';
    visit.scheduledDate = scheduledDate;
    visit.scheduledTimeSlot = scheduledTimeSlot;
    visit.assignedTechnician = assignedTechnician;
    visit.adminNotes = adminNotes;
    visit.estimatedDuration = estimatedDuration;
    visit.approvedAt = Date.now();

    await visit.save();

    // Populate references
    await visit.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address' },
      { path: 'assignedTechnician', select: 'name email phone' }
    ]);

    // Send notification to client
    try {
      await notificationService.sendVisitApprovalNotification(visit);
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Visit approved successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline visit request (Admin only)
// @route   PUT /api/visits/:id/decline
// @access  Private (Admin)
exports.declineVisit = async (req, res, next) => {
  try {
    const { declineReason } = req.body;

    if (!declineReason) {
      return res.status(400).json({
        success: false,
        message: 'Decline reason is required'
      });
    }

    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (visit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Visit is not pending approval'
      });
    }

    visit.status = 'declined';
    visit.declineReason = declineReason;
    visit.declinedAt = Date.now();

    await visit.save();

    // Populate references
    await visit.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address' }
    ]);

    // Send notification to client
    try {
      await notificationService.sendVisitDeclineNotification(visit);
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Visit declined successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule visit (Admin only)
// @route   PUT /api/visits/:id/reschedule
// @access  Private (Admin)
exports.rescheduleVisit = async (req, res, next) => {
  try {
    const { scheduledDate, scheduledTimeSlot, rescheduleReason } = req.body;

    if (!rescheduleReason) {
      return res.status(400).json({
        success: false,
        message: 'Reschedule reason is required'
      });
    }

    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (!['approved', 'rescheduled'].includes(visit.status)) {
      return res.status(400).json({
        success: false,
        message: 'Visit must be approved or already rescheduled to reschedule'
      });
    }

    visit.status = 'rescheduled';
    visit.scheduledDate = scheduledDate;
    visit.scheduledTimeSlot = scheduledTimeSlot;
    visit.rescheduleReason = rescheduleReason;
    visit.rescheduledAt = Date.now();

    await visit.save();

    // Populate references
    await visit.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address' },
      { path: 'assignedTechnician', select: 'name email phone' }
    ]);

    // Send notification to client
    try {
      await notificationService.sendVisitRescheduleNotification(visit);
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Visit rescheduled successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete visit (Admin only)
// @route   PUT /api/visits/:id/complete
// @access  Private (Admin)
exports.completeVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (!['approved', 'rescheduled'].includes(visit.status)) {
      return res.status(400).json({
        success: false,
        message: 'Visit must be approved or rescheduled to complete'
      });
    }

    visit.status = 'completed';
    visit.completedAt = Date.now();

    await visit.save();

    // Populate references
    await visit.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address' },
      { path: 'assignedTechnician', select: 'name email phone' }
    ]);

    // Send notification to client
    try {
      await notificationService.sendVisitCompletionNotification(visit);
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Visit completed successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel visit
// @route   PUT /api/visits/:id/cancel
// @access  Private
exports.cancelVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && visit.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this visit'
      });
    }

    if (!['pending', 'approved', 'rescheduled'].includes(visit.status)) {
      return res.status(400).json({
        success: false,
        message: 'Visit cannot be cancelled in its current status'
      });
    }

    visit.status = 'cancelled';

    await visit.save();

    // Populate references
    await visit.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'pool', select: 'name address' },
      { path: 'assignedTechnician', select: 'name email phone' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Visit cancelled successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visit statistics (Admin only)
// @route   GET /api/visits/stats
// @access  Private (Admin)
exports.getVisitStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await Visit.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalVisits = await Visit.countDocuments(query);
    const pendingVisits = await Visit.countDocuments({ ...query, status: 'pending' });
    const approvedVisits = await Visit.countDocuments({ ...query, status: 'approved' });
    const completedVisits = await Visit.countDocuments({ ...query, status: 'completed' });

    res.status(200).json({
      success: true,
      data: {
        total: totalVisits,
        pending: pendingVisits,
        approved: approvedVisits,
        completed: completedVisits,
        breakdown: stats
      }
    });
  } catch (error) {
    next(error);
  }
}; 