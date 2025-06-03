import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  MapPinIcon, 
  LinkIcon, 
  CalendarIcon,
  PencilIcon,
  UserPlusIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';
import { formatNumber, formatFullDate } from '../utils';
import PostFeed from '../components/Post/PostFeed';
import UserCard from '../components/User/UserCard';
import EditProfile from '../components/User/EditProfile';
import api from '../services/api';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const targetUserId = userId || currentUser?._id;
  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;

      try {
        setLoading(true);
        const response = await api.get(`/users/${targetUserId}`);
        const userData = response.data.data.user;
        
        setProfileUser(userData);
        setIsFollowing(userData.isFollowing || false);
        
        // Clear followers and following lists when switching users
        setFollowers([]);
        setFollowing([]);
        setActiveTab('posts');
      } catch (error) {
        console.error('Error fetching profile:', error);
        showToast('Failed to load profile', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId, navigate, showToast]);

  const handleFollow = async () => {
    if (isOwnProfile) return;

    setIsFollowLoading(true);
    try {
      const endpoint = isFollowing ? `/users/${targetUserId}/unfollow` : `/users/${targetUserId}/follow`;
      const response = await api.post(endpoint);
      const newIsFollowing = !isFollowing;
      const followersCount = profileUser.followersCount + (newIsFollowing ? 1 : -1);
      
      setIsFollowing(newIsFollowing);
      setProfileUser(prev => ({
        ...prev,
        followersCount,
        isFollowing: newIsFollowing
      }));

      showToast(
        newIsFollowing ? `Now following ${profileUser.username}` : `Unfollowed ${profileUser.username}`,
        'success'
      );
    } catch (error) {
      console.error('Error following user:', error);
      showToast('Failed to update follow status', 'error');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleProfileUpdate = async (updatedUserData) => {
    // Update the profile user data with the complete user information from server
    setProfileUser(prev => ({
      ...prev,
      ...updatedUserData,
      // Keep the counts that might not be in the update response
      followersCount: prev.followersCount,
      followingCount: prev.followingCount,
      postsCount: prev.postsCount
    }));
  };

  const fetchFollowers = async () => {
    if (followersLoading || !targetUserId) return;
    
    setFollowersLoading(true);
    try {
      const response = await api.get(`/users/${targetUserId}/followers`);
      setFollowers(response.data.data.followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      showToast('Failed to load followers', 'error');
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (followingLoading || !targetUserId) return;
    
    setFollowingLoading(true);
    try {
      const response = await api.get(`/users/${targetUserId}/following`);
      setFollowing(response.data.data.following);
    } catch (error) {
      console.error('Error fetching following:', error);
      showToast('Failed to load following', 'error');
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'followers' && followers.length === 0) {
      fetchFollowers();
    } else if (tab === 'following' && following.length === 0) {
      fetchFollowing();
    }
  };

  const handleUserUpdate = (userId, updates) => {
    if (activeTab === 'followers') {
      setFollowers(prev => prev.map(user => 
        user._id === userId ? { ...user, ...updates } : user
      ));
    } else if (activeTab === 'following') {
      setFollowing(prev => prev.map(user => 
        user._id === userId ? { ...user, ...updates } : user
      ));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card p-6 animate-pulse">
          <div className="flex space-x-4">
            <div className="h-24 w-24 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            User not found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            The user you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0 mb-4 sm:mb-0">
            <img
              src={profileUser.profilePicture}
              alt={profileUser.username}
              className="h-24 w-24 rounded-full object-cover"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profileUser.username}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {profileUser.email}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 sm:mt-0">
                {isOwnProfile ? (
                  <button
                    onClick={handleEditProfile}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowLoading ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        {isFollowing ? (
                          <UserMinusIcon className="h-4 w-4" />
                        ) : (
                          <UserPlusIcon className="h-4 w-4" />
                        )}
                        <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-gray-900 dark:text-white mb-4">
                {profileUser.bio}
              </p>
            )}

            {/* User Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              {profileUser.location && (
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{profileUser.location}</span>
                </div>
              )}
              {profileUser.website && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="h-4 w-4" />
                  <a
                    href={profileUser.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {profileUser.website}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Joined {formatFullDate(profileUser.createdAt)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <button
                onClick={() => handleTabChange('following')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(profileUser.followingCount || 0)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">Following</span>
              </button>
              <button
                onClick={() => handleTabChange('followers')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(profileUser.followersCount || 0)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
              </button>
              <button
                onClick={() => handleTabChange('posts')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(profileUser.postsCount || 0)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">Posts</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="card mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => handleTabChange('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'posts'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => handleTabChange('followers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'followers'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Followers ({formatNumber(profileUser.followersCount || 0)})
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'following'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Following ({formatNumber(profileUser.followingCount || 0)})
            </button>
            <button
              onClick={() => handleTabChange('likes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'likes'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Likes
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'posts' && (
          <PostFeed feedType="profile" userId={targetUserId} />
        )}
        
        {activeTab === 'followers' && (
          <div>
            {followersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="flex space-x-3">
                      <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : followers.length > 0 ? (
              <div className="space-y-4">
                {followers.map(follower => (
                  <UserCard
                    key={follower._id}
                    user={follower}
                    showFollowButton={follower._id !== currentUser?._id}
                    onUserUpdate={handleUserUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {isOwnProfile ? "You don't have any followers yet." : `${profileUser.username} doesn't have any followers yet.`}
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'following' && (
          <div>
            {followingLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="flex space-x-3">
                      <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : following.length > 0 ? (
              <div className="space-y-4">
                {following.map(followedUser => (
                  <UserCard
                    key={followedUser._id}
                    user={followedUser}
                    showFollowButton={followedUser._id !== currentUser?._id}
                    onUserUpdate={handleUserUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {isOwnProfile ? "You're not following anyone yet." : `${profileUser.username} isn't following anyone yet.`}
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'likes' && (
          <div className="card p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Liked posts will be shown here.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfile
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={profileUser}
        onUserUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default Profile; 