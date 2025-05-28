import React from 'react';
import CreatePost from '../components/Post/CreatePost';
import PostFeed from '../components/Post/PostFeed';

const Dashboard = () => {
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Create Post */}
      <CreatePost />
      
      {/* Post Feed */}
      <PostFeed feedType="home" />
    </div>
  );
};

export default Dashboard; 