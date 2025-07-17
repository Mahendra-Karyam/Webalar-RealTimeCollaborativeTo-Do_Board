const express = require('express');
const Action = require('../models/Action');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get recent actions (last 20)
router.get('/', auth, async (req, res) => {
  try {
    const actions = await Action.find({ boardId: 'main-board' })
      .populate('user', 'name email')
      .populate('task', 'title status priority')
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(actions);
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get actions for a specific task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const actions = await Action.find({ 
      task: req.params.taskId,
      boardId: 'main-board'
    })
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json(actions);
  } catch (error) {
    console.error('Get task actions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get actions for a specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const actions = await Action.find({ 
      user: req.params.userId,
      boardId: 'main-board'
    })
      .populate('task', 'title status priority')
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(actions);
  } catch (error) {
    console.error('Get user actions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get actions by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const actions = await Action.find({ 
      type: req.params.type,
      boardId: 'main-board'
    })
      .populate('user', 'name email')
      .populate('task', 'title status priority')
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(actions);
  } catch (error) {
    console.error('Get actions by type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 