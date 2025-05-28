import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { validateEmail, validateUsername, isValidImageFile } from '../../utils';

const EditProfile = ({ isOpen, onClose, user, onUserUpdate }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    profilePicture: null
  });
  const [previewImage, setPreviewImage] = useState(user?.profilePicture || '');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateUser } = useAuth();
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!isValidImageFile(file)) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
        }));
        return;
      }

      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        setErrors(prev => ({
          ...prev,
          profilePicture: 'File size must be less than 15MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.profilePicture) {
        setErrors(prev => ({
          ...prev,
          profilePicture: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters and contain only letters, numbers, and underscores';
    }

    // Validate website URL if provided
    if (formData.website && formData.website.trim()) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(formData.website)) {
        newErrors.website = 'Please provide a valid website URL starting with http:// or https://';
      }
    }

    // Validate bio length
    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = 'Bio cannot exceed 160 characters';
    }

    // Validate location length
    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location cannot exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        website: formData.website.trim()
      };

      // Add profile picture if selected
      if (formData.profilePicture) {
        updateData.profilePicture = formData.profilePicture;
      }

      const result = await updateUser(updateData);
      
      if (result.success) {
        if (onUserUpdate) {
          onUserUpdate(updateData);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form data
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      profilePicture: null
    });
    setPreviewImage(user?.profilePicture || '');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Profile
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={previewImage}
                alt="Profile preview"
                className="h-24 w-24 rounded-full object-cover"
              />
              <label
                htmlFor="profilePicture"
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <PhotoIcon className="h-4 w-4" />
                <input
                  id="profilePicture"
                  name="profilePicture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            {errors.profilePicture && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.profilePicture}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input-field w-full ${errors.username ? 'border-red-500' : ''}`}
              placeholder="Enter your username"
              maxLength={30}
            />
            {errors.username && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.username}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className={`input-field w-full resize-none ${errors.bio ? 'border-red-500' : ''}`}
              placeholder="Tell us about yourself"
              maxLength={160}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.bio && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.bio}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                {formData.bio.length}/160
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`input-field w-full ${errors.location ? 'border-red-500' : ''}`}
              placeholder="Where are you from?"
              maxLength={100}
            />
            {errors.location && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.location}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={`input-field w-full ${errors.website ? 'border-red-500' : ''}`}
              placeholder="https://your-website.com"
              maxLength={200}
            />
            {errors.website && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.website}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile; 