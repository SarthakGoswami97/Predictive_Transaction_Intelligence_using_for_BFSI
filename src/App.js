import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

import Predict from "./pages/Predict";
import Metrics from "./pages/Metrics";
import History from "./pages/History";
import Login from "./pages/Login";

import { motion } from "framer-motion";   // <-- ANIMATION IMPORT
import { ThemeProvider } from "./ThemeContext";
import { showInfo } from "./utils/toast";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [currentCustomerId, setCurrentCustomerId] = useState("C001");

  // initialize from localStorage so logged-in state persists across refresh
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );

  useEffect(() => {
    if (isLoggedIn) localStorage.setItem("loggedIn", "true");
    else localStorage.removeItem("loggedIn");
  }, [isLoggedIn]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "predict":
        return <Predict onCustomerIdChange={setCurrentCustomerId} />;
      case "metrics":
        return <Metrics />;
      case "history":
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("prediction_history");
    localStorage.removeItem("loggedIn");
    setIsLoggedIn(false);
    setActivePage("dashboard");
    showInfo("You have been logged out successfully");
  };

  const handleLogin = () => {
    localStorage.setItem("loggedIn", "true");
    setIsLoggedIn(true);
    setActivePage("dashboard");
  };

  // If not logged in → show login screen only
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ThemeProvider>
      <div className="app-container">
        <Navbar onLogout={handleLogout} customerId={currentCustomerId} />

        <div className="main-content">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />

          {/* 🟣 ANIMATED PAGE TRANSITIONS */}
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ width: "100%", height: "100%" }}
          >
            {renderPage()}
          </motion.div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
