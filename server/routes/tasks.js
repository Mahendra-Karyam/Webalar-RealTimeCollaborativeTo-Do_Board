const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Action = require('../models/Action');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ boardId: 'main-board' })
      .populate('createdBy', 'name email')
      .sort({ position: 1, createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new task
router.post('/', auth, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assignedTo')
    .optional()
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, description, priority, assignedTo } = req.body;

    // Create task
    const task = new Task({
      title,
      description,
      priority: priority || 'medium',
      assignedTo,
      createdBy: req.user._id,
      boardId: 'main-board'
    });

    await task.save();

    // Log action
    await Action.logAction({
      type: 'create',
      user: req.user._id,
      task: task._id,
      details: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignedTo: task.assignedTo
      },
      boardId: 'main-board'
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to('main-board').emit('task-created', task);
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.patch('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assignedTo')
    .optional()
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check for conflicts
    const { version } = req.body;
    if (version && task.version !== version) {
      // Store conflicting version
      await task.addConflictingVersion(req.body);
      return res.status(409).json({
        error: 'Conflict detected',
        task,
        message: 'Another user has modified this task. Please resolve the conflict.'
      });
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, version: task.version + 1 },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    // Log action
    await Action.logAction({
      type: 'update',
      user: req.user._id,
      task: task._id,
      details: {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        assignedTo: updatedTask.assignedTo
      },
      boardId: 'main-board'
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to('main-board').emit('task-updated', updatedTask);
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Log action
    await Action.logAction({
      type: 'delete',
      user: req.user._id,
      task: task._id,
      details: {
        title: task.title
      },
      boardId: 'main-board'
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to('main-board').emit('task-deleted', task);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Smart assign task
router.post('/smart-assign', auth, async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    // Get all users and their task counts
    const users = await User.find({});
    const userTaskCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Task.countDocuments({
          assignedTo: user.name,
          status: { $in: ['todo', 'inProgress'] }
        });
        return { user, count };
      })
    );

    // Find user with fewest tasks
    const userWithFewestTasks = userTaskCounts.reduce((min, current) =>
      current.count < min.count ? current : min
    );

    res.json({
      assignedTo: userWithFewestTasks.user.name,
      taskCount: userWithFewestTasks.count
    });
  } catch (error) {
    console.error('Smart assign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Move task (for drag and drop)
router.patch('/:id/move', auth, async (req, res) => {
  try {
    const { status, position } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldStatus = task.status;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status, position, version: task.version + 1 },
      { new: true }
    ).populate('createdBy', 'name email');

    // Log action
    await Action.logAction({
      type: 'move',
      user: req.user._id,
      task: task._id,
      details: {
        fromStatus: oldStatus,
        toStatus: status,
        title: task.title
      },
      boardId: 'main-board'
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to('main-board').emit('task-moved', updatedTask);
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resolve task conflict
router.post('/:id/resolve-conflict', auth, async (req, res) => {
  try {
    const { resolutionType, conflictData } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.resolveConflict(resolutionType, conflictData);

    // Log action
    await Action.logAction({
      type: 'resolve_conflict',
      user: req.user._id,
      task: task._id,
      details: {
        title: task.title,
        conflictResolved: true
      },
      boardId: 'main-board'
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to('main-board').emit('task-updated', task);
    }

    res.json(task);
  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 