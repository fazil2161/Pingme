import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatNumber } from '../../utils';
import api from '../../services/api';

const UserCard = ({ user, onUserUpdate, showFollowButton = true }) => {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const isOwnProfile = currentUser?._id === user._id;

  const handleFollow = async () => {
    if (isOwnProfile) return;

    setIsLoading(true);
    try {
      const endpoint = isFollowing ? `/users/${user._id}/unfollow` : `/users/${user._id}/follow`;
      const response = await api.post(endpoint);
      const newIsFollowing = !isFollowing;
      const followersCount = user.followersCount + (newIsFollowing ? 1 : -1);
      
      setIsFollowing(newIsFollowing);
      
      if (onUserUpdate) {
        onUserUpdate(user._id, { 
          isFollowing: newIsFollowing,
          followersCount
        });
      }

      showToast(
        newIsFollowing ? `Now following ${user.username}` : `Unfollowed ${user.username}`,
        'success'
      );
    } catch (error) {
      console.error('Error following user:', error);
      showToast('Failed to update follow status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center space-x-3">
        <Link to={`/profile/${user._id}`}>
          <img
            src={user.profilePicture}
            alt={user.username}
            className="h-12 w-12 rounded-full object-cover"
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link 
            to={`/profile/${user._id}`}
            className="block"
          >
            <h3 className="font-medium text-gray-900 dark:text-white hover:underline truncate">
              {user.username}
            </h3>
            {user.bio && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.bio}
              </p>
            )}
          </Link>
          
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatNumber(user.followersCount || 0)} followers</span>
            <span>{formatNumber(user.followingCount || 0)} following</span>
          </div>
        </div>

        {showFollowButton && !isOwnProfile && (
          <button
            onClick={handleFollow}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFollowing
                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
          >
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              isFollowing ? 'Unfollow' : 'Follow'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard; 