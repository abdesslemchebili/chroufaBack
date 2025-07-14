const mongoose = require('mongoose');

const PoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a pool name'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add a street address'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the pool owner'],
    alias: 'userId' // Keep backward compatibility
  },
  type: {
    type: String,
    enum: ['residential', 'commercial', 'public'],
    required: [true, 'Please specify the pool type']
  },
  size: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['sqft', 'sqm'],
      default: 'sqft'
    }
  },
  volume: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['gallons', 'liters'],
      default: 'gallons'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  notes: String,
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
PoolSchema.index({ owner: 1 });
PoolSchema.index({ address: 1 });

module.exports = mongoose.model('Pool', PoolSchema); 