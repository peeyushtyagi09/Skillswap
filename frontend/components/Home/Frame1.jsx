import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';

const SKILLWAP_LETTERS = ['S', 'K', 'I', 'L', 'L', 'S', 'W', 'A', 'P'];

const Frame1 = () => {
  const navigate = useNavigate();

  // Letter animation
  const letterRefs = useRef(SKILLWAP_LETTERS.map(() => React.createRef()));
  const [rotations] = useState(() => SKILLWAP_LETTERS.map(() => (Math.random() * 16 - 8).toFixed(1)));

  // --- Modals ---
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // --- Login states ---
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [need2FA, setNeed2FA] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState('email');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // --- Register states ---
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerNeedOtp, setRegisterNeedOtp] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerOtpError, setRegisterOtpError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerOtpLoading, setRegisterOtpLoading] = useState(false);

  // --- Handlers ---
  const handleLoginChange = (e) => {
    setLoginForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setLoginError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setRegisterError('');
  };

  // --- Login submit ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setNeed2FA(false);
    setOtp('');
    setOtpError('');

    try {
      const { data } = await api.post('/auth/login', loginForm);
      if (data.need2fa) {
        setPendingEmail(loginForm.email);
        setNeed2FA(true);
        setTwoFAMethod(data.method || 'email');
        if (data.method === 'email') {
          await api.post('/auth/request-email-otp', { email: loginForm.email });
        }
        return;
      }
      localStorage.setItem('accessToken', data.accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      navigate('/landing');
    } catch (err) {
      setLoginError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');

    try {
      const payload = twoFAMethod === 'email'
        ? { email: pendingEmail, otp }
        : { email: pendingEmail, token: otp }; // TOTP
      const endpoint = twoFAMethod === 'email' ? '/auth/verify-email-otp' : '/auth/verify-totp-login';
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('accessToken', data.accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      navigate('/landing');
    } catch (err) {
      setOtpError(err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  // --- Register submit ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');

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
    } catch (err) {
      setRegisterError(err?.response?.data?.message || 'Failed to send OTP');
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
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      navigate('/landing');
    } catch (err) {
      setRegisterOtpError(err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setRegisterOtpLoading(false);
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginForm({ email: '', password: '' });
    setLoginError('');
    setNeed2FA(false);
    setOtp('');
    setOtpError('');
    setPendingEmail('');
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
    setRegisterError('');
    setRegisterNeedOtp(false);
    setRegisterOtp('');
    setRegisterOtpError('');
    setRegisterEmail('');
  };
  // Random rotations
  const [rotations] = useState(() => SKILLWAP_LETTERS.map(() => (Math.random() * 16 - 4).toFixed(1)))

  return (
    <div ref={frameRef} className="relative w-full min-h-screen bg-[#f6f4f4] flex flex-col justify-between ">
      <div className="absolute top-8 left-6 select-none flex flex-col items-start z-20">
        <div style={{ display: 'flex', marginBottom: '0.2em', transform: 'rotate(-3deg)' }}>
          {SKILLWAP_LETTERS.map((char, i) => (
            <span key={`skillwap-${i}`} ref={letterRefs.current[i]} style={{
              display: 'inline-block',
              transform: `rotate(${rotations[i]}deg)`,
              fontFamily: '"Luckiest Guy", sans-serif',
              fontWeight: 1000,
              fontSize: '4.5rem',
              lineHeight: 1,
              color: '#f6f4f4',
              letterSpacing: '0.01em',
              textShadow: '0 2px 0 #000, 0 4px 0 #000',
              WebkitTextStroke: '4px #000',
              background: 'transparent',
              padding: 0,
              margin: 0,
              textTransform: 'uppercase',
            }}>{char}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex flex-col items-center">
          <img className="animated-image" src="/src/public/images/frame1_main.png" alt="" />
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

      <div className="absolute bottom-8 right-8 flex gap-4">
        <button onClick={() => setShowLoginModal(true)} className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow-lg">Login</button>
        <button onClick={() => setShowRegisterModal(true)} className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg font-semibold shadow-lg">Register</button>
      </div>

      {/* Login Modal */}
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={closeLoginModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Login</h2>

            {!need2FA ? (
              <form onSubmit={handleLogin} className="space-y-6">
                {loginError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{loginError}</div>}
                <input type="email" name="email" value={loginForm.email} onChange={handleLoginChange} placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <input type="password" name="password" value={loginForm.password} onChange={handleLoginChange} placeholder="Password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <button type="submit" disabled={loginLoading} className="w-full bg-black text-white py-3 rounded-lg font-semibold">{loginLoading ? 'Logging in...' : 'Login'}</button>
              </form>
            ) : (
              <form onSubmit={submitOtp} className="space-y-6">
                <div className="text-sm text-gray-600">Enter the code from your authenticator app{twoFAMethod === 'email' ? ' or email' : ''}.</div>
                {otpError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{otpError}</div>}
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <button type="submit" disabled={otpLoading} className="w-full bg-black text-white py-3 rounded-lg font-semibold">{otpLoading ? 'Verifying...' : 'Verify'}</button>
                {twoFAMethod === 'email' && <button type="button" onClick={async () => { setOtpError(''); await api.post('/auth/request-email-otp', { email: pendingEmail }); }} className="mt-2 underline text-sm">Resend email code</button>}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={closeRegisterModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Register</h2>

            {!registerNeedOtp ? (
              <form onSubmit={handleRegister} className="space-y-6">
                {registerError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{registerError}</div>}
                <input type="text" name="username" value={registerForm.username} onChange={handleRegisterChange} placeholder="Username" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <input type="email" name="email" value={registerForm.email} onChange={handleRegisterChange} placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <input type="password" name="password" value={registerForm.password} onChange={handleRegisterChange} placeholder="Password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <input type="password" name="confirmPassword" value={registerForm.confirmPassword} onChange={handleRegisterChange} placeholder="Confirm Password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <button type="submit" disabled={registerLoading} className="w-full bg-black text-white py-3 rounded-lg font-semibold">{registerLoading ? 'Sending OTP...' : 'Register'}</button>
              </form>
            ) : (
              <form onSubmit={submitRegisterOtp} className="space-y-6">
                {registerOtpError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{registerOtpError}</div>}
                <input value={registerOtp} onChange={e => setRegisterOtp(e.target.value)} placeholder="OTP" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                <button type="submit" disabled={registerOtpLoading} className="w-full bg-black text-white py-3 rounded-lg font-semibold">{registerOtpLoading ? 'Verifying...' : 'Verify'}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Frame1
