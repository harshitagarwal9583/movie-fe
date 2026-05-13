import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Stub out heavy page components so tests stay fast
vi.mock('./pages/Home', () => ({ default: () => <div>Home Page</div> }));
vi.mock('./pages/Auth', () => ({ default: () => <div>Auth Page</div> }));
vi.mock('./pages/Profile', () => ({ default: () => <div>Profile Page</div> }));
vi.mock('./pages/MovieDetail', () => ({ default: () => <div>MovieDetail Page</div> }));
vi.mock('./components/Navbar', () => ({ default: () => <nav>Navbar</nav> }));

// App uses BrowserRouter internally; to control the initial URL we swap it out.
// We test App's route table by mounting App directly and controlling location via
// window.history.pushState before each test.

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('App routing', () => {
  it('renders the Home page at /', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders MovieDetail page at /movie/:movieId', () => {
    window.history.pushState({}, '', '/movie/42');
    render(<App />);
    expect(screen.getByText('MovieDetail Page')).toBeInTheDocument();
  });

  it('renders MovieDetail page for a different movieId', () => {
    window.history.pushState({}, '', '/movie/abc-xyz');
    render(<App />);
    expect(screen.getByText('MovieDetail Page')).toBeInTheDocument();
  });

  it('renders Auth page at /auth when not logged in', () => {
    localStorage.removeItem('token');
    window.history.pushState({}, '', '/auth');
    render(<App />);
    expect(screen.getByText('Auth Page')).toBeInTheDocument();
  });

  it('redirects /auth to / when user is already logged in', () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/auth');
    render(<App />);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Auth Page')).not.toBeInTheDocument();
  });

  it('renders Profile page at /profile when logged in', () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/profile');
    render(<App />);
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  it('redirects /profile to /auth when not logged in', () => {
    localStorage.removeItem('token');
    window.history.pushState({}, '', '/profile');
    render(<App />);
    expect(screen.getByText('Auth Page')).toBeInTheDocument();
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });

  it('always renders the Navbar', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByText('Navbar')).toBeInTheDocument();
  });
});