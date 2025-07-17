import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, User, Calendar, AlertTriangle, CheckCircle, Clock, Save, X, UserCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import axios from 'axios';
import './TaskCard.css';

const TaskCard = ({ task, onUpdate, onDelete }) => {
  // All hooks must be at the top level
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignedTo: task.assignedTo
  });
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [smartAssignLoading, setSmartAssignLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo
    });
  };

  const handleSave = async () => {
    if (!editData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.patch(`/api/tasks/${task._id}`, editData);
      onUpdate(response.data);
      setIsEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.error || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    try {
      await axios.delete(`/api/tasks/${task._id}`);
      onDelete(task);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error.response?.data?.error || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-danger-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-warning-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-success-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'status-todo';
      case 'inProgress': return 'status-progress';
      case 'done': return 'status-done';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const handleSmartAssign = async () => {
    setSmartAssignLoading(true);
    try {
      const response = await axios.post(`/api/tasks/${task._id}/smart-assign`);
      onUpdate(response.data);
      setIsFlipped(true);
      toast.success(`Task smart assigned to ${response.data.assignedTo}`);
    } catch (error) {
      console.error('Error smart assigning task:', error);
      toast.error(error.response?.data?.error || 'Failed to smart assign task');
    } finally {
      setSmartAssignLoading(false);
    }
  };

  // Flip card back after a delay
  useEffect(() => {
    let timer;
    if (isFlipped) {
      timer = setTimeout(() => {
        setIsFlipped(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isFlipped]);

  if (isEditing) {
    return (
      <div className="card p-4 animate-bounce-in">
        <div className="space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="input-field font-semibold"
            placeholder="Task title"
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="input-field resize-none h-20"
            placeholder="Task description"
          />
          <select
            value={editData.priority}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
            className="input-field"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            type="text"
            value={editData.assignedTo || ''}
            onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
            className="input-field"
            placeholder="Assigned to (optional)"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
      <div className="flip-card-inner">
        {/* Front of card */}
        <div className={`flip-card-front card rounded-lg bg-blue-50 hover:shadow-md transition-all duration-300`}>
          {/* Priority Bar */}
          <div className="flex items-center justify-between p-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-amber-500 font-medium">{task.priority}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSmartAssign} 
                disabled={smartAssignLoading}
                className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                title="Smart Assign"
              >
                {smartAssignLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <User className="w-4 h-4 text-blue-600" />
                )}
              </button>
              <button 
                onClick={handleEdit} 
                className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                title="Edit task"
              >
                <Edit3 className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={handleDelete} 
                className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{task.title}</h3>
            
            {task.description && (
              <p className="text-gray-600 mb-4">{task.description}</p>
            )}
            
            {/* User Assignment */}
            {task.assignedTo && (
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{task.assignedTo}</span>
              </div>
            )}
            
            {/* Date */}
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Created {format(new Date(task.createdAt), 'MMM dd, yyyy')}</span>
            </div>
            
            {/* Conflict Warning */}
            {task.hasConflict && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Conflict detected</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={async () => {
                      try {
                        const response = await axios.post(`/api/tasks/${task._id}/resolve-conflict`, {
                          resolutionType: 'merge'
                        });
                        onUpdate(response.data);
                        toast.success('Conflict resolved with merge');
                      } catch (error) {
                        toast.error('Failed to resolve conflict');
                      }
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                  >
                    Merge
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const response = await axios.post(`/api/tasks/${task._id}/resolve-conflict`, {
                          resolutionType: 'overwrite'
                        });
                        onUpdate(response.data);
                        toast.success('Conflict resolved with overwrite');
                      } catch (error) {
                        toast.error('Failed to resolve conflict');
                      }
                    }}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs"
                  >
                    Keep Mine
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Back of card - Smart Assign info */}
        <div className="flip-card-back card rounded-lg bg-blue-50 border border-blue-200">
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Smart Assigned!</h3>
            <p className="text-blue-600 mb-4">
              Task assigned to team member with fewest active tasks
            </p>
            {task.assignedTo && (
              <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{task.assignedTo}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
