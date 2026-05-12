import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { movieAPI } from '../api/auth';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const response = await movieAPI.getUserProfile();
        setUser(response.data.user);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const renderMovieList = (items) => {
    if (!items || items.length === 0) {
      return <p className="text-gray-400">No items yet.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={index} className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
            {item}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-darker to-dark text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold text-primary">My Profile</h1>
            <p className="text-gray-300 mt-2">Saved movies and account details</p>
          </div>
          <Link to="/" className="px-4 py-2 bg-primary rounded text-white hover:bg-red-700 transition">
            Back Home
          </Link>
        </div>

        {message && <div className="p-4 bg-red-900/40 border border-red-700 rounded">{message}</div>}

        {user && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-darker border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Account</h2>
              <p><span className="text-gray-400">Name:</span> {user.name}</p>
              <p><span className="text-gray-400">Email:</span> {user.email}</p>
              <p><span className="text-gray-400">Verified:</span> {user.isVerified ? 'Yes' : 'No'}</p>
            </div>

            <div className="bg-darker border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Favorites</h2>
              {renderMovieList(user.favorites)}
            </div>

            <div className="bg-darker border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Watch History</h2>
              {renderMovieList(user.history)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
