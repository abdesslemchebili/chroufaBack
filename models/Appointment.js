const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required']
  },
  pool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pool',
    required: [true, 'Pool is required']
  },
  serviceType: {
    type: String,
    enum: ['cleaning', 'chemical_check', 'equipment_maintenance', 'inspection', 'repair', 'other'],
    required: [true, 'Service type is required']
  },
  frequency: {
    type: String,
    enum: ['one_time', 'weekly', 'biweekly', 'monthly', 'quarterly'],
    default: 'one_time'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    default: null // null for ongoing recurring appointments
  },
  preferredTimeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'any'],
    default: 'any'
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 60
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  lastServiceDate: {
    type: Date,
    default: null
  },
  nextServiceDate: {
    type: Date,
    required: true
  },
  autoGenerateVisits: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  }
}, {
  timestamps: true
});

// Calculate next service date based on frequency
AppointmentSchema.methods.calculateNextServiceDate = function() {
  const nextDate = new Date(this.nextServiceDate || this.startDate);
  
  switch (this.frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    default:
      return null; // one_time appointments don't have next date
  }
  
  return nextDate;
};

// Generate next visit when current one is completed
AppointmentSchema.methods.generateNextVisit = async function() {
  if (this.frequency === 'one_time' || this.status !== 'active') {
    return null;
  }
  
  const nextDate = this.calculateNextServiceDate();
  if (!nextDate) return null;
  
  // Check if we've reached the end date
  if (this.endDate && nextDate > this.endDate) {
    this.status = 'completed';
    await this.save();
    return null;
  }
  
  // Create new visit
  const Visit = require('./Visit');
  const visit = new Visit({
    client: this.client,
    pool: this.pool,
    requestedDate: nextDate,
    preferredTimeSlot: this.preferredTimeSlot,
    reason: `Scheduled ${this.serviceType} service`,
    description: `Recurring service appointment`,
    assignedTechnician: this.assignedTechnician,
    estimatedDuration: this.estimatedDuration,
    specialInstructions: this.specialInstructions
  });
  
  await visit.save();
  
  // Update appointment
  this.lastServiceDate = this.nextServiceDate;
  this.nextServiceDate = nextDate;
  await this.save();
  
  return visit;
};

// Index for better query performance
AppointmentSchema.index({ client: 1, status: 1 });
AppointmentSchema.index({ pool: 1, status: 1 });
AppointmentSchema.index({ nextServiceDate: 1 });
AppointmentSchema.index({ assignedTechnician: 1, nextServiceDate: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema); 