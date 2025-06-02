import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  ShareIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { formatDate, formatNumber, linkifyText, copyToClipboard } from '../../utils';
import api from '../../services/api';
import ConfirmationModal from '../UI/ConfirmationModal';

const PostCard = ({ post, onPostUpdate, onPostDelete }) => {
  // All hooks must be called before any early returns
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Guard against invalid post data - now after all hooks
  if (!post || !post.author || !post._id) {
    console.warn('PostCard received invalid post data:', post);
    return null;
  }

  const handleLike = async () => {
    try {
      const response = await api.post(`/posts/${post._id}/like`);
      const { isLiked: newIsLiked, likesCount: newLikesCount } = response.data.data;
      
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);
    } catch (error) {
      console.error('Error liking post:', error);
      showToast('Failed to like post', 'error');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await api.post(`/posts/${post._id}/comments`, {
        text: newComment.trim()
      });

      setNewComment('');
      setShowComments(true);
      showToast('Comment added successfully!', 'success');
      
      if (onPostUpdate) {
        onPostUpdate(post._id, { 
          comments: [...post.comments, response.data.data.comment]
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const success = await copyToClipboard(postUrl);
    
    if (success) {
      showToast('Post link copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      setShowDeleteModal(false);
      showToast('Post deleted successfully!', 'success');
      
      if (onPostDelete) {
        onPostDelete(post._id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const isOwnPost = post.author._id === user?._id;

  return (
    <div className="card p-4 mb-4">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author._id}`}>
            <img
              src={post.author.profilePicture || '/default-avatar.png'}
              alt={post.author.username || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
          </Link>
          <div>
            <Link 
              to={`/profile/${post.author._id}`}
              className="font-medium text-gray-900 dark:text-white hover:underline"
            >
              {post.author.username || 'Unknown User'}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Post Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="py-1">
                <button
                  onClick={handleShare}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Copy link
                </button>
                {isOwnPost && (
                  <button
                    onClick={handleDeleteClick}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Delete post
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p 
          className="text-gray-900 dark:text-white whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: linkifyText(post.text) }}
        />
        
        {/* Post Image */}
        {post.image && (
          <img
            src={post.image}
            alt="Post content"
            className="mt-3 rounded-lg max-h-96 w-full object-cover"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center space-x-6 py-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
            isLiked 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
          }`}
        >
          {isLiked ? (
            <HeartIconSolid className="h-5 w-5" />
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
          <span>{formatNumber(likesCount)}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ChatBubbleOvalLeftIcon className="h-5 w-5" />
          <span>{formatNumber(post.comments?.length || 0)}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <ShareIcon className="h-5 w-5" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Add Comment */}
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex space-x-3">
              <img
                src={user?.profilePicture}
                alt={user?.username}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="input-field w-full"
                  maxLength={500}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="btn-primary px-4 py-1 text-sm disabled:opacity-50"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments?.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <Link to={`/profile/${comment.author._id}`}>
                  <img
                    src={comment.author.profilePicture}
                    alt={comment.author.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link 
                      to={`/profile/${comment.author._id}`}
                      className="font-medium text-sm text-gray-900 dark:text-white hover:underline"
                    >
                      {comment.author.username}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PostCard; 