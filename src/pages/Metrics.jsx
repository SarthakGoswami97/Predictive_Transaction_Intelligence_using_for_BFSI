import React, { useEffect, useState } from "react";
import api from "../api";
import "./Metrics.css";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [performanceMetrics] = useState({
    accuracy: 90,
    precision: 85,
    recall: 80,
    f1_score: 87,
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await api.get("/metrics");
        setMetrics(response.data);
      } catch (err) {
        setError("Unable to load metrics (backend not ready). Showing sample data.");
        // Use sample data if backend is not available
      }
    }

    fetchMetrics();
  }, []);

  const displayMetrics = metrics || performanceMetrics;

  return (
    <div className="metrics-container">
      <h2>📊 Model Performance Metrics</h2>
      {error && <p className="info-text">{error}</p>}

      {/* ========== PERFORMANCE CARDS ========== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 28 }}>
        {/* Accuracy */}
        <div style={{ padding: "20px", backgroundColor: "#e3f2fd", borderRadius: "12px", border: "2px solid #2196f3" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: 700, color: "#1565c0", textTransform: "uppercase", letterSpacing: "0.5px" }}>📊 Accuracy</p>
          <p style={{ margin: "0 0 8px 0", fontSize: "36px", fontWeight: "900", color: "#1565c0" }}>
            {displayMetrics?.accuracy || performanceMetrics.accuracy}%
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Overall correctness of predictions</p>
          <div style={{ marginTop: 12, width: "100%", height: "6px", backgroundColor: "#bbdefb", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${displayMetrics?.accuracy || performanceMetrics.accuracy}%`, height: "100%", backgroundColor: "#2196f3", borderRadius: "3px" }}></div>
          </div>
        </div>

        {/* Precision */}
        <div style={{ padding: "20px", backgroundColor: "#f3e5f5", borderRadius: "12px", border: "2px solid #9c27b0" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: 700, color: "#6a1b9a", textTransform: "uppercase", letterSpacing: "0.5px" }}>🎯 Precision</p>
          <p style={{ margin: "0 0 8px 0", fontSize: "36px", fontWeight: "900", color: "#6a1b9a" }}>
            {displayMetrics?.precision || performanceMetrics.precision}%
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>True positives vs all predicted positives</p>
          <div style={{ marginTop: 12, width: "100%", height: "6px", backgroundColor: "#e1bee7", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${displayMetrics?.precision || performanceMetrics.precision}%`, height: "100%", backgroundColor: "#9c27b0", borderRadius: "3px" }}></div>
          </div>
        </div>

        {/* Recall */}
        <div style={{ padding: "20px", backgroundColor: "#fce4ec", borderRadius: "12px", border: "2px solid #e91e63" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: 700, color: "#ad1457", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔍 Recall</p>
          <p style={{ margin: "0 0 8px 0", fontSize: "36px", fontWeight: "900", color: "#ad1457" }}>
            {displayMetrics?.recall || performanceMetrics.recall}%
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>True positives vs all actual positives</p>
          <div style={{ marginTop: 12, width: "100%", height: "6px", backgroundColor: "#f8bbd0", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${displayMetrics?.recall || performanceMetrics.recall}%`, height: "100%", backgroundColor: "#e91e63", borderRadius: "3px" }}></div>
          </div>
        </div>

        {/* F1 Score */}
        <div style={{ padding: "20px", backgroundColor: "#e8f5e9", borderRadius: "12px", border: "2px solid #4caf50" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: 700, color: "#1b5e20", textTransform: "uppercase", letterSpacing: "0.5px" }}>⭐ F1 Score</p>
          <p style={{ margin: "0 0 8px 0", fontSize: "36px", fontWeight: "900", color: "#1b5e20" }}>
            {displayMetrics?.f1_score || performanceMetrics.f1_score}%
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Harmonic mean of precision & recall</p>
          <div style={{ marginTop: 12, width: "100%", height: "6px", backgroundColor: "#c8e6c9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${displayMetrics?.f1_score || performanceMetrics.f1_score}%`, height: "100%", backgroundColor: "#4caf50", borderRadius: "3px" }}></div>
          </div>
        </div>
      </div>

      {/* ========= ROW: CHART + CONFUSION MATRIX ========= */}
      <div className="metrics-row">

        {/* ===== BAR CHART CARD ===== */}
        <div className="metrics-card">
          <h3>📈 Performance Bar Chart</h3>

          {true && (
            <Bar
              data={{
                labels: ["Accuracy", "Precision", "Recall", "F1-Score", "AUC"],
                datasets: [
                  {
                    label: "Metric Values (%)",
                    data: [
                      displayMetrics?.accuracy || performanceMetrics.accuracy,
                      displayMetrics?.precision || performanceMetrics.precision,
                      displayMetrics?.recall || performanceMetrics.recall,
                      displayMetrics?.f1_score || performanceMetrics.f1_score,
                      metrics?.auc ? parseInt(metrics.auc) : 92,
                    ],
                    backgroundColor: [
                      "#1a73e8",
                      "#34a853",
                      "#fbbc04",
                      "#ea4335",
                      "#673ab7",
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { 
                    position: "top", 
                    labels: { padding: 16, font: { size: 12, weight: "bold" } } 
                  },
                  tooltip: { 
                    backgroundColor: "rgba(0,0,0,0.7)", 
                    padding: 12, 
                    bodyFont: { size: 12 },
                    displayColors: false,
                  },
                },
                scales: {
                  x: { 
                    beginAtZero: true, 
                    max: 100,
                    ticks: { font: { size: 11 } }, 
                    grid: { color: "rgba(0,0,0,0.05)" } 
                  },
                  y: { 
                    ticks: { font: { size: 12 } }, 
                    grid: { display: false } 
                  },
                },
              }}
            />
          )}
        </div>

        {/* ===== CONFUSION MATRIX CARD ===== */}
        <div className="metrics-card">
          <h3>🔲 Confusion Matrix</h3>

          <div className="matrix-grid">
            <div className="matrix-card tn">
              <div className="matrix-title">TN (True Negatives)</div>
              <div className="matrix-value">1200</div>
              <div className="matrix-desc">Legit correctly identified</div>
            </div>

            <div className="matrix-card fp">
              <div className="matrix-title">FP (False Positives)</div>
              <div className="matrix-value">50</div>
              <div className="matrix-desc">Legit wrongly marked fraud</div>
            </div>

            <div className="matrix-card fn">
              <div className="matrix-title">FN (False Negatives)</div>
              <div className="matrix-value">30</div>
              <div className="matrix-desc">Fraud missed</div>
            </div>

            <div className="matrix-card tp">
              <div className="matrix-title">TP (True Positives)</div>
              <div className="matrix-value">220</div>
              <div className="matrix-desc">Fraud correctly caught</div>
            </div>
          </div>
        </div>

      </div>

      {/* ========== INTERPRETATION GUIDE ========== */}
      <div style={{ marginTop: 28, padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700 }}>📚 Interpretation Guide</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "12px", lineHeight: "1.6" }}>
          <div>
            <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#1565c0" }}>✅ What does each metric mean?</p>
            <ul style={{ margin: 0, paddingLeft: "16px", color: "#666" }}>
              <li><strong>Accuracy:</strong> % of all predictions that were correct</li>
              <li><strong>Precision:</strong> Of predicted frauds, how many were actually fraud</li>
              <li><strong>Recall:</strong> Of all actual frauds, how many we caught</li>
              <li><strong>F1 Score:</strong> Balance between precision and recall</li>
            </ul>
          </div>
          <div>
            <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#d32f2f" }}>⚠️ Key Insights</p>
            <ul style={{ margin: 0, paddingLeft: "16px", color: "#666" }}>
              <li>High precision = fewer false fraud alerts</li>
              <li>High recall = catch more actual frauds</li>
              <li>High F1 = balanced detection capability</li>
              <li>Metrics may vary by transaction type</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e0e0e0", fontSize: "12px", color: "#999", textAlign: "center" }}>
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default Metrics;
