import React, { useEffect, useState, useMemo } from "react";
import "./History.css";

function History() {
  const [history, setHistory] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Load saved predictions from localStorage
    const saved = JSON.parse(localStorage.getItem("prediction_history") || "[]");
    setHistory(saved);
  }, []);

  // Filter and search logic
  const filteredHistory = useMemo(() => {
    let result = history;

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.transaction_id?.toLowerCase().includes(search) ||
          item.customer_id?.toLowerCase().includes(search) ||
          String(item.transaction_amount).includes(search)
      );
    }

    // Prediction type filter
    if (filterType !== "all") {
      result = result.filter((item) => item.prediction === filterType);
    }

    // Channel filter
    if (filterChannel !== "all") {
      result = result.filter((item) => item.channel === filterChannel);
    }

    // Sorting
    if (sortBy === "newest") {
      result = [...result].reverse();
    } else if (sortBy === "oldest") {
      result = [...result];
    } else if (sortBy === "highest-risk") {
      result = [...result].sort((a, b) => b.risk - a.risk);
    } else if (sortBy === "lowest-risk") {
      result = [...result].sort((a, b) => a.risk - b.risk);
    } else if (sortBy === "highest-amount") {
      result = [...result].sort((a, b) => b.transaction_amount - a.transaction_amount);
    }

    return result;
  }, [history, searchText, filterType, filterChannel, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / pageSize);
  const paginatedHistory = filteredHistory.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Statistics
  const stats = useMemo(() => {
    if (history.length === 0) return { fraud: 0, legit: 0, totalAmount: 0, avgRisk: 0 };
    return {
      fraud: history.filter((h) => h.prediction === "Fraud").length,
      legit: history.filter((h) => h.prediction === "Legit").length,
      totalAmount: history.reduce((sum, h) => sum + Number(h.transaction_amount || 0), 0),
      avgRisk: Math.round(history.reduce((sum, h) => sum + h.risk, 0) / history.length),
    };
  }, [history]);

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📊 Transaction History</h2>
        <p className="history-subtitle">View and analyze all fraud detection predictions</p>
      </div>

      {history.length === 0 ? (
        <div className="no-data-box">
          <div className="no-data-icon">📭</div>
          <p className="no-data">No predictions yet. Make a prediction to see history.</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="history-stats">
            <div className="stat-box fraud">
              <span className="stat-label">🔴 Fraud Cases</span>
              <span className="stat-number">{stats.fraud}</span>
            </div>
            <div className="stat-box legit">
              <span className="stat-label">🟢 Legit Cases</span>
              <span className="stat-number">{stats.legit}</span>
            </div>
            <div className="stat-box amount">
              <span className="stat-label">💰 Total Amount</span>
              <span className="stat-number">₹{stats.totalAmount}</span>
            </div>
            <div className="stat-box risk">
              <span className="stat-label">⚠️ Avg Risk</span>
              <span className="stat-number">{stats.avgRisk}%</span>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="history-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search by Transaction ID, Customer ID, or Amount"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(0);
                }}
                className="search-input"
              />
            </div>

            <div className="filters-row">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(0);
                }}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="Fraud">🔴 Fraud Only</option>
                <option value="Legit">🟢 Legit Only</option>
              </select>

              <select
                value={filterChannel}
                onChange={(e) => {
                  setFilterChannel(e.target.value);
                  setCurrentPage(0);
                }}
                className="filter-select"
              >
                <option value="all">All Channels</option>
                <option value="ATM">ATM</option>
                <option value="Online">Online</option>
                <option value="POS">POS</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest-risk">Highest Risk</option>
                <option value="lowest-risk">Lowest Risk</option>
                <option value="highest-amount">Highest Amount</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="filter-select"
              >
                <option value={5}>5 rows</option>
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Transaction ID</th>
                  <th>Customer ID</th>
                  <th>Amount</th>
                  <th>Channel</th>
                  <th>Prediction</th>
                  <th>Risk Score</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {paginatedHistory.map((item, index) => (
                  <tr key={index} className={`row-${item.prediction.toLowerCase()}`}>
                    <td className="row-number">{currentPage * pageSize + index + 1}</td>
                    <td className="txn-id">{item.transaction_id}</td>
                    <td className="cust-id">{item.customer_id}</td>
                    <td className="amount">₹{item.transaction_amount}</td>
                    <td className="channel">{item.channel}</td>
                    <td>
                      <span className={`tag ${item.prediction.toLowerCase()}`}>
                        {item.prediction === "Fraud" ? "🔴" : "🟢"} {item.prediction}
                      </span>
                    </td>
                    <td className="risk-score">
                      <div className="risk-badge" style={{width: `${item.risk}%`}}>
                        {item.risk}%
                      </div>
                    </td>
                    <td className="time">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing {paginatedHistory.length > 0 ? currentPage * pageSize + 1 : 0} -{" "}
              {Math.min((currentPage + 1) * pageSize, filteredHistory.length)} of{" "}
              {filteredHistory.length} results
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="btn-pagination"
              >
                ← Previous
              </button>
              <span className="page-indicator">
                Page {currentPage + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn-pagination"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default History;
