import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import KanbanBoard from './KanbanBoard';
import ActivityLog from './ActivityLog';
import { LayoutDashboard, Activity, X } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [showActivityLog, setShowActivityLog] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-2">Todo</div>
              <p className="text-gray-600">Tasks to be started</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-warning-600 mb-2">In Progress</div>
              <p className="text-gray-600">Currently working on</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-success-600 mb-2">Done</div>
              <p className="text-gray-600">Completed tasks</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Kanban Board */}
          <div className="flex-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Task Board</h2>
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Activity className="w-5 h-5" />
                  {showActivityLog ? 'Hide' : 'Show'} Activity Log
                </button>
              </div>
              <KanbanBoard />
            </div>
          </div>

          {/* Activity Log Sidebar */}
          {showActivityLog && (
            <div className="lg:w-80 animate-slide-in">
              <div className="card p-6 h-fit sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Activity Log</h3>
                  <button
                    onClick={() => setShowActivityLog(false)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <ActivityLog />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Activity Log Modal */}
        {showActivityLog && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Activity Log</h3>
                <button
                  onClick={() => setShowActivityLog(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ActivityLog />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 