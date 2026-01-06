import React, { useState } from "react";
import "./Login.css";
import { showSuccess, showError } from "../utils/toast";
import { FiShield } from "react-icons/fi";

/**
 * Login component expects a prop: onLogin()
 * When credentials are correct, it calls onLogin() to notify App.
 */
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate API delay
    await new Promise((res) => setTimeout(res, 800));

    // Simple fake login (replace with API later)
    if (email === "admin@gmail.com" && password === "admin123") {
      showSuccess("Welcome back! Login successful 🎉");
      // notify App that login succeeded
      if (typeof onLogin === "function") onLogin();
    } else {
      setError("Invalid email or password");
      showError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <div className="login-logo">
          <FiShield />
        </div>
        <h2>Welcome Back</h2>
        <p className="login-subtitle">Sign in to FraudShield Dashboard</p>

        {error && <p className="error">{error}</p>}

        <div className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <p className="login-footer">
          Demo: admin@gmail.com / admin123
        </p>
      </form>
    </div>
  );
}

export default Login;
