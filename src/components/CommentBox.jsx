import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon as HeartIconOutline, 
  TrashIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CommentBox = ({ postId, comments, onCommentAdded }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsList, setCommentsList] = useState(comments || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    setCommentsList(comments || []);
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/comments/post/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        const newComment = data.comment;
        
        setCommentsList([newComment, ...commentsList]);
        setCommentText('');
        
        if (onCommentAdded) {
          onCommentAdded(newComment);
        }
        toast.success('Comment posted successfully!');
      } else {
        toast.error(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCommentsList(commentsList.map(comment => 
          comment._id === commentId ? data.comment : comment
        ));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const response = await fetch(`/api/comments/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCommentsList(commentsList.filter(comment => comment._id !== commentToDelete));
        toast.success('Comment deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  const cancelDeleteComment = () => {
    setShowDeleteConfirm(false);
    setCommentToDelete(null);
  };

  return (
    <div className="p-4">
      {/* Comment Input */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex items-start space-x-3">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {user.username?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim() || loading}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="spinner mr-2"></div>
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                  )}
                  Post
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {commentsList.map((comment) => (
          <div key={comment._id} className="flex items-start space-x-3">
            <Link to={`/profile/${comment.author?.username}`}>
              {comment.author?.profilePicture ? (
                <img
                  src={comment.author.profilePicture}
                  alt={comment.author.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">
                    {comment.author?.username?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </Link>

            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Link
                    to={`/profile/${comment.author?.username}`}
                    className="font-medium text-sm text-gray-900 hover:text-blue-600"
                  >
                    {comment.author?.username}
                  </Link>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{comment.content}</p>
              </div>

              {/* Comment Actions */}
              <div className="flex items-center space-x-4 mt-2">
                <button
                  onClick={() => handleLikeComment(comment._id)}
                  className={`flex items-center space-x-1 text-xs ${
                    comment.likes?.includes(user?._id) ? 'text-red-500' : 'text-gray-500'
                  } hover:text-red-500 transition-colors`}
                >
                  {comment.likes?.includes(user?._id) ? (
                    <HeartIconSolid className="h-4 w-4" />
                  ) : (
                    <HeartIconOutline className="h-4 w-4" />
                  )}
                  <span>{comment.likes?.length || 0}</span>
                </button>

                {comment.author?._id === user?._id && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {commentsList.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Comment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteComment}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteComment}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentBox;

