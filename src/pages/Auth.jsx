import { useState } from 'react';
import { authAPI } from '../api/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('form'); // form, otp
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        await authAPI.signup(formData);
        setMessage('Signup successful! Check your email for OTP.');
        setStep('otp');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await authAPI.verifyOTP({
        email: formData.email,
        otp,
      });

      setMessage('Email verified! You can now login.');
      setTimeout(() => {
        setIsLogin(true);
        setStep('form');
        setOtp('');
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setMessage('');
      await authAPI.resendOTP({ email: formData.email });
      setMessage('OTP resent to your email.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-darker rounded-lg p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
            />

            {!isLogin && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-primary"
              />
            )}

            {message && (
              <p className={`text-center text-sm ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPVerify} className="space-y-4">
            <p className="text-center text-gray-300">
              Enter the 6-digit OTP sent to your email
            </p>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              maxLength="6"
              required
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-center text-2xl tracking-widest focus:outline-none focus:border-primary"
            />

            {message && (
              <p className={`text-center text-sm ${message.includes('verified') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full text-gray-300 py-2 hover:text-primary transition"
            >
              Back to Sign Up
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-gray-300 py-2 hover:text-primary transition disabled:opacity-50"
            >
              Resend OTP
            </button>
          </form>
        )}

        <p className="text-center text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setStep('form');
              setMessage('');
              setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            }}
            className="text-primary hover:underline font-bold"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
