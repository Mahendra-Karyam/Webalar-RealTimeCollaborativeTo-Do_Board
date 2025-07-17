const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Task title must be at least 3 characters long'],
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'inProgress', 'done'],
    default: 'todo',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true
  },
  assignedTo: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  hasConflict: {
    type: Boolean,
    default: false
  },
  conflictingVersions: [{
    title: String,
    description: String,
    priority: String,
    assignedTo: String,
    version: Number,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  boardId: {
    type: String,
    default: 'main-board'
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ status: 1, position: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ boardId: 1 });

// Validate unique title per board
taskSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    const existingTask = await this.constructor.findOne({
      title: this.title,
      boardId: this.boardId,
      _id: { $ne: this._id }
    });
    
    if (existingTask) {
      const error = new Error('Task title must be unique within the board');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Increment version on update
taskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ version: this.get('version') + 1 });
  next();
});

// Method to add conflicting version
taskSchema.methods.addConflictingVersion = function(conflictData) {
  this.conflictingVersions.push({
    ...conflictData,
    version: this.version + 1,
    modifiedAt: new Date()
  });
  this.hasConflict = true;
  return this.save();
};

// Method to resolve conflicts
taskSchema.methods.resolveConflict = function(resolutionType, conflictData = null) {
  if (resolutionType === 'merge') {
    // Merge logic here
    this.title = conflictData.title || this.title;
    this.description = conflictData.description || this.description;
    this.priority = conflictData.priority || this.priority;
    this.assignedTo = conflictData.assignedTo || this.assignedTo;
  }
  
  this.conflictingVersions = [];
  this.hasConflict = false;
  this.version += 1;
  return this.save();
};

// Virtual for task age
taskSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema); 