const Record = require('../models/Record');

// @desc    Create new record
// @route   POST /api/records
// @access  Private
exports.createRecord = async (req, res, next) => {
  try {
    // Add user ID to request body
    req.body.userId = req.user.id;
    
    const record = await Record.create(req.body);
    
    res.status(201).json({
      success: true,
      data: record,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all records for user
// @route   GET /api/records
// @access  Private
exports.getRecords = async (req, res, next) => {
  try {
    // Build query
    let query = { userId: req.user.id };
    
    // Filter by pool if provided
    if (req.query.poolId) {
      query.poolId = req.query.poolId;
    }
    
    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.performedAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const records = await Record.find(query)
      .sort({ performedAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Record.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: records,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single record
// @route   GET /api/records/:id
// @access  Private
exports.getRecord = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    // Check if record belongs to user
    if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this record'
      });
    }
    
    res.status(200).json({
      success: true,
      data: record,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update record
// @route   PUT /api/records/:id
// @access  Private
exports.updateRecord = async (req, res, next) => {
  try {
    let record = await Record.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    // Check if record belongs to user
    if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record'
      });
    }
    
    // Handle sync conflicts
    if (req.body.lastModified && new Date(req.body.lastModified) < new Date(record.lastModified)) {
      return res.status(409).json({
        success: false,
        message: 'Sync conflict detected',
        serverData: record,
        timestamp: new Date(),
        syncStatus: 'conflict'
      });
    }
    
    // Update lastModified timestamp
    req.body.lastModified = new Date();
    
    // Update record
    record = await Record.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: record,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete record
// @route   DELETE /api/records/:id
// @access  Private
exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    // Check if record belongs to user
    if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this record'
      });
    }
    
    await record.remove();
    
    res.status(200).json({
      success: true,
      data: {},
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk sync records
// @route   POST /api/records/sync
// @access  Private
exports.syncRecords = async (req, res, next) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Records must be an array'
      });
    }
    
    const results = {
      updated: [],
      conflicts: [],
      created: []
    };
    
    // Process each record
    for (const recordData of records) {
      if (recordData._id) {
        // Existing record - update
        const existingRecord = await Record.findById(recordData._id);
        
        if (!existingRecord) {
          // Record doesn't exist on server, create it
          const newRecord = await Record.create({
            ...recordData,
            userId: req.user.id,
            syncStatus: 'synced',
            lastModified: new Date()
          });
          results.created.push(newRecord);
          continue;
        }
        
        // Check ownership
        if (existingRecord.userId.toString() !== req.user.id && req.user.role !== 'admin') {
          continue; // Skip this record
        }
        
        // Check for conflicts
        if (new Date(recordData.lastModified) < new Date(existingRecord.lastModified)) {
          results.conflicts.push({
            clientData: recordData,
            serverData: existingRecord
          });
          continue;
        }
        
        // Update record
        const updatedRecord = await Record.findByIdAndUpdate(
          recordData._id,
          {
            ...recordData,
            syncStatus: 'synced',
            lastModified: new Date()
          },
          { new: true, runValidators: true }
        );
        
        results.updated.push(updatedRecord);
      } else {
        // New record - create
        const newRecord = await Record.create({
          ...recordData,
          userId: req.user.id,
          syncStatus: 'synced',
          lastModified: new Date()
        });
        
        results.created.push(newRecord);
      }
    }
    
    res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};