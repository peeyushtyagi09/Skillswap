import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';

const CreateProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    educationLevel: '',
    bio: '',
    skillsHave: '',
    skillsWant: '',
    profilePic: '',
    certificate: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Automatically upload and save the profile picture
      await handleUploadProfilePic(file);
    }
  };

// Upload image for initial profile creation
const handleUploadProfilePic = async (file = selectedFile) => {
  if (!file) return;

  setUploadingPic(true);
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    const fd = new FormData();
    fd.append("profilePicture", file);

    // 👇 Use the new route instead of /upload/profile-picture
    const { data } = await api.post("/profile/upload-initial-pic", fd, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    // Save the Cloudinary URL to local state only
    setFormData((prev) => ({ ...prev, profilePic: data.imageUrl }));
    console.log("Initial profile picture uploaded:", data.imageUrl);
  } catch (error) {
    alert(error?.response?.data?.message || "Failed to upload profile picture");
  } finally {
    setUploadingPic(false);
  }
};

  const handleUploadCertificate = async (file) => {
    if (!file) return

    try{
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const formDataData = new FormData();
      formDataData.append('certificate', file);

      const { data } = await api.post('/api/upload/certificate', formDataData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Certificate uploaded successfully:', data);

      setFormData(prev => ({ ...prev, certificate: data.fileUrl }));
    }catch (error) {
      alert(error?.response?.data?.message || 'Failed to upload certificate');
    }
  } 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const profileData = {
        username: formData.username,
        age: formData.age ? parseInt(formData.age) : undefined,
        educationLevel: formData.educationLevel,
        bio: formData.bio,
        skillsHave: formData.skillsHave ? formData.skillsHave.split(',').map(s => s.trim()) : [],
        skillsWant: formData.skillsWant ? formData.skillsWant.split(',').map(s => s.trim()) : [],
        profilePic: formData.profilePic || '', // Include the profile picture URL
        certificate: formData.certificate || ''
      };

      console.log('Creating profile with data:', profileData);

      const createResponse = await api.post('/profile/create', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Profile creation response:', createResponse.data);

      alert('Profile created successfully!');
      navigate('/landing');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Profile</h1>
          <p className="text-gray-600">Tell us about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload Section */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Picture
            </label>
            
            {/* Preview */}
            {previewUrl && (
              <div className="mb-4">
                <img 
                  src={previewUrl} 
                  alt="Profile preview" 
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
                />
              </div>
            )}

            {/* File Input */}
            <div className="flex flex-col items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input file-input-bordered w-full max-w-xs"
                disabled={uploadingPic}
              />
              
              {uploadingPic && (
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              )}
            </div>

            {/* Uploaded Image URL */}
            {formData.profilePic && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Profile picture uploaded successfully!
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="0"
                max="120"
                className="input input-bordered w-full"
                placeholder="Enter your age"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Level
            </label>
            <select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleChange}
              className="select select-bordered w-full"
            >
              <option value="">Select education level</option>
              <option value="High School">High School</option>
              <option value="Associate Degree">Associate Degree</option>
              <option value="Bachelor's Degree">Bachelor's Degree</option>
              <option value="Master's Degree">Master's Degree</option>
              <option value="Doctorate">Doctorate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              maxLength="500"
              className="textarea textarea-bordered w-full"
              placeholder="Tell us about yourself..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills You Have
            </label>
            <input
              type="text"
              name="skillsHave"
              value={formData.skillsHave}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="e.g., JavaScript, React, Design (separate with commas)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills You Want to Learn
            </label>
            <input
              type="text"
              name="skillsWant"
              value={formData.skillsWant}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="e.g., Python, Machine Learning, UI/UX (separate with commas)"
            />
          </div>
          {/* Certificate Upload Section */}
            <div className="text-center mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Certificate (PDF, Word, or Image)
              </label>

              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => handleUploadCertificate(e.target.files[0])}
                className="file-input file-input-bordered w-full max-w-xs"
              />

              {formData.certificate && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Certificate uploaded successfully!
                  </p>
                </div>
              )}
            </div>


          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Profile...
                </>
              ) : (
                'Create Profile'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/landing')}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;