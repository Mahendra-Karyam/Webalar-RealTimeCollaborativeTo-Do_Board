import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSocket } from '../contexts/SocketContext';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { Plus, Trello, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const KanbanBoard = () => {
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchTasks();
    
    if (socket) {
      socket.emit('join-board', 'main-board');
      
      socket.on('task-created', handleTaskCreated);
      socket.on('task-updated', handleTaskUpdated);
      socket.on('task-deleted', handleTaskDeleted);
      socket.on('task-moved', handleTaskMoved);
    }

    return () => {
      if (socket) {
        socket.emit('leave-board', 'main-board');
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-deleted');
        socket.off('task-moved');
      }
    };
  }, [socket]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      const data = response.data;
      
      const groupedTasks = {
        todo: data.filter(task => task.status === 'todo'),
        inProgress: data.filter(task => task.status === 'inProgress'),
        done: data.filter(task => task.status === 'done')
      };
      setTasks(groupedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to view tasks');
      } else {
        toast.error('Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => ({
      ...prev,
      [newTask.status]: [...prev[newTask.status], newTask]
    }));
    toast.success('New task created!');
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(status => {
        newTasks[status] = newTasks[status].map(task =>
          task._id === updatedTask._id ? updatedTask : task
        );
      });
      return newTasks;
    });
    toast.success('Task updated!');
  };

  const handleTaskDeleted = (deletedTask) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(status => {
        newTasks[status] = newTasks[status].filter(task => task._id !== deletedTask._id);
      });
      return newTasks;
    });
    toast.success('Task deleted!');
  };

  const handleTaskMoved = (movedTask) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      // Remove from all columns
      Object.keys(newTasks).forEach(status => {
        newTasks[status] = newTasks[status].filter(task => task._id !== movedTask._id);
      });
      // Add to new column
      newTasks[movedTask.status] = [...newTasks[movedTask.status], movedTask];
      return newTasks;
    });
    toast.success('Task moved!');
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reorder within same column
      const column = tasks[source.droppableId];
      const newColumn = Array.from(column);
      const [removed] = newColumn.splice(source.index, 1);
      newColumn.splice(destination.index, 0, removed);
      
      setTasks(prev => ({
        ...prev,
        [source.droppableId]: newColumn
      }));
    } else {
      // Move to different column
      const sourceColumn = tasks[source.droppableId];
      const destColumn = tasks[destination.droppableId];
      const [movedTask] = sourceColumn.splice(source.index, 1);
      destColumn.splice(destination.index, 0, movedTask);
      
      setTasks(prev => ({
        ...prev,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      }));

      // Update task status on server
      try {
        await axios.patch(`/api/tasks/${draggableId}`, {
          status: destination.droppableId
        });
      } catch (error) {
        console.error('Error updating task status:', error);
        toast.error('Failed to update task status');
        fetchTasks(); // Revert changes
      }
    }
  };

  const getColumnIcon = (status) => {
    switch (status) {
      case 'todo':
        return <Trello className="w-5 h-5" />;
      case 'inProgress':
        return <Clock className="w-5 h-5" />;
      case 'done':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Trello className="w-5 h-5" />;
    }
  };

  const getColumnTitle = (status) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'inProgress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  const getColumnColor = (status) => {
    switch (status) {
      case 'todo':
        return 'border-primary-200 bg-primary-50';
      case 'inProgress':
        return 'border-warning-200 bg-warning-50';
      case 'done':
        return 'border-success-200 bg-success-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(tasks).map((status) => (
            <div key={status} className="space-y-4">
              {/* Column Header */}
              <div className={`flex items-center justify-between p-4 rounded-lg border ${getColumnColor(status)}`}>
                <div className="flex items-center gap-2">
                  {getColumnIcon(status)}
                  <h3 className="font-semibold text-gray-800">{getColumnTitle(status)}</h3>
                  <span className="bg-white text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    {tasks[status].length}
                  </span>
                </div>
                {status === 'todo' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary p-2 rounded-lg"
                    title="Add new task"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Column Content */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary-100 border-2 border-dashed border-primary-300' : 'bg-gray-50'
                    }`}
                  >
                    {tasks[status].map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 ${snapshot.isDragging ? 'rotate-3 scale-105 shadow-large' : ''}`}
                          >
                            <TaskCard task={task} onUpdate={handleTaskUpdated} onDelete={handleTaskDeleted} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default KanbanBoard; 