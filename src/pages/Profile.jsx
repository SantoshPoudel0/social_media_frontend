import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  MapPinIcon, 
  CalendarIcon,
  UsersIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', profilePicture: '' });
  const [editErrors, setEditErrors] = useState({});

  const isOwnProfile = !username || username === currentUser?.username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const profileUsername = username || currentUser?.username;
      const response = await fetch(`/api/users/profile/${profileUsername}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileUser(data.user);
        setPosts(data.user.posts || []);
        setIsFollowing(data.isFollowing);
        setEditForm({
          username: data.user.username || '',
          bio: data.user.bio || '',
          profilePicture: data.user.profilePicture || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profileUser) return;

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${profileUser._id}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setProfileUser(data.user);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const validateEditForm = () => {
    const newErrors = {};
    
    if (editForm.username) {
      if (editForm.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (editForm.username.length > 30) {
        newErrors.username = 'Username must be less than 30 characters';
      } else if (!/^[a-zA-Z]/.test(editForm.username)) {
        newErrors.username = 'Username must start with a letter';
      } else if (!/^[a-zA-Z0-9_]+$/.test(editForm.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      } else if (/\d{5,}$/.test(editForm.username)) {
        newErrors.username = 'Username cannot end with more than 4 consecutive digits';
      } else {
        const letterCount = (editForm.username.match(/[a-zA-Z]/g) || []).length;
        if (letterCount < 2 && editForm.username.length > 5) {
          newErrors.username = 'Username must contain at least 2 letters';
        }
      }
    }
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        const oldUsername = profileUser?.username;
        setProfileUser(data.user);
        setShowEditModal(false);
        setEditErrors({});
        toast.success('Profile updated successfully!');
        
        // Reload page to update URL if username changed
        if (editForm.username && editForm.username !== oldUsername) {
          navigate(`/profile/${editForm.username}`, { replace: true });
          setTimeout(() => window.location.reload(), 100);
        } else {
          fetchProfile();
        }
      } else {
        const errorMsg = data.message || 'Failed to update profile';
        setEditErrors({ username: errorMsg });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditErrors({ username: 'Network error. Please try again.' });
    }
  };

  const handleEditPostClick = (post) => {
    // Edit functionality can be added here if needed
    // For now, this prevents the modal from opening unexpectedly
    console.log('Edit post clicked:', post._id);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
        <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
        <Link to="/" className="mt-4 inline-block btn-primary">
          Go back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profileUser.profilePicture ? (
                <img
                  src={profileUser.profilePicture}
                  alt={profileUser.username}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-blue-500 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white text-4xl font-bold">
                    {profileUser.username?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profileUser.username}
                  </h1>
                  <p className="text-gray-600">@{profileUser.username}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 mt-4 md:mt-0">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      className={`${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="text-gray-700 mb-4">{profileUser.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                <div className="flex items-center space-x-1">
                  <strong>{posts.length}</strong>
                  <span className="text-gray-600">posts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <strong>{profileUser.followers?.length || 0}</strong>
                  <span className="text-gray-600">followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <strong>{profileUser.following?.length || 0}</strong>
                  <span className="text-gray-600">following</span>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center justify-center md:justify-start mt-4 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
            </button>
            {!isOwnProfile && (
              <button
                onClick={() => setActiveTab('followers')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'followers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Followers
              </button>
            )}
            {!isOwnProfile && (
              <button
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Following
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
                  </p>
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
          )}

          {activeTab === 'followers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileUser.followers?.map((follower) => (
                <div key={follower._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {follower.profilePicture ? (
                    <img
                      src={follower.profilePicture}
                      alt={follower.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {follower.username?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <Link
                    to={`/profile/${follower.username}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {follower.username}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileUser.following?.map((following) => (
                <div key={following._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {following.profilePicture ? (
                    <img
                      src={following.profilePicture}
                      alt={following.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {following.username?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <Link
                    to={`/profile/${following.username}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {following.username}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => {
                    setEditForm({ ...editForm, username: e.target.value });
                    if (editErrors.username) {
                      setEditErrors({ ...editErrors, username: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border ${editErrors.username ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter username"
                />
                {editErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.username}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must start with a letter, 3-30 characters, cannot end with more than 4 digits
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={editForm.profilePicture}
                  onChange={(e) => setEditForm({ ...editForm, profilePicture: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

