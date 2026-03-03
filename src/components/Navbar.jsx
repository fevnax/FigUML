import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const profileRef = useRef(null);

    // Close dropdowns on route change
    useEffect(() => {
        setMenuOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const userInitial = user?.displayName?.[0] || user?.email?.[0] || 'U';

    return (
        <nav className="navbar">
            <div className="navbar__inner container">
                {/* Logo */}
                <Link to="/" className="navbar__logo">
                    <span className="navbar__logo-text">
                        <span className="navbar__logo-fig">Fig</span>UML
                    </span>
                </Link>

                {/* Desktop Actions */}
                <div className="navbar__actions">
                    <ThemeToggle />

                    {user ? (
                        <div className="navbar__profile" ref={profileRef}>
                            <button
                                className="navbar__avatar"
                                onClick={() => setProfileOpen(!profileOpen)}
                                aria-label="Profile menu"
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="navbar__avatar-img" />
                                ) : (
                                    <span className="navbar__avatar-initial">{userInitial}</span>
                                )}
                            </button>

                            {profileOpen && (
                                <div className="navbar__dropdown animate-fade-in">
                                    <div className="navbar__dropdown-header">
                                        <span className="navbar__dropdown-name">{user.displayName || 'User'}</span>
                                        <span className="navbar__dropdown-email">{user.email}</span>
                                    </div>
                                    <div className="navbar__dropdown-divider" />
                                    <Link to="/" className="navbar__dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                        Home
                                    </Link>
                                    <Link to="/my-diagrams" className="navbar__dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                                        My Diagrams
                                    </Link>
                                    <button onClick={handleLogout} className="navbar__dropdown-item navbar__dropdown-item--danger">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/auth" className="btn btn-primary">
                            Sign In
                        </Link>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button
                    className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--active' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                >
                    <span /><span /><span />
                </button>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="navbar__mobile animate-fade-in">
                        <div className="navbar__mobile-inner">
                            <div className="navbar__mobile-item">
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Theme</span>
                                <ThemeToggle small />
                            </div>

                            <Link to="/" className="navbar__mobile-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                Home
                            </Link>

                            {user ? (
                                <>
                                    <Link to="/my-diagrams" className="navbar__mobile-item">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                                        My Diagrams
                                    </Link>
                                    <button onClick={handleLogout} className="navbar__mobile-item navbar__mobile-item--danger">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link to="/auth" className="navbar__mobile-item navbar__mobile-item--primary">
                                    Sign In / Sign Up
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
