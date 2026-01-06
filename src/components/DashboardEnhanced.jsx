import React, { useEffect, useState } from "react";
import "./DashboardEnhanced.css";
import PredictionForm from "./PredictionForm";
import Dashboard from "./Dashboard";
import { motion } from "framer-motion";
import api from "../api";
import { showError } from "../utils/toast";

export default function DashboardEnhanced() {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Fetch metrics on component mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Fetch prediction history from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("prediction_history") || "[]");
    setHistory(savedHistory);
  }, []);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const response = await api.get("/api/metrics");
      setMetrics(response.data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      showError("Failed to load metrics");
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handlePredictionComplete = (prediction) => {
    // Update history when new prediction is made
    const savedHistory = JSON.parse(localStorage.getItem("prediction_history") || "[]");
    setHistory(savedHistory);
  };

  return (
    <div className="dashboard-enhanced-container">
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-wrapper">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="tab-icon">📊</span>
            <span>Overview</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "prediction" ? "active" : ""}`}
            onClick={() => setActiveTab("prediction")}
          >
            <span className="tab-icon">🔍</span>
            <span>Prediction</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span className="tab-icon">📜</span>
            <span>History</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "performance" ? "active" : ""}`}
            onClick={() => setActiveTab("performance")}
          >
            <span className="tab-icon">📈</span>
            <span>Performance</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        className="tab-content"
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-pane overview-tab">
            <Dashboard />
          </div>
        )}

        {/* Prediction Tab */}
        {activeTab === "prediction" && (
          <div className="tab-pane prediction-tab">
            <PredictionForm onPredictionComplete={handlePredictionComplete} />
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="tab-pane history-tab">
            <div className="history-container">
              <h2>📜 Prediction History</h2>
              {history.length === 0 ? (
                <div className="empty-state">
                  <p>No predictions yet. Go to the Prediction tab to analyze transactions.</p>
                </div>
              ) : (
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Customer ID</th>
                        <th>Prediction</th>
                        <th>Confidence</th>
                        <th>Risk Score</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((record, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="txn-id">{record.transaction_id}</td>
                          <td>{record.customer_id || "N/A"}</td>
                          <td>
                            <span className={`badge ${record.prediction.toLowerCase()}`}>
                              {record.prediction}
                            </span>
                          </td>
                          <td>
                            {record.confidence
                              ? (record.confidence * 100).toFixed(2) + "%"
                              : "N/A"}
                          </td>
                          <td>
                            <div className="risk-indicator">
                              <div
                                className="risk-bar"
                                style={{
                                  width: `${(record.risk_score || 0) * 100}%`,
                                  backgroundColor:
                                    (record.risk_score || 0) > 0.7
                                      ? "#ef4444"
                                      : (record.risk_score || 0) > 0.4
                                      ? "#fbbf24"
                                      : "#10b981",
                                }}
                              ></div>
                              <span className="risk-text">
                                {record.risk_score
                                  ? (record.risk_score * 100).toFixed(1)
                                  : "0"}
                                %
                              </span>
                            </div>
                          </td>
                          <td className="timestamp">
                            {record.timestamp
                              ? new Date(record.timestamp).toLocaleString()
                              : "N/A"}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="tab-pane performance-tab">
            <div className="performance-container">
              <h2>📈 Model Performance Metrics</h2>
              {loadingMetrics ? (
                <div className="metrics-loading">
                  <p>Loading metrics...</p>
                </div>
              ) : metrics ? (
                <div className="metrics-grid">
                  <motion.div
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">🎯</span>
                      <span className="metric-name">Accuracy</span>
                    </div>
                    <div className="metric-value">
                      {metrics.accuracy || 0}%
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill accuracy"
                        style={{ width: `${metrics.accuracy || 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">✅</span>
                      <span className="metric-name">Precision</span>
                    </div>
                    <div className="metric-value">
                      {metrics.precision || 0}%
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill precision"
                        style={{ width: `${metrics.precision || 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">🎣</span>
                      <span className="metric-name">Recall</span>
                    </div>
                    <div className="metric-value">
                      {metrics.recall || 0}%
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill recall"
                        style={{ width: `${metrics.recall || 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">⚖️</span>
                      <span className="metric-name">F1-Score</span>
                    </div>
                    <div className="metric-value">
                      {metrics.f1_score || 0}%
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill f1"
                        style={{ width: `${metrics.f1_score || 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">📊</span>
                      <span className="metric-name">AUC-ROC</span>
                    </div>
                    <div className="metric-value">
                      {metrics.auc || 0}%
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill auc"
                        style={{ width: `${metrics.auc || 0}%` }}
                      ></div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="metric-card metric-card-wide"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">📈</span>
                      <span className="metric-name">Total Predictions</span>
                    </div>
                    <div className="metric-value large">
                      {metrics.total_predictions || 0}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No metrics available. Try making some predictions first.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
