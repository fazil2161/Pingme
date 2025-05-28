import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  HomeIcon, 
  UserIcon, 
  MagnifyingGlassIcon, 
  BellIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Explore',
      href: '/explore',
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      current: location.pathname === '/explore'
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: BellIcon,
      iconSolid: BellIconSolid,
      current: location.pathname === '/notifications'
    },
    {
      name: 'Profile',
      href: `/profile/${user?._id}`,
      icon: UserIcon,
      iconSolid: UserIconSolid,
      current: location.pathname.includes('/profile')
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PingMe</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.current ? item.iconSolid : item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile user menu */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-4">
              <img
                src={user?.profilePicture}
                alt={user?.username}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={toggleTheme}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
              >
                {isDark ? (
                  <SunIcon className="h-5 w-5 mr-3" />
                ) : (
                  <MoonIcon className="h-5 w-5 mr-3" />
                )}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 rounded-lg"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="lg:flex">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">PingMe</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.current ? item.iconSolid : item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center mb-4">
                <img
                  src={user?.profilePicture}
                  alt={user?.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                >
                  {isDark ? (
                    <SunIcon className="h-5 w-5 mr-3" />
                  ) : (
                    <MoonIcon className="h-5 w-5 mr-3" />
                  )}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 rounded-lg"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* Mobile header */}
          <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">PingMe</h1>
              <div className="w-6" /> {/* Spacer */}
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout; 