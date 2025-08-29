import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';
console.log(api.defaults.baseURL);

gsap.registerPlugin(ScrollTrigger);

const SKILLWAP_LETTERS = ['S', 'K', 'I', 'L', 'L', 'S', 'W', 'A', 'P'];

const Frame1 = () => { 
  const frameRef = useRef(null);
  const navigate = useNavigate();

  // Refs for each letter
  const letterRefs = useRef(SKILLWAP_LETTERS.map(() => React.createRef()));

  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  // Loading states
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Error states
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  // OTP states for login
  const [needOtp, setNeedOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // OTP states for registration
  const [registerNeedOtp, setRegisterNeedOtp] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerOtpLoading, setRegisterOtpLoading] = useState(false);
  const [registerOtpError, setRegisterOtpError] = useState('');

  const handleLoginChange = (e) => {
    setLoginForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setLoginError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setRegisterError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setNeedOtp(false);
    setOtp('');
    setOtpError('');

    try {
      const { data } = await api.post('/auth/login', loginForm);
      if (data.need2fa) {
        setPendingEmail(loginForm.email);
        setNeedOtp(true);
        await api.post('/auth/request-email-otp', { email: loginForm.email });
        return;
      }
      localStorage.setItem('accessToken', data.accessToken);
      navigate('/landing');
    } catch (error) {
      setLoginError(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');

    try {
      const { data } = await api.post('/auth/verify-email-otp', { email: pendingEmail, otp });
      localStorage.setItem('accessToken', data.accessToken);
      navigate('/landing');
    } catch (error) {
      setOtpError(error?.response?.data?.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    setRegisterNeedOtp(false);
    setRegisterOtp('');
    setRegisterOtpError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Passwords do not match');
      setRegisterLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/auth/request-register-otp', {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
      });
      setRegisterEmail(registerForm.email);
      setRegisterNeedOtp(true);
    } catch (error) {
      setRegisterError(error?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setRegisterLoading(false);
    }
  };

  const submitRegisterOtp = async (e) => {
    e.preventDefault();
    setRegisterOtpLoading(true);
    setRegisterOtpError('');

    try {
      const { data } = await api.post('/auth/verify-register-otp', { email: registerEmail, otp: registerOtp });
      localStorage.setItem('accessToken', data.accessToken);
      navigate('/landing');
    } catch (error) {
      setRegisterOtpError(error?.response?.data?.message || 'OTP verification failed');
    } finally {
      setRegisterOtpLoading(false);
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginForm({ email: '', password: '' });
    setLoginError('');
    setNeedOtp(false);
    setOtp('');
    setOtpError('');
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
    setRegisterError('');
    setRegisterNeedOtp(false);
    setRegisterOtp('');
    setRegisterOtpError('');
  };

  // Random rotations
  const [rotations] = useState(() => SKILLWAP_LETTERS.map(() => (Math.random() * 16 - 4).toFixed(1)));

  return (
    <div ref={frameRef} className="relative w-full min-h-screen bg-[#f6f4f4] flex flex-col justify-between">
      <div className="absolute top-8 left-6 select-none flex flex-col items-start z-20">
        <div style={{ display: 'flex', marginBottom: '0.2em', transform: 'rotate(-3deg)' }}>
          {SKILLWAP_LETTERS.map((char, i) => (
            <span key={`skillwap-${i}`} ref={letterRefs.current[i]} style={{
              display: 'inline-block',
              transform: `rotate(${rotations[i + 2]}deg)`,
              fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
              fontWeight: 1000,
              fontSize: '4.5rem',
              lineHeight: 1,
              color: '#f6f4f4',
              letterSpacing: '0.01em',
              textShadow: '0 2px 0 #000, 0 4px 0 #000, 0 6px 0 #000, 0 8px 0 #000',
                WebkitTextStroke: '4px #000',
                background: 'transparent',
                padding: 0,
                margin: 0,
                textTransform: 'uppercase',
                opacity: 1,
            }}>{char}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex flex-col items-center">
          <img className="animated-image" src="/images/frame1_main.png" alt="" />
          <style>{`
            @keyframes floatAround {
              0%   { transform: translate(0, 0); }
              25%  { transform: translate(10px, 0); }
              50%  { transform: translate(0, 10px); }
              75%  { transform: translate(-10px, 0); }
              100% { transform: translate(0, 0); }
            }
            .animated-image { animation: floatAround 6s ease-in-out infinite; }
          `}</style>
        </div>
      </div>

      {/* Login & Register Buttons */}
      <div className="absolute bottom-8 right-8 flex gap-4" >
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 shadow-lg"
          style={{
            fontFamily: 'cursive, "Comic Sans MS", "Brush Script MT", sans-serif',
            fontWeight: 600,
            transform: 'rotate(-10deg)',
            letterSpacing: '0.01em',
          }}
        >
          Login
        </button>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg"
          style={{
            fontFamily: 'cursive, "Comic Sans MS", "Brush Script MT", sans-serif',
            fontWeight: 600,
            transform: 'rotate(-10deg)',
            letterSpacing: '0.01em',
          }}
        >
          Register
        </button>
      </div>

      {/* Login Modal */}
{showLoginModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
      <button
        onClick={closeLoginModal}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        ×
      </button>
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Login</h2>

      {!needOtp ? (
        <form onSubmit={handleLogin} className="space-y-6">
          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {loginError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="space-y-6">
          <button
            type="button"
            onClick={() => setNeedOtp(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back
          </button>
          <div className="text-sm text-gray-600">Enter the OTP sent to your email.</div>

          {otpError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {otpError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={otpLoading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold"
          >
            {otpLoading ? 'Verifying...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={async () => {
              setOtpError('');
              await api.post('/auth/request-email-otp', { email: pendingEmail });
            }}
            className="mt-2 underline"
          >
            Resend OTP
          </button>
        </form>
      )}
    </div>
  </div>
)}


      {/* Register Modal */}
{showRegisterModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
      <button
        onClick={closeRegisterModal}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        ×
      </button>
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Register</h2>

      {!registerNeedOtp ? (
        <form onSubmit={handleRegister} className="space-y-6">
          {registerError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {registerError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={registerForm.username}
              onChange={handleRegisterChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={registerForm.confirmPassword}
              onChange={handleRegisterChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={registerLoading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {registerLoading ? 'Sending OTP...' : 'Register'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitRegisterOtp} className="space-y-6">
          <button
            type="button"
            onClick={() => {
              setRegisterNeedOtp(false);
              setRegisterOtp('');
              setRegisterOtpError('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back
          </button>

          <div className="text-sm text-gray-600">Enter the OTP sent to your email.</div>

          {registerOtpError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {registerOtpError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
            <input
              value={registerOtp}
              onChange={e => setRegisterOtp(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={registerOtpLoading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold"
          >
            {registerOtpLoading ? 'Verifying...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={async () => {
              setRegisterOtpError('');
              await api.post('/auth/request-register-otp', {
                username: registerForm.username,
                email: registerEmail,
                password: registerForm.password,
              });
            }}
            className="mt-2 underline"
          >
            Resend OTP
          </button>
        </form>
      )}
    </div>
  </div>
)}

    </div>
  );
};

export default Frame1;