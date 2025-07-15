const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const VisitSchema = new mongoose.Schema({
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
  requestedDate: {
    type: Date,
    required: [true, 'Requested date is required']
  },
  preferredTimeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'any'],
    default: 'any'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'rescheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  scheduledTimeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', null],
    default: null
  },
  reason: {
    type: String,
    required: [true, 'Reason for visit is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  declineReason: {
    type: String,
    trim: true
  },
  rescheduleReason: {
    type: String,
    trim: true
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 60
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  contactPhone: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  },
  declinedAt: {
    type: Date,
    default: null
  },
  rescheduledAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
VisitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
VisitSchema.index({ client: 1, status: 1 });
VisitSchema.index({ pool: 1, status: 1 });
VisitSchema.index({ requestedDate: 1 });
VisitSchema.index({ scheduledDate: 1 });
VisitSchema.index({ status: 1, createdAt: 1 });

// Add pagination plugin
VisitSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Visit', VisitSchema); 