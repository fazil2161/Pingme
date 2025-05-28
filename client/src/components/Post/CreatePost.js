import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { isValidImageFile, extractHashtags } from '../../utils';
import api from '../../services/api';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!isValidImageFile(file)) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        showToast('Image size must be less than 15MB', 'error');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !image) {
      showToast('Please add some content or an image', 'error');
      return;
    }

    if (content.length > 280) {
      showToast('Post content cannot exceed 280 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('text', content.trim());
      
      if (image) {
        formData.append('postImage', image);
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setContent('');
      setImage(null);
      setImagePreview(null);
      showToast('Post created successfully!', 'success');
      
      if (onPostCreated) {
        onPostCreated(response.data.data.post);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showToast(error.response?.data?.message || 'Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-3">
          <img
            src={user?.profilePicture}
            alt={user?.username}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full border-none outline-none resize-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent text-gray-900 dark:text-white text-lg"
              rows={3}
              maxLength={280}
            />
            
            {/* Character count */}
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span></span>
              <span className={content.length > 260 ? 'text-red-500' : ''}>
                {content.length}/280
              </span>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mb-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg max-h-64 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label htmlFor="post-image" className="cursor-pointer text-blue-500 hover:text-blue-600">
                  <PhotoIcon className="h-5 w-5" />
                  <input
                    id="post-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && !image)}
                className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePost; 