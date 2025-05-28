import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { MagnifyingGlassIcon, HashtagIcon } from '@heroicons/react/24/outline';
import { debounce } from '../utils';
import PostFeed from '../components/Post/PostFeed';
import UserSearch from '../components/User/UserSearch';
import api from '../services/api';

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('hashtag') || '');
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const { showToast } = useToast();

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        const response = await api.get('/posts/trending');
        setTrendingHashtags(response.data.data.hashtags);
      } catch (error) {
        console.error('Error fetching trending hashtags:', error);
        // Don't show toast for trending hashtags failure - it's not critical
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchTrendingHashtags();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.startsWith('#')) {
      const hashtag = query.slice(1);
      setSearchParams({ hashtag });
    } else {
      setSearchParams({});
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);

  const handleHashtagClick = (hashtag) => {
    setSearchQuery(`#${hashtag}`);
    setSearchParams({ hashtag });
    setActiveTab('posts');
  };

  const currentHashtag = searchParams.get('hashtag');

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Search Bar */}
          <div className="card p-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                placeholder="Search posts (#hashtag) or switch to Users tab..."
                className="input-field pl-10 w-full"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="card mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'posts'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'users'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Users
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'posts' && (
              <div>
                {currentHashtag ? (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Posts tagged with #{currentHashtag}
                      </h2>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchParams({});
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm mt-1"
                      >
                        ← Back to explore
                      </button>
                    </div>
                    <PostFeed feedType="hashtag" hashtag={currentHashtag} />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Discover Posts
                    </h2>
                    <PostFeed feedType="explore" />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Find People
                </h2>
                <UserSearch />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Trending Hashtags */}
          <div className="card p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trending Hashtags
            </h3>
            
            {loadingTrending ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : trendingHashtags.length > 0 ? (
              <div className="space-y-3">
                {trendingHashtags.map((item, index) => (
                  <button
                    key={item.hashtag}
                    onClick={() => handleHashtagClick(item.hashtag)}
                    className="block w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <HashtagIcon className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          #{item.hashtag}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.count} {item.count === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        #{index + 1}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <HashtagIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No trending hashtags yet</p>
              </div>
            )}
          </div>

          {/* Search Tips */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Search Tips
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Use #hashtag to search for posts</p>
              <p>• Switch to Users tab to find people</p>
              <p>• Click trending hashtags to explore</p>
              <p>• Discover new content in the Posts tab</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore; 