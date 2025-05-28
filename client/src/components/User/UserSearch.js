import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { debounce } from '../../utils';
import UserCard from './UserCard';
import api from '../../services/api';

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { showToast } = useToast();

  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
      showToast('Failed to search users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a stable debounced function
  const debouncedSearch = React.useMemo(
    () => debounce(searchUsers, 500),
    [showToast]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleUserUpdate = (userId, updates) => {
    setUsers(prev => prev.map(user => 
      user._id === userId ? { ...user, ...updates } : user
    ));
  };

  return (
    <div>
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for users..."
          className="input-field pl-10 w-full"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Searching users...</p>
        </div>
      )}

      {/* Search Results */}
      {!loading && hasSearched && (
        <div>
          {users.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Search Results ({users.length})
              </h3>
              {users.map(user => (
                <UserCard
                  key={user._id}
                  user={user}
                  onUserUpdate={handleUserUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p>Try searching with different keywords.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <div className="card p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Search for Users</h3>
            <p>Enter a username or name to find people on PingMe.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch; 