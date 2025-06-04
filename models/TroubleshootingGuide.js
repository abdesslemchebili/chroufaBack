const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: String,
  videoUrl: String
});

const TroubleshootingGuideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['water-quality', 'equipment', 'cleaning', 'general'],
    required: true
  },
  symptoms: [String],
  steps: [StepSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Text index for search functionality
TroubleshootingGuideSchema.index({ 
  title: 'text', 
  description: 'text', 
  symptoms: 'text',
  'steps.title': 'text',
  'steps.description': 'text'
});

module.exports = mongoose.model('TroubleshootingGuide', TroubleshootingGuideSchema);