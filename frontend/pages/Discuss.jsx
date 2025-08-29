import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import api from '../src/api';
import Dock from '../src/block/Dock/Dock'; 

// Use window.ENV or fallback for API base
const API_BASE =
  (typeof window !== 'undefined' && (window.REACT_APP_API_BASE || (window.env && window.env.REACT_APP_API_BASE))) ||
  'http://localhost:8000';

const initialCommentState = {};

const Discuss = () => {
  const navigate = useNavigate();
  // State declarations
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [haveViewed, setHaveViewed] = useState({});
  const [haveVoted, setHaveVoted] = useState({});

  // New discussion state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newTags, setNewTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState('');

  // Comment state
  const [commentInputs, setCommentInputs] = useState(initialCommentState);
  const [commentImageUrls, setCommentImageUrls] = useState(initialCommentState);
  const [commentUploadPreview, setCommentUploadPreview] = useState(initialCommentState);
  const [commentUploading, setCommentUploading] = useState(initialCommentState);

  // UI state
  const [expanded, setExpanded] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [modalPost, setModalPost] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const commentFileInputRefs = useRef({});
  const searchInputRef = useRef(null);

  // Add a separate loading state for search
  const [searchLoading, setSearchLoading] = useState(false);

  // Add sorting state
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'votes'


  // items
  const items = [
    { label: "Home", icon: ' 🏠 ', onClick: () => navigate("/landing") },
    { label: "Discuss", icon: '💬', onClick: () => navigate("/discuss") },
    { label: "Friends", icon: '👨', onClick: () => navigate("/friends") },
    {label: "Primium", icon: '🏆', onClick:() => navigate("/Working")}
  ];
  // Fetch current user info
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data);
      } catch {
        setUser(null);
      }
    };
    fetchMe();
  }, []);

  // Modified fetchDiscussions to not set loading for search queries
  const fetchDiscussions = useCallback(async (isSearch = false) => {
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        if (isSearch) setSearchLoading(false);
        else setLoading(false);
        return;
      }
      let url = '/discuss';
      if (searchQuery.trim()) {
        url = `/discuss/search?q=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDiscussions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' && err.response.data.trim().startsWith('<')
          ? 'Server returned HTML instead of JSON. Check your API endpoint.'
          : err?.response?.data) ||
        err?.message ||
        'Error loading discussions';
      if (
        err?.response?.data?.message?.includes('Cast to ObjectId failed')
      ) {
        setError('Invalid discussion ID. Please check your request or try again.');
      } else {
        setError(msg);
      }
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [searchQuery]);

  // Initial load useEffect
  useEffect(() => {
    fetchDiscussions(false);
  }, []); // Empty dependency array for initial load only

  // Search useEffect (only when searchQuery changes)
  useEffect(() => {
    if (searchQuery.trim()) {
      const id = setTimeout(() => fetchDiscussions(true), 300);
      return () => clearTimeout(id);
    } else if (searchQuery === '') {
      fetchDiscussions(false);
    }
  }, [searchQuery, fetchDiscussions]);

  useEffect(() => {
    if (!user) return;
    const viewed = {};
    const voted = {};
    (discussions || []).forEach(d => {
      const uid = String(user._id || user.id || '');
      if (Array.isArray(d.viewedBy) && d.viewedBy.some(u => String(u) === uid)) viewed[d._id] = true;
      if (Array.isArray(d.likes) && d.likes.some(u => String(u) === uid)) voted[d._id] = true;
    });
    setHaveViewed(viewed);
    setHaveVoted(voted);
  }, [discussions, user]);

  const handleVote = async (id) => {
    if (haveVoted[id]) return;
    try {
      const token = localStorage.getItem("accessToken");
      const { data } = await api.post(
        `/discuss/${id}/vote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscussions((prev) =>
        prev.map((d) => (d._id === id ? { ...d, votes: data.votes, likes: data.likes } : d))
      );
      setHaveVoted((p) => ({ ...p, [id]: true }));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Vote failed"
      );
    }
  };

  const handleView = async (id) => {
    try {
      if (!haveViewed[id]) {
        const token = localStorage.getItem("accessToken");
        const { data } = await api.post(
          `/discuss/${id}/view`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDiscussions((prev) =>
          prev.map((d) => (d._id === id ? { ...d, views: data.views, viewedBy: data.viewedBy } : d))
        );
        setHaveViewed((p) => ({ ...p, [id]: true }));
      }
      const post = discussions.find((d) => d._id === id);
      setModalPost(post);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "View failed"
      );
    }
  };

  // Search handler
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      fetchDiscussions();
    },
    [fetchDiscussions]
  );

  // Image URL resolver
  const resolveImageUrl = useCallback((url) => {
    if (!url) return '';
    if (/^(https?:\/\/|blob:)/.test(url)) return url;
    if (url.startsWith('/uploads/')) return API_BASE + url;
    return url;
  }, []);

  // Image upload for new discussion
  const uploadImage = useCallback(
    async (file) => {
      setError('');
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('image', file);
        const token = localStorage.getItem('accessToken');
        const { data } = await api.post('/upload/image', fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setNewImageUrl(data.imageUrl);
        setUploadedPreview(resolveImageUrl(data.imageUrl));
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            'Failed to upload image'
        );
      } finally {
        setUploading(false);
        setDragActive(false);
      }
    },
    [resolveImageUrl]
  );

  // Image upload for comment
  const uploadCommentImage = useCallback(
    async (discussionId, file) => {
      setCommentUploading((p) => ({ ...p, [discussionId]: true }));
      setError('');
      try {
        const fd = new FormData();
        fd.append('image', file);
        const token = localStorage.getItem('accessToken');
        const { data } = await api.post('/upload/image', fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setCommentImageUrls((p) => ({ ...p, [discussionId]: data.imageUrl }));
        setCommentUploadPreview((p) => ({
          ...p,
          [discussionId]: resolveImageUrl(data.imageUrl),
        }));
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to upload image for comment'
        );
      } finally {
        setCommentUploading((p) => ({ ...p, [discussionId]: false }));
      }
    },
    [resolveImageUrl]
  );

  // Drag and drop handlers
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = e.dataTransfer.files;
      if (files && files[0]) uploadImage(files[0]);
    },
    [uploadImage]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) uploadImage(file);
    },
    [uploadImage]
  );

  // Comment image upload handlers
  const onCommentDrop = useCallback(
    (e, id) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files && files[0]) uploadCommentImage(id, files[0]);
    },
    [uploadCommentImage]
  );

  const onCommentFileChange = useCallback(
    (e, id) => {
      const file = e.target.files?.[0];
      if (file) uploadCommentImage(id, file);
    },
    [uploadCommentImage]
  );

  // Tag helpers
  const addTag = useCallback(
    (raw) => {
      const t = String(raw || '').trim().replace(/^#/, '').toLowerCase();
      if (!t) return;
      setNewTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
      setNewTagInput('');
    },
    []
  );
  const removeTag = useCallback(
    (t) => setNewTags((prev) => prev.filter((x) => x !== t)),
    []
  );

  // Create a new discussion
  const handleCreateDiscussion = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      if (!newTitle.trim() || !newContent.trim()) {
        setError('Title and content are required.');
        return;
      }
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }
        const { data } = await api.post(
          '/discuss',
          {
            title: newTitle,
            content: newContent,
            imageUrl: newImageUrl,
            tags: newTags,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNewTitle('');
        setNewContent('');
        setNewImageUrl('');
        setUploadedPreview('');
        setNewTags([]);
        setShowCreatePost(false); // Close modal on success
        setDiscussions((prev) => [data, ...prev]);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            'Failed to create discussion'
        );
      }
    },
    [newTitle, newContent, newImageUrl, newTags]
  );

  // Delete a discussion
  const handleDeleteDiscussion = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this discussion?')) return;
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }
        await api.delete(`/discuss/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiscussions((prev) => prev.filter((d) => d._id !== id));
      } catch (err) {
        if (
          err?.response?.data?.message?.includes('Cast to ObjectId failed')
        ) {
          setError('Invalid discussion ID. Please check your request or try again.');
        } else {
          setError(
            err?.response?.data?.message ||
              err?.response?.data ||
              err?.message ||
              'Failed to delete discussion'
          );
        }
      }
    },
    []
  );

  // Add a comment to a discussion
  const handleAddComment = useCallback(
    async (discussionId) => {
      const commentText = commentInputs[discussionId];
      if ((!commentText || !commentText.trim()) && !commentImageUrls[discussionId]) return;
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }
        const { data } = await api.post(
          `/discuss/${discussionId}/comments`,
          {
            content: commentText || '',
            imageUrl: commentImageUrls[discussionId] || '',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDiscussions((prev) =>
          prev.map((d) =>
            d._id === discussionId
              ? { ...d, comments: [...(d.comments || []), data] }
              : d
          )
        );
        setCommentInputs((prev) => ({ ...prev, [discussionId]: '' }));
        setCommentImageUrls((prev) => ({ ...prev, [discussionId]: '' }));
        setCommentUploadPreview((prev) => ({ ...prev, [discussionId]: '' }));
      } catch (err) {
        if (
          err?.response?.data?.message?.includes('Cast to ObjectId failed')
        ) {
          setError('Invalid discussion or comment ID. Please check your request or try again.');
        } else {
          setError(
            err?.response?.data?.message ||
              err?.response?.data ||
              err?.message ||
              'Failed to add comment'
          );
        }
      }
    },
    [commentInputs, commentImageUrls]
  );

  // Delete a comment (only by author)
  const handleDeleteComment = useCallback(
    async (discussionId, commentId) => {
      if (!window.confirm('Are you sure you want to delete this comment?')) return;
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }
        await api.delete(`/discuss/${discussionId}/comments/${commentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiscussions((prev) =>
          prev.map((d) =>
            d._id === discussionId
              ? { ...d, comments: (d.comments || []).filter((c) => c._id !== commentId) }
              : d
          )
        );
      } catch (err) {
        if (
          err?.response?.data?.message?.includes('Cast to ObjectId failed')
        ) {
          setError('Invalid comment ID. Please check your request or try again.');
        } else {
          setError(
            err?.response?.data?.message ||
              err?.response?.data ||
              err?.message ||
              'Failed to delete comment'
          );
        }
      }
    },
    []
  );

  // Toggle expand/collapse for comments
  const toggleExpand = useCallback((id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Modal close handler (reset form)
  const handleCloseModal = () => {
    setShowCreatePost(false);
    setError('');
    setNewTitle('');
    setNewContent('');
    setNewImageUrl('');
    setUploadedPreview('');
    setNewTags([]);
    setNewTagInput('');
    setUploading(false);
    setDragActive(false);
  };

  // Modal close handler for post details
  const handleClosePostModal = () => {
    setModalPost(null);
  };

  // Sorting function
  const sortDiscussions = useCallback((discussionsToSort) => {
    if (!discussionsToSort || discussionsToSort.length === 0) return discussionsToSort;
    const sorted = [...discussionsToSort];
    if (sortBy === 'votes') {
      sorted.sort((a, b) => {
        const votesA = a.votes || 0;
        const votesB = b.votes || 0;
        return votesB - votesA;
      });
    } else {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    }
    return sorted;
  }, [sortBy]);

  // Sort discussions whenever discussions or sortBy changes
  const sortedDiscussions = useMemo(() => {
    return sortDiscussions(discussions);
  }, [discussions, sortDiscussions]);

  // Handle sort button clicks
  const handleSortByVotes = () => {
    setSortBy('votes');
  };

  const handleSortByNewest = () => {
    setSortBy('newest');
  };

  // Responsive UI helpers
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#f6f4f4]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-2"></div>
        <span className="text-gray-600 font-semibold">Loading discussions...</span>
      </div>
    </div>
  );
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div className="w-full mx-auto px-2 sm:px-4 py-4 bg-black min-h-screen">
      {/* Post Details Modal */}
      {modalPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={handleClosePostModal}
        >
          <div
            className="relative bg-black rounded-2xl shadow-2xl w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-100 hover:text-white text-2xl font-bold"
              onClick={handleClosePostModal}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{modalPost.title}</h3>
            {/* Image in top right corner */}
            {modalPost.imageUrl && (
              <div className="absolute top-4 right-4">
                <img
                  src={resolveImageUrl(modalPost.imageUrl)}
                  alt="discussion"
                  className="max-h-32 sm:max-h-40 w-32 sm:w-40 object-cover rounded border border-gray-800"
                />
              </div>
            )}
            <p className="mb-3 whitespace-pre-wrap text-gray-100" style={{marginTop: modalPost.imageUrl ? '140px' : undefined}}>
              {modalPost.content}
            </p>
            <div className="text-xs sm:text-sm text-gray-400 flex flex-wrap items-center gap-3">
              <span>👍 {modalPost.votes ?? 0}</span>
              <span>👁 {modalPost.views ?? 0}</span>
              <span>💬 {modalPost.comments?.length ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
        <h2 className="text-2xl font-bold text-white border border-gray-800 p-2 bg-black rounded-xl" style={{
            fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '1.7rem',
            letterSpacing: '0.03em',
            color: 'white',
            marginRight: '0.5em',
            textShadow: '0 1px 0 #000, 2px 0 #000',
          }}>Discussions</h2>
        <button
          className="bg-green-400 hover:border hover:border-green-200 hover:border-4 text-black px-4 py-2 rounded-xl font-bold  shadow-lg transition-all duration-150 w-full sm:w-auto "
          onClick={() => setShowCreatePost(true)}
        >
          📝 Create
        </button>
      </div>

      {/* Category Buttons */}
      {/* <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
        <button className='bg-black text-white px-3 py-1 rounded-lg border border-gray-800 hover:bg-gray-900 shadow transition-all duration-150 text-xs sm:text-sm'>🔥For You</button>
        <button className='bg-black text-gray-100 px-3 py-1 rounded-lg border border-gray-800 hover:bg-gray-900 shadow transition-all duration-150 text-xs sm:text-sm'>Career</button>
        <button className='bg-black text-gray-100 px-3 py-1 rounded-lg border border-gray-800 hover:bg-gray-900 shadow transition-all duration-150 text-xs sm:text-sm'>New</button>
        <button className='bg-black text-gray-100 px-3 py-1 rounded-lg border border-gray-800 hover:bg-gray-900 shadow transition-all duration-150 text-xs sm:text-sm'>Contest</button>
        <button className='bg-black text-gray-100 px-3 py-1 rounded-lg border border-gray-800 hover:bg-gray-900 shadow transition-all duration-150 text-xs sm:text-sm'>Leader Board</button>
      </div> */}

      {/* Sorting Buttons */}
      <div className='flex flex-wrap gap-2 justify-center sm:justify-between items-center mb-4'>
        <button 
          className={`px-4 py-2 rounded-lg shadow transition-all duration-150 text-xs sm:text-base border border-gray-800 ${
            sortBy === 'votes' 
              ? 'bg-white text-black font-bold' 
              : 'bg-black text-gray-100 hover:bg-gray-900'
          }`}
          onClick={handleSortByVotes}
        >
          Most Votes
        </button>
        <button 
          className={`px-4 py-2 rounded-lg shadow transition-all duration-150 text-xs sm:text-base border border-gray-800 ${
            sortBy === 'newest' 
              ? 'bg-white text-black font-bold' 
              : 'bg-black text-gray-100 hover:bg-gray-900'
          }`}
          onClick={handleSortByNewest}
        >
          Newest
        </button>
      </div>

      {/* Modal for Create Post */}
      {showCreatePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={handleCloseModal}
        >
          <div
            className="relative bg-black rounded-2xl shadow-2xl w-[95vw] max-w-lg mx-auto p-4 sm:p-8 animate-fadeIn border border-gray-800"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cross Button */}
            <button
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-100 hover:text-white text-2xl font-bold focus:outline-none transition"
              onClick={handleCloseModal}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h3 className="font-bold text-lg sm:text-xl mb-4 text-center text-white">Create New Discussion</h3>
            <form
              onSubmit={handleCreateDiscussion}
              autoComplete="off"
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Title"
                className="block w-full p-3 border border-gray-800 rounded-lg bg-black text-white focus:ring-2 focus:ring-white focus:outline-none transition text-sm"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Content"
                className="block w-full p-3 border border-gray-800 rounded-lg bg-black text-white focus:ring-2 focus:ring-white focus:outline-none transition min-h-[100px] text-sm"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />

              {/* Drag-and-drop uploader */}
              <div
                className={`w-full p-4 border-2 rounded-lg text-center cursor-pointer transition text-sm ${
                  dragActive ? 'border-white bg-black' : 'border-dashed border-gray-800 bg-black hover:bg-gray-900'
                } text-gray-100`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                {uploading ? (
                  <span className="text-white font-medium">Uploading...</span>
                ) : uploadedPreview ? (
                  <div className="flex items-center justify-between">
                    <img src={uploadedPreview} alt="preview" className="max-h-16 object-contain rounded-lg mr-2 border border-gray-800" />
                    <button
                      type="button"
                      className="text-sm text-red-400 hover:text-red-200 font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedPreview('');
                        setNewImageUrl('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-gray-100">Drag and drop an image here</div>
                    <div className="text-xs text-gray-400">or click to select</div>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileChange}
              />

              {/* Tags */}
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newTags.map((t) => (
                    <span key={t} className="px-2 py-1 text-xs sm:text-sm bg-black border border-gray-800 text-white rounded-lg flex items-center">
                      #{t}
                      <button
                        type="button"
                        className="ml-1 text-white hover:text-red-400 font-bold"
                        onClick={() => removeTag(t)}
                        aria-label="Remove tag"
                      >×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tag and press Enter (e.g., react)"
                  className="block w-full p-2 border border-gray-800 rounded-lg bg-black text-white focus:ring-2 focus:ring-white focus:outline-none transition text-sm"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(newTagInput);
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold shadow transition disabled:opacity-60 text-sm"
                disabled={uploading}
              >
                Post
              </button>
              {error && <div className="text-red-400 text-center">{error}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="flex relative w-full gap-3">
          <input
            type="text"
            placeholder="Search discussions or tags..."
            className="w-full p-2 border border-gray-800 rounded-lg pr-8 text-sm bg-black text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
          <button
          type="submit"
          className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 text-sm border border-gray-800 gap-2"
        >
          Search
        </button>
        </div>
        
      </form>

      {/* Discussions List - Use sortedDiscussions instead of discussions */}
      {sortedDiscussions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No discussions found.</div>
      ) : (
        <ul className="space-y-6">
          {sortedDiscussions.map((d) => {
            // For swapping image at 20% and 75% of the description
            let content = d.content || '';
            let imageUrl = d.imageUrl;
            let contentElements = [
              <span key="content">{content}</span>,
              imageUrl ? (
                <img
                  key="img"
                  src={resolveImageUrl(imageUrl)}
                  alt="discussion"
                  className="float-right ml-4 mb-2 max-h-20 w-20 object-cover rounded border border-gray-800"
                  style={{marginTop: 0}}
                />
              ) : null,
            ];
            if (imageUrl && content.length > 20) {
              // Calculate split points
              const firstSplit = Math.floor(content.length * 0.2);
              const secondSplit = Math.floor(content.length * 0.75);
              const part1 = content.slice(0, firstSplit);
              const part2 = content.slice(firstSplit, secondSplit);
              const part3 = content.slice(secondSplit);

              contentElements = [
                <span key="part1">{part1}</span>,
                imageUrl ? (
                  <img
                    key="img1"
                    src={resolveImageUrl(imageUrl)}
                    alt="discussion"
                    className="float-right ml-4 mb-2 max-h-20 w-20 object-cover rounded border border-gray-800"
                    style={{marginTop: 0}}
                  />
                ) : null,
                <span key="part2">{part2}</span>,
                imageUrl ? (
                  <img
                    key="img2"
                    src={resolveImageUrl(imageUrl)}
                    alt="discussion"
                    className="float-right ml-4 mb-2 max-h-20 w-20 object-cover rounded border border-gray-800"
                    style={{marginTop: 0}}
                  />
                ) : null,
                <span key="part3">{part3}</span>,
              ];
            } else if (imageUrl) {
              // Fallback: just show image at right
              contentElements = [
                <img
                  key="img"
                  src={resolveImageUrl(imageUrl)}
                  alt="discussion"
                  className="float-right ml-4 mb-2 max-h-20 w-20 object-cover rounded border border-gray-800"
                />,
                <span key="content">{content}</span>,
              ];
            } else {
              contentElements = [<span key="content">{content}</span>];
            }

            return (
              <li
                key={d._id}
                className="p-3 sm:p-4 bg-black rounded-xl shadow border border-gray-800 flex flex-col gap-2"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <strong className="text-base sm:text-lg text-white">{d.title}</strong>
                    <span className="ml-2 text-gray-400 text-xs sm:text-sm">
                      by {d.author?.Username || d.author?.username || 'Unknown'}
                    </span>
                  </div>
                  {user && d.author && (user._id === d.author._id || user.id === d.author._id) && (
                    <button
                      className="text-xs sm:text-sm text-white border-red-900 p-1 rounded-sm  border-2- bg-red-600 "
                      onClick={() => handleDeleteDiscussion(d._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                {/* Description with swapped images at 20% and 75% */}
                <div className="mb-2 text-gray-100 text-sm sm:text-base flex-1" style={{overflow: 'hidden', minHeight: '60px'}}>
                  {contentElements}
                  <div style={{clear: 'both'}} />
                </div>
                
                {/* Votes | Views | Comments row as three buttons */}
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mb-2">
                  <button
                    onClick={() => handleVote(d._id)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-black border border-gray-800 rounded-lg hover:bg-gray-900 font-medium transition text-gray-100"
                  >
                    👍 <span>Votes</span> <span className="ml-1">{d.votes || 0}</span>
                  </button>
                  <button
                    onClick={() => handleView(d._id)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-black border border-gray-800 rounded-lg hover:bg-gray-900 font-medium transition text-gray-100"
                  >
                    👁 <span>See</span> <span className="ml-1">{d.views || 0}</span>
                  </button>
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [d._id]: !p[d._id] }))}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg font-medium transition border border-gray-800 ${
                      expanded[d._id]
                        ? 'bg-white text-black'
                        : 'bg-black hover:bg-gray-900 text-gray-100'
                    }`}
                  >
                    💬 <span>Comments</span> <span className="ml-1">{d.comments?.length || 0}</span>
                  </button>
                </div>

                {Array.isArray(d.tags) && d.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {d.tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="px-2 py-0.5 text-xs bg-black border border-gray-800 rounded hover:bg-gray-900 text-gray-100"
                        onClick={() => setSearchQuery(`#${t}`)}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}

                {/* Show/Hide Comments Toggle */}
                <button
                  className="text-white hover:underline text-xs sm:text-sm w-fit"
                  onClick={() => toggleExpand(d._id)}
                > 
                </button>

                {/* Comments Section */}
                {expanded[d._id] && (
                  <div className="mt-2">
                    {/* Comments List */}
                    <ul className="mb-2">
                      {(d.comments && d.comments.length > 0) ? (
                        d.comments.map((c) => (
                          <li
                            key={c._id}
                            className="border-b border-gray-800 py-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                              <span className="font-semibold text-xs sm:text-sm text-white">{c.author?.Username || c.author?.username || 'Unknown'}:</span>{' '}
                              <span className="text-xs sm:text-sm text-gray-100">{c.content}</span>
                              {c.imageUrl && (
                                <img
                                  src={resolveImageUrl(c.imageUrl)}
                                  alt="comment"
                                  className="inline-block max-h-8 max-w-8 ml-0 sm:ml-2 align-middle rounded border border-gray-800"
                                />
                              )}
                              <span className="ml-0 sm:ml-2 text-[10px] sm:text-xs text-gray-400">
                                {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                              </span>
                            </div>
                            {user && c.author && (user._id === c.author._id || user.id === c.author._id) && (
                              <button
                                className="text-xs text-red-400 hover:underline ml-0 sm:ml-2"
                                onClick={() => handleDeleteComment(d._id, c._id)}
                              >
                                Delete
                              </button>
                            )}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400 text-xs sm:text-sm">No comments yet.</li>
                      )}
                    </ul>
                    {/* Add Comment Form */}
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="flex-1 p-2 border border-gray-800 rounded-lg text-xs sm:text-sm bg-black text-white"
                        value={commentInputs[d._id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [d._id]: e.target.value,
                          }))
                        }
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(d._id);
                          }
                        }}
                      />
                      <div
                        className={`relative border border-gray-800 rounded-lg p-1 cursor-pointer flex items-center justify-center ${commentUploading[d._id] ? 'opacity-50' : ''} bg-black`}
                        style={{ minWidth: 32, minHeight: 32 }}
                        title="Attach image"
                        onClick={() => {
                          if (!commentFileInputRefs.current[d._id]) return;
                          commentFileInputRefs.current[d._id].click();
                        }}
                        onDragOver={e => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={e => onCommentDrop(e, d._id)}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => (commentFileInputRefs.current[d._id] = el)}
                          onChange={e => onCommentFileChange(e, d._id)}
                          tabIndex={-1}
                        />
                        {commentUploading[d._id] ? (
                          <span className="text-xs text-gray-400">Uploading...</span>
                        ) : commentUploadPreview[d._id] ? (
                          <div className="flex items-center">
                            <img
                              src={commentUploadPreview[d._id]}
                              alt="preview"
                              className="max-h-8 max-w-8 object-contain rounded border border-gray-800"
                            />
                            <button
                              type="button"
                              className="ml-1 text-xs text-red-400"
                              onClick={e => {
                                e.stopPropagation();
                                setCommentUploadPreview(prev => ({ ...prev, [d._id]: '' }));
                                setCommentImageUrls(prev => ({ ...prev, [d._id]: '' }));
                                if (commentFileInputRefs.current[d._id]) {
                                  commentFileInputRefs.current[d._id].value = '';
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400" role="img" aria-label="attach">📎</span>
                        )}
                      </div>
                      <button
                        className="bg-white text-black px-3 py-1 rounded-lg hover:bg-gray-100 text-xs sm:text-sm border border-gray-800"
                        onClick={() => handleAddComment(d._id)}
                        disabled={commentUploading[d._id]}
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
        <Dock
        items={items}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
        spring={{ mass: 0.1, stiffness: 100, damping: 30 }}
        className=" fixed bottom-0 left-0 items-center justify-center bg-white/80 backdrop-blur-xl shadow-lg"
      />
    </div>
  );
};

export default Discuss;