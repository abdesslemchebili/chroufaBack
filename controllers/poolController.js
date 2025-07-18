const Pool = require('../models/Pool');
const User = require('../models/User');

// @desc    Create new pool
// @route   POST /api/pools
// @access  Private
exports.createPool = async (req, res, next) => {
  try {
    const { name, address, owner, type, size, volume } = req.body;
    
    // Check if the owner exists
    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pool owner not found'
      });
    }
    
    // Create pool with simplified structure
    const poolData = {
      name,
      address,
      owner,
      type
    };
    
    // Add optional fields if provided
    if (size) {
      poolData.size = size;
    }
    
    if (volume) {
      poolData.volume = volume;
    }
    
    const pool = await Pool.create(poolData);
    
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
    let query = {};
    
    // If user is not admin, only show their pools
    if (req.user.role !== 'admin') {
      query.owner = req.user.id;
    }
    
    const pools = await Pool.find(query).populate('owner', 'name email');
    
    res.status(200).json({
      success: true,
      count: pools.length,
      data: pools
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single pool
// @route   GET /api/pools/:id
// @access  Private
exports.getPool = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is not admin, only allow access to their own pools
    if (req.user.role !== 'admin') {
      query.owner = req.user.id;
    }
    
    const pool = await Pool.findOne(query).populate('owner', 'name email');
    
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
    let query = { _id: req.params.id };
    
    // If user is not admin, only allow updates to their own pools
    if (req.user.role !== 'admin') {
      query.owner = req.user.id;
    }
    
    let pool = await Pool.findOne(query);
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    // Update pool with new data
    const { name, address, owner, type, size, volume, notes, status } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (type !== undefined) updateData.type = type;
    if (size !== undefined) updateData.size = size;
    if (volume !== undefined) updateData.volume = volume;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    
    // Handle owner change if provided
    if (owner !== undefined) {
      // Check if the new owner exists
      const newOwner = await User.findById(owner);
      if (!newOwner) {
        return res.status(404).json({
          success: false,
          message: 'New pool owner not found'
        });
      }
      updateData.owner = owner;
    }
    
    pool = await Pool.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('owner', 'name email');
    
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
    let query = { _id: req.params.id };
    
    // If user is not admin, only allow deletion of their own pools
    if (req.user.role !== 'admin') {
      query.owner = req.user.id;
    }
    
    const pool = await Pool.findOne(query);
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Pool not found'
      });
    }
    
    await Pool.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
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
    let query = { _id: req.params.id };
    
    // If user is not admin, only allow status updates to their own pools
    if (req.user.role !== 'admin') {
      query.owner = req.user.id;
    }
    
    const pool = await Pool.findOne(query);
    
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