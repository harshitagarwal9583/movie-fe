import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import MovieDetail from './pages/MovieDetail';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(!!localStorage.getItem('token'));

    window.addEventListener('storage', syncAuth);
    window.addEventListener('authchange', syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('authchange', syncAuth);
    };
  }, []);

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={isLoggedIn ? <Navigate to="/" /> : <Auth />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/auth" />} />
        <Route path="/movie/:movieId" element={<MovieDetail />} />
      </Routes>
    </Router>
  );
}
