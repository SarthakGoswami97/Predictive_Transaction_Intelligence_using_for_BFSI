// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from "react";
import Profile from "./Profile";
import { useTheme } from "../ThemeContext";
import { FiSearch, FiBell, FiChevronDown, FiLogOut, FiUser, FiSettings, FiShield } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";

/**
 * Professional Navbar with search, notifications, and user dropdown
 */
function Navbar({ onLogout, customerId = "C001" }) {
  const [scrolled, setScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkMode, toggleTheme } = useTheme();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Mock notifications
  const notifications = [
    { id: 1, type: "alert", message: "High-risk transaction detected", time: "2 min ago", unread: true },
    { id: 2, type: "info", message: "Model accuracy improved to 94%", time: "1 hour ago", unread: true },
    { id: 3, type: "success", message: "Batch prediction completed", time: "3 hours ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      setScrolled(y > 16);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className={`top-navbar ${scrolled ? "scrolled" : ""}`}>
        {/* Left - Logo & Brand */}
        <div className="navbar-left">
          <div className="brand">
            <div className="brand-logo">
              <FiShield className="logo-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-main">FraudShield</span>
              <span className="brand-tagline">AI-Powered Protection</span>
            </div>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="navbar-center">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search transactions, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-shortcut">⌘K</span>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="navbar-right">
          {/* Theme Toggle */}
          <button 
            className="nav-icon-btn"
            onClick={toggleTheme}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            <span className="nav-icon">{isDarkMode ? "☀️" : "🌙"}</span>
          </button>

          {/* Notifications */}
          <div className="nav-dropdown" ref={notifRef}>
            <button 
              className="nav-icon-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell className="nav-icon" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="dropdown-menu notifications-menu"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    <button className="mark-read-btn">Mark all read</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                        <div className={`notif-icon ${notif.type}`}>
                          {notif.type === 'alert' ? '⚠️' : notif.type === 'success' ? '✅' : 'ℹ️'}
                        </div>
                        <div className="notif-content">
                          <p className="notif-message">{notif.message}</p>
                          <span className="notif-time">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dropdown-footer">
                    <button className="view-all-btn">View all notifications</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="nav-dropdown" ref={userMenuRef}>
            <button 
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <span>A</span>
              </div>
              <div className="user-info">
                <span className="user-name">Admin</span>
                <span className="user-role">Analyst</span>
              </div>
              <FiChevronDown className={`chevron ${showUserMenu ? 'open' : ''}`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="dropdown-menu user-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="dropdown-user-header">
                    <div className="user-avatar large">
                      <span>A</span>
                    </div>
                    <div className="dropdown-user-info">
                      <p className="dropdown-user-name">Admin User</p>
                      <p className="dropdown-user-email">admin@fraudshield.com</p>
                    </div>
                  </div>
                  <div className="dropdown-body">
                    <button className="dropdown-item" onClick={() => { setShowProfile(true); setShowUserMenu(false); }}>
                      <FiUser className="dropdown-icon" />
                      <span>View Profile</span>
                    </button>
                    <button className="dropdown-item">
                      <FiSettings className="dropdown-icon" />
                      <span>Settings</span>
                    </button>
                  </div>
                  <div className="dropdown-footer-section">
                    <button 
                      className="dropdown-item logout"
                      onClick={() => { if (typeof onLogout === "function") onLogout(); }}
                    >
                      <FiLogOut className="dropdown-icon" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <Profile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)}
        customerId={customerId}
      />
    </>
  );
}

export default Navbar;
