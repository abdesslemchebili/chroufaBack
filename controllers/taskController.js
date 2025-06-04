const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    // Add user ID to request body
    req.body.userId = req.user.id;
    
    const task = await Task.create(req.body);
    
    res.status(201).json({
      success: true,
      data: task,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    // Build query
    let query = { userId: req.user.id };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by pool if provided
    if (req.query.poolId) {
      query.poolId = req.query.poolId;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.scheduledDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const tasks = await Task.find(query)
      .sort({ scheduledDate: 1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Task.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: tasks,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    // Handle sync conflicts
    if (req.body.lastModified && new Date(req.body.lastModified) < new Date(task.lastModified)) {
      return res.status(409).json({
        success: false,
        message: 'Sync conflict detected',
        serverData: task,
        timestamp: new Date(),
        syncStatus: 'conflict'
      });
    }
    
    // Update lastModified timestamp
    req.body.lastModified = new Date();
    
    // Update task
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: task,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }
    
    await task.remove();
    
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

// @desc    Complete task
// @route   PUT /api/tasks/:id/complete
// @access  Private
exports.completeTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    // Update task status and completion date
    task = await Task.findByIdAndUpdate(req.params.id, {
      status: 'completed',
      completedDate: new Date(),
      lastModified: new Date()
    }, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: task,
      timestamp: new Date(),
      syncStatus: 'synced'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk sync tasks
// @route   POST /api/tasks/sync
// @access  Private
exports.syncTasks = async (req, res, next) => {
  try {
    const { tasks, lastSyncTimestamp } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Tasks must be an array'
      });
    }
    
    const results = {
      updated: [],
      conflicts: [],
      created: []
    };
    
    // Process each task
    for (const taskData of tasks) {
      if (taskData._id) {
        // Existing task - update
        const existingTask = await Task.findById(taskData._id);
        
        if (!existingTask) {
          // Task doesn't exist on server, create it
          const newTask = await Task.create({
            ...taskData,
            userId: req.user.id,
            syncStatus: 'synced',
            lastModified: new Date()
          });
          results.created.push(newTask);
          continue;
        }
        
        // Check ownership
        if (existingTask.userId.toString() !== req.user.id && req.user.role !== 'admin') {
          continue; // Skip this task
        }
        
        // Check for conflicts
        if (new Date(taskData.lastModified) < new Date(existingTask.lastModified)) {
          results.conflicts.push({
            clientData: taskData,
            serverData: existingTask
          });
          continue;
        }
        
        // Update task
        const updatedTask = await Task.findByIdAndUpdate(
          taskData._id,
          {
            ...taskData,
            syncStatus: 'synced',
            lastModified: new Date()
          },
          { new: true, runValidators: true }
        );
        
        results.updated.push(updatedTask);
      } else {
        // New task - create
        const newTask = await Task.create({
          ...taskData,
          userId: req.user.id,
          syncStatus: 'synced',
          lastModified: new Date()
        });
        
        results.created.push(newTask);
      }
    }
    
    // Update user's last sync timestamp
    await User.findByIdAndUpdate(req.user.id, {
      lastSyncTimestamp: new Date()
    });
    
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
