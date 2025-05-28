const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get the user from the database
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Middleware to verify refresh token
const authenticateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Get the user from the database and check if refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired',
        error: 'REFRESH_TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    console.error('Refresh token middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during refresh token authentication'
    });
  }
};

// Middleware to check if user is the owner of a resource
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // If roles are specified, check if user has required role
    if (allowedRoles.length > 0) {
      const hasRole = allowedRoles.includes(req.user.role);
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
    }
    
    next();
  };
};

// Middleware to check if user owns the resource
const checkResourceOwnership = (resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const userId = req.user._id.toString();
      
      // This middleware should be used after authenticateToken
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Check different resource types
      let resource = null;
      
      // Try to find the resource in different models
      const Post = require('../models/Post');
      const Comment = require('../models/Comment');
      const User = require('../models/User');
      
      // First try Post
      resource = await Post.findById(resourceId);
      if (resource) {
        if (resource.author.toString() !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You can only modify your own posts'
          });
        }
        req.resource = resource;
        return next();
      }
      
      // Then try Comment
      resource = await Comment.findById(resourceId);
      if (resource) {
        if (resource.author.toString() !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You can only modify your own comments'
          });
        }
        req.resource = resource;
        return next();
      }
      
      // Finally try User
      resource = await User.findById(resourceId);
      if (resource) {
        if (resourceId !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You can only modify your own profile'
          });
        }
        req.resource = resource;
        return next();
      }
      
      // Resource not found
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
      
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization'
      });
    }
  };
};

// Middleware for optional authentication (user might or might not be logged in)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -refreshToken');
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
        console.log('Optional auth token error:', error.message);
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  
  return { accessToken, refreshToken };
};

// Helper function to set secure cookie options
const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  };
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  authorize,
  checkResourceOwnership,
  optionalAuth,
  generateTokens,
  getCookieOptions
}; 