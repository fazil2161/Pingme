import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user && token) {
      // Connect to socket
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      setSocket(newSocket);

      // Connection established
      newSocket.on('connection_established', (data) => {
        console.log('Connected to PingMe server');
      });

      // Handle real-time notifications
      newSocket.on('new_notification', (notification) => {
        showToast(notification.message, 'info', 4000);
      });

      // Handle user online/offline status
      newSocket.on('user_online', (data) => {
        setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
      });

      newSocket.on('user_offline', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      });

      // Handle connection errors
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user, token, showToast]);

  // Send activity update periodically
  useEffect(() => {
    if (socket) {
      const interval = setInterval(() => {
        socket.emit('activity');
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [socket]);

  // Socket utility functions
  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave_room', roomId);
    }
  };

  const sendMessage = (recipientId, message, type = 'text') => {
    if (socket) {
      socket.emit('send_message', {
        recipientId,
        message,
        type
      });
    }
  };

  const startTyping = (recipientId) => {
    if (socket) {
      socket.emit('typing_start', { recipientId });
    }
  };

  const stopTyping = (recipientId) => {
    if (socket) {
      socket.emit('typing_stop', { recipientId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  const value = {
    socket,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 