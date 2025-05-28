import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  ChatBubbleLeftRightIcon, 
  HeartIcon, 
  ShareIcon,
  UserGroupIcon,
  BellIcon,
  HashtagIcon,
  PhotoIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Landing = () => {
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Connect & Chat",
      description: "Share thoughts, engage in conversations, and build meaningful connections with people around the world."
    },
    {
      icon: HeartIcon,
      title: "Express Yourself",
      description: "Like, comment, and share posts that resonate with you. Show appreciation for content that matters."
    },
    {
      icon: PhotoIcon,
      title: "Share Moments",
      description: "Upload photos, create posts, and share your life's moments with your network of friends and followers."
    },
    {
      icon: UserGroupIcon,
      title: "Build Network",
      description: "Follow interesting people, discover new connections, and grow your social network organically."
    },
    {
      icon: BellIcon,
      title: "Stay Updated",
      description: "Real-time notifications keep you informed about likes, comments, follows, and important interactions."
    },
    {
      icon: HashtagIcon,
      title: "Discover Trends",
      description: "Explore trending hashtags, discover popular content, and stay connected with what's happening."
    }
  ];

  const samplePosts = [
    {
      user: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e6?w=400&h=400&fit=crop&crop=face",
      time: "2h",
      content: "Just finished an amazing hiking trip in the mountains! The sunrise was absolutely breathtaking 🌅",
      likes: 24,
      comments: 8,
      shares: 3
    },
    {
      user: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      time: "4h",
      content: "Working on a new coding project today. The satisfaction of solving complex problems never gets old! 💻 #coding #developer",
      likes: 42,
      comments: 12,
      shares: 7
    },
    {
      user: "Maria Rodriguez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      time: "6h",
      content: "Coffee and books - the perfect combination for a relaxing Sunday afternoon ☕📚",
      likes: 18,
      comments: 5,
      shares: 2
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-xl">
                <ChatBubbleLeftRightIcon className="w-8 h-8" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PingMe
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {isDark ? (
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <SparklesIcon className="w-16 h-16 text-blue-600 animate-bounce-gentle" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Connect, Share, Inspire
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Join PingMe and be part of a vibrant community where your voice matters. 
            Share your thoughts, discover amazing content, and connect with like-minded people from around the world.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 hover:shadow-lg"
            >
              Join PingMe Today
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-lg font-semibold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            Why Choose PingMe?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl w-fit mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Posts Preview */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            See What's Happening
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-6">
            {samplePosts.map((post, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src={post.avatar} 
                    alt={post.user}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {post.user}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.time} ago
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                        {post.text}
                </p>
                
                <div className="flex items-center space-x-6 text-gray-500 dark:text-gray-400">
                  <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                    <HeartIcon className="w-5 h-5" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                    <ShareIcon className="w-5 h-5" />
                    <span>{post.shares}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Join to See More
              <SparklesIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-xl">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">PingMe</span>
            </div>
            <p className="text-gray-400 mb-6">
              Connect with the world, one ping at a time.
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 