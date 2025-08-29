import React, { useState } from 'react';
import api from '../../src/api';

const CertificateManager = ({ onClose, onCertificateAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    date: '',
    url: '',
    fileUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadCertificate = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploadingCert(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('certificate', selectedFile);

      const { data } = await api.post('/upload/certificate', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({ ...prev, fileUrl: data.fileUrl }));
      alert('Certificate uploaded successfully!');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to upload certificate');
    } finally {
      setUploadingCert(false);
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

      const certificateData = {
        ...formData,
        date: formData.date || new Date().toISOString().split('T')[0]
      };

      await api.post('/profile/certificates', certificateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Certificate added successfully!');
      onCertificateAdded();
      onClose();
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to add certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Certificate</h2>
          <button onClick={onClose} className="btn btn-circle btn-outline btn-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
              placeholder="e.g., AWS Certified Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issuing Organization *
            </label>
            <input
              type="text"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
              placeholder="e.g., Amazon Web Services"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input input-bordered w-full"
            />
          </div>

          {/* Certificate File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate File
            </label>
            
            <div className="space-y-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="file-input file-input-bordered w-full"
              />
              
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleUploadCertificate}
                  disabled={uploadingCert}
                  className="btn btn-primary btn-sm w-full"
                >
                  {uploadingCert ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Uploading...
                    </>
                  ) : (
                    'Upload Certificate'
                  )}
                </button>
              )}
            </div>

            {/* Uploaded File URL */}
            {formData.fileUrl && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Certificate uploaded successfully!
                </p>
              </div>
            )}
          </div>

          {/* Manual URL input as alternative */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or provide URL manually
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="https://example.com/certificate.pdf"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || (!formData.fileUrl && !formData.url)}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                'Add Certificate'
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
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

export default CertificateManager;
