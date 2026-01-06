import React, { useState } from "react";
import "./Sidebar.css";
import { FiHome, FiBarChart2, FiLayers, FiClock, FiChevronLeft, FiHelpCircle, FiSettings, FiShield } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Professional Sidebar with sliding indicator, collapse toggle, and footer
 */
function Sidebar({ activePage, setActivePage }) {
  const [collapsed, setCollapsed] = useState(false);

  const pages = [
    { key: "dashboard", label: "Dashboard", icon: FiHome, badge: null },
    { key: "predict", label: "Predict", icon: FiLayers, badge: "New" },
    { key: "metrics", label: "Metrics", icon: FiBarChart2, badge: null },
    { key: "history", label: "History", icon: FiClock, badge: "12" },
  ];

  const activeIndex = pages.findIndex((p) => p.key === activePage);

  return (
    <motion.div 
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header with Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon-wrapper">
            <FiShield className="sidebar-logo-icon" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="brand-main">Fraud</span>
                <span className="brand-accent">AI</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <FiChevronLeft className={`collapse-icon ${collapsed ? 'rotated' : ''}`} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                className="nav-section-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                MAIN MENU
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <ul className="sidebar-menu">
          {/* Sliding indicator */}
          <motion.div 
            className="active-indicator"
            layoutId="activeIndicator"
            animate={{ 
              top: activeIndex * 46,
              opacity: 1
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />

          {pages.map((p, index) => {
            const Icon = p.icon;
            const isActive = activePage === p.key;
            
            return (
              <motion.li
                key={p.key}
                className={`menu-item ${isActive ? 'active' : ''}`}
                onClick={() => setActivePage(p.key)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`menu-icon-wrapper ${isActive ? 'active' : ''}`}>
                  <Icon className="menu-icon" />
                </div>
                
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="menu-label"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {p.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {p.badge && !collapsed && (
                  <motion.span 
                    className={`menu-badge ${p.badge === 'New' ? 'new' : 'count'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {p.badge}
                  </motion.span>
                )}
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-divider" />
        
        <button className="footer-btn" title="Help & Support">
          <FiHelpCircle className="footer-icon" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Help
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button className="footer-btn" title="Settings">
          <FiSettings className="footer-icon" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {!collapsed && (
          <motion.div 
            className="version-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>v2.0.0</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default Sidebar;
