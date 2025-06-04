const Pool = require('../models/Pool');
const User = require('../models/User');

// @desc    Create new pool and assign to user (Admin only)
// @route   POST /api/pools
// @access  Admin
exports.createPool = async (req, res, next) => {
  try {
    // Check if the target user exists
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const pool = await Pool.create(req.body);
    
    res.status(201).json({
      success: true,
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pools for user
// @route   GET /api/pools
// @access  Private
exports.getPools = async (req, res, next) => {
  try {
    const responses = await Pool.find({});
    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses
    });
    console.log('====================================');
    console.log(responses,"here");
    console.log('====================================');
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// @desc    Get single pool
// @route   GET /api/pools/:id
// @access  Private
exports.getPool = async (req, res, next) => {
  try {
    const pool = await Pool.findOne({
      _id: req.params.id,
    });
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pool
// @route   PUT /api/pools/:id
// @access  Private
exports.updatePool = async (req, res, next) => {
  try {
    let pool = await Pool.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    pool = await Pool.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete pool
// @route   DELETE /api/pools/:id
// @access  Private
exports.deletePool = async (req, res, next) => {
  try {
    const pool = await Pool.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    await pool.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pool equipment
// @route   PUT /api/pools/:id/equipment
// @access  Private
exports.updateEquipment = async (req, res, next) => {
  try {
    const pool = await Pool.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    pool.equipment = req.body.equipment;
    await pool.save();
    
    res.status(200).json({
      success: true,
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update chemical levels ideal ranges
// @route   PUT /api/pools/:id/chemical-levels
// @access  Private
exports.updateChemicalLevels = async (req, res, next) => {
  try {
    const pool = await Pool.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    pool.chemicalLevels.idealRanges = req.body.idealRanges;
    await pool.save();
    
    res.status(200).json({
      success: true,
      data: pool
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pool status
// @route   PUT /api/pools/:id/status
// @access  Private
exports.updateStatus = async (req, res, next) => {
  try {
    const pool = await Pool.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    pool.status = req.body.status;
    await pool.save();
    
    res.status(200).json({
      success: true,
      data: pool
    });
  } catch (error) {
    next(error);
  }
}; 