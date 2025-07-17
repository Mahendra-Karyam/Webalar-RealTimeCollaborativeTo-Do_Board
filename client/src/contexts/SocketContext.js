import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinBoard = (boardId) => {
    if (socket && isConnected) {
      socket.emit('join-board', boardId);
    }
  };

  const leaveBoard = (boardId) => {
    if (socket && isConnected) {
      socket.emit('leave-board', boardId);
    }
  };

  const emitTaskCreated = (task, boardId) => {
    if (socket && isConnected) {
      socket.emit('task-created', { task, boardId });
    }
  };

  const emitTaskUpdated = (task, boardId) => {
    if (socket && isConnected) {
      socket.emit('task-updated', { task, boardId });
    }
  };

  const emitTaskDeleted = (taskId, boardId) => {
    if (socket && isConnected) {
      socket.emit('task-deleted', { taskId, boardId });
    }
  };

  const emitTaskMoved = (task, fromStatus, toStatus, boardId) => {
    if (socket && isConnected) {
      socket.emit('task-moved', { task, fromStatus, toStatus, boardId });
    }
  };

  const value = {
    socket,
    isConnected,
    joinBoard,
    leaveBoard,
    emitTaskCreated,
    emitTaskUpdated,
    emitTaskDeleted,
    emitTaskMoved,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 