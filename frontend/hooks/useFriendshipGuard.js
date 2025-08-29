import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../src/api';

export default function useFriendshipGuard(peerId) {
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      return;
    }

    if (!peerId) {
      setLoading(false);
      return;
    }

    const checkFriendship = async () => {
      try {
        setLoading(true);
        
        // Try to get friends from cache first
        let friends = [];
        const cachedFriends = localStorage.getItem('friends');
        
        if (cachedFriends) {
          try {
            friends = JSON.parse(cachedFriends);
            if (!Array.isArray(friends)) {
              friends = [];
            }
          } catch (e) {
            friends = [];
          }
        }

        // If no cached friends or cache is old, fetch fresh data
        if (!friends.length) {
          const response = await api.get('/friend/list', { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          friends = response.data;
          localStorage.setItem('friends', JSON.stringify(friends));
        }

        const isFriend = friends.some((f) => f.id === peerId || f._id === peerId);
        
        if (!isFriend) {
          navigate('/');
          return;
        }

        setIsValid(true);
        
      } catch (error) {
        console.error('Friendship check error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkFriendship();
  }, [peerId, navigate]);

  return { isValid, loading };
}
