import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderNavbar = (props = {}) =>
  render(
    <MemoryRouter>
      <Navbar {...props} />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('Navbar – logo changed to Link', () => {
  it('renders the MovieFlix brand text', () => {
    renderNavbar();
    expect(screen.getByText(/MovieFlix/)).toBeInTheDocument();
  });

  it('renders the logo as an anchor/link element pointing to /', () => {
    renderNavbar();
    const logoLink = screen.getByRole('link', { name: /MovieFlix/ });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('logo is NOT a plain h1 element (changed in PR)', () => {
    renderNavbar();
    // The old implementation wrapped text in an h1; now it must be inside a Link
    const h1 = document.querySelector('h1');
    expect(h1).toBeNull();
  });
});

describe('Navbar – logged out state', () => {
  it('shows a Login link when isLoggedIn is false', () => {
    renderNavbar({ isLoggedIn: false });
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('does not show Profile or Logout when isLoggedIn is false', () => {
    renderNavbar({ isLoggedIn: false });
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });
});

describe('Navbar – logged in state', () => {
  it('shows Profile link and Logout button when isLoggedIn is true', () => {
    renderNavbar({ isLoggedIn: true });
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('does not show Login link when isLoggedIn is true', () => {
    renderNavbar({ isLoggedIn: true });
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('logout clears token and user from localStorage', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', 'john');
    // jsdom does not navigate, so just test localStorage side-effect
    const assignSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      href: '',
    });

    renderNavbar({ isLoggedIn: true });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    assignSpy.mockRestore();
  });

  it('logout dispatches an authchange event', () => {
    const handler = vi.fn();
    window.addEventListener('authchange', handler);
    renderNavbar({ isLoggedIn: true });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('authchange', handler);
  });
});