import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../src/api';
import Dock from '../src/block/Dock/Dock'; 
import Loader2 from "../components/Loaders/Loader2"


// ViewProfile Page
// - Displays the same profile UI previously shown in a modal, now as a full page
// - Supports viewing own profile (/view-profile) and other users (/view-profile/:userId)
// - Keeps scrollable panel behavior for consistency and better UX on small screens
export default function ViewProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }
        const endpoint = userId ? `/profile/user/${userId}` : '/profile';
        const { data } = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const certLink = (c) => c?.fileUrl || c?.url || '';
  const isImage = (link) => /\.(jpg|jpeg|png|gif|webp)$/i.test(link);

  return (
    <div className="h-full w-full bg-[#f6f4f4] py-6 px-4">
      <div className=" w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="border-4 hover:border-gray-200 bg-gray-400 w-fit text-white text-bold p-2 rounded-xl duration-500"
            aria-label="Go back"
            title="Go back"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{userId ? 'User Profile' : 'Your Profile'}</h1>
          <div className="w-[72px]" aria-hidden="true" />
        </div>

        {/* Content card (scrollable) */}
        <div
          className="bg-[#f7f7f7] rounded-2xl shadow-2xl p-6 md:p-8  w-full  min-h-0 border border-[#f5f2f2]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* States */}
          {loading && (
           <Loader2 />
          )}

          {!loading && error && (
            <div className="w-full flex flex-col items-center justify-center py-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
              <p className="text-gray-600 mb-6 text-center">{error}</p>
              <button onClick={() => navigate(-1)} className="border-4 hover:border-red-200 bg-red-400 text-white text-bold p-2 rounded-xl duration-500">Close</button>
            </div>
          )}

          {!loading && !error && !profile && (
            <div className="w-full flex flex-col items-center justify-center py-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-6 text-center">Unable to load the profile.</p>
              <button onClick={() => navigate(-1)} className="border-4 hover:border-red-200 bg-red-400 text-white text-bold p-2 rounded-xl duration-500">Close</button>
            </div>
          )}

          {!loading && !error && profile && (
            <>
             

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Avatar & Basic Info */}
                <div className="space-y-6">
                  <div className="bg-base-200 p-6 rounded-xl flex flex-col items-center shadow border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200">
                    {/* Avatar */}
                    <div className="mb-4">
                      <div className="avatar">
                        <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden flex items-center justify-center bg-neutral-focus text-neutral-content text-4xl font-bold">
                          {profile.profilePic ? (
                            <img
                              src={profile.profilePic}
                              alt="Profile"
                              className="object-cover w-32 h-32"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <div
                            style={{
                              display: profile.profilePic ? 'none' : 'flex',
                              width: '100%',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {profile.username ? profile.username[0].toUpperCase() : '?'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <h3
                      className=" mb-2"
                      style={{
                        fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
                        fontWeight: 900,
                        fontStyle: 'italic',
                        fontSize: '1.7rem',
                        letterSpacing: '0.03em',
                        color: 'black',
                        marginRight: '0.5em',
                        textShadow: '0 1px 0 #000, 2px 0 #000',
                      }}
                    >
                      Basic Information
                    </h3>
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-white shadow-sm hover:scale-[1.02] transition-transform duration-200">
                        <span className="font-semibold text-gray-700 text-lg">Username:</span>
                        <p className="text-gray-900 font-medium break-all">{profile.username}</p>
                      </div>
                      <div className="flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-white shadow-sm hover:scale-[1.02] transition-transform duration-200">
                        <span className="font-semibold text-gray-700 text-lg">Email:</span>
                        <p className="text-gray-900 font-medium break-all">{profile.email}</p>
                      </div>
                      {profile.age && (
                        <div className="flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-white shadow-sm hover:scale-[1.02] transition-transform duration-200">
                          <span className="font-semibold text-gray-700 text-lg">Age:</span>
                          <p className="text-gray-900 font-medium">{profile.age} years</p>
                        </div>
                      )}
                      {profile.educationLevel && (
                        <div className="flex items-center justify-between border border-gray-300 rounded-xl p-3 bg-white shadow-sm hover:scale-[1.02] transition-transform duration-200">
                          <span className="font-semibold text-gray-700 text-lg">Education:</span>
                          <p className="text-gray-900 font-medium">{profile.educationLevel}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <div className=" p-6 rounded-xl shadow border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Bio</h3>
                      <p className="text-gray-900 whitespace-pre-line">{profile.bio}</p>
                    </div>
                  )}
                </div>

                {/* Right: Skills & Certificates */}
                <div className="space-y-6">
                  {profile.skillsHave?.length > 0 && (
                    <div className=" p-6 rounded-xl shadow border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skillsHave.map((skill, i) => (
                          <span key={i} className="badge badge-primary px-3 py-2 text-base">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.skillsWant?.length > 0 && (
                    <div className=" p-6 rounded-xl shadow border border-[#f5f2f2] bg-[#f5f2f2] rounded-xl p-2 hover:scale-102 transition-transform duration-200">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Wants to Learn</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skillsWant.map((skill, i) => (
                          <span key={i} className="badge badge-success px-3 py-2 text-base">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.certificates?.length > 0 && (
                    <div className="bg-purple-50 p-6 rounded-xl shadow">
                      <h3 className="text-lg font-semibold text-purple-800 mb-2">Certificates</h3>
                      <div className="space-y-4">
                        {profile.certificates.map((cert, index) => {
                          const link = certLink(cert);
                          return (
                            <div key={cert._id || index} className="border-l-4 border-purple-400 pl-4 pb-2">
                              <p className="font-medium text-gray-900">{cert.name}</p>
                              {cert.issuer && (
                                <p className="text-sm text-gray-600">Issued by: {cert.issuer}</p>
                              )}
                              {cert.date && (
                                <p className="text-sm text-gray-600">
                                  Date: {new Date(cert.date).toLocaleDateString()}
                                </p>
                              )}
                              {link && (isImage(link) ? (
                                <a href={link} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                  <img
                                    src={link}
                                    alt={cert.name || 'Certificate'}
                                    className="rounded shadow max-h-32 border border-gray-200"
                                    style={{ maxWidth: '200px', objectFit: 'contain' }}
                                  />
                                </a>
                              ) : (
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link link-primary block mt-2"
                                >
                                  View Certificate File
                                </a>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between gap-4 mt-10">
              {!userId && (
                  <button
                    onClick={() => navigate('/update-profile')}
                    className="border-4 hover:border-gray-200 bg-gray-400 w-fit text-white text-bold p-2 rounded-xl duration-500"
                  >
                    Edit Profile
                  </button>
                )}
                <button onClick={() => navigate('/landing')} className="border-4 hover:border-red-200 bg-red-400 text-white text-bold p-2 rounded-xl duration-500">Close</button>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}