import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import KanbanBoard from './KanbanBoard';
import { CheckSquare } from 'lucide-react';

const Tasks = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Tasks</h1>
              <p className="text-gray-600">Manage and track all your tasks</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Task Management</h2>
          </div>
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
};

export default Tasks;