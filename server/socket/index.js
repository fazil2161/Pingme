const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store active connections
const activeConnections = new Map();
const userSocketMap = new Map(); // userId -> socketId

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get the user from database
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const username = socket.user.username;
    
    console.log(`🔌 User ${username} connected (Socket ID: ${socket.id})`);
    
    // Store connection
    activeConnections.set(socket.id, {
      userId,
      username,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    // Map user to socket for easy lookup
    userSocketMap.set(userId, socket.id);
    
    // Join user to their personal room for notifications
    socket.join(`user_${userId}`);
    
    // Update user's last active timestamp
    User.findByIdAndUpdate(userId, { 
      lastActive: new Date() 
    }).catch(err => console.error('Error updating last active:', err));
    
    // Handle user going online
    socket.broadcast.emit('user_online', {
      userId,
      username,
      timestamp: new Date()
    });
    
    // Send initial data to newly connected user
    socket.emit('connection_established', {
      message: 'Connected to PingMe',
      userId,
      timestamp: new Date()
    });
    
    // Handle joining specific rooms
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${username} joined room: ${roomId}`);
    });
    
    // Handle leaving specific rooms
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${username} left room: ${roomId}`);
    });
    
    // Handle real-time messaging (if implementing chat)
    socket.on('send_message', (data) => {
      const { recipientId, message, type = 'text' } = data;
      
      // Emit to recipient if they're online
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new_message', {
          senderId: userId,
          senderUsername: username,
          message,
          type,
          timestamp: new Date()
        });
      }
      
      console.log(`Message from ${username} to ${recipientId}: ${message}`);
    });
    
    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { recipientId } = data;
      const recipientSocketId = userSocketMap.get(recipientId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_typing', {
          userId,
          username,
          timestamp: new Date()
        });
      }
    });
    
    socket.on('typing_stop', (data) => {
      const { recipientId } = data;
      const recipientSocketId = userSocketMap.get(recipientId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_stop_typing', {
          userId,
          username,
          timestamp: new Date()
        });
      }
    });
    
    // Handle activity updates
    socket.on('activity', () => {
      const connection = activeConnections.get(socket.id);
      if (connection) {
        connection.lastActivity = new Date();
      }
    });
    
    // Handle user status updates
    socket.on('status_update', (status) => {
      socket.broadcast.emit('user_status_change', {
        userId,
        username,
        status,
        timestamp: new Date()
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${username} disconnected (Reason: ${reason})`);
      
      // Remove from active connections
      activeConnections.delete(socket.id);
      userSocketMap.delete(userId);
      
      // Update user's last active timestamp
      User.findByIdAndUpdate(userId, { 
        lastActive: new Date() 
      }).catch(err => console.error('Error updating last active on disconnect:', err));
      
      // Notify other users that this user went offline
      socket.broadcast.emit('user_offline', {
        userId,
        username,
        timestamp: new Date()
      });
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${username}:`, error);
    });
  });
  
  // Helper functions accessible from other parts of the application
  io.notifyUser = (userId, notificationData) => {
    const socketId = userSocketMap.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('new_notification', notificationData);
      return true; // User is online
    }
    return false; // User is offline
  };
  
  io.notifyFollowers = (userId, notificationData) => {
    // This would require getting the user's followers and notifying each one
    // Implementation depends on your follower system
    io.to(`user_${userId}`).emit('follower_notification', notificationData);
  };
  
  io.broadcastToRoom = (roomId, event, data) => {
    io.to(roomId).emit(event, data);
  };
  
  io.getActiveUsers = () => {
    return Array.from(activeConnections.values()).map(conn => ({
      userId: conn.userId,
      username: conn.username,
      connectedAt: conn.connectedAt,
      lastActivity: conn.lastActivity
    }));
  };
  
  io.isUserOnline = (userId) => {
    return userSocketMap.has(userId.toString());
  };
  
  io.getUserSocketId = (userId) => {
    return userSocketMap.get(userId.toString());
  };
  
  // Cleanup inactive connections periodically
  setInterval(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    for (const [socketId, connection] of activeConnections) {
      if (connection.lastActivity < fiveMinutesAgo) {
        console.log(`Cleaning up inactive connection for user ${connection.username}`);
        activeConnections.delete(socketId);
        userSocketMap.delete(connection.userId);
        
        // Force disconnect the socket if it's still connected
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
  }, 60000); // Check every minute
  
  console.log('🚀 Socket.io server initialized');
};

// Helper functions for creating specific notifications
const createNotificationData = (type, sender, data = {}) => {
  const baseNotification = {
    type,
    sender: {
      _id: sender._id,
      username: sender.username,
      profilePicture: sender.profilePicture
    },
    timestamp: new Date(),
    ...data
  };
  
  return baseNotification;
};

const notificationTypes = {
  LIKE_POST: 'like_post',
  LIKE_COMMENT: 'like_comment',
  COMMENT_POST: 'comment_post',
  REPLY_COMMENT: 'reply_comment',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  MENTION_POST: 'mention_post',
  MENTION_COMMENT: 'mention_comment',
  RETWEET: 'retweet',
  POST_PUBLISHED: 'post_published'
};

module.exports = {
  socketHandler,
  createNotificationData,
  notificationTypes
}; 