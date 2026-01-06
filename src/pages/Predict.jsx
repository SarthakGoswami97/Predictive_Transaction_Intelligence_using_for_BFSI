// Predict.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Predict.css";
import { showSuccess, showError, showWarning, showPredictionResult } from "../utils/toast";

/*
  Predict.jsx (single-file replace)
  - No external CSV/OCR libraries required (simple CSV parser included)
  - Tabs: form | csv upload | image (image OCR is left as a future optional improvement)
  - KYC modal + local persistence (localStorage.kyc_verifications)
  - CSV persistence (localStorage.uploaded_csv_data) and automatic event dispatch
  - Predict all CSV rows (simulated model), per-row predict, saves to localStorage.prediction_history
  - Improved AI reasoning (structured explanation)
  - CSV preview supports search + pageSize + pagination
  - All predictions saved & restored from localStorage
  - Replace `simulateAIReason` with real LLM call when backend/LLM ready
*/

/* ---------- Helpers ---------- */
function nowAsISOForInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
function ageFromDays(days) {
  const yrs = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return `${yrs}y ${months}m`;
}
function newTransactionId() {
  return "T_" + Date.now().toString(10);
}

/* Simple CSV parser (header-aware). Not as full-featured as papaparse,
   but works with typical CSVs exported by Excel/Sheets. Handles quoted fields. */
function parseCSVText(text) {
  // Trim BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const lines = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      // peek next char to handle escaped quotes
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      // handle \r\n
      if (ch === "\r" && text[i + 1] === "\n") i++;
      lines.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.length) lines.push(cur);

  // split CSV rows into arrays
  const rows = lines.map((l) => {
    // split by comma not inside quotes
    const cells = [];
    let cell = "";
    let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') {
        const next = l[i + 1];
        if (inQ && next === '"') {
          cell += '"';
          i++;
        } else {
          inQ = !inQ;
        }
        continue;
      }
      if (!inQ && c === ",") {
        cells.push(cell);
        cell = "";
        continue;
      }
      cell += c;
    }
    cells.push(cell);
    return cells.map((c) => c.trim());
  });

  if (!rows.length) return [];

  const header = rows[0].map((h) => h.trim());
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const rowArr = rows[i];
    // skip empty rows
    if (rowArr.every((v) => v === "")) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = rowArr[j] ?? "";
    }
    data.push(obj);
  }
  return data;
}

/* Normalizes a CSV row into the canonical schema used across the UI */
function normalizeRow(r) {
  // tolerant key picks
  return {
    transaction_id: r.transaction_id ?? r.txn_id ?? r.id ?? newTransactionId(),
    customer_id: String(r.customer_id ?? r.customer ?? r.cust ?? ""),
    kyc_verified: Number(r.kyc_verified ?? r.kyc ?? r.is_kyc ?? 0),
    account_age_days: Number(r.account_age_days ?? r.account_age ?? r.age_days ?? 0),
    transaction_amount: Number(r.transaction_amount ?? r.amount ?? r.txn_amount ?? 0),
    channel: r.channel ?? r.txn_channel ?? r.method ?? "Online",
    timestamp: r.timestamp ?? r.time ?? new Date().toISOString(),
    is_fraud: Number(r.is_fraud ?? r.fraud ?? 0),
    __raw: r,
  };
}

/* Simulated, more descriptive AI reasoning. Replace by an LLM/backend call for production.
   Returns { short, detail } */
async function simulateAIReason(payload, signals = {}) {
  // Generate comprehensive AI analysis with multiple factors
  const analysis = [];
  const warnings = [];
  const positives = [];
  
  // RISK FACTORS (Red flags)
  if (!payload.kyc_verified) analysis.push("[ALERT] KYC NOT VERIFIED - High risk indicator");
  if (payload.account_age_days < 30) analysis.push("[WARNING] NEW ACCOUNT - Less than 30 days old");
  if (payload.account_age_days < 365 && payload.transaction_amount > 10000) {
    analysis.push("[ALERT] YOUNG ACCOUNT + HIGH AMOUNT - Suspicious combination");
  }
  if (payload.transaction_amount > (signals.avg_customer_amount || 2000) * 5) {
    const ratio = (payload.transaction_amount / (signals.avg_customer_amount || 2000)).toFixed(1);
    analysis.push(`[ALERT] UNUSUAL AMOUNT - ${ratio}x above customer average`);
  }
  if ((payload.channel || "").toLowerCase().includes("online") && (signals.hour ?? 12) < 6) {
    const hour = (signals.hour ?? 12);
    analysis.push(`UNUSUAL TIMING - Online at ${hour}:00 (late night/early morning)`);
  }
  if ((signals.recent_fraud_count || 0) >= 2) {
    analysis.push(`FRAUD HISTORY - ${signals.recent_fraud_count} recent fraud(s) on this customer`);
  }
  
  // POSITIVE FACTORS (Green flags)
  if (payload.kyc_verified) positives.push("KYC Verified");
  if (payload.account_age_days > 365) positives.push(`Established Account (${Math.floor(payload.account_age_days / 365)} years)`);
  if (payload.transaction_amount <= (signals.avg_customer_amount || 2000) * 2) {
    positives.push("Within normal spending range");
  }
  if ((signals.recent_fraud_count || 0) === 0) positives.push("No fraud history");
  
  // Combine analysis
  const mainRisks = analysis.slice(0, 4); // Top 4 risks
  const summary = mainRisks.length > 0 ? mainRisks[0] : "[OK] Transaction appears legitimate";
  const fullDetails = [
    ...mainRisks,
    ...(positives.length > 0 ? ["✅ Positive Factors:", ...positives] : [])
  ].join(" | ");
  
  return { 
    short: summary,
    detail: fullDetails || "[OK] All checks passed. Normal transaction profile."
  };
}

/* Risk scorer (0..1). Replace by actual model probability from backend later. */
function computeRiskScore({ transaction_amount = 0, account_age_days = 0, kyc_verified = 0, channel = "" }) {
  // Higher transaction amounts increase risk
  const amtFactor = Math.min(Number(transaction_amount) / 100000, 1);
  
  // Newer accounts are riskier (max risk at 0 days, decays over 2 years)
  const ageFactor = Math.exp(-Number(account_age_days) / 365);
  
  // KYC verified reduces risk significantly
  const kycFactor = kyc_verified ? 0.15 : 0.8;
  
  // Online transactions have slightly higher risk
  const channelFactor = (channel || "").toLowerCase().includes("online") ? 1.1 : 0.9;
  
  // Weighted combination (adjusted weights for better accuracy)
  const raw = (0.35 * amtFactor + 0.25 * ageFactor + 0.25 * kycFactor + 0.15 * channelFactor) / 2;
  
  return Math.min(1, Math.max(0, raw));
}

// Detect fraud patterns in history
function detectFraudPatterns(history) {
  const patterns = {
    rapidFire: [],
    sameAmount: [],
    sameTiming: {},
    sameCustomer: {}
  };

  // Rapid-fire detection: multiple transactions within 1 minute
  const timeGroups = {};
  history.forEach(h => {
    const time = new Date(h.time).getTime();
    if (!timeGroups[time]) timeGroups[time] = [];
    timeGroups[time].push(h);
  });
  Object.values(timeGroups).forEach(group => {
    if (group.length > 2) patterns.rapidFire.push(group.length);
  });

  // Same amount repeated
  const amountGroups = {};
  history.forEach(h => {
    const amt = h.transaction_amount;
    if (!amountGroups[amt]) amountGroups[amt] = [];
    amountGroups[amt].push(h);
  });
  Object.entries(amountGroups).forEach(([amt, txns]) => {
    if (txns.length > 3) patterns.sameAmount.push({ amount: amt, count: txns.length });
  });

  // Fraud at same time daily
  const timeOfDay = {};
  history.filter(h => h.prediction === "Fraud").forEach(h => {
    const hour = new Date(h.time).getHours();
    if (!timeOfDay[hour]) timeOfDay[hour] = 0;
    timeOfDay[hour]++;
  });
  Object.entries(timeOfDay).forEach(([hour, count]) => {
    if (count > 2) patterns.sameTiming[hour] = count;
  });

  // Same customer fraud count
  history.filter(h => h.prediction === "Fraud").forEach(h => {
    if (!patterns.sameCustomer[h.customer_id]) patterns.sameCustomer[h.customer_id] = 0;
    patterns.sameCustomer[h.customer_id]++;
  });

  return patterns;
}

// Check for alerts
function checkAlerts(prediction, history, customerId) {
  const newAlerts = [];
  
  // High risk alert
  if (prediction.risk_score > 75) {
    newAlerts.push({ 
      type: "high-risk", 
      message: `🔴 High-risk transaction detected (${prediction.risk_score}%)`,
      transactionId: prediction.transaction_id,
      customerId: prediction.customer_id,
      amount: prediction.transaction_amount,
      prediction: prediction.prediction || "Fraud"
    });
  }

  // Repeat fraud customer
  const customerFrauds = history.filter(h => h.customer_id === customerId && h.prediction === "Fraud").length;
  if (customerFrauds > 2) {
    newAlerts.push({ 
      type: "repeat-fraud", 
      message: `⚠️ Customer ${customerId} has ${customerFrauds} fraud cases`,
      transactionId: prediction.transaction_id,
      customerId: customerId,
      amount: prediction.transaction_amount,
      prediction: prediction.prediction || "Fraud"
    });
  }

  // Unusual amount
  const avgAmount = history.filter(h => h.customer_id === customerId).reduce((s, h) => s + Number(h.transaction_amount), 0) / (history.filter(h => h.customer_id === customerId).length || 1);
  if (Number(prediction.transaction_amount) > avgAmount * 2) {
    newAlerts.push({ 
      type: "unusual-amount", 
      message: `💰 Amount ₹${prediction.transaction_amount} is 2x customer average (₹${avgAmount.toFixed(0)})`,
      transactionId: prediction.transaction_id,
      customerId: prediction.customer_id,
      amount: prediction.transaction_amount,
      prediction: prediction.prediction || "Suspicious"
    });
  }

  return newAlerts;
}

/* ---------- Component ---------- */
export default function Predict({ onCustomerIdChange }) {
  // Tabs
  const [activeTab, setActiveTab] = useState("form"); // form | csv | image | alerts

  // SINGLE FORM STATE
  const [form, setForm] = useState({
    customer_id: "",
    kyc_verified: "", // "1" or "0"
    account_age_days: "",
    transaction_amount: "",
    channel: "",
    timestamp: nowAsISOForInput(),
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // KYC
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycDoc, setKycDoc] = useState({ type: "", number: "", file: null });
  const [kycError, setKycError] = useState("");

  // CSV
  const [csvRows, setCsvRows] = useState([]); // normalized rows
  const [csvMessage, setCsvMessage] = useState("");
  const [csvParsing, setCsvParsing] = useState(false);
  // preview controls
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(0);

  // History
  const [history, setHistory] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyPageSize, setHistoryPageSize] = useState(5); // Pagination for performance (reduced from 10 for better scrolling)

  // Row selection for predicting specific rows
  const [selectMode, setSelectMode] = useState("all"); // "all", "single", "range"
  const [selectedRow, setSelectedRow] = useState(""); // for single row
  const [rangeStart, setRangeStart] = useState(""); // for range
  const [rangeEnd, setRangeEnd] = useState(""); // for range

  // FILTERS FOR HISTORY
  const [historyFilters, setHistoryFilters] = useState({
    predictionType: "all", // all | fraud | legit
    riskRange: [0, 100],
    channel: "all",
    customerId: "",
    dateRange: "all" // all | today | week | month
  });

  // ALERTS
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(true);

  // FRAUD PATTERNS
  const [fraudPatterns, setFraudPatterns] = useState({
    rapidFire: [], // multiple transactions within 1 minute
    sameAmount: [], // same amount repeated >3 times
    sameTiming: [], // fraud at same time daily
    sameCustomer: {} // customer fraud count
  });

  // Alert highlight and navigation
  const [selectedAlertTransactionId, setSelectedAlertTransactionId] = useState(null);

  // Load persisted data on mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("prediction_history") || "[]");
    // Sanitize history - ensure reason is always a string
    const sanitizedHistory = savedHistory.map(h => ({
      ...h,
      reason: typeof h.reason === 'string' ? h.reason : (h.reason?.detail || h.reason?.short || "No reasoning available")
    }));
    setHistory(sanitizedHistory);

    const savedCsv = JSON.parse(localStorage.getItem("uploaded_csv_data") || "[]");
    if (Array.isArray(savedCsv) && savedCsv.length) {
      setCsvRows(savedCsv);
      setCsvMessage(`Loaded ${savedCsv.length} rows from storage`);
    }

    // If current customer has persisted KYC, prefill kyc_verified
    const kycMap = JSON.parse(localStorage.getItem("kyc_verifications") || "{}");
    if (form.customer_id && kycMap[form.customer_id]) {
      setForm((s) => ({ ...s, kyc_verified: "1" }));
    }

    // listen for external csv-updated events (in case another tab changed it)
    function onCsvUpdated(e) {
      const saved = JSON.parse(localStorage.getItem("uploaded_csv_data") || "[]");
      setCsvRows(saved);
      setCsvMessage(`CSV updated: ${saved.length} rows`);
    }
    window.addEventListener("csv-updated", onCsvUpdated);
    return () => window.removeEventListener("csv-updated", onCsvUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist history automatically
  useEffect(() => {
    localStorage.setItem("prediction_history", JSON.stringify(history));
  }, [history]);

  // Update KYC status when customer_id changes
  useEffect(() => {
    if (form.customer_id) {
      const kycMap = JSON.parse(localStorage.getItem("kyc_verifications") || "{}");
      if (kycMap[form.customer_id]) {
        setForm((s) => ({ ...s, kyc_verified: "1" }));
        setShowKycModal(false);
      } else {
        setForm((s) => ({ ...s, kyc_verified: "" }));
      }
      // Notify parent of customer ID change
      if (onCustomerIdChange) {
        onCustomerIdChange(form.customer_id);
      }
    }
  }, [form.customer_id, onCustomerIdChange]);

  // Detect patterns and generate alerts from history
  useEffect(() => {
    if (history.length > 0) {
      const patterns = detectFraudPatterns(history);
      setFraudPatterns(patterns);

      // Generate alerts for recent predictions
      const recentAlerts = [];
      const last10 = history.slice(-10);
      
      last10.forEach((pred) => {
        const predAlerts = checkAlerts(pred, history, pred.customer_id);
        recentAlerts.push(...predAlerts);
      });

      // Remove duplicates and keep last 20 alerts
      const uniqueAlerts = Array.from(
        new Map(recentAlerts.map((a) => [a.message, a])).values()
      ).slice(-20);

      setAlerts(uniqueAlerts);
    }
  }, [history]);

  /* ================ KYC helpers ================ */
  function validateAadhaar(num) {
    return /^\d{12}$/.test(num);
  }
  function validatePAN(num) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(num).toUpperCase());
  }
  function persistKyc(customerId, doc) {
    const map = JSON.parse(localStorage.getItem("kyc_verifications") || "{}");
    map[customerId] = { ...doc, verifiedAt: new Date().toISOString() };
    localStorage.setItem("kyc_verifications", JSON.stringify(map));
    // broadcast (optional)
    window.dispatchEvent(new CustomEvent("kyc-updated", { detail: { customerId } }));
  }
  function getKycForCustomer(customerId) {
    const map = JSON.parse(localStorage.getItem("kyc_verifications") || "{}");
    return map[customerId] ?? null;
  }

  async function handleKycVerify() {
    if (!form.customer_id) {
      setKycError("Enter Customer ID first.");
      return;
    }
    const { type, number } = kycDoc;
    if (!type || !number) {
      setKycError("Pick a document and enter its number.");
      return;
    }
    if (type === "Aadhaar" && !validateAadhaar(number)) {
      setKycError("Aadhaar must be 12 digits.");
      return;
    }
    if (type === "PAN" && !validatePAN(number)) {
      setKycError("PAN looks invalid (example: ABCDE1234F).");
      return;
    }
    // persist locally for demo; in production call backend KYC service then persist
    persistKyc(form.customer_id, { type, number });
    setForm((s) => ({ ...s, kyc_verified: "1" }));
    setShowKycModal(false);
    setKycError("");
    showSuccess("KYC verification successful! ✅");
  }

  /* ================ Single-form predict ================ */
  async function handleSubmitForm(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    // require kyc: check persisted or selected
    const persisted = getKycForCustomer(form.customer_id);
    if (!persisted && form.kyc_verified !== "1") {
      setError("KYC not verified — please perform KYC.");
      setShowKycModal(true);
      return;
    }

    if (!form.transaction_amount || !form.channel || !form.account_age_days) {
      setError("Please fill required fields.");
      return;
    }

    const payload = {
      customer_id: form.customer_id || "unknown",
      kyc_verified: Number(form.kyc_verified || (persisted ? 1 : 0)),
      account_age_days: Number(form.account_age_days),
      transaction_amount: Number(form.transaction_amount),
      channel: form.channel,
      timestamp: form.timestamp || new Date().toISOString(),
    };

    setLoading(true);
    setError("");
    try {
      // Build signals for AI reasoning
      const avgCustAmount = computeAvgForCustomerFromCSV(payload.customer_id) || 2000;
      const signals = {
        avg_customer_amount: avgCustAmount,
        hour: new Date(payload.timestamp).getHours(),
        recent_fraud_count: countRecentFraudsForCustomer(payload.customer_id, 30),
      };

      // Get AI reasoning instantly (no delays!)
      const ai = await simulateAIReason(payload, signals);
      const riskRaw = computeRiskScore(payload);
      const riskPercent = Math.round(riskRaw * 10000) / 100;
      const isFraud = riskRaw >= 0.5;

      // Create prediction result with visual indicators and AI summary
      const res = {
        prediction: isFraud ? "🔴 FRAUD" : "✅ LEGIT",
        risk_score: riskPercent,
        reason: ai.detail,
        summary: ai.short,
        transaction_id: newTransactionId(),
        customer_id: payload.customer_id,
        transaction_amount: payload.transaction_amount,
      };

      // Generate alerts for this prediction
      const predAlerts = checkAlerts(res, history, payload.customer_id);
      if (predAlerts.length > 0) {
        setAlerts(prevAlerts => [...predAlerts, ...prevAlerts].slice(0, 20));
      }

      // Create and save history entry
      const entry = {
        transaction_id: res.transaction_id,
        ...payload,
        prediction: isFraud ? "Fraud" : "Legit",
        risk: res.risk_score,
        time: new Date().toLocaleString(),
        reason: res.reason,
        summary: res.summary,
      };

      // Save to history and localStorage (limit to 1000 to prevent quota exceeded)
      const updatedHistory = [entry, ...history].slice(0, 1000);
      setHistory(updatedHistory);
      localStorage.setItem("prediction_history", JSON.stringify(updatedHistory));
      
      setResult(res);
      
      // Show toast notification for prediction result
      showPredictionResult(isFraud ? "Fraud" : "Legit", riskRaw);
      
      console.log("Prediction Result:", res); // Debug log
      console.log("AI Reasoning:", ai.detail); // Debug log
      setError("");
    } catch (err) {
      console.error(err);
      setError("❌ Prediction failed: " + (err.message || "Unknown error"));
      showError("Prediction failed: " + (err.message || "Unknown error"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  /* ================ CSV handlers ================ */
  function onCsvFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvParsing(true);
    setCsvMessage("Reading file...");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const parsed = parseCSVText(String(text));
        const rows = parsed.map((r) => normalizeRow(r));
        setCsvRows(rows);
        localStorage.setItem("uploaded_csv_data", JSON.stringify(rows));
        setCsvMessage(`Loaded ${rows.length} rows from ${file.name}`);
        showSuccess(`CSV uploaded: ${rows.length} transactions loaded`);
        // broadcast event so Dashboard can refresh
        window.dispatchEvent(new CustomEvent("csv-updated", { detail: { rowsCount: rows.length } }));
      } catch (err) {
        console.error(err);
        setCsvMessage("Failed to parse CSV.");
        showError("Failed to parse CSV file");
      } finally {
        setCsvParsing(false);
        setPage(0);
      }
    };
    reader.onerror = (err) => {
      console.error(err);
      setCsvMessage("Failed to read file.");
      showError("Failed to read file");
      setCsvParsing(false);
    };
    reader.readAsText(file, "utf-8");
  }

  function clearCsv() {
    setCsvRows([]);
    setCsvMessage("");
    setSearchText("");
    setPage(0);
    setPageSize(5);
    setSelectMode("all");
    setSelectedRow("");
    setRangeStart("");
    setRangeEnd("");
    localStorage.removeItem("uploaded_csv_data");
    window.dispatchEvent(new CustomEvent("csv-updated", { detail: { rowsCount: 0 } }));
  }

  // compute avg customer amount from uploaded CSV (helper)
  function computeAvgForCustomerFromCSV(customerId) {
    if (!csvRows.length) {
      const saved = JSON.parse(localStorage.getItem("uploaded_csv_data") || "[]");
      if (!saved.length) return null;
      const arr = saved.filter((r) => String(r.customer_id) === String(customerId)).map((r) => Number(r.transaction_amount || 0));
      if (!arr.length) return null;
      return arr.reduce((s, a) => s + a, 0) / arr.length;
    }
    const arr = csvRows.filter((r) => String(r.customer_id) === String(customerId)).map((r) => Number(r.transaction_amount || 0));
    if (!arr.length) return null;
    return arr.reduce((s, a) => s + a, 0) / arr.length;
  }

  // count recent frauds for this customer in history (last N entries)
  function countRecentFraudsForCustomer(customerId, window = 30) {
    const saved = JSON.parse(localStorage.getItem("prediction_history") || "[]");
    if (!saved.length) return 0;
    return saved.filter((h) => String(h.customer_id) === String(customerId) && h.prediction === "Fraud").length;
  }

  // Predict all rows from CSV with optimized batch processing (no UI freeze!)
  async function predictAllCsv() {
    // Use state csvRows or load from localStorage if state is empty
    let allRows = csvRows && csvRows.length > 0 ? csvRows : JSON.parse(localStorage.getItem("uploaded_csv_data") || "[]");
    let rowsToPredict = allRows;
    let selectionDescription = "all";

    // Filter based on selection mode
    if (selectMode === "single") {
      const rowNum = Number(selectedRow);
      if (isNaN(rowNum) || rowNum < 1 || rowNum > allRows.length) {
        setCsvMessage(`❌ Invalid row number. Please enter a number between 1 and ${allRows.length}`);
        return;
      }
      rowsToPredict = [allRows[rowNum - 1]];
      selectionDescription = `row ${rowNum}`;
    } else if (selectMode === "range") {
      const start = Number(rangeStart);
      const end = Number(rangeEnd);
      if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > allRows.length) {
        setCsvMessage(`❌ Invalid range. Please enter valid row numbers between 1 and ${allRows.length}`);
        return;
      }
      rowsToPredict = allRows.slice(start - 1, end);
      selectionDescription = `rows ${start}-${end}`;
    }
    
    if (!rowsToPredict || !rowsToPredict.length) {
      setCsvMessage("❌ No CSV loaded. Please upload a CSV file first.");
      return;
    }

    setLoading(true);
    const totalRows = rowsToPredict.length;
    setCsvMessage(`🔄 Predicting ${totalRows} transactions (${selectionDescription})...(initializing)`);
    
    try {
      // compute per-customer averages
      const per = {};
      rowsToPredict.forEach((r) => {
        per[r.customer_id] = per[r.customer_id] || [];
        per[r.customer_id].push(Number(r.transaction_amount || 0));
      });
      const avg = {};
      Object.keys(per).forEach((k) => {
        const arr = per[k];
        avg[k] = arr.reduce((s, a) => s + a, 0) / arr.length;
      });

      const newEntries = [];
      const BATCH_SIZE = 20; // Smaller batch to prevent UI freeze
      
      for (let i = 0; i < rowsToPredict.length; i += BATCH_SIZE) {
        const batchRows = rowsToPredict.slice(i, Math.min(i + BATCH_SIZE, rowsToPredict.length));
        
        // Process batch with control to prevent UI freeze
        const batchPromises = batchRows.map(async (row) => {
          const payload = {
            customer_id: row.customer_id || "unknown",
            kyc_verified: Number(row.kyc_verified || 0),
            account_age_days: Number(row.account_age_days || 0),
            transaction_amount: Number(row.transaction_amount || 0),
            channel: row.channel || "Online",
            timestamp: row.timestamp || new Date().toISOString(),
          };
          const signals = { 
            ...payload, 
            avg_customer_amount: avg[row.customer_id] || 2000, 
            hour: new Date(payload.timestamp).getHours(),
            recent_fraud_count: countRecentFraudsForCustomer(payload.customer_id, 30)
          };
          
          // Get AI reasoning
          const ai = await simulateAIReason(payload, signals);
          const riskRaw = computeRiskScore(payload);
          const riskPercent = Math.round(riskRaw * 10000) / 100;
          const isFraud = riskRaw >= 0.5;
          
          // Create entry with AI reasoning
          const entry = {
            transaction_id: row.transaction_id || newTransactionId(),
            ...payload,
            prediction: isFraud ? "Fraud" : "Legit",
            risk: riskPercent,
            time: new Date().toLocaleString(),
            reason: ai.detail,
          };
          
          return entry;
        });
        
        const batchResults = await Promise.all(batchPromises);
        newEntries.push(...batchResults);
        
        // Yield to browser to update UI and prevent freeze
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Update progress
        const processedCount = Math.min(i + BATCH_SIZE, rowsToPredict.length);
        setCsvMessage(`🔄 Predicted ${processedCount} of ${totalRows} transactions (${selectionDescription})...`);
      }

      const updated = [...newEntries, ...history];
      // Keep only last 1000 predictions to prevent localStorage quota exceeded
      const limited = updated.slice(0, 1000);
      setHistory(limited);
      localStorage.setItem("prediction_history", JSON.stringify(limited));
      
      const fraudCount = newEntries.filter(e => e.prediction === "Fraud").length;
      const legitCount = newEntries.length - fraudCount;
      setCsvMessage(`✅ Done! Predicted ${totalRows} transactions - ${fraudCount} fraud(s) | ${legitCount} legit`);
      
      // broadcast to dashboard
      window.dispatchEvent(new CustomEvent("csv-updated", { detail: { rowsCount: totalRows, predictedCount: newEntries.length, fraudCount } }));
    } catch (err) {
      console.error("Prediction error:", err);
      setCsvMessage("❌ Prediction failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  /* ================ CSV preview controls ================ */
  const filteredCsv = useMemo(() => {
    if (!searchText) return csvRows;
    const s = searchText.toLowerCase();
    return csvRows.filter((r) =>
      String(r.transaction_id).toLowerCase().includes(s) ||
      String(r.customer_id).toLowerCase().includes(s) ||
      String(r.channel).toLowerCase().includes(s) ||
      String(r.transaction_amount).toLowerCase().includes(s)
    );
  }, [csvRows, searchText]);

  const pageCount = Math.max(1, Math.ceil(filteredCsv.length / pageSize));
  const pagedCsv = filteredCsv.slice(page * pageSize, (page + 1) * pageSize);

  /* ================ History helpers ================ */
  function toggleExpand(idx) {
    setExpandedIdx((p) => (p === idx ? null : idx));
  }
  function removeHistory(idx) {
    const copy = [...history];
    copy.splice(idx, 1);
    setHistory(copy);
  }
  function exportHistoryCSV() {
    const header = ["transaction_id", "customer_id", "transaction_amount", "channel", "prediction", "risk", "time", "reason"];
    const rows = history.map((h) => header.map((k) => JSON.stringify(h[k] ?? "")).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prediction_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Pagination for history (prevents lag with large datasets)
  const historyPageCount = Math.max(1, Math.ceil(history.length / historyPageSize));
  const pagedHistory = useMemo(() => {
    // Apply filters first
    let filtered = history.filter(h => {
      // Prediction Type Filter
      if (historyFilters.predictionType !== "all") {
        const type = historyFilters.predictionType === "fraud" ? "Fraud" : "Legit";
        if (h.prediction !== type) return false;
      }

      // Risk Range Filter
      if (h.risk > historyFilters.riskRange[1]) return false;

      // Channel Filter
      if (historyFilters.channel !== "all" && h.channel !== historyFilters.channel) return false;

      // Customer ID Filter
      if (historyFilters.customerId && !h.customer_id.toLowerCase().includes(historyFilters.customerId.toLowerCase())) return false;

      // Date Range Filter (simplified - assumes same day for all in this session)
      if (historyFilters.dateRange !== "all") {
        // In a real app, you'd parse timestamps, but for simplicity we'll keep all today
        // This is a placeholder for date filtering
      }

      return true;
    });

    // Then paginate
    return filtered.slice(historyPage * historyPageSize, (historyPage + 1) * historyPageSize);
  }, [history, historyPage, historyPageSize, historyFilters]);

  // Image OCR
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  /* ================ Image OCR with Tesseract.js ================ */
  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);

    // OCR processing
    setOcrLoading(true);
    setCsvMessage("Processing image with OCR...");
    setOcrText("");
    setExtractedData(null);

    try {
      // Dynamically import Tesseract.js
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker();
      
      // Perform OCR
      const result = await worker.recognize(file);
      const fullText = result.data.text;
      setOcrText(fullText);
      
      // Extract bill details from text
      const extracted = extractBillDetails(fullText);
      setExtractedData(extracted);
      
      setCsvMessage(`OCR completed! Found: ${extracted.items.length} items, Total: ₹${extracted.totalAmount}`);

      // Cleanup worker
      await worker.terminate();
    } catch (err) {
      console.error("OCR Error:", err);
      setCsvMessage(`OCR Error: ${err.message || "Tesseract.js not available. Install with: npm install tesseract.js"}`);
    } finally {
      setOcrLoading(false);
    }
  }

  /* Extract bill/invoice details from OCR text */
  function extractBillDetails(text) {
    const data = {
      items: [],
      totalAmount: 0,
      date: null,
      merchant: null,
      confidence: 0,
    };

    // Extract merchant name (usually at top)
    const merchantMatch = text.match(/^([A-Za-z\s&.,'-]+)/m);
    if (merchantMatch) {
      data.merchant = merchantMatch[1].trim().substring(0, 50);
    }

    // Extract date (various formats)
    const dateRegex = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      data.date = dateMatch[0];
    }

    // Extract amounts (prices, total)
    const amountRegex = /₹\s*([\d,]+\.?\d*)|(?:Rs|INR|rupees)\s*([\d,]+\.?\d*)/gi;
    let amounts = [];
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      const amount = parseFloat((match[1] || match[2]).replace(/,/g, ""));
      if (!isNaN(amount)) {
        amounts.push(amount);
      }
    }

    // Extract items (lines with amounts)
    const lines = text.split("\n");
    lines.forEach((line) => {
      const lineAmountMatch = line.match(/(₹|Rs|INR)?\s*([\d,]+\.?\d*)/);
      if (lineAmountMatch && line.length > 5) {
        const desc = line.replace(/[₹RsINR\d.,]/g, "").trim();
        const amt = parseFloat(lineAmountMatch[2].replace(/,/g, ""));
        if (desc && amt && !isNaN(amt) && amt > 0 && amt < 100000) {
          data.items.push({
            description: desc.substring(0, 100),
            amount: amt,
          });
        }
      }
    });

    // Total amount (usually largest or last amount)
    if (amounts.length > 0) {
      data.totalAmount = Math.max(...amounts);
    } else if (data.items.length > 0) {
      data.totalAmount = data.items.reduce((s, i) => s + i.amount, 0);
    }

    // Remove duplicates in items
    data.items = data.items.filter((item, idx, arr) => arr.findIndex((i) => i.amount === item.amount && i.description === item.description) === idx);
    data.items = data.items.slice(0, 10); // Limit to 10 items

    data.confidence = Math.min(100, (data.items.length + (data.totalAmount > 0 ? 1 : 0) + (data.date ? 1 : 0)) * 15);

    return data;
  }

  /* Use extracted bill data to prefill transaction form */
  function useBillDataInForm() {
    if (!extractedData || extractedData.totalAmount === 0) {
      setError("No valid bill data extracted.");
      return;
    }

    setForm((s) => ({
      ...s,
      transaction_amount: String(extractedData.totalAmount),
      channel: "POS", // Bill is usually from POS
      timestamp: extractedData.date ? convertDateToInput(extractedData.date) : s.timestamp,
    }));

    setActiveTab("form");
    setError("Bill data loaded into form. Please complete other fields.");
  }

  function convertDateToInput(dateStr) {
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const iso = date.toISOString();
      return iso.slice(0, 16);
    }
    return nowAsISOForInput();
  }

  /* ---------- Render ---------- */
  return (
    <div className="predict-root">
      {/* Real-time Alerts Notification Banner */}
      {alerts.length > 0 && showAlerts && (
        <div style={{ 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffc107", 
          borderRadius: "8px", 
          padding: "12px 16px", 
          marginBottom: "16px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#856404", marginBottom: "8px" }}>⚠️ {alerts.length} Alert(s) Detected</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#856404" }}>
              {alerts.slice(-3).map((alert, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedAlertTransactionId(alert.transactionId);
                    setHistoryPage(0);
                    // Scroll to history section
                    setTimeout(() => {
                      document.querySelector(".history-card")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  style={{
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    backgroundColor: "#ffedba",
                    marginBottom: "4px",
                    transition: "all 150ms ease",
                    border: "1px solid #ffc107"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffda8a";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffedba";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "2px", opacity: 0.8 }}>
                    Txn: {alert.transactionId} | Cust: {alert.customerId} | Amt: ₹{alert.amount}
                  </div>
                </div>
              ))}
              {alerts.length > 3 && <div style={{ fontSize: "12px", marginTop: "4px", fontStyle: "italic" }}>...and {alerts.length - 3} more. Click to view transaction.</div>}
            </div>
          </div>
          <button 
            onClick={() => { setShowAlerts(false); setAlerts([]); }}
            style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: "0 8px", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="tabs">
        <button className={activeTab === "form" ? "tab active" : "tab"} onClick={() => setActiveTab("form")}>Form</button>
        <button className={activeTab === "csv" ? "tab active" : "tab"} onClick={() => setActiveTab("csv")}>CSV Upload</button>
        <button className={activeTab === "image" ? "tab active" : "tab"} onClick={() => setActiveTab("image")}>Image OCR</button>
        <button className={activeTab === "alerts" ? "tab active" : "tab"} onClick={() => { setActiveTab("alerts"); setShowAlerts(true); }}>
          Alerts {alerts.length > 0 && <span style={{ marginLeft: "4px", backgroundColor: "#d32f2f", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "11px", fontWeight: "bold" }}>{alerts.length}</span>}
        </button>
      </div>

      <div className="tab-content">

        {/* ----- DASHBOARD SUMMARY CARDS ----- */}
        {activeTab === "form" && (
          <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {/* Total Predictions Card */}
            <div style={{ padding: "16px", backgroundColor: "#e3f2fd", borderRadius: "8px", border: "1px solid #bbdefb", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#1565c0", textTransform: "uppercase" }}>📊 Total Predictions</p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "#1976d2" }}>{history.length}</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Today</p>
            </div>

            {/* Fraud Count Card */}
            <div style={{ padding: "16px", backgroundColor: "#ffebee", borderRadius: "8px", border: "1px solid #ffcdd2", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#b71c1c", textTransform: "uppercase" }}>🔴 Fraud Cases</p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "#c62828" }}>
                {history.filter(h => h.prediction === "Fraud").length} / {history.length}
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
                {history.length > 0 ? ((history.filter(h => h.prediction === "Fraud").length / history.length) * 100).toFixed(1) : 0}% Fraud Rate
              </p>
            </div>

            {/* Average Risk Score Card */}
            <div style={{ padding: "16px", backgroundColor: "#fff3e0", borderRadius: "8px", border: "1px solid #ffe0b2", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#e65100", textTransform: "uppercase" }}>📈 Avg Risk Score</p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "#f57c00" }}>
                {history.length > 0 ? (history.reduce((sum, h) => sum + h.risk, 0) / history.length).toFixed(1) : 0}%
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Across all transactions</p>
            </div>

            {/* Active Alerts Card */}
            <div style={{ padding: "16px", backgroundColor: "#f3e5f5", borderRadius: "8px", border: "1px solid #e1bee7", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#6a1b9a", textTransform: "uppercase" }}>⚠️ Active Alerts</p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "#7b1fa2" }}>{alerts.length}</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Suspicious patterns detected</p>
            </div>
          </div>
        )}

        {/* ----- FORM TAB ----- */}
        {activeTab === "form" && (
          <div className="form-grid">
            <div className="card form-card" style={{ boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12)", border: "1px solid #eef2f7" }}>
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #f0f2f7" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f1724" }}>💳 Single Transaction Prediction</h3>
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Enter transaction details to get AI-powered fraud detection</p>
              </div>
              <form onSubmit={handleSubmitForm}>
                <label style={{ fontWeight: 600, color: "#0f1724", fontSize: "13px", marginTop: 12, display: "block" }}>Customer ID</label>
                <input name="customer_id" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} placeholder="e.g. CUST_101" style={{ marginBottom: 16 }} />

                <label style={{ fontWeight: 600, color: "#0f1724", fontSize: "13px", marginTop: 12, display: "block" }}>KYC Verified</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                  <select name="kyc_verified" value={form.kyc_verified} onChange={(e) => setForm({ ...form, kyc_verified: e.target.value })} style={{ flex: 1 }}>
                    <option value="">Select</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                  <button type="button" className="verify-btn" onClick={() => { setShowKycModal(true); }} style={{ whiteSpace: "nowrap" }}>Verify KYC</button>
                </div>

                <label style={{ fontWeight: 600, color: "#0f1724", fontSize: "13px", marginTop: 12, display: "block" }}>Account Age (days)</label>
                <input name="account_age_days" value={form.account_age_days} onChange={(e) => setForm({ ...form, account_age_days: e.target.value })} placeholder="e.g. 365" style={{ marginBottom: 8 }} />
                {form.account_age_days && <small className="muted" style={{ display: "block", marginBottom: 16 }}>📅 Account age: {ageFromDays(Number(form.account_age_days))}</small>}

                <label style={{ fontWeight: 600, color: "#0f1724", fontSize: "13px", marginTop: 12, display: "block" }}>Transaction Amount (₹)</label>
                <input name="transaction_amount" value={form.transaction_amount} onChange={(e) => setForm({ ...form, transaction_amount: e.target.value })} placeholder="e.g. 2500" style={{ marginBottom: 16 }} />

                <label style={{ fontWeight: 600, color: "#0f1724", fontSize: "13px", marginTop: 12, display: "block" }}>Channel</label>
                <select name="channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} style={{ marginBottom: 16 }}>
                  <option value="">Select</option>
                  <option value="ATM">ATM</option>
                  <option value="Online">Online</option>
                  <option value="POS">POS</option>
                  <option value="Mobile">Mobile</option>
                </select>

                <label style={{ fontWeight: 600, color: "#0f1724", fontSize: "13px", marginTop: 12, display: "block" }}>Timestamp</label>
                <input type="datetime-local" name="timestamp" value={form.timestamp} onChange={(e) => setForm({ ...form, timestamp: e.target.value })} style={{ marginBottom: 20 }} />

                <button type="submit" className="primary-btn" disabled={loading} style={{ width: "100%", marginTop: 12 }}>{loading ? "🔄 Predicting..." : "🚀 Predict"}</button>
                {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
              </form>
            </div>

            <div className="card result-card" style={{ boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12)", border: "1px solid #eef2f7" }}>
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #f0f2f7" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f1724" }}>📊 Prediction Result</h3>
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>AI-powered fraud detection analysis</p>
              </div>
              {!result && <p className="muted" style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>No prediction yet — fill the form and submit.</p>}
              {result && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* ALERTS NOTIFICATION */}
                  {alerts.length > 0 && (
                    <div style={{ 
                      padding: "16px", 
                      backgroundColor: "#fef2f2", 
                      borderRadius: "10px", 
                      border: "2px solid #fecaca",
                      borderLeft: "5px solid #dc2626"
                    }}>
                      <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.5px" }}>🚨 Active Alerts ({alerts.length})</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {alerts.slice(0, 3).map((alert, idx) => (
                          <p key={idx} style={{ margin: 0, fontSize: "13px", color: "#991b1b", fontWeight: 500 }}>• {alert.message}</p>
                        ))}
                        {alerts.length > 3 && <p style={{ margin: 0, fontSize: "12px", color: "#7f1d1d", fontStyle: "italic" }}>+ {alerts.length - 3} more alerts</p>}
                      </div>
                    </div>
                  )}
                  
                  {/* Prediction Badge */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    padding: "20px 16px", 
                    borderRadius: "8px",
                    backgroundColor: result.prediction.includes("FRAUD") ? "#fee2e2" : "#dcfce7",
                    border: `2px solid ${result.prediction.includes("FRAUD") ? "#dc2626" : "#22c55e"}`,
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Prediction</p>
                      <div style={{ fontSize: "32px", fontWeight: "900", color: result.prediction.includes("FRAUD") ? "#dc2626" : "#22c55e" }}>
                        {result.prediction.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div style={{ 
                    padding: "16px", 
                    backgroundColor: "#f9fafb", 
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase" }}>Risk Score</p>
                    <div style={{ 
                      fontSize: "36px", 
                      fontWeight: "bold", 
                      color: result.risk_score > 50 ? "#dc2626" : "#22c55e",
                      display: "flex",
                      alignItems: "baseline",
                      gap: "6px"
                    }}>
                      {result.risk_score}<span style={{ fontSize: "20px" }}>%</span>
                    </div>
                    <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
                      {result.risk_score > 75 ? "🔴 Critical Risk" : result.risk_score > 50 ? "🟠 High Risk" : result.risk_score > 25 ? "🟡 Medium Risk" : "🟢 Low Risk"}
                    </p>
                  </div>

                  {/* Summary Box */}
                  {result.summary && (
                    <div style={{ 
                      padding: "18px", 
                      backgroundColor: result.prediction.includes("FRAUD") ? "#fef2f2" : "#f0fdf4", 
                      borderRadius: "10px", 
                      borderLeft: "5px solid " + (result.prediction.includes("FRAUD") ? "#dc2626" : "#22c55e"),
                      border: `2px solid ${result.prediction.includes("FRAUD") ? "#fca5a5" : "#86efac"}`,
                    }}>
                      <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚡ Quick Summary</p>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: result.prediction.includes("FRAUD") ? "#7f1d1d" : "#1b4332", lineHeight: "1.6" }}>{result.summary}</p>
                    </div>
                  )}
                  
                  {/* Detailed Reasoning Box */}
                  <div style={{ 
                    padding: "18px", 
                    backgroundColor: "#eff6ff", 
                    borderRadius: "10px", 
                    border: "2px solid #bfdbfe",
                    borderLeft: "5px solid #3b82f6"
                  }}>
                    <p style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px" }}>🤖 AI Analysis & Reasoning</p>
                    {result.reason ? (
                      <div style={{ 
                        padding: "16px", 
                        backgroundColor: "#f0f9ff", 
                        borderRadius: "8px", 
                        fontSize: "14px", 
                        lineHeight: "1.8",
                        border: "1px solid #93c5fd",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: "450px",
                        overflowY: "auto",
                        color: "#1e293b",
                        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
                      }}>
                        {result.reason.split(" | ").map((line, idx) => (
                          <div key={idx} style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "3px solid #93c5fd", paddingBottom: "8px" }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: "#1e40af", fontSize: "14px", backgroundColor: "#f0f9ff", padding: "12px", borderRadius: "6px", border: "1px solid #93c5fd" }}>No detailed reasoning available</p>
                    )}
                  </div>
                  
                  {/* Transaction ID */}
                  <div style={{ 
                    padding: "12px 16px", 
                    backgroundColor: "#f3f4f6", 
                    borderRadius: "6px",
                    borderTop: "1px solid #e5e7eb"
                  }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Transaction ID</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", fontWeight: 600, color: "#1f2937", fontFamily: "monospace" }}>{result.transaction_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----- CSV TAB ----- */}
        {activeTab === "csv" && (
          <div className="csv-grid">
            <div className="card upload-card" style={{ boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12)", border: "1px solid #eef2f7" }}>
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #f0f2f7" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f1724" }}>📤 Upload CSV File</h3>
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Batch predict multiple transactions at once</p>
              </div>
              <input type="file" accept=".csv" onChange={onCsvFileChange} style={{ padding: "12px", border: "2px dashed #d0dff0", borderRadius: "6px", marginBottom: 16, cursor: "pointer" }} />
              <div className="muted" style={{ fontSize: "12px", padding: "12px", backgroundColor: "#f5f8ff", borderRadius: "6px", border: "1px solid #d0dff0", marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>📋 Expected Columns:</p>
                <p style={{ margin: 0, fontSize: "11px", lineHeight: "1.6" }}>transaction_id, customer_id, kyc_verified, account_age_days, transaction_amount, channel, timestamp, is_fraud</p>
              </div>
              {csvMessage && <div style={{ padding: "12px", backgroundColor: csvMessage.includes("❌") ? "#ffebee" : "#e8f5e9", borderRadius: "6px", fontSize: "13px", marginBottom: 16, border: "1px solid " + (csvMessage.includes("❌") ? "#ffcdd2" : "#c8e6c9") }}>{csvMessage}</div>}

              {/* Row Selection Controls */}
              {csvRows.length > 0 && (
                <div style={{ marginTop: 16, padding: "16px", backgroundColor: "#f0f4f8", borderRadius: "8px", border: "2px solid #d0dff0", marginBottom: 16 }}>
                  <p style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: "13px", color: "#1565c0", textTransform: "uppercase" }}>⚙️ Select Prediction Mode:</p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="radio" name="selectMode" value="all" checked={selectMode === "all"} onChange={(e) => { setSelectMode(e.target.value); setSelectedRow(""); setRangeStart(""); setRangeEnd(""); }} />
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>All Rows</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="radio" name="selectMode" value="single" checked={selectMode === "single"} onChange={(e) => { setSelectMode(e.target.value); setRangeStart(""); setRangeEnd(""); }} />
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>Single Row:</span>
                    </label>
                    {selectMode === "single" && (
                      <input type="number" min="1" max={csvRows.length} placeholder="Row #" value={selectedRow} onChange={(e) => setSelectedRow(e.target.value)} style={{ width: "70px", padding: "8px", fontSize: "13px", borderRadius: "4px", border: "1px solid #d0dff0" }} />
                    )}
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="radio" name="selectMode" value="range" checked={selectMode === "range"} onChange={(e) => { setSelectMode(e.target.value); setSelectedRow(""); }} />
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>Range:</span>
                    </label>
                    {selectMode === "range" && (
                      <>
                        <input type="number" min="1" max={csvRows.length} placeholder="From" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} style={{ width: "70px", padding: "8px", fontSize: "13px", borderRadius: "4px", border: "1px solid #d0dff0" }} />
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>to</span>
                        <input type="number" min="1" max={csvRows.length} placeholder="To" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} style={{ width: "70px", padding: "8px", fontSize: "13px", borderRadius: "4px", border: "1px solid #d0dff0" }} />
                      </>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <button className="primary-btn" onClick={predictAllCsv} disabled={(!csvRows.length && !JSON.parse(localStorage.getItem("uploaded_csv_data") || "[]").length) || loading} style={{ flex: 1, minWidth: "120px" }}>{loading ? "🔄 Predicting..." : "🚀 Predict"}</button>
                <button className="secondary-btn" onClick={clearCsv} style={{ flex: 1, minWidth: "120px" }}>🗑️ Clear CSV</button>
              </div>
            </div>

            <div className="card preview-card" style={{ boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12)", border: "1px solid #eef2f7" }}>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "2px solid #f0f2f7" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f1724" }}>👁️ CSV Preview ({csvRows.length})</h3>
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Review and search uploaded transactions</p>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input placeholder="🔍 Search Txn/Customer/Channel/Amount" value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(0); }} style={{ flex: 1, padding: "10px 12px", fontSize: "13px" }} />
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} style={{ padding: "10px 12px", fontSize: "13px" }}>
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>

              {!csvRows.length && <p className="muted">No CSV loaded yet.</p>}
              {csvRows.length > 0 && (
                <>
                  <table className="preview-table">
                    <thead>
                      <tr><th>#</th><th>Txn ID</th><th>Cust</th><th>Amt</th><th>Age</th><th>Channel</th><th>Is Fraud</th></tr>
                    </thead>
                    <tbody>
                      {pagedCsv.map((r, idx) => (
                        <tr key={r.transaction_id + idx}>
                          <td>{page * pageSize + idx + 1}</td>
                          <td>{r.transaction_id}</td>
                          <td>{r.customer_id}</td>
                          <td>₹{r.transaction_amount}</td>
                          <td>{ageFromDays(Number(r.account_age_days) || 0)}</td>
                          <td>{r.channel}</td>
                          <td>{Number(r.is_fraud) === 1 ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* pagination */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <div className="muted">Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filteredCsv.length)} of {filteredCsv.length}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="secondary-btn" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
                      <button className="secondary-btn" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>Next</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ----- IMAGE TAB (light fallback) ----- */}
        {activeTab === "image" && (
          <div className="image-grid">
            <div className="card upload-card" style={{ boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12)", border: "1px solid #eef2f7" }}>
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #f0f2f7" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f1724" }}>📸 Upload Bill / Invoice</h3>
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Extract transaction details from documents using OCR</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageFile} disabled={ocrLoading} style={{ padding: "12px", border: "2px dashed #d0dff0", borderRadius: "6px", marginBottom: 16, cursor: ocrLoading ? "not-allowed" : "pointer" }} />
              <div style={{ padding: "12px", backgroundColor: ocrLoading ? "#fff3cd" : "#f5f8ff", borderRadius: "6px", border: "1px solid " + (ocrLoading ? "#ffeaa7" : "#d0dff0"), fontSize: "12px", marginBottom: 16 }}>
                {ocrLoading ? "⏳ Processing image... (this may take a moment)" : "💡 Upload a bill, receipt, or invoice image. Our AI will extract details like amount, items, and date."}
              </div>

              {imagePreview && (
                <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                  <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: 600, color: "#333" }}>Preview:</p>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", border: "1px solid #e0e0e0" }} />
                </div>
              )}

              {error && <div className="error-text" style={{ marginTop: 12, padding: "12px", backgroundColor: "#ffebee", borderRadius: "6px", border: "1px solid #ffcdd2" }}>{error}</div>}
            </div>

            <div className="card preview-card" style={{ boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12)", border: "1px solid #eef2f7" }}>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "2px solid #f0f2f7" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f1724" }}>📊 Extracted Details</h3>
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Transaction information from document</p>
              </div>

              {!ocrText && !ocrLoading && <p className="muted" style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>Upload an image to extract bill details...</p>}

              {ocrLoading && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div className="spinner" style={{ marginBottom: 12 }}></div>
                  <p className="muted">⏳ Analyzing image with Tesseract.js OCR...</p>
                </div>
              )}

              {extractedData && (
                <div style={{ marginTop: 12 }}>
                  <div className="extracted-section">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <p style={{ margin: "8px 0" }}>
                          <strong>💼 Merchant:</strong> {extractedData.merchant || "(Not detected)"}
                        </p>
                        <p style={{ margin: "8px 0" }}>
                          <strong>📅 Date:</strong> {extractedData.date || "(Not detected)"}
                        </p>
                        <p style={{ margin: "8px 0" }}>
                          <strong>💰 Total Amount:</strong> ₹{extractedData.totalAmount.toFixed(2)}
                        </p>
                        <p style={{ margin: "8px 0", opacity: 0.7 }}>
                          <strong>🎯 Confidence:</strong> {extractedData.confidence}%
                        </p>
                      </div>
                      <button className="primary-btn" onClick={useBillDataInForm}>Use in Form →</button>
                    </div>

                    {extractedData.items.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <h4 style={{ margin: "0 0 12px 0" }}>📦 Items ({extractedData.items.length})</h4>
                        <div className="items-list">
                          {extractedData.items.map((item, idx) => (
                            <div key={idx} className="item-row">
                              <span className="item-name">{item.description}</span>
                              <span className="item-price">₹{item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {ocrText && (
                    <details style={{ marginTop: 16 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 600, color: "#6a11cb" }}>View Full OCR Text</summary>
                      <pre style={{ 
                        marginTop: 12, 
                        padding: "12px", 
                        background: "#f5f7fc", 
                        borderRadius: "8px", 
                        fontSize: "11px",
                        maxHeight: "200px",
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                      }}>
                        {ocrText}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {!ocrLoading && csvMessage && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: ocrText ? "#e8f5e9" : "#fff3cd", borderRadius: "6px", fontSize: "12px" }}>
                  {csvMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----- ALERTS TAB ----- */}
        {activeTab === "alerts" && (
          <div className="alerts-grid">
            <div className="card alerts-card">
              <h3>� Alert Transactions ({alerts.length})</h3>

              {alerts.length === 0 ? (
                <p className="muted">No alerts detected. All transactions look good!</p>
              ) : (
                <>
                  {/* Alerts List */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {alerts.map((alert, idx) => (
                        <div key={idx} style={{ 
                          padding: "14px", 
                          backgroundColor: alert.type === "high-risk" ? "#ffebee" : alert.type === "repeat-fraud" ? "#fff3e0" : "#e8f5e9",
                          borderLeft: alert.type === "high-risk" ? "4px solid #d32f2f" : alert.type === "repeat-fraud" ? "4px solid #ff6f00" : "4px solid #388e3c",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": { boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 8px 0", fontWeight: 600, fontSize: "14px" }}>{alert.message}</p>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "12px", color: "#666" }}>
                                <div>
                                  <span style={{ fontWeight: 600, color: "#333" }}>Txn ID:</span> {alert.transactionId}
                                </div>
                                <div>
                                  <span style={{ fontWeight: 600, color: "#333" }}>Customer ID:</span> {alert.customerId}
                                </div>
                                <div>
                                  <span style={{ fontWeight: 600, color: "#333" }}>Amount:</span> ₹{alert.amount}
                                </div>
                                <div>
                                  <span style={{ fontWeight: 600, color: "#333" }}>Prediction:</span> 
                                  <span style={{ marginLeft: "4px", fontWeight: "bold", color: alert.prediction === "Fraud" ? "#d32f2f" : "#388e3c" }}>
                                    {alert.prediction}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span style={{ 
                              padding: "4px 12px", 
                              backgroundColor: alert.type === "high-risk" ? "#d32f2f" : alert.type === "repeat-fraud" ? "#ff6f00" : "#388e3c",
                              color: "#fff",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap"
                            }}>
                              {alert.type === "high-risk" ? "HIGH RISK" : alert.type === "repeat-fraud" ? "REPEAT FRAUD" : "UNUSUAL AMOUNT"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

                  {/* Fraud Detection Analytics Summary */}
                  <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 600 }}>📊 Fraud Detection Analytics</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    <div style={{ padding: "16px", backgroundColor: "#ffebee", borderRadius: "8px", border: "1px solid #ffcdd2" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#b71c1c", textTransform: "uppercase" }}>🔴 Fraud Cases</p>
                      <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#c62828" }}>{history.filter(h => h.prediction === "Fraud").length}</p>
                      <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
                        {((history.filter(h => h.prediction === "Fraud").length / history.length) * 100).toFixed(1)}% of total
                      </p>
                    </div>

                    <div style={{ padding: "16px", backgroundColor: "#e8f5e9", borderRadius: "8px", border: "1px solid #c8e6c9" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#1b5e20", textTransform: "uppercase" }}>🟢 Legit Cases</p>
                      <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#2e7d32" }}>{history.filter(h => h.prediction === "Legit").length}</p>
                      <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
                        {((history.filter(h => h.prediction === "Legit").length / history.length) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>

                  {/* Risk Score Distribution */}
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 600 }}>📈 Risk Score Distribution</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                      <div style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>Critical (75-100%)</p>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#d32f2f" }}>
                          {history.filter(h => h.risk > 75).length}
                        </p>
                      </div>
                      <div style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>High (50-75%)</p>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#f57c00" }}>
                          {history.filter(h => h.risk > 50 && h.risk <= 75).length}
                        </p>
                      </div>
                      <div style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>Medium (25-50%)</p>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#fbc02d" }}>
                          {history.filter(h => h.risk > 25 && h.risk <= 50).length}
                        </p>
                      </div>
                      <div style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>Low (0-25%)</p>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#388e3c" }}>
                          {history.filter(h => h.risk <= 25).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Fraud Reasons */}
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 600 }}>⚠️ Top Fraud Indicators</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(() => {
                        const reasons = {};
                        history.forEach(h => {
                          const mainReason = h.reason?.split('|')[0]?.trim() || "Unknown";
                          reasons[mainReason] = (reasons[mainReason] || 0) + 1;
                        });
                        return Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([reason, count]) => (
                          <div key={reason} style={{ padding: "12px", backgroundColor: "#fff3e0", borderRadius: "6px", borderLeft: "4px solid #ff6f00" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "13px", fontWeight: 500 }}>{reason}</span>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#ff6f00" }}>{count} cases</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Average Risk Score by Channel */}
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 600 }}>📱 Average Risk by Channel</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                      {(() => {
                        const channels = {};
                        history.forEach(h => {
                          if (!channels[h.channel]) channels[h.channel] = { sum: 0, count: 0 };
                          channels[h.channel].sum += h.risk;
                          channels[h.channel].count += 1;
                        });
                        return Object.entries(channels).map(([channel, data]) => (
                          <div key={channel} style={{ padding: "12px", backgroundColor: "#f3f4f6", borderRadius: "6px" }}>
                            <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#666" }}>{channel}</p>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: (data.sum / data.count) > 50 ? "#d32f2f" : "#388e3c" }}>
                              {(data.sum / data.count).toFixed(1)}%
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Fraud Pattern Detection */}
                  <div style={{ marginTop: 24, padding: "16px", backgroundColor: "#f3e5f5", borderRadius: "8px", border: "1px solid #e1bee7" }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 600 }}>🔍 Fraud Pattern Detection</h4>
                    
                    {/* Rapid-Fire Transactions */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#4a148c" }}>⚡ Rapid-Fire Transactions</span>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff", backgroundColor: "#d32f2f", padding: "2px 8px", borderRadius: "4px" }}>
                          {fraudPatterns.rapidFire?.length || 0} detected
                        </span>
                      </div>
                      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                        Multiple transactions within 1 minute indicating potential fraud
                      </p>
                    </div>

                    {/* Same Amount Repeated */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#4a148c" }}>💰 Same Amount Repeated</span>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff", backgroundColor: "#f57c00", padding: "2px 8px", borderRadius: "4px" }}>
                          {fraudPatterns.sameAmount?.length || 0} detected
                        </span>
                      </div>
                      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                        Same transaction amount repeated >3 times (suspicious pattern)
                      </p>
                    </div>

                    {/* Same Timing Fraud */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#4a148c" }}>🕐 Same Timing Fraud</span>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff", backgroundColor: "#fbc02d", padding: "2px 8px", borderRadius: "4px" }}>
                          {fraudPatterns.sameTiming?.length || 0} detected
                        </span>
                      </div>
                      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                        Fraud occurring at same time of day (automated attacks)
                      </p>
                    </div>

                    {/* High-Risk Customers */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#4a148c" }}>👤 High-Risk Customers</span>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff", backgroundColor: "#388e3c", padding: "2px 8px", borderRadius: "4px" }}>
                          {Object.keys(fraudPatterns.sameCustomer || {}).filter(cid => (fraudPatterns.sameCustomer[cid] || 0) > 2).length} customers
                        </span>
                      </div>
                      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                        Customers with >2 fraud cases (repeat offenders)
                      </p>
                      {Object.entries(fraudPatterns.sameCustomer || {})
                        .filter(([_, count]) => count > 2)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([customerId, count]) => (
                          <div key={customerId} style={{ marginTop: "8px", padding: "8px", backgroundColor: "#fff", borderRadius: "4px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{customerId}</span>
                            <span style={{ fontWeight: "bold", color: "#d32f2f" }}>{count} cases</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full-width history below tabs */}
      <div className="history-card card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Prediction History ({history.length} entries)</h3>
          <select value={historyPageSize} onChange={(e) => { setHistoryPageSize(Number(e.target.value)); setHistoryPage(0); }} style={{ padding: "6px 8px", fontSize: "12px" }}>
            <option value={3}>3 rows</option>
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={15}>15 rows</option>
          </select>
          <div style={{ marginLeft: "auto" }}>
            <button className="secondary-btn" onClick={() => { setHistory([]); localStorage.removeItem("prediction_history"); }}>Clear History</button>
            <button className="secondary-btn" onClick={clearCsv} style={{ marginLeft: 8 }}>Remove CSV</button>
            <button className="primary-btn" onClick={exportHistoryCSV} style={{ marginLeft: 8 }}>Export CSV</button>
          </div>
        </div>

        {!history.length && <p className="muted">No predictions yet. Predictions from form/CSV appear here.</p>}
        {history.length > 0 && (
          <>
          {/* Advanced Filters Section */}
          <div style={{ marginBottom: 16, padding: "12px 14px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f1724" }}>🔍 Advanced Filters:</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {/* Prediction Type Filter */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#666", display: "block", marginBottom: "4px" }}>Prediction Type</label>
                <select 
                  value={historyFilters.predictionType}
                  onChange={(e) => setHistoryFilters({...historyFilters, predictionType: e.target.value})}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                >
                  <option value="all">All</option>
                  <option value="fraud">Fraud Only</option>
                  <option value="legit">Legit Only</option>
                </select>
              </div>

              {/* Risk Range Filter */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#666", display: "block", marginBottom: "4px" }}>Risk Range: {historyFilters.riskRange[0]}-{historyFilters.riskRange[1]}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={historyFilters.riskRange[1]}
                  onChange={(e) => setHistoryFilters({...historyFilters, riskRange: [0, Number(e.target.value)]})}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Channel Filter */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#666", display: "block", marginBottom: "4px" }}>Channel</label>
                <select 
                  value={historyFilters.channel}
                  onChange={(e) => setHistoryFilters({...historyFilters, channel: e.target.value})}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                >
                  <option value="all">All Channels</option>
                  <option value="ATM">ATM</option>
                  <option value="Online">Online</option>
                  <option value="POS">POS</option>
                </select>
              </div>

              {/* Customer ID Filter */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#666", display: "block", marginBottom: "4px" }}>Customer ID</label>
                <input 
                  type="text"
                  placeholder="e.g. CUST_101"
                  value={historyFilters.customerId}
                  onChange={(e) => setHistoryFilters({...historyFilters, customerId: e.target.value})}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#666", display: "block", marginBottom: "4px" }}>Date Range</label>
                <select 
                  value={historyFilters.dateRange}
                  onChange={(e) => setHistoryFilters({...historyFilters, dateRange: e.target.value})}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Reset Filters Button */}
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button 
                  onClick={() => setHistoryFilters({predictionType: "all", riskRange: [0, 100], channel: "all", customerId: "", dateRange: "all"})}
                  style={{ width: "100%", padding: "6px 12px", fontSize: "12px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontWeight: 500, color: "#374151" }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          <div style={{ maxHeight: "500px", overflowY: "auto", border: "1px solid #eef1f6", borderRadius: "8px" }}>
            <table className="history-table" style={{ tableLayout: "auto", width: "100%" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#f5f7fc", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <tr><th>#</th><th>Txn ID</th><th>Cust</th><th>Amt</th><th>Channel</th><th>Prediction</th><th>Risk</th><th>Time</th><th></th></tr>
              </thead>
              <tbody>
                {pagedHistory.map((h, idx) => {
                  const actualHistoryIdx = history.indexOf(h);
                  const displayNum = historyPage * historyPageSize + idx + 1;
                  const isAlertTransaction = selectedAlertTransactionId === h.transaction_id;
                  const hasAlert = alerts.some(a => a.transactionId === h.transaction_id);
                  return (
                    <React.Fragment key={h.transaction_id + actualHistoryIdx}>
                      <tr 
                        onClick={() => toggleExpand(actualHistoryIdx)} 
                        style={{ 
                          cursor: "pointer", 
                          transition: "all 200ms ease",
                          backgroundColor: isAlertTransaction ? "#fff8dc" : hasAlert ? "#fffacd" : "transparent",
                          borderLeft: isAlertTransaction ? "4px solid #ff6f00" : hasAlert ? "4px solid #ffc107" : "4px solid transparent",
                          padding: isAlertTransaction ? "4px 0" : "0"
                        }}
                      >
                        <td>{displayNum}</td>
                        <td style={{ fontWeight: hasAlert ? 600 : 400 }}>{h.transaction_id}</td>
                        <td>{h.customer_id}</td>
                        <td>₹{h.transaction_amount}</td>
                        <td>{h.channel}</td>
                        <td className={h.prediction === "Fraud" ? "fraud-text" : "legit-text"}>{h.prediction}</td>
                        <td>{h.risk}%</td>
                        <td>{h.time}</td>
                        <td>
                          {hasAlert && <span style={{ marginRight: "6px", backgroundColor: "#ff6f00", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold" }}>ALERT</span>}
                          <button className="small-danger" onClick={(ev) => { ev.stopPropagation(); removeHistory(actualHistoryIdx); }}>Delete</button>
                        </td>
                      </tr>

                      {expandedIdx === actualHistoryIdx && (
                        <tr className="expanded-row">
                          <td colSpan={9}>
                            <div style={{ paddingTop: 12 }}>
                              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: "14px" }}>AI Reasoning & Analysis:</div>
                              <div style={{ 
                                backgroundColor: "#f5f8ff", 
                                padding: "12px 14px", 
                                borderRadius: "6px", 
                                fontSize: "13px", 
                                lineHeight: "1.8", 
                                border: "1px solid #d0dff0",
                                marginBottom: 12,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                color: "#333",
                                maxHeight: "250px",
                                overflowY: "auto"
                              }}>
                                {typeof h.reason === 'string' ? h.reason : "No detailed reasoning available"}
                              </div>

                              {/* Associated Alerts */}
                              {alerts.filter(a => a.transactionId === h.transaction_id).length > 0 && (
                                <div style={{ 
                                  marginTop: 12, 
                                  padding: "10px 12px", 
                                  backgroundColor: "#fff3cd", 
                                  borderRadius: "6px", 
                                  border: "1px solid #ffc107"
                                }}>
                                  <div style={{ fontWeight: 700, color: "#856404", marginBottom: "8px", fontSize: "13px" }}>⚠️ Associated Alerts:</div>
                                  {alerts.filter(a => a.transactionId === h.transaction_id).map((alert, alertIdx) => (
                                    <div key={alertIdx} style={{ 
                                      padding: "6px 8px", 
                                      backgroundColor: "#ffedba", 
                                      borderRadius: "4px", 
                                      marginBottom: "4px",
                                      fontSize: "12px",
                                      color: "#333",
                                      borderLeft: "3px solid #ff6f00"
                                    }}>
                                      {alert.message}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ marginTop: 10, color: "#666", fontSize: "12px", paddingTop: 10, borderTop: "1px solid #e0e0e0" }}>
                                Account age: {ageFromDays(Number(h.account_age_days || 0))} • KYC: {h.kyc_verified ? "Yes" : "No"} • Amount: ₹{h.transaction_amount}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
            <div className="muted" style={{ fontSize: "12px" }}>
              Showing {historyPage * historyPageSize + 1} - {Math.min((historyPage + 1) * historyPageSize, history.length)} of {history.length}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="secondary-btn" onClick={() => setHistoryPage((p) => Math.max(0, p - 1))} disabled={historyPage === 0}>← Prev</button>
              <span style={{ padding: "6px 12px", fontSize: "12px" }}>Page {historyPage + 1} of {historyPageCount}</span>
              <button className="secondary-btn" onClick={() => setHistoryPage((p) => Math.min(historyPageCount - 1, p + 1))} disabled={historyPage >= historyPageCount - 1}>Next →</button>
            </div>
          </div>
          </>
        )}
      </div>

      {/* KYC modal */}
      {showKycModal && (
        <div className="modal-backdrop" onClick={() => setShowKycModal(false)}>
          <div className="kyc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Verify KYC for {form.customer_id || "(enter customer id)"}</h3>

            <label>Document Type</label>
            <select value={kycDoc.type} onChange={(e) => setKycDoc((s) => ({ ...s, type: e.target.value }))}>
              <option value="">Choose</option>
              <option value="Aadhaar">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="Passport">Passport</option>
            </select>

            <label>Document Number</label>
            <input value={kycDoc.number} onChange={(e) => setKycDoc((s) => ({ ...s, number: e.target.value }))} />

            <label>Upload Document (optional)</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setKycDoc((s) => ({ ...s, file: e.target.files?.[0] }))} />

            {kycError && <div className="error-text">{kycError}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="primary-btn" onClick={handleKycVerify}>Verify & Save</button>
              <button className="secondary-btn" onClick={() => setShowKycModal(false)}>Cancel</button>
            </div>

            <div className="muted" style={{ marginTop: 10 }}>Note: This simulates KYC locally. In production call your backend KYC verification endpoint and store securely.</div>
          </div>
        </div>
      )}
    </div>
  );
}
