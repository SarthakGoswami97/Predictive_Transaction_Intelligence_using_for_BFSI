import React, { useState } from "react";
import "./PredictionForm.css";
import api from "../api";
import { showSuccess, showError, showLoading, showInfo } from "../utils/toast";
import Loader from "./Loader";

export default function PredictionForm({ onPredictionComplete }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transaction_id: "",
    customer_id: "",
    transaction_amount: "",
    account_age_days: "",
    kyc_verified: "Yes",
    channel: "Online",
    hour: "12",
    weekday: "1",
    month: "1",
    is_high_value: "No",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.transaction_id || !formData.customer_id) {
      showError("Please fill in Transaction ID and Customer ID");
      return;
    }

    if (!formData.transaction_amount || isNaN(formData.transaction_amount)) {
      showError("Please enter a valid transaction amount");
      return;
    }

    setLoading(true);

    try {
      // Convert string values to proper types
      const payload = {
        ...formData,
        transaction_amount: parseFloat(formData.transaction_amount),
        account_age_days: parseInt(formData.account_age_days) || 365,
        hour: parseInt(formData.hour),
        weekday: parseInt(formData.weekday),
        month: parseInt(formData.month),
        is_high_value: formData.is_high_value === "Yes" ? 1 : 0,
      };

      const response = await api.post("/api/predict", payload);
      const prediction = response.data;

      setResult(prediction);

      // Save to history
      const history = JSON.parse(localStorage.getItem("prediction_history") || "[]");
      history.unshift({
        ...prediction,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("prediction_history", JSON.stringify(history.slice(0, 100)));

      showSuccess(
        `Prediction: ${prediction.prediction} (Confidence: ${(prediction.confidence * 100).toFixed(2)}%)`
      );

      if (onPredictionComplete) {
        onPredictionComplete(prediction);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Failed to make prediction";
      showError(errorMsg);
      console.error("Prediction error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      transaction_id: "",
      customer_id: "",
      transaction_amount: "",
      account_age_days: "",
      kyc_verified: "Yes",
      channel: "Online",
      hour: "12",
      weekday: "1",
      month: "1",
      is_high_value: "No",
    });
    setResult(null);
  };

  return (
    <div className="prediction-form-container">
      <div className="prediction-card">
        <h2 className="form-title">🔍 Fraud Detection Prediction</h2>
        <p className="form-subtitle">Enter transaction details to detect fraud</p>

        <form onSubmit={handleSubmit} className="prediction-form">
          <div className="form-grid">
            {/* Transaction ID */}
            <div className="form-group">
              <label>Transaction ID *</label>
              <input
                type="text"
                name="transaction_id"
                placeholder="e.g., TXN12345"
                value={formData.transaction_id}
                onChange={handleChange}
                required
              />
            </div>

            {/* Customer ID */}
            <div className="form-group">
              <label>Customer ID *</label>
              <input
                type="text"
                name="customer_id"
                placeholder="e.g., CUST001"
                value={formData.customer_id}
                onChange={handleChange}
                required
              />
            </div>

            {/* Transaction Amount */}
            <div className="form-group">
              <label>Transaction Amount (₹) *</label>
              <input
                type="number"
                name="transaction_amount"
                placeholder="e.g., 5000"
                value={formData.transaction_amount}
                onChange={handleChange}
                required
                step="0.01"
              />
            </div>

            {/* Account Age */}
            <div className="form-group">
              <label>Account Age (Days)</label>
              <input
                type="number"
                name="account_age_days"
                placeholder="e.g., 365"
                value={formData.account_age_days}
                onChange={handleChange}
              />
            </div>

            {/* KYC Verified */}
            <div className="form-group">
              <label>KYC Verified</label>
              <select name="kyc_verified" value={formData.kyc_verified} onChange={handleChange}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Channel */}
            <div className="form-group">
              <label>Channel</label>
              <select name="channel" value={formData.channel} onChange={handleChange}>
                <option value="Online">Online</option>
                <option value="ATM">ATM</option>
                <option value="Branch">Branch</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>

            {/* Hour */}
            <div className="form-group">
              <label>Hour of Transaction</label>
              <select name="hour" value={formData.hour} onChange={handleChange}>
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>

            {/* Weekday */}
            <div className="form-group">
              <label>Day of Week</label>
              <select name="weekday" value={formData.weekday} onChange={handleChange}>
                <option value="0">Monday</option>
                <option value="1">Tuesday</option>
                <option value="2">Wednesday</option>
                <option value="3">Thursday</option>
                <option value="4">Friday</option>
                <option value="5">Saturday</option>
                <option value="6">Sunday</option>
              </select>
            </div>

            {/* Month */}
            <div className="form-group">
              <label>Month</label>
              <select name="month" value={formData.month} onChange={handleChange}>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString("en-US", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            {/* High Value Transaction */}
            <div className="form-group">
              <label>High Value Transaction</label>
              <select name="is_high_value" value={formData.is_high_value} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-predict" disabled={loading}>
              {loading ? "Analyzing..." : "🚀 Analyze Transaction"}
            </button>
            <button type="button" className="btn-reset" onClick={handleReset}>
              Clear Form
            </button>
          </div>
        </form>

        {/* Prediction Result */}
        {result && (
          <div className={`prediction-result ${result.prediction.toLowerCase()}`}>
            <div className="result-header">
              <h3>📊 Prediction Result</h3>
              <span className={`badge ${result.prediction.toLowerCase()}`}>
                {result.prediction}
              </span>
            </div>

            <div className="result-details">
              <div className="detail-item">
                <label>Transaction ID:</label>
                <span>{result.transaction_id}</span>
              </div>
              <div className="detail-item">
                <label>Prediction:</label>
                <span className={`status ${result.prediction.toLowerCase()}`}>
                  {result.prediction}
                </span>
              </div>
              <div className="detail-item">
                <label>Confidence:</label>
                <span>{(result.confidence * 100).toFixed(2)}%</span>
              </div>
              <div className="detail-item">
                <label>Risk Score:</label>
                <div className="risk-bar">
                  <div
                    className="risk-fill"
                    style={{
                      width: `${result.risk_score * 100}%`,
                      backgroundColor:
                        result.risk_score > 0.7 ? "#ef4444" : result.risk_score > 0.4 ? "#fbbf24" : "#10b981",
                    }}
                  ></div>
                </div>
                <span>{(result.risk_score * 100).toFixed(2)}%</span>
              </div>
            </div>

            <div className="explanation-box">
              <h4>🤖 AI Explanation:</h4>
              <p>{result.explanation}</p>
            </div>

            {result.rules_triggered && result.rules_triggered.length > 0 && (
              <div className="rules-triggered">
                <h4>⚠️ Rules Triggered:</h4>
                <ul>
                  {result.rules_triggered.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && <Loader message="Analyzing transaction..." />}
    </div>
  );
}
