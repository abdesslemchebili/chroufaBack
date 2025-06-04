const mongoose = require('mongoose');

const PoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a pool name'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: [true, 'Please add a street address'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please add a city'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Please add a state'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Please add a zip code'],
      trim: true
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specifications: {
    type: {
      type: String,
      enum: ['residential', 'commercial', 'public'],
      required: true
    },
    volume: {
      value: {
        type: Number,
        required: [true, 'Please add pool volume'],
        min: 0
      },
      unit: {
        type: String,
        enum: ['gallons', 'liters'],
        default: 'gallons'
      }
    },
    surfaceArea: {
      value: {
        type: Number,
        required: [true, 'Please add surface area'],
        min: 0
      },
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft'
      }
    }
  },
  equipment: [{
    type: {
      type: String,
      enum: ['pump', 'filter', 'heater', 'chlorinator', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    model: String,
    serialNumber: String,
    installationDate: Date,
    lastServiceDate: Date
  }],
  chemicalLevels: {
    idealRanges: {
      chlorine: {
        min: { type: Number, default: 1 },
        max: { type: Number, default: 3 }
      },
      pH: {
        min: { type: Number, default: 7.2 },
        max: { type: Number, default: 7.6 }
      },
      alkalinity: {
        min: { type: Number, default: 80 },
        max: { type: Number, default: 120 }
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  notes: String,
  images: [String],
  lastInspection: {
    date: Date,
    inspector: String,
    notes: String
  }
}, {
  timestamps: true
});

// Index for faster queries
PoolSchema.index({ userId: 1 });
PoolSchema.index({ 'address.zipCode': 1 });

module.exports = mongoose.model('Pool', PoolSchema); 