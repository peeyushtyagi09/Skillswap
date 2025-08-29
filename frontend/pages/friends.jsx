import React, { useState, useEffect, useCallback } from 'react';  
import { useNavigate } from 'react-router-dom';
import api from '../src/api';
import Dock from '../src/block/Dock/Dock'; 

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // items
  const items = [
    { label: "Home", icon: ' 🏠 ', onClick: () => navigate("/landing") },
    { label: "Discuss", icon: '💬', onClick: () => navigate("/discuss") },
    { label: "Friends", icon: '👨', onClick: () => navigate("/friends") },
    {label: "Primium", icon: '🏆', onClick:() => navigate("/Working")}
  ];

  // Make fetchAllFriends available for re-calling after accepting a friend request
  const fetchAllFriends = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/friend/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(
        Array.isArray(data)
          ? data.map(f => ({
              id: f.id || f._id,
              Username: f.Username,
              email: f.email,
              profilePic: f.profilePic,
              skills: f.skills || [],
              friendedAt: f.friendedAt
            }))
          : []
      );
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleUnFriend = async (friendId) => {
    if (!window.confirm("Do you really want to unfriend this user?")) return;
    try {
      const token = localStorage.getItem('accessToken');
      await api.post(
        '/friend/unfriend',
        { friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // update state locally
      setFriends(prev => prev.filter(f => f.id !== friendId));
  
      alert('Unfriended successfully');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message);
    }
  };
  
  
  useEffect(() => {
    const fetchAndSet = async () => {
      await fetchAllFriends();
    };
    fetchAndSet();
  }, [fetchAllFriends]);

  // Listen for friend list updates from other components
  useEffect(() => {
    const handleFriendListUpdate = (event) => {
      if (event.detail?.action === 'accepted' && Array.isArray(event.detail?.friendsData)) {
        // Always update with provided data if valid
        const processedFriends = (event.detail.friendsData || []).map(f => ({
          id: f.id || f._id,   // normalize id
          Username: f.Username,
          email: f.email,
          profilePic: f.profilePic,
          skills: f.skills || [],
          friendedAt: f.friendedAt
        }));
        setFriends(processedFriends);
      } else {
        // Always fallback to server fetch if no valid data
        fetchAllFriends();
      }
    };

    // Add event listener
    window.addEventListener('friendListUpdated', handleFriendListUpdate);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('friendListUpdated', handleFriendListUpdate);
    };
  }, [fetchAllFriends]);

  // Check for recent friends updates when component mounts
  useEffect(() => {
    const lastUpdate = localStorage.getItem('lastFriendsUpdate');
    if (lastUpdate) {
      try {
        const updateData = JSON.parse(lastUpdate);
        const timeDiff = Date.now() - updateData.timestamp;
        
        // If the update was within the last 60 seconds, apply it
        if (timeDiff < 60000 && updateData.action === 'accepted' && updateData.friendsData) {
          if (Array.isArray(updateData.friendsData)) {
            const processedFriends = updateData.friendsData.map(friend => ({
              id: friend.id || friend._id,
              Username: friend.Username,
              email: friend.email,
              profilePic: friend.profilePic,
              skills: friend.skills || [],
              friendedAt: friend.friendedAt
            })).filter(friend => friend.id);
            
            setFriends(processedFriends);
          }
        }
        
        // Clear the stored update
        localStorage.removeItem('lastFriendsUpdate');
      } catch (error) {
        localStorage.removeItem('lastFriendsUpdate');
      }
    }
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <span className="ml-4 text-lg">Loading friends...</span>
    </div>
  );
  if (error) return (
    <div className="alert alert-error shadow-lg my-4">
      <span>{error}</span>
    </div>
  );

  return (
    <div  className="w-full h-screen overflow-hidden "
    style={{
      backgroundImage: "url('/src/public/images/friend.png')", // put your file in /public/images
      backgroundRepeat: "repeat-y", // repeat vertically if height increases
      backgroundSize: "100% auto", // stretch full width, keep ratio
    }}
    >
      <div className="max-w-2xl mx-auto p-4">
      <h2 className=" mb-8  flex items-center "
      style={{
        fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
        fontWeight: 900,
        fontStyle: 'italic',
        fontSize: '3rem',
        letterSpacing: '0.03em',
        color: 'white',
        marginRight: '0.5em',
        textShadow: '0 1px 0 #000, 6px 0px #000',
      }}>Your Friends
      </h2>
      {friends.length === 0 ? (
        <div className="alert alert-info shadow-sm flex items-center gap-2 text-lg bg-blue-50 border-blue-200 text-blue-700">
          <span role="img" aria-label="No friends">😔</span>
          No friends yet.
        </div>
      ) : (
        <ul className="space-y-5">
          {friends.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between bg-white/90 rounded-2xl p-5 shadow-lg border border-green-100 hover:shadow-xl transition group"
            >
              <div className="flex items-center gap-4">
                {f.profilePic ? (
                  <img
                    src={f.profilePic}
                    alt={`${f.Username}'s profile`}
                    className="w-14 h-14 rounded-full object-cover border-2 border-green-400 shadow group-hover:scale-105 transition"
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl border-2 border-green-200 shadow">
                    <span role="img" aria-label="No profile pic">👤</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-green-900">{f.Username}</span> 
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-full font-semibold shadow hover:shadow-lg hover:scale-105 transition"
                  onClick={() => navigate(`/chat?peerId=${f.id}`)}
                  title="Chat"
                >
                  <span role="img" aria-label="Chat">💬</span> Chat
                </button>
                <button
                className="hover:border-red-200 border-4 rounded-full bg-red-500 text-white p-2 font-semibold shadow hover:scale-105 transition"
                onClick={() => handleUnFriend(f.id)}
              >
                UnFriend
              </button>

              </div>
            </li>
          ))}
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
    </div>
  );
};

export default Friends;