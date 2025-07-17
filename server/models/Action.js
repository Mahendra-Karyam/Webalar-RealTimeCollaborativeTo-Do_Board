const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'move', 'assign', 'smart_assign', 'resolve_conflict']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  details: {
    title: String,
    description: String,
    status: String,
    priority: String,
    assignedTo: String,
    fromStatus: String,
    toStatus: String,
    conflictResolved: Boolean,
    smartAssignedTo: String
  },
  boardId: {
    type: String,
    default: 'main-board'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
actionSchema.index({ timestamp: -1 });
actionSchema.index({ user: 1, timestamp: -1 });
actionSchema.index({ task: 1, timestamp: -1 });
actionSchema.index({ type: 1, timestamp: -1 });
actionSchema.index({ boardId: 1, timestamp: -1 });

// Static method to log an action
actionSchema.statics.logAction = async function(actionData) {
  try {
    const action = new this(actionData);
    await action.save();
    
    // Keep only last 1000 actions per board
    const actionCount = await this.countDocuments({ boardId: actionData.boardId });
    if (actionCount > 1000) {
      const oldestActions = await this.find({ boardId: actionData.boardId })
        .sort({ timestamp: 1 })
        .limit(actionCount - 1000);
      
      if (oldestActions.length > 0) {
        await this.deleteMany({ _id: { $in: oldestActions.map(a => a._id) } });
      }
    }
    
    return action;
  } catch (error) {
    console.error('Error logging action:', error);
    throw error;
  }
};

// Method to get formatted action description
actionSchema.methods.getDescription = function() {
  const descriptions = {
    create: 'created a new task',
    update: 'updated a task',
    delete: 'deleted a task',
    move: `moved a task from ${this.details.fromStatus} to ${this.details.toStatus}`,
    assign: `assigned task to ${this.details.assignedTo}`,
    smart_assign: `smart assigned task to ${this.details.smartAssignedTo}`,
    resolve_conflict: 'resolved a task conflict'
  };
  
  return descriptions[this.type] || 'performed an action';
};

// Virtual for action age
actionSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp;
});

// Ensure virtual fields are serialized
actionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Action', actionSchema); 