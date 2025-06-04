const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  poolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pool',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly'],
    default: 'none'
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'conflict'],
    default: 'synced'
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('Task', TaskSchema);