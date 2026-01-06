import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import {
  FiTrendingUp,
  FiAlertTriangle,
  FiUsers,
  FiBarChart2,
  FiPieChart,
  FiCalendar,
} from "react-icons/fi";

import { Line, Doughnut, Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState([]);

  const [stats, setStats] = useState({
    totalTransactions: 0,
    fraudCases: 0,
    fraudRate: 0,
    avgTxAmount: 0,
    avgAccountAge: "",
    mostRiskyChannel: "--",
    mostActiveCustomer: "--",
    highRiskUsers: 0,
    modelAccuracy: 0,
  });

  const [lineChart, setLineChart] = useState({ labels: [], datasets: [] });
  const [pieChart, setPieChart] = useState({ labels: [], datasets: [] });
  const [barChart, setBarChart] = useState({ labels: [], datasets: [] });

  // 💡 Fix #1 — Universal timestamp normalizer
  function fixDateFormat(ts) {
    if (!ts) return null;

    ts = String(ts).trim();

    // ISO: 2024-03-12T08:22
    if (ts.includes("T")) {
      return ts.split("T")[0];
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(ts)) return ts;

    // DD/MM/YYYY → YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(ts)) {
      const [d, m, y] = ts.split("/");
      return `${y}-${m}-${d}`;
    }

    // DD-MM-YYYY → YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(ts)) {
      const [d, m, y] = ts.split("-");
      return `${y}-${m}-${d}`;
    }

    // Try parse any natural date
    const parsed = new Date(ts);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }

    return null;
  }

  function daysToAge(days) {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return `${years}y ${months}m`;
  }

  // ============ HEATMAP HELPER FUNCTIONS ============
  function generateHeatmapData() {
    const channels = ['ATM', 'Online', 'POS', 'Web'];
    const heatmapData = [];
    
    // Generate 24 hours of data
    for (let hour = 0; hour < 24; hour++) {
      const row = [];
      channels.forEach(channel => {
        // Generate realistic fraud patterns
        let baseValue = Math.random() * 5;
        
        // Peak hours: 0-2 (night), 9-11 (morning), 19-21 (evening)
        if ((hour >= 0 && hour <= 2) || (hour >= 9 && hour <= 11) || (hour >= 19 && hour <= 21)) {
          baseValue *= 2.5;
        }
        
        // Channel patterns
        if (channel === 'Online') baseValue *= 1.8;
        if (channel === 'Web') baseValue *= 1.6;
        if (channel === 'ATM') baseValue *= 0.7;
        
        row.push(Math.round(baseValue));
      });
      heatmapData.push(row);
    }
    return heatmapData;
  }

  function getHeatmapColor(value, row) {
    const max = Math.max(...row);
    const min = Math.min(...row);
    const normalized = (value - min) / (max - min || 1);
    
    // Green (low) → Yellow (medium) → Red (high)
    if (normalized < 0.33) {
      return `rgba(52, 211, 153, ${0.3 + normalized * 0.4})`;
    } else if (normalized < 0.66) {
      return `rgba(251, 191, 36, ${0.4 + normalized * 0.3})`;
    } else {
      return `rgba(239, 68, 68, ${0.5 + normalized * 0.3})`;
    }
  }

  function getHourlyFraudChart() {
    const heatmapData = generateHeatmapData();
    const hourlyTotals = heatmapData.map(row => row.reduce((a, b) => a + b, 0));
    
    return {
      labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
      datasets: [
        {
          label: 'Fraud Cases',
          data: hourlyTotals,
          backgroundColor: hourlyTotals.map(val => {
            const max = Math.max(...hourlyTotals);
            const normalized = val / max;
            if (normalized < 0.33) return 'rgba(52, 211, 153, 0.8)';
            if (normalized < 0.66) return 'rgba(251, 191, 36, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    };
  }

  // --------------------- CSV LISTENERS ---------------------
  useEffect(() => {
    function refresh() {
      loadData();
    }
    window.addEventListener("csv-updated", refresh);
    return () => window.removeEventListener("csv-updated", refresh);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = JSON.parse(localStorage.getItem("uploaded_csv_data") || "[]");
      if (saved.length !== csvData.length) loadData();
    }, 1200);

    return () => clearInterval(interval);
  }, [csvData]);

  // --------------------- LOAD DATA ---------------------
  function loadData() {
    const saved = JSON.parse(localStorage.getItem("uploaded_csv_data") || "[]");

    if (!Array.isArray(saved) || saved.length === 0) {
      setCsvData([]);
      setLoading(false);
      return;
    }

    setCsvData(saved);
    computeAnalytics(saved);
    setLoading(false);
  }

  // ---------------------------------------------------------
  // ⚡ FIXED ANALYTICS ENGINE WITH VALID CHART LABELS
  // ---------------------------------------------------------
  function computeAnalytics(data) {
    const total = data.length;

    const fraudCases = data.filter((r) => Number(r.is_fraud) === 1).length;
    const fraudRate = ((fraudCases / total) * 100).toFixed(1);

    const avgTxAmount =
      Math.round(data.reduce((a, b) => a + Number(b.transaction_amount || 0), 0) / total);

    const avgAgeDays =
      Math.round(data.reduce((a, b) => a + Number(b.account_age_days || 0), 0) / total);

    const avgAccountAge = daysToAge(avgAgeDays);

    // --------- MOST RISKY CHANNEL -----------
    const channelFraud = {};
    data.forEach((r) => {
      const ch = r.channel || "Unknown";
      if (!channelFraud[ch]) channelFraud[ch] = 0;
      if (Number(r.is_fraud) === 1) channelFraud[ch]++;
    });

    const mostRiskyChannel =
      Object.entries(channelFraud).length > 0
        ? Object.entries(channelFraud).sort((a, b) => b[1] - a[1])[0][0]
        : "--";

    // --------- MOST ACTIVE CUSTOMER ----------
    const customerCount = {};
    data.forEach((r) => {
      customerCount[r.customer_id] = (customerCount[r.customer_id] || 0) + 1;
    });

    const mostActiveCustomer =
      Object.entries(customerCount).sort((a, b) => b[1] - a[1])[0][0];

    const highRiskUsers = Object.values(customerCount).filter((v) => v >= 5).length;

    // ---------------------------------------------------------
    // 📌 FIXED LINE CHART — Robust Timestamp Handling
    // ---------------------------------------------------------
    const dayMap = {};

    data.forEach((r) => {
      const date = fixDateFormat(r.timestamp);
      if (!date) return;

      if (!dayMap[date]) dayMap[date] = 0;
      if (Number(r.is_fraud) === 1) dayMap[date]++;
    });

    const sortedDays = Object.keys(dayMap).sort();

    setLineChart({
      labels: sortedDays,
      datasets: [
        {
          label: "Fraud Cases per Day",
          data: sortedDays.map((d) => dayMap[d]),
          borderColor: "#6a11cb",
          backgroundColor: "rgba(106, 17, 203, 0.08)",
          tension: 0.45,
          borderWidth: 3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#6a11cb",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    });

    // ---------------------------------------------------------
    // 📌 FIXED PIE CHART
    // ---------------------------------------------------------
    const low = data.filter((r) => r.transaction_amount < 2000).length;
    const medium = data.filter(
      (r) => r.transaction_amount >= 2000 && r.transaction_amount < 8000
    ).length;
    const high = data.filter((r) => r.transaction_amount >= 8000).length;

    setPieChart({
      labels: ["Low", "Medium", "High"],
      datasets: [
        {
          data: [low, medium, high],
          backgroundColor: ["#34a853", "#fbbc04", "#ea4335"],
          borderColor: "#fff",
          borderWidth: 3,
          hoverOffset: 15,
        },
      ],
    });

    // ---------------------------------------------------------
    // 📌 FIXED BAR CHART
    // ---------------------------------------------------------
    const channelMap = {};
    data.forEach((r) => {
      const ch = r.channel || "Unknown";
      if (!channelMap[ch]) channelMap[ch] = 0;
      if (Number(r.is_fraud) === 1) channelMap[ch]++;
    });

    setBarChart({
      labels: Object.keys(channelMap),
      datasets: [
        {
          label: "Fraud Count",
          data: Object.values(channelMap),
          backgroundColor: "#ff6b6b",
          borderRadius: 10,
          borderSkipped: false,
          borderWidth: 0,
          barThickness: 'flex',
          maxBarThickness: 60,
        },
      ],
    });

    // ---------------------------------------------------------
    // 📌 SAVE FINAL STATS
    // ---------------------------------------------------------
    setStats({
      totalTransactions: total,
      fraudCases,
      fraudRate,
      avgTxAmount,
      avgAccountAge,
      mostRiskyChannel,
      mostActiveCustomer,
      highRiskUsers,
      modelAccuracy: (100 - fraudRate).toFixed(1),
    });
  }

  const fade = (d) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: d, duration: 0.5 } },
  });

  return (
    <div className="dashboard-container">
      <motion.h2 className="dashboard-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Dashboard Analytics
      </motion.h2>

      {/* --------- TOP STATS --------- */}
      <div className="stats-grid-wide">
        <motion.div className="stat-card purple" {...fade(0.1)}>
          <FiTrendingUp className="stat-icon" />
          <div className="stat-value">{stats.totalTransactions}</div>
          <div className="stat-label">Total Transactions</div>
        </motion.div>

        <motion.div className="stat-card pink" {...fade(0.2)}>
          <FiAlertTriangle className="stat-icon" />
          <div className="stat-value">{stats.fraudCases}</div>
          <div className="stat-label">Fraud Cases</div>
        </motion.div>

        <motion.div className="stat-card orange" {...fade(0.3)}>
          <FiBarChart2 className="stat-icon" />
          <div className="stat-value">{stats.fraudRate}%</div>
          <div className="stat-label">Fraud Rate</div>
        </motion.div>

        <motion.div className="stat-card green" {...fade(0.4)}>
          <FiPieChart className="stat-icon" />
          <div className="stat-value">₹{stats.avgTxAmount}</div>
          <div className="stat-label">Avg Transaction Amount</div>
        </motion.div>

        <motion.div className="stat-card blue" {...fade(0.5)}>
          <FiCalendar className="stat-icon" />
          <div className="stat-value">{stats.avgAccountAge}</div>
          <div className="stat-label">Avg Account Age</div>
        </motion.div>

        <motion.div className="stat-card dark" {...fade(0.6)}>
          <FiUsers className="stat-icon" />
          <div className="stat-value">{stats.mostRiskyChannel}</div>
          <div className="stat-label">Most Risky Channel</div>
        </motion.div>

        <motion.div className="stat-card gold" {...fade(0.7)}>
          <FiUsers className="stat-icon" />
          <div className="stat-value">{stats.mostActiveCustomer}</div>
          <div className="stat-label">Top Active Customer</div>
        </motion.div>

        <motion.div className="stat-card" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}} {...fade(0.8)}>
          <FiAlertTriangle className="stat-icon" />
          <div className="stat-value">{stats.highRiskUsers}</div>
          <div className="stat-label">High Risk Users</div>
        </motion.div>

        <motion.div className="stat-card" style={{background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"}} {...fade(0.9)}>
          <FiBarChart2 className="stat-icon" />
          <div className="stat-value">{stats.modelAccuracy}%</div>
          <div className="stat-label">Model Accuracy</div>
        </motion.div>
      </div>

      {/* ---------- PREMIUM METRICS ROW ---------- */}
      <div className="metrics-row">
        <motion.div className="premium-card" {...fade(0.95)}>
          <div className="premium-header">
            <span className="premium-icon">📊</span>
            <span className="premium-title">Transaction Insights</span>
          </div>
          <div className="premium-content">
            <div className="insight-item">
              <span className="insight-label">Avg Transaction:</span>
              <span className="insight-value">₹{stats.avgTxAmount}</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Total Processed:</span>
              <span className="insight-value">{stats.totalTransactions}</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="premium-card" {...fade(1.0)}>
          <div className="premium-header">
            <span className="premium-icon">⚡</span>
            <span className="premium-title">Fraud Alert Status</span>
          </div>
          <div className="premium-content">
            <div className="insight-item">
              <span className="insight-label">Detected:</span>
              <span className="insight-value fraud">{stats.fraudCases}</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Detection Rate:</span>
              <span className="insight-value alert">{stats.fraudRate}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---------- CHARTS ---------- */}
      <div className="charts-row">
        <motion.div className="chart-box" {...fade(0.8)}>
          <h4>📈 Fraud Cases per Day</h4>
          {!loading && lineChart.labels.length > 0 ? (
            <Line 
              data={lineChart}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: { 
                    position: "top", 
                    labels: { padding: 20, font: { size: 13, weight: "600" }, usePointStyle: true, pointStyle: 'circle', color: '#333' },
                    display: true,
                  },
                  tooltip: { 
                    backgroundColor: "rgba(0,0,0,0.85)", 
                    padding: 14, 
                    bodyFont: { size: 12, weight: '500' },
                    titleFont: { size: 13, weight: 'bold' },
                    borderColor: "#6a11cb",
                    borderWidth: 2,
                    displayColors: true,
                    cornerRadius: 8,
                    usePointStyle: true,
                  },
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    ticks: { font: { size: 12 }, padding: 10, color: '#666' }, 
                    grid: { color: "rgba(0,0,0,0.05)", drawBorder: false, lineWidth: 1 },
                    title: { display: true, text: 'Fraud Count', font: { size: 13, weight: '600' }, color: '#333' },
                  },
                  x: { 
                    ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 45, color: '#666', padding: 10 }, 
                    grid: { display: false, drawBorder: false },
                    title: { display: true, text: 'Date', font: { size: 13, weight: '600' }, color: '#333' },
                  },
                },
              }}
            />
          ) : (
            <div className="skeleton-chart" />
          )}
        </motion.div>

        <motion.div className="chart-box" {...fade(0.9)}>
          <h4>🎯 Risk Distribution</h4>
          {!loading && pieChart.labels.length > 0 ? (
            <Doughnut 
              data={pieChart}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { 
                    position: "bottom", 
                    labels: { 
                      padding: 20, 
                      font: { size: 12, weight: "600" },
                      usePointStyle: true,
                      pointStyle: 'circle',
                      color: '#333',
                      generateLabels: (chart) => {
                        const data = chart.data;
                        return data.labels.map((label, i) => ({
                          text: `${label}: ${data.datasets[0].data[i]} cases`,
                          fillStyle: data.datasets[0].backgroundColor[i],
                          hidden: false,
                          index: i,
                        }));
                      },
                    } 
                  },
                  tooltip: { 
                    backgroundColor: "rgba(0,0,0,0.85)", 
                    padding: 14, 
                    bodyFont: { size: 12, weight: '500' },
                    titleFont: { size: 13, weight: 'bold' },
                    cornerRadius: 8,
                    callbacks: {
                      label: (context) => `${context.label}: ${context.parsed} transactions`,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="skeleton-chart" />
          )}
        </motion.div>

        <motion.div className="chart-box" {...fade(1.0)}>
          <h4>📊 Fraud by Channel</h4>
          {!loading && barChart.labels.length > 0 ? (
            <Bar 
              data={barChart}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: "y",
                plugins: {
                  legend: { position: "top", labels: { padding: 20, font: { size: 13, weight: "600" }, usePointStyle: true, pointStyle: 'circle', color: '#333' } },
                  tooltip: { 
                    backgroundColor: "rgba(0,0,0,0.85)", 
                    padding: 14, 
                    bodyFont: { size: 12, weight: '500' },
                    titleFont: { size: 13, weight: 'bold' },
                    cornerRadius: 8,
                    callbacks: {
                      label: (context) => `${context.dataset.label}: ${context.parsed.x} cases`,
                    },
                  },
                },
                scales: {
                  x: { 
                    beginAtZero: true, 
                    ticks: { font: { size: 12 }, padding: 10, color: '#666' }, 
                    grid: { color: "rgba(0,0,0,0.05)", drawBorder: false, lineWidth: 1 },
                    title: { display: true, text: 'Fraud Count', font: { size: 13, weight: '600' }, color: '#333' },
                  },
                  y: { 
                    ticks: { font: { size: 12 }, padding: 10, color: '#666' }, 
                    grid: { display: false, drawBorder: false },
                  },
                },
              }}
            />
          ) : (
            <div className="skeleton-chart" />
          )}
        </motion.div>
      </div>


    </div>
  );
}
