import React, { useState, useEffect } from 'react';
import { PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', image: '', tags: [] });
  const [editPost, setEditPost] = useState({ content: '', image: '', tags: [] });
  const [imageFile, setImageFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [error, setError] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('Feed component mounted, user:', user?.username || 'not logged in');
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setError(null);
      const response = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        setError('Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setNewPost({ ...newPost, image: data.imageUrl });
        setImageFile(file);
        setError(null);
        toast.success('Image uploaded successfully');
      } else {
        const errorMsg = data.message || 'Failed to upload image. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('Upload error:', data);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMsg = 'Network error. Please check your connection and try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingEdit(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setEditPost({ ...editPost, image: data.imageUrl });
        setEditImageFile(file);
        toast.success('Image uploaded successfully');
      } else {
        const errorMsg = data.message || 'Failed to upload image. Please try again.';
        toast.error(errorMsg);
        console.error('Upload error:', data);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setUploadingEdit(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });

      const data = await response.json();

      if (response.ok) {
        setPosts([data.post, ...posts]);
        setNewPost({ content: '', image: '', tags: [] });
        setImageFile(null);
        setShowCreatePost(false);
        toast.success('Post created successfully!');
      } else {
        toast.error(data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleEditPostClick = (post) => {
    setEditingPost(post);
    setEditPost({
      content: post.content || '',
      image: post.image || '',
      tags: post.tags || []
    });
    setEditImageFile(null);
    setShowEditPost(true);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editPost.content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    if (!editingPost) return;

    try {
      const response = await fetch(`/api/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editPost)
      });

      const data = await response.json();

      if (response.ok) {
        setPosts(posts.map(post => 
          post._id === editingPost._id ? data.post : post
        ));
        setShowEditPost(false);
        setEditingPost(null);
        setEditPost({ content: '', image: '', tags: [] });
        setEditImageFile(null);
        toast.success('Post updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setPosts(posts.filter(post => post._id !== postId));
        toast.success('Post deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Create Post Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user?.username || 'User'}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <span className="text-gray-500">What's on your mind?</span>
          </div>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto relative">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create Post</h3>
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  setNewPost({ content: '', image: '', tags: [] });
                  setImageFile(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} className="p-4">
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="What's on your mind?"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer text-gray-500 hover:text-blue-600">
                    <PhotoIcon className="h-6 w-6" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploading && <div className="spinner"></div>}
                </div>
                
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Post
                </button>
              </div>
              
              {newPost.image && (
                <div className="mt-4">
                  <img
                    src={newPost.image}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditPost && editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto relative">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Post</h3>
              <button
                onClick={() => {
                  setShowEditPost(false);
                  setEditingPost(null);
                  setEditPost({ content: '', image: '', tags: [] });
                  setEditImageFile(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdatePost} className="p-4">
              <textarea
                value={editPost.content}
                onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                placeholder="What's on your mind?"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer text-gray-500 hover:text-blue-600">
                    <PhotoIcon className="h-6 w-6" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadingEdit && <div className="spinner"></div>}
                </div>
                
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update
                </button>
              </div>
              
              {editPost.image && (
                <div className="mt-4">
                  <img
                    src={editPost.image}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <PlusIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No posts yet</p>
              <p className="text-sm">Be the first to create a post!</p>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={handleEditPostClick}
              onPostUpdate={handlePostUpdate}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;

