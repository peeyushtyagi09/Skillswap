import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';
import Loader2 from '../../components/Loaders/Loader2';

const UpdateProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: '',
    educationLevel: '',
    bio: '',
    skillsHave: '',
    skillsWant: '',
    profilePic: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Profile picture upload
  const [uploadingPic, setUploadingPic] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Certificates
  const [certificates, setCertificates] = useState([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    date: '',
    file: null,
    url: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          alert('Not authenticated');
          return;
        }

        const { data } = await api.get('/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setFormData({
          age: data.age || '',
          educationLevel: data.educationLevel || '',
          bio: data.bio || '',
          skillsHave: data.skillsHave ? data.skillsHave.join(', ') : '',
          skillsWant: data.skillsWant ? data.skillsWant.join(', ') : '',
          profilePic: data.profilePic || ''
        });

        setCertificates(Array.isArray(data.certificates) ? data.certificates : []);

        if (data.profilePic) {
          setPreviewUrl(data.profilePic);
        }
      } catch (error) {
        alert(error?.response?.data?.message || 'Failed to fetch profile');
        navigate('/landing');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

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
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Automatically upload and save the profile picture
      await handleUploadProfilePic(file);
    }
  };

  // Persist profile picture immediately after upload
  const handleUploadProfilePic = async (file = selectedFile) => {
    if (!file) {
      return;
    }

    setUploadingPic(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const fd = new FormData();
      fd.append('profilePicture', file);

      const { data } = await api.post('/upload/profile-picture', fd, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Save to profile right away so View Profile sees it
      await api.put('/profile/profile-picture', { profilePic: data.imageUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormData(prev => ({ ...prev, profilePic: data.imageUrl }));
      setPreviewUrl(data.imageUrl);
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  // Certificates helpers
  const handleCertChange = (e) => {
    const { name, value } = e.target;
    setCertForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCertFileSelect = (e) => {
    const file = e.target.files[0] || null;
    setCertForm(prev => ({ ...prev, file }));
  };

  const addCertificate = async () => {
    if (!certForm.name || !certForm.issuer) {
      alert('Please provide certificate name and issuer');
      return;
    }

    setUploadingCert(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      let fileUrl = '';
      if (certForm.file) {
        const fd = new FormData();
        fd.append('certificate', certForm.file);
        const up = await api.post('/upload/certificate', fd, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        fileUrl = up.data.fileUrl;
      }

      // Prefer uploaded fileUrl; fallback to manual URL
      const payload = {
        name: certForm.name,
        issuer: certForm.issuer,
        date: certForm.date || undefined,
        fileUrl: fileUrl || undefined,
        url: !fileUrl && certForm.url ? certForm.url : undefined
      };

      const { data } = await api.post('/profile/certificates', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Server returns { message, certificate, profile }
      setCertificates(data?.profile?.certificates || []);
      setCertForm({ name: '', issuer: '', date: '', file: null, url: '' });
      alert('Certificate added!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add certificate');
    } finally {
      setUploadingCert(false);
    }
  };

  const removeCertificate = async (certificateId) => {
    if (!window.confirm('Remove this certificate?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await api.delete(`/profile/certificates/${certificateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(data?.profile?.certificates || []);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to remove certificate');
    }
  };

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
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        skillsHave: formData.skillsHave ? formData.skillsHave.split(',').map(s => s.trim()) : [],
        skillsWant: formData.skillsWant ? formData.skillsWant.split(',').map(s => s.trim()) : []
      };

      await api.put('/profile/update', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Profile updated successfully!');
      navigate('/landing');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Loader2 />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-[#f7f7f7] rounded-lg shadow-xl p-8 w-full m-3 ">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{
            fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '2rem',
            letterSpacing: '0.03em',
            color: 'black',
            marginRight: '0.5em',
            textShadow: '0 1px 0 #000, 2px 0 #000',
          }}>Update Your Profile</h1> 
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload Section */}
          <div className="main flex flex-col md:flex-row gap-6 w-full">
            <div className="w-full md:w-1/2 p-3">
            <div className="text-center m-3">
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

            {formData.profilePic && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Profile picture saved
                </p>
              </div>
            )}
          </div>

          {/* Basic fields */}
          <div className="border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200 mb-3">
            <label className="block text-xl font-large font-bold text-black mb-2 ">
              Age
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              max="120"
              className="input input-bordered w-full p-2 rounded-xl"
              placeholder="Enter your age"
            />
          </div>

          <div className="border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200 mb-3">
            <label className="block text-xl font-large font-bold  text-black mb-2 ">
              Education Level
            </label>
            <select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleChange}
              className="select select-bordered w-full bg-[#f2e4e4] p-3   rounded-xl  focus:ring-2 focus:ring-[#ebdfdf] focus:outline-none transition duration-200"
            >
              <option className='bg-gray-200 m-1 p-2' value="">Select education level</option>
              <option className='bg-white m-1 p-2' value="High School">High School</option>
              <option className='bg-gray-200 m-1 p-2' value="Associate Degree">Associate Degree</option>
              <option className='bg-white m-1 p-2' value="Bachelor's Degree">Bachelor's Degree</option>
              <option className='bg-gray-200 m-1 p-2' value="Master's Degree">Master's Degree</option>
              <option className='bg-white m-1 p-2' value="Doctorate">Doctorate</option>
              <option className='bg-gray-200 m-1 p-2' value="Other">Other</option>
            </select>
          </div>

          <div className="border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200 mb-3">
            <label className="block text-xl font-large font-bold  text-black mb-2 ">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              maxLength="500"
              className="textarea textarea-bordered w-full rounded-xl p-2"
              placeholder="Tell us about yourself..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>
            </div>
            <div className="w-full md:w-1/2 p-3">
            <div className="border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200 mb-3">
            <label className="block text-xl font-large font-bold  text-black mb-2  p-2">
              Skills You Have
            </label>
            <input
              type="text"
              name="skillsHave"
              value={formData.skillsHave}
              onChange={handleChange}
              className="input input-bordered w-full p-2 rounded-xl"
              placeholder="e.g., JavaScript, React, Design (separate with commas)"
            />
          </div>

          <div className="border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200 mb-3">
            <label className="block text-xl font-large font-bold  text-black mb-2 ">
              Skills You Want to Learn
            </label>
            <input
              type="text"
              name="skillsWant"
              value={formData.skillsWant}
              onChange={handleChange}
              className="input input-bordered w-full p-2 rounded-xl"
              placeholder="e.g., Python, Machine Learning, UI/UX (separate with commas)"
            />
          </div>

          {/* Certificates section */}
          <div className="divider block text-xl font-large font-bold  text-black mb-3" style={{
            fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '2rem',
            letterSpacing: '0.03em',
            color: 'black',
            marginRight: '0.5em',
            textShadow: '0 1px 0 #000, 2px 0 #000',
          }}>Certificates</div>

          {/* Existing certificates */}
          {certificates.length > 0 ? (
            <div className="space-y-3">
              {certificates.map((cert) => {
                const link = cert.fileUrl || cert.url || '';
                const isImage = link && /\.(jpg|jpeg|png|gif|webp)$/i.test(link);
                return (
                  <div key={cert._id || cert.name} className="p-3 font-large font-bold  border rounded-lg flex items-start gap-3 border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200 mb-3">
                    <div className="flex-1">
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-sm text-gray-600">Issuer: {cert.issuer}</p>
                      {cert.date && (
                        <p className="text-sm text-gray-600">
                          Date: {new Date(cert.date).toLocaleDateString()}
                        </p>
                      )}
                      {link && (
                        isImage ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="block mt-2">
                            <img
                              src={link}
                              alt={cert.name}
                              className="rounded shadow max-h-24 border border-gray-200"
                              style={{ maxWidth: '160px', objectFit: 'contain' }}
                            />
                          </a>
                        ) : (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="link link-primary mt-1 inline-block">
                            View file
                          </a>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      className="border-4 hover:border-red-200 bg-red-400 p-2 text-white  rounded-xl"
                      onClick={() => removeCertificate(cert._id)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No certificates yet.</p>
          )}

          {/* Add new certificate */}
          <div className="border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200">
            <div className="grid grid-cols-1  gap-3">
              <input
                type="text"
                name="name"
                value={certForm.name}
                onChange={handleCertChange}
                placeholder="Certificate name"
                className="input w-full p-2 border-4 border-[#ebdfdf] rounded-xl font-bold"
              />
              <input
                type="text"
                name="issuer"
                value={certForm.issuer}
                onChange={handleCertChange}
                placeholder="Issuer"
                className="input w-full p-2 border-4 border-[#ebdfdf] rounded-xl font-bold"
              />
              <input
                type="date"
                name="date"
                value={certForm.date}
                onChange={handleCertChange}
                className="input input-bordered w-full"
              />
            </div>

            <div className="grid grid-cols-1  gap-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleCertFileSelect}
                className="file-input file-input-bordered w-full "
              />
              <input
                type="url"
                name="url"
                value={certForm.url}
                onChange={handleCertChange}
                placeholder="Or paste a public file URL"
                className="input  p-2 border-4 border-[#ebdfdf] rounded-xl font-bold"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={addCertificate}
                disabled={uploadingCert}
                className="border-4 hover:border-green-200 bg-green-400 p-2 text-white m-3 rounded-xl"
              >
                {uploadingCert ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  'Add Certificate'
                )}
              </button>
            </div>
          </div>
            </div>
          </div>

          

          <div className="flex justify-between gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="border-4 hover:border-green-200 bg-green-400 p-2 text-white m-3 rounded-xl"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Updating Profile...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/landing')}
              className="border-4 hover:border-red-200 bg-red-400 p-2 text-white m-3 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;