import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ isLoggedIn }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authchange'));
    window.location.href = '/';
  };

  return (
    <nav className="bg-darker border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-primary">🎬 MovieFlix</h1>
        </div>

        <div className="flex gap-4">
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className="px-4 py-2 text-white hover:text-primary transition"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="/auth"
                className="px-4 py-2 text-white hover:text-primary transition"
              >
                Login
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
