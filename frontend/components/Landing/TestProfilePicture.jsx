import React, { useState } from 'react';
import api from '../../src/api';

const TestProfilePicture = () => {
  const [testUrl, setTestUrl] = useState('');
  const [result, setResult] = useState('');
  const [profileId] = useState('68a1b1623d845e6e9034f8ec'); // Your profile ID

  const testUpdateProfilePicture = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setResult('Not authenticated');
        return;
      }

      const response = await api.put('/profile/test-profile-picture', { 
        profilePic: testUrl 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(`Error: ${error?.response?.data?.message || error.message}`);
    }
  };

  const testGetProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setResult('Not authenticated');
        return;
      }

      const response = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(`Error: ${error?.response?.data?.message || error.message}`);
    }
  };

  const testUpdateProfilePictureById = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setResult('Not authenticated');
        return;
      }

      const response = await api.put(`/profile/test-profile-picture/${profileId}`, { 
        profilePic: testUrl 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(`Error: ${error?.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Test Profile Picture Update</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Profile Picture URL:</label>
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="http://localhost:8000/uploads/test-image.jpg"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={testUpdateProfilePicture}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Update
          </button>
          <button
            onClick={testUpdateProfilePictureById}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Update by ID
          </button>
          <button
            onClick={testGetProfile}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Get Profile
          </button>
        </div>

        {result && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Result:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestProfilePicture;
