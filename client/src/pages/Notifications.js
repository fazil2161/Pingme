import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  UserPlusIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../utils';
import api from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data.data.notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        showToast('Failed to load notifications', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [showToast]);

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
      };

      socket.on('new_notification', handleNewNotification);

      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [socket]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like_post':
      case 'like_comment':
        return <HeartIcon className="h-5 w-5 text-red-500" />;
      case 'comment_post':
      case 'reply_comment':
        return <ChatBubbleOvalLeftIcon className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlusIcon className="h-5 w-5 text-green-500" />;
      case 'retweet':
        return <ShareIcon className="h-5 w-5 text-purple-500" />;
      case 'mention_post':
      case 'mention_comment':
        return <ChatBubbleOvalLeftIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <HeartIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, sender, relatedPost, message } = notification;
    const username = sender?.username || 'Someone';
    const post = relatedPost;
    
    // Handle different notification types from the server
    switch (type) {
      case 'like_post':
        return (
          <>
            <strong>{username}</strong> liked your post
            {post && post.text && (
              <span className="text-gray-500 dark:text-gray-400">
                : "{post.text.slice(0, 50)}{post.text.length > 50 ? '...' : ''}"
              </span>
            )}
          </>
        );
      case 'comment_post':
        return (
          <>
            <strong>{username}</strong> commented on your post
            {post && post.text && (
              <span className="text-gray-500 dark:text-gray-400">
                : "{post.text.slice(0, 50)}{post.text.length > 50 ? '...' : ''}"
              </span>
            )}
          </>
        );
      case 'follow':
        return (
          <>
            <strong>{username}</strong> started following you
          </>
        );
      case 'retweet':
        return (
          <>
            <strong>{username}</strong> shared your post
          </>
        );
      case 'like_comment':
        return (
          <>
            <strong>{username}</strong> liked your comment
          </>
        );
      case 'reply_comment':
        return (
          <>
            <strong>{username}</strong> replied to your comment
          </>
        );
      case 'mention_post':
        return (
          <>
            <strong>{username}</strong> mentioned you in a post
          </>
        );
      case 'mention_comment':
        return (
          <>
            <strong>{username}</strong> mentioned you in a comment
          </>
        );
      default:
        return message || `${username} interacted with your content`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex space-x-3">
                <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'unread', 'like_post', 'comment_post', 'follow'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {filterType === 'like_post' ? 'Likes' : 
               filterType === 'comment_post' ? 'Comments' :
               filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType === 'unread' && unreadCount > 0 && (
                <span className="ml-1">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`card p-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                !notification.isRead ? 'border-l-4 border-blue-500' : ''
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markAsRead(notification._id);
                }
              }}
            >
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  {notification.sender && notification.sender._id ? (
                    <Link to={`/profile/${notification.sender._id}`}>
                      <img
                        src={notification.sender.profilePicture || 'https://via.placeholder.com/40x40.png?text=User'}
                        alt={notification.sender.username || 'User'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getNotificationIcon(notification.type)}
                      <p className="text-sm text-gray-900 dark:text-white">
                        {getNotificationMessage(notification)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(notification.createdAt)}
                  </p>

                  {/* Post preview for post-related notifications */}
                  {notification.relatedPost && notification.relatedPost._id && notification.relatedPost.text && 
                   (notification.type === 'like_post' || notification.type === 'comment_post' || notification.type === 'retweet' || notification.type === 'mention_post') && (
                    <Link
                      to={`/post/${notification.relatedPost._id}`}
                      className="block mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {notification.relatedPost.text.slice(0, 100)}
                      {notification.relatedPost.text.length > 100 && '...'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <HeartIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p>
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 