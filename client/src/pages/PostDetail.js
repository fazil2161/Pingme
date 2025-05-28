import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PostCard from '../components/Post/PostCard';
import api from '../services/api';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/posts/${postId}`);
        setPost(response.data.data.post);
      } catch (error) {
        console.error('Error fetching post:', error);
        showToast('Post not found', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, navigate, showToast]);

  const handlePostUpdate = (updatedPostId, updates) => {
    if (updatedPostId === postId) {
      setPost(prev => ({ ...prev, ...updates }));
    }
  };

  const handlePostDelete = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card p-4 animate-pulse">
          <div className="flex space-x-3">
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Post not found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>Back</span>
      </button>

      {/* Post Detail */}
      <PostCard
        post={post}
        onPostUpdate={handlePostUpdate}
        onPostDelete={handlePostDelete}
      />

      {/* Related Posts or Suggestions could go here */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          More from {post.author.username}
        </h3>
        <div className="card p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Related posts feature coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostDetail; 