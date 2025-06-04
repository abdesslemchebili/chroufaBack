const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
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
  type: {
    type: String,
    enum: ['chemical', 'cleaning', 'repair', 'inspection', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  measurements: {
    chlorine: Number,
    pH: Number,
    alkalinity: Number,
    temperature: Number
  },
  productsUsed: [{
    name: String,
    quantity: Number,
    unit: String
  }],
  notes: String,
  images: [String],
  performedAt: {
    type: Date,
    default: Date.now
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
RecordSchema.index({ poolId: 1, performedAt: -1 });
RecordSchema.index({ userId: 1 });

module.exports = mongoose.model('Record', RecordSchema);