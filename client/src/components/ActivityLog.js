import React, { useState, useEffect } from 'react';
import { Activity, User, Edit3, Trash2, Plus, Move, Clock, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const ActivityLog = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchActions();
    
    // Listen for real-time action updates
    if (socket) {
      socket.on('action-logged', (newAction) => {
        setActions(prev => [newAction, ...prev.slice(0, 19)]);
      });
    }
    
    return () => {
      if (socket) {
        socket.off('action-logged');
      }
    };
  }, [socket]);

  const fetchActions = async () => {
    try {
      const response = await axios.get('/api/actions');
      setActions(response.data);
    } catch (error) {
      console.error('Error fetching activity log:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to view activity log');
      } else {
        toast.error('Failed to fetch activity log');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action.type) {
      case 'create':
        return <Plus className="w-4 h-4 text-success-500" />;
      case 'update':
        return <Edit3 className="w-4 h-4 text-primary-500" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-danger-500" />;
      case 'move':
        return <Move className="w-4 h-4 text-warning-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action.type) {
      case 'create':
        return 'bg-success-50 border-success-200';
      case 'update':
        return 'bg-primary-50 border-primary-200';
      case 'delete':
        return 'bg-danger-50 border-danger-200';
      case 'move':
        return 'bg-warning-50 border-warning-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActionText = (action) => {
    switch (action.type) {
      case 'create':
        return 'created a new task';
      case 'update':
        return 'updated a task';
      case 'delete':
        return 'deleted a task';
      case 'move':
        return 'moved a task';
      default:
        return 'performed an action';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'text-primary-600 bg-primary-100';
      case 'inProgress':
        return 'text-warning-600 bg-warning-100';
      case 'done':
        return 'text-success-600 bg-success-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {actions.length} actions
        </span>
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {actions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No activity yet</p>
            <p className="text-gray-400 text-xs">Actions will appear here</p>
          </div>
        ) : (
          actions.map((action) => (
            <div
              key={action._id}
              className={`p-3 rounded-lg border ${getActionColor(action)} animate-fade-in`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-500" />
                      <span className="text-sm font-medium text-gray-800">
                        {action.user?.name || 'Unknown User'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {getActionText(action)}
                    </span>
                  </div>

                  {/* Task Details */}
                  {action.task && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {action.task.title}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded-full ${getStatusColor(action.task.status)}`}>
                          {action.task.status}
                        </span>
                        {action.task.priority && (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {action.task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(new Date(action.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Showing last {actions.length} actions
        </p>
      </div>
    </div>
  );
};

export default ActivityLog; 