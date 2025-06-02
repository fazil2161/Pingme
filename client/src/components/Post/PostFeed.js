import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useToast } from '../../context/ToastContext';
import PostCard from './PostCard';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import api from '../../services/api';

const PostFeed = forwardRef(({ feedType = 'home', userId = null, hashtag = null }, ref) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { showToast } = useToast();
  const errorShownRef = useRef(false);

  // Construct API endpoint based on feed type
  const getApiEndpoint = () => {
    switch (feedType) {
      case 'profile':
        return `/posts/user/${userId}`;
      case 'hashtag':
        return `/posts/search?hashtag=${hashtag}`;
      case 'explore':
        return '/posts/explore';
      default:
        return '/posts/feed';
    }
  };

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const endpoint = getApiEndpoint();
      const response = await api.get(`${endpoint}?page=${pageNum}&limit=10`);
      
      const { posts: newPosts, totalPages, currentPage } = response.data.data;

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(currentPage < totalPages);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Only show toast once per component mount to avoid spam
      if (!errorShownRef.current) {
        showToast('Failed to load posts', 'error');
        errorShownRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [feedType, userId, hashtag, showToast]);

  const fetchMorePosts = useCallback(async () => {
    if (!hasMore) return;
    await fetchPosts(page, true);
  }, [fetchPosts, page, hasMore]);

  const [isFetching] = useInfiniteScroll(fetchMorePosts, hasMore);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    errorShownRef.current = false; // Reset error flag when component reloads
    fetchPosts(1, false);
  }, [feedType, userId, hashtag]);

  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(post => 
      post._id === postId ? { ...post, ...updates } : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleNewPost = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Expose handleNewPost function to parent components
  useImperativeHandle(ref, () => ({
    handleNewPost
  }), [handleNewPost]);

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex space-x-3">
              <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          {feedType === 'home' && (
            <>
              <h3 className="text-lg font-medium mb-2">Welcome to PingMe!</h3>
              <p>Your feed is empty. Start following people to see their posts here.</p>
            </>
          )}
          {feedType === 'profile' && (
            <>
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p>This user hasn't posted anything yet.</p>
            </>
          )}
          {feedType === 'hashtag' && (
            <>
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p>No posts found for #{hashtag}. Be the first to post with this hashtag!</p>
            </>
          )}
          {feedType === 'explore' && (
            <>
              <h3 className="text-lg font-medium mb-2">No posts to explore</h3>
              <p>Check back later for new content to discover.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          onPostUpdate={handlePostUpdate}
          onPostDelete={handlePostDelete}
        />
      ))}

      {isFetching && hasMore && (
        <div className="card p-4 text-center">
          <div className="spinner mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Loading more posts...</p>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="card p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">You've reached the end! 🎉</p>
        </div>
      )}
    </div>
  );
});

export default PostFeed; 