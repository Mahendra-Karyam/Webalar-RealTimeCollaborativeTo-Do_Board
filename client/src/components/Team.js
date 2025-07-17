import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import { Users, UserPlus, Mail, Phone } from 'lucide-react';

const Team = () => {
  const { user } = useAuth();

  // Mock team data - in a real app, this would come from an API
  const teamMembers = [
    {
      id: 1,
      name: 'John Doe',
      role: 'Project Manager',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      avatar: 'JD',
      status: 'online'
    },
    {
      id: 2,
      name: 'Jane Smith',
      role: 'Frontend Developer',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 234-5678',
      avatar: 'JS',
      status: 'online'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      role: 'Backend Developer',
      email: 'mike.johnson@example.com',
      phone: '+1 (555) 345-6789',
      avatar: 'MJ',
      status: 'away'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      role: 'UI/UX Designer',
      email: 'sarah.wilson@example.com',
      phone: '+1 (555) 456-7890',
      avatar: 'SW',
      status: 'offline'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Team</h1>
              <p className="text-gray-600">Manage your team members and collaboration</p>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-primary-600 mb-2">{teamMembers.length}</div>
            <p className="text-gray-600">Total Members</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-success-600 mb-2">
              {teamMembers.filter(member => member.status === 'online').length}
            </div>
            <p className="text-gray-600">Online</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-warning-600 mb-2">
              {teamMembers.filter(member => member.status === 'away').length}
            </div>
            <p className="text-gray-600">Away</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-gray-600 mb-2">
              {teamMembers.filter(member => member.status === 'offline').length}
            </div>
            <p className="text-gray-600">Offline</p>
          </div>
        </div>

        {/* Team Members */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Team Members</h2>
            <button className="btn-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Member
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{member.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    member.status === 'online' ? 'bg-success-500' :
                    member.status === 'away' ? 'bg-warning-500' :
                    'bg-gray-400'
                  }`}></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="btn-secondary w-full text-sm">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team; 