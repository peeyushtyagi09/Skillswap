import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../src/api';
import { motion, AnimatePresence } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Dock from '../src/block/Dock/Dock';

// Remove unused import
// import gsap from 'gsap';

const menuVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }
};

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
    const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  // Remove unused friendObjects state
  // const [friendObjects, setFriendObjects] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Filter users by Username (case-insensitive)
  
  const filteredUsers = useMemo(
    () =>
      users?.filter(u => {
        const searchTerm = search.toLowerCase();
        return (
          u.Username?.toLowerCase().includes(searchTerm) ||
          u.skillsHave?.some(skillsHave =>
            skillsHave.toLowerCase().includes(searchTerm)
          ) ||
          u.skillsWant?.some(skillsWant => 
            skillsWant.toLowerCase().includes(searchTerm)
            
          )
        );
        
      }),
    [users, search]
  );
  const items = [
    { label: "Home", icon: ' 🏠 ', onClick: () => navigate("/landing") },
    { label: "Discuss", icon: '💬', onClick: () => navigate("/discuss") },
    { label: "Friends", icon: '👨', onClick: () => navigate("/friends") },
    {label: "Primium", icon: '🏆', onClick:() => navigate("/Working")}
  ];

  // Fetch user/profile/friends/outgoing requests
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchAllUsers = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const { data } = await api.get('/auth/allUser', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(data); 
      } catch (err) {
        console.error(err);
      }
    };

    const fetchFriends = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const { data } = await api.get('/friend/list', { headers: { Authorization: `Bearer ${token}` } });
        const list = Array.isArray(data) ? data : [];
        setFriends(list);
        localStorage.setItem('friends', JSON.stringify(list)); 
        
      } catch (err) { console.error(err); }
    };

    const fetchOutgoingRequests = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const { data } = await api.get('/friend/notifications/outgoing', { headers: { Authorization: `Bearer ${token}` } });
        setOutgoingRequests(data);
      } catch (err) {
        console.error(err);
      }
    };

    const checkProfileAndFetchData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const profileResponse = await api.get('/profile/check', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (profileResponse.data.hasProfile) {
          setHasProfile(true);
          await Promise.all([
            fetchMe(),
            fetchAllUsers(),
            fetchFriends(),
            fetchOutgoingRequests()
          ]);
        } else {
          navigate('/create-profile');
          return;
        }
      } catch (error) {
        if (error.response?.status === 404) {
          navigate('/create-profile');
          return;
        }
        console.error('Error checking profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProfileAndFetchData();
  }, [navigate]);

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to Logout your account?')) return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('friends');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Not authenticated');
        return;
      }
      await api.delete('/auth/delete', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.removeItem('accessToken');
      alert('Account deleted successfully');
      navigate('/');
    } catch (err) {
      alert(
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'Failed to delete account'
      );
    }
  };

  const handleAddFriend = async (targetId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return alert('Not authenticated');
      await api.post('/friend/request', { targetId }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Friend request sent!');
      // Refresh outgoing requests after sending
      const { data } = await api.get('/friend/notifications/outgoing', { headers: { Authorization: `Bearer ${token}` } });
      setOutgoingRequests(data);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to send friend request');
    }
  };

  const handleCancelRequest = async (targetId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return alert('Not authenticated');
      await api.delete('/friend/request/cancel', { 
        data: { targetId }, 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert('Friend request cancelled!');
      // Refresh outgoing requests after cancelling
      const { data } = await api.get('/friend/notifications/outgoing', { headers: { Authorization: `Bearer ${token}` } });
      setOutgoingRequests(data);
      
      // Dispatch custom event to notify other components about the friend list update
      window.dispatchEvent(new CustomEvent('friendListUpdated', { 
        detail: { action: 'cancelled' } 
      }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to cancel friend request');
    }
  };

  const handleNotification = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return alert('Not authenticated');
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/friend/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/friend/notifications/outgoing', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotifications(incomingRes.data);
      setOutgoingRequests(outgoingRes.data);
      setModalOpen(true);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to fetch notifications');
    }
  };

  // Improved: Always update friends list state with normalized objects, and ensure event/LS backup is always dispatched.
  // In Landing.jsx
  const handleAccept = async (notifId, senderId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return alert('Not authenticated');
  
      await api.post(
        '/friend/accept',
        { notifId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // ✅ update notifications state
      setNotifications(prev => prev.filter(n => n._id !== notifId));
  
      // ✅ update friends state (just add sender as a friend locally)
      setFriends(prev => [...prev, { id: senderId }]);
  
      setModalOpen(false);
      alert('Friend request accepted');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to accept request');
    }
  };
  

  const handleReject = async (notifId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return alert('Not authenticated');
  
      await api.post(
        '/friend/reject',
        { notifId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // ✅ remove rejected request locally
      setNotifications(prev => prev.filter(n => n._id !== notifId));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reject request');
    }
  };
  
  

  // Returns true if userId is in friends list
// AFTER
      const isFriend = (userId) => {
        if (!userId) return false;
        const uid = userId.toString();
        return friends.some(f => (f?.id || f?._id)?.toString() === uid);
      };
  // Returns true if there is an outgoing request to userId
  const hasOutgoingRequest = (userId) => {
    return outgoingRequests.some(req => {
      // Defensive: handle both string and object receiverId
      if (!req.receiverId) return false;
      if (typeof req.receiverId === 'string') return req.receiverId === userId;
      return req.receiverId._id === userId || req.receiverId.id === userId;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f6f4f4]">
        <p className="mt-4 text-gray-600 text-lg font-semibold animate-pulse"> ⚙️ Loading...</p>
      </div>
    );
  }

  if (!hasProfile) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#f6f4f4] relative pb-24">
      {/* Top-left corner content goes here */}
      <div
        className="fixed top-4 left-4 z-50 flex items-center gap-3 bg-white/80 shadow-lg rounded-full px-4 py-2 border border-green-200 backdrop-blur-md"
        onClick={() => { navigate('/view-profile'); setDropdownOpen(false); }}
      >
        {user?.profilePic ? (
          <img
            src={user.profilePic}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-green-400 shadow"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl border-2 border-green-200 shadow">
            <span role="img" aria-label="No profile pic">👤</span>
          </div>
        )}
        <div className="hidden sm:flex flex-col justify-center ml-1">
          <span className="font-semibold text-green-900 text-lg leading-tight">
            {user?.name}
          </span>
          <span className="text-xs text-gray-500">My Profile</span>
        </div>

      </div>
      {/* Top-right settings dropdown */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenu.Trigger asChild>
            <motion.button
              aria-label="Settings"
              className=" hover:scale-110 transition-transform"
              whileTap={{ scale: 0.9, rotate: 180 }}
              whileHover={{ rotate: -100 }}
            >
              <span>⚙️</span>
            </motion.button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <AnimatePresence>
              {dropdownOpen && (
                <DropdownMenu.Content
                  sideOffset={12}
                  asChild
                  className="p-0"
                >
                  <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-base-100 rounded-2xl shadow-2xl w-72 max-w-[90vw] overflow-hidden border border-green-200"
                  >
                    <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-green-300 to-green-100 border-b border-green-200">
                      <span className="font-bold text-lg text-green-900"> ⚙️ Settings</span>
                    </div>
                    <div className="menu menu-sm px-2 py-2">
                      <DropdownMenu.Item asChild>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-green-100 transition"
                          onClick={() => { navigate('/view-profile'); setDropdownOpen(false); }}
                        >
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View Profile
                        </button>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-green-100 transition"
                          onClick={() => { navigate('/update-profile'); setDropdownOpen(false); }}
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7l-1.5-1.5" />
                          </svg>
                          Update Profile
                        </button>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-green-100 transition"
                          onClick={() => { handleNotification(); setDropdownOpen(false); }}
                        >
                          🔔 Notifications
                          {notifications.length > 0 && (
                            <span className="ml-auto badge badge-error badge-sm animate-bounce">{notifications.length}</span>
                          )}
                        </button>
                      </DropdownMenu.Item>
                    </div>
                    <DropdownMenu.Separator className="h-px bg-green-200 my-1" />
                    <div className="menu-title mt-1 px-5 text-xs text-gray-500">Danger Zone</div>
                    <div className="menu menu-sm px-2 py-2">
                      <DropdownMenu.Item asChild>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-yellow-100 text-yellow-700 transition"
                          onClick={() => { handleLogout(); setDropdownOpen(false); }}
                        >
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                          </svg>
                          Logout
                        </button>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-100 text-red-700 transition"
                          onClick={() => { handleDeleteAccount(); setDropdownOpen(false); }}
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                          Delete Account
                        </button>
                      </DropdownMenu.Item>
                    </div>
                    <DropdownMenu.Arrow className="fill-base-100" />
                  </motion.div>
                </DropdownMenu.Content>
              )}
            </AnimatePresence>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Main content */}
      <div className="w-full flex flex-col items-center justify-start pt-20 px-2 sm:px-0">
      
        <motion.h1 
          className="text-3xl sm:text-4xl font-extrabold text-gray-800 drop-shadow-lg text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '2rem',
            letterSpacing: '0.03em',
            color: 'black',
            marginRight: '0.5em',
            textShadow: '0 1px 0 #000, 2px 0 #000',
          }}
        >
          Welcome! <span> {user?.name} </span> 
        </motion.h1>

        <motion.input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="mt-6 p-3 rounded-xl border border-green-300 shadow focus:outline-none focus:ring-2 focus:ring-green-400 w-full max-w-md transition"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        />

        <div className="mt-6 w-full max-w-2xl px-0 sm:px-4">
          <AnimatePresence initial={false}>
            {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map(u => {
              return (
                <motion.div
                  key={u.id || u._id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="p-4 border border-green-100 rounded-xl bg-white/90 mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow hover:shadow-lg transition"
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => {
                      const id = u.id || u._id;
                      navigate(`/view-profile/${id}`);
                    }}
                    title="View Profile"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {u.profilePic ? (
                        <img
                          src={u.profilePic}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-400 shadow"
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl border-2 border-green-200 shadow">
                          <span role="img" aria-label="No profile pic">👤</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-green-800">{u.name}</p>
                        {u.skillsHave && u.skillsHave.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {u.skillsHave.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {u.skillsHave.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                +{u.skillsHave.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {isFriend(u.id || u._id) ? (
                      <span className="px-4 py-2 bg-green-200 text-green-800 rounded-full font-semibold shadow-sm  ">Friend</span>
                    ) : hasOutgoingRequest(u.id || u._id) ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleCancelRequest(u.id || u._id)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-full font-semibold shadow hover:shadow-lg transition"
                      >
                        Cancel Request
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleAddFriend(u.id || u._id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-full font-semibold shadow hover:shadow-lg transition"
                      >
                        Add Friend
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            }) : (
              <motion.p
                key="no-users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-center text-gray-500"
              >
                No users found.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      
      {/* Notifications Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-green-200"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span>🔔 </span>
                <h2 className="text-lg font-bold">Friend Requests</h2>
              </div>
              
              {/* Incoming Requests */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Incoming Requests</h3>
                {notifications && notifications.length > 0 ? notifications.map(n => {
                  const sender = n.senderId;
                  return (
                    <div key={n._id} className="p-2 border rounded-xl mb-2 bg-green-50 flex flex-col gap-2">
                      <p>
                        <strong className="text-green-800">{sender.Username}</strong> wants to be your friend
                      </p>
                      <div className="flex gap-2 mt-1">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAccept(n._id, n.senderId)}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg font-semibold shadow hover:bg-green-600 transition"
                        >
                          Accept
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(n._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition"
                        >
                          Reject
                        </motion.button>
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-500 text-sm">No incoming requests.</p>}
              </div>

              {/* Outgoing Requests */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Outgoing Requests</h3>
                {outgoingRequests && outgoingRequests.length > 0 ? outgoingRequests.map(n => {
                  const receiver = n.receiverId;
                  // Defensive: handle both string and object receiverId
                  const receiverName = typeof receiver === 'string'
                    ? receiver
                    : receiver?.Username || receiver?.email || 'Unknown';
                  const receiverId = typeof receiver === 'string'
                    ? receiver
                    : receiver?._id || receiver?.id;
                  return (
                    <div key={n._id} className="p-2 border rounded-xl mb-2 bg-yellow-50 flex flex-col gap-2">
                      <p>
                        Friend request sent to <strong className="text-yellow-800">{receiverName}</strong>
                      </p>
                      <div className="flex gap-2 mt-1">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancelRequest(receiverId)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-lg font-semibold shadow hover:bg-yellow-600 transition"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-500 text-sm">No outgoing requests.</p>}
              </div>
              <div className="mt-4 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom navigation */}
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

export default Landing;