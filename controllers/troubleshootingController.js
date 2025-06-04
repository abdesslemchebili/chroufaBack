const TroubleshootingGuide = require('../models/TroubleshootingGuide');

// @desc    Create new troubleshooting guide
// @route   POST /api/troubleshooting
// @access  Private
exports.createGuide = async (req, res, next) => {
  try {
    // Add user ID to request body
    req.body.createdBy = req.user.id;
    
    const guide = await TroubleshootingGuide.create(req.body);
    
    res.status(201).json({
      success: true,
      data: guide
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all troubleshooting guides
// @route   GET /api/troubleshooting
// @access  Private
exports.getGuides = async (req, res, next) => {
  try {
    // Build query
    let query = {};
    
    // If not admin, only show public guides or guides created by user
    if (req.user.role !== 'admin') {
      query.$or = [
        { isPublic: true },
        { createdBy: req.user.id }
      ];
    }
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Search by text if provided
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    let guides;
    
    // If searching, sort by text score
    if (req.query.search) {
      guides = await TroubleshootingGuide.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(startIndex)
        .limit(limit);
    } else {
      guides = await TroubleshootingGuide.find(query)
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);
    }
    
    const total = await TroubleshootingGuide.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: guides.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: guides
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single troubleshooting guide
// @route   GET /api/troubleshooting/:id
// @access  Private
exports.getGuide = async (req, res, next) => {
  try {
    const guide = await TroubleshootingGuide.findById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }
    
    // Check if guide is public or belongs to user
    if (!guide.isPublic && guide.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this guide'
      });
    }
    
    res.status(200).json({
      success: true,
      data: guide
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update troubleshooting guide
// @route   PUT /api/troubleshooting/:id
// @access  Private
exports.updateGuide = async (req, res, next) => {
  try {
    let guide = await TroubleshootingGuide.findById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }
    
    // Check if guide belongs to user or user is admin
    if (guide.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this guide'
      });
    }
    
    // Update lastModified timestamp
    req.body.lastModified = new Date();
    
    // Update guide
    guide = await TroubleshootingGuide.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: guide
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete troubleshooting guide
// @route   DELETE /api/troubleshooting/:id
// @access  Private
exports.deleteGuide = async (req, res, next) => {
  try {
    const guide = await TroubleshootingGuide.findById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }
    
    // Check if guide belongs to user or user is admin
    if (guide.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this guide'
      });
    }
    
    await guide.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};