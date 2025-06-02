import React, { useRef } from 'react';
import CreatePost from '../components/Post/CreatePost';
import PostFeed from '../components/Post/PostFeed';

const Dashboard = () => {
  const postFeedRef = useRef();

  const handlePostCreated = (newPost) => {
    // Call the PostFeed's handleNewPost function to add the new post immediately
    if (postFeedRef.current && postFeedRef.current.handleNewPost) {
      postFeedRef.current.handleNewPost(newPost);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />
      
      {/* Post Feed */}
      <PostFeed 
        ref={postFeedRef}
        feedType="home" 
      />
    </div>
  );
};

export default Dashboard; 