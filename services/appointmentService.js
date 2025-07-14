const Appointment = require('../models/Appointment');
const Visit = require('../models/Visit');
const notificationService = require('./notificationService');

/**
 * Generate upcoming visits for recurring appointments
 * This is called by the cron job in server.js
 */
exports.generateUpcomingVisits = async () => {
  try {
    console.log('Generating upcoming visits for recurring appointments...');
    
    // Get all active recurring appointments
    const appointments = await Appointment.find({
      status: 'active',
      frequency: { $ne: 'one_time' },
      autoGenerateVisits: true
    }).populate('client pool');
    
    console.log(`Found ${appointments.length} active recurring appointments`);
    
    let generatedCount = 0;
    
    for (const appointment of appointments) {
      try {
        // Check if we need to generate a new visit
        const shouldGenerate = await shouldGenerateVisit(appointment);
        
        if (shouldGenerate) {
          const visit = await generateVisitFromAppointment(appointment);
          if (visit) {
            generatedCount++;
            console.log(`Generated visit ${visit._id} for appointment ${appointment._id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing appointment ${appointment._id}:`, error);
      }
    }
    
    console.log(`Generated ${generatedCount} new visits`);
  } catch (error) {
    console.error('Error generating upcoming visits:', error);
  }
};

/**
 * Check if a visit should be generated for an appointment
 */
const shouldGenerateVisit = async (appointment) => {
  // If no next service date, calculate it
  if (!appointment.nextServiceDate) {
    appointment.nextServiceDate = appointment.calculateNextServiceDate();
    await appointment.save();
  }
  
  // Check if next service date is within the next 7 days
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return appointment.nextServiceDate <= nextWeek;
};

/**
 * Generate a visit from an appointment
 */
const generateVisitFromAppointment = async (appointment) => {
  try {
    // Check if a visit already exists for this date
    const existingVisit = await Visit.findOne({
      client: appointment.client._id,
      pool: appointment.pool._id,
      requestedDate: {
        $gte: new Date(appointment.nextServiceDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before
        $lte: new Date(appointment.nextServiceDate.getTime() + 24 * 60 * 60 * 1000)  // 1 day after
      }
    });
    
    if (existingVisit) {
      console.log(`Visit already exists for appointment ${appointment._id} on ${appointment.nextServiceDate}`);
      return null;
    }
    
    // Create new visit
    const visit = new Visit({
      client: appointment.client._id,
      pool: appointment.pool._id,
      requestedDate: appointment.nextServiceDate,
      preferredTimeSlot: appointment.preferredTimeSlot,
      reason: `Scheduled ${appointment.serviceType} service`,
      description: `Recurring service appointment - ${appointment.notes || ''}`,
      assignedTechnician: appointment.assignedTechnician,
      estimatedDuration: appointment.estimatedDuration,
      specialInstructions: appointment.specialInstructions,
      priority: 'medium'
    });
    
    await visit.save();
    
    // Update appointment
    appointment.lastServiceDate = appointment.nextServiceDate;
    appointment.nextServiceDate = appointment.calculateNextServiceDate();
    await appointment.save();
    
    // Send notification to client
    await notificationService.sendVisitRequestNotification(visit);
    
    return visit;
  } catch (error) {
    console.error(`Error generating visit for appointment ${appointment._id}:`, error);
    return null;
  }
};

/**
 * Create a new recurring appointment
 */
exports.createAppointment = async (appointmentData) => {
  try {
    const appointment = new Appointment(appointmentData);
    
    // Set next service date
    appointment.nextServiceDate = appointment.startDate;
    
    await appointment.save();
    
    // If it's a one-time appointment, generate visit immediately
    if (appointment.frequency === 'one_time') {
      await generateVisitFromAppointment(appointment);
    }
    
    return appointment;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an appointment and regenerate visits if needed
 */
exports.updateAppointment = async (appointmentId, updateData) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    // Update appointment
    Object.assign(appointment, updateData);
    
    // Recalculate next service date if frequency or start date changed
    if (updateData.frequency || updateData.startDate) {
      appointment.nextServiceDate = appointment.calculateNextServiceDate();
    }
    
    await appointment.save();
    
    return appointment;
  } catch (error) {
    throw error;
  }
};

/**
 * Pause or cancel an appointment
 */
exports.updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    appointment.status = status;
    await appointment.save();
    
    // If cancelled, cancel any pending visits
    if (status === 'cancelled') {
      await Visit.updateMany(
        {
          client: appointment.client,
          pool: appointment.pool,
          status: 'pending',
          reason: { $regex: `Scheduled ${appointment.serviceType} service` }
        },
        { status: 'cancelled' }
      );
    }
    
    return appointment;
  } catch (error) {
    throw error;
  }
};

/**
 * Get appointments for a client
 */
exports.getClientAppointments = async (clientId, status = null) => {
  try {
    const query = { client: clientId };
    
    if (status) {
      query.status = status;
    }
    
    const appointments = await Appointment.find(query)
      .populate('pool', 'name address')
      .populate('assignedTechnician', 'name')
      .sort({ nextServiceDate: 1 });
    
    return appointments;
  } catch (error) {
    throw error;
  }
};

/**
 * Get appointments for a technician
 */
exports.getTechnicianAppointments = async (technicianId, status = null) => {
  try {
    const query = { assignedTechnician: technicianId };
    
    if (status) {
      query.status = status;
    }
    
    const appointments = await Appointment.find(query)
      .populate('client', 'name email')
      .populate('pool', 'name address')
      .sort({ nextServiceDate: 1 });
    
    return appointments;
  } catch (error) {
    throw error;
  }
}; 