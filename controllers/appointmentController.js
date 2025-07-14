const appointmentService = require('../services/appointmentService');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Pool = require('../models/Pool');

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
  try {
    const {
      poolId,
      serviceType,
      frequency,
      startDate,
      endDate,
      preferredTimeSlot,
      estimatedDuration,
      notes,
      specialInstructions,
      price,
      currency
    } = req.body;

    // Check if pool exists and belongs to user (for regular users)
    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }

    if (req.user.role === 'user' && pool.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create appointment for this pool'
      });
    }

    const appointmentData = {
      client: req.user.role === 'user' ? req.user.id : req.body.clientId,
      pool: poolId,
      serviceType,
      frequency,
      startDate,
      endDate,
      preferredTimeSlot,
      estimatedDuration,
      notes,
      specialInstructions,
      price,
      currency,
      assignedTechnician: req.body.assignedTechnician || null
    };

    const appointment = await appointmentService.createAppointment(appointmentData);

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, clientId, technicianId, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by client
    if (req.user.role === 'user') {
      query.client = req.user.id;
    } else if (clientId) {
      query.client = clientId;
    }

    // Filter by technician
    if (technicianId) {
      query.assignedTechnician = technicianId;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'client', select: 'name email' },
        { path: 'pool', select: 'name address' },
        { path: 'assignedTechnician', select: 'name' }
      ],
      sort: { nextServiceDate: 1 }
    };

    const appointments = await Appointment.paginate(query, options);

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('pool', 'name address')
      .populate('assignedTechnician', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && appointment.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && appointment.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    const updatedAppointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && appointment.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    const updatedAppointment = await appointmentService.updateAppointmentStatus(
      req.params.id,
      status
    );

    res.status(200).json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && appointment.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client appointments
// @route   GET /api/appointments/client/:clientId
// @access  Private (Admin only)
exports.getClientAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;

    const appointments = await appointmentService.getClientAppointments(
      req.params.clientId,
      status
    );

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technician appointments
// @route   GET /api/appointments/technician/:technicianId
// @access  Private (Admin only)
exports.getTechnicianAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;

    const appointments = await appointmentService.getTechnicianAppointments(
      req.params.technicianId,
      status
    );

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available technicians
// @route   GET /api/appointments/technicians
// @access  Private (Admin only)
exports.getAvailableTechnicians = async (req, res, next) => {
  try {
    const technicians = await User.find({ role: 'admin' })
      .select('name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: technicians
    });
  } catch (error) {
    next(error);
  }
}; 