// src/components/Profile.jsx
import React, { useEffect, useState } from "react";
import "./Profile.css";

/**
 * Profile Panel Component
 * Shows customer stats: trust rating, transaction counts, KYC status, account age, profile photo, documents
 */
function Profile({ isOpen, onClose, customerId }) {
  const [stats, setStats] = useState({
    trustRating: 0,
    totalTransactions: 0,
    fraudCount: 0,
    legitCount: 0,
    kycStatus: "Not Verified",
    kycType: null,
    accountAge: "N/A",
    accountAgeMs: 0,
    riskLevel: "Low",
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [verifications, setVerifications] = useState({
    email: false,
    phone: false,
    identity: false,
    address: false,
  });
  const [loading, setLoading] = useState(true);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [verificationModals, setVerificationModals] = useState({
    email: false,
    phone: false,
    identity: false,
    address: false,
  });
  const [verificationStep, setVerificationStep] = useState({
    email: 1,
    phone: 1,
    identity: 1,
    address: 1,
  });
  const [verificationDetails, setVerificationDetails] = useState({
    email: "",
    phone: "",
    identity: "",
    address: "",
  });
  const [verificationCodes, setVerificationCodes] = useState({
    email: "",
    phone: "",
    identity: "",
    address: "",
  });

  useEffect(() => {
    if (!isOpen || !customerId) return;
    
    setLoading(true);
    
    // Load prediction history
    const history = JSON.parse(localStorage.getItem("prediction_history") || "[]");
    const kycMap = JSON.parse(localStorage.getItem("kyc_verifications") || "{}");
    const profileData = JSON.parse(localStorage.getItem("profile_data") || "{}");
    const verificationData = JSON.parse(localStorage.getItem("verification_data") || "{}");

    // Filter history for this customer
    const customerHistory = history.filter((h) => String(h.customer_id) === String(customerId));
    
    // Calculate fraud/legit counts
    const fraudCount = customerHistory.filter((h) => h.prediction === "Fraud").length;
    const legitCount = customerHistory.filter((h) => h.prediction === "Legit").length;
    const totalTransactions = customerHistory.length;
    
    // Calculate trust rating (% of legitimate transactions)
    const trustRating = totalTransactions > 0 ? Math.round((legitCount / totalTransactions) * 100) : 0;
    
    // Determine risk level based on fraud percentage
    const fraudPercentage = totalTransactions > 0 ? (fraudCount / totalTransactions) * 100 : 0;
    let riskLevel = "Low";
    if (fraudPercentage > 50) riskLevel = "Critical";
    else if (fraudPercentage > 25) riskLevel = "High";
    else if (fraudPercentage > 10) riskLevel = "Medium";
    
    // Get KYC status
    const kycInfo = kycMap[customerId];
    const kycStatus = kycInfo ? "Verified" : "Not Verified";
    const kycType = kycInfo?.type || null;
    
    // Calculate account age from oldest transaction
    let accountAge = "N/A";
    let accountAgeMs = 0;
    if (customerHistory.length > 0) {
      const oldestTx = customerHistory[customerHistory.length - 1];
      const oldestDate = new Date(oldestTx.timestamp || oldestTx.time);
      const now = new Date();
      accountAgeMs = now - oldestDate;
      const days = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);
      if (years > 0) {
        accountAge = `${years}y ${months % 12}m`;
      } else if (months > 0) {
        accountAge = `${months}m ${days % 30}d`;
      } else {
        accountAge = `${days}d`;
      }
    }
    
    // Get profile photo
    const custProfileData = profileData[customerId];
    if (custProfileData?.photoUrl) {
      setProfilePhoto(custProfileData.photoUrl);
    }
    
    // Get documents and document verification status
    const docs = custProfileData?.documents || [];
    setDocuments(docs.map(d => ({
      ...d,
      verificationStatus: d.verificationStatus || "Pending"
    })));
    
    // Load verification data
    const custVerification = verificationData[customerId] || {
      email: false,
      phone: false,
      identity: false,
      address: false,
    };
    setVerifications(custVerification);
    
    // Load verification history
    const custHistory = custVerification.history || [];
    setVerificationHistory(custHistory);

    setStats({
      trustRating,
      totalTransactions,
      fraudCount,
      legitCount,
      kycStatus,
      kycType,
      accountAge,
      accountAgeMs,
      riskLevel,
    });

    setLoading(false);
  }, [isOpen, customerId]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const photoUrl = ev.target.result;
      setProfilePhoto(photoUrl);
      
      // Save to localStorage
      const profileData = JSON.parse(localStorage.getItem("profile_data") || "{}");
      profileData[customerId] = profileData[customerId] || {};
      profileData[customerId].photoUrl = photoUrl;
      localStorage.setItem("profile_data", JSON.stringify(profileData));
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const docUrl = ev.target.result;
      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        url: docUrl,
        uploadedAt: new Date().toLocaleString(),
      };
      
      const newDocs = [...documents, newDoc];
      setDocuments(newDocs);
      
      // Save to localStorage
      const profileData = JSON.parse(localStorage.getItem("profile_data") || "{}");
      profileData[customerId] = profileData[customerId] || {};
      profileData[customerId].documents = newDocs;
      localStorage.setItem("profile_data", JSON.stringify(profileData));
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (docId) => {
    const newDocs = documents.filter((d) => d.id !== docId);
    setDocuments(newDocs);
    
    // Save to localStorage
    const profileData = JSON.parse(localStorage.getItem("profile_data") || "{}");
    profileData[customerId] = profileData[customerId] || {};
    profileData[customerId].documents = newDocs;
    localStorage.setItem("profile_data", JSON.stringify(profileData));
  };

  const toggleVerification = (type) => {
    setVerificationModals({
      ...verificationModals,
      [type]: true,
    });
    setVerificationStep({
      ...verificationStep,
      [type]: 1,
    });
  };

  const handleSendVerificationCode = (type) => {
    const detail = verificationDetails[type];
    
    // Validate details based on type
    let isValid = false;
    let errorMsg = "Please enter a valid ";
    
    if (type === "email") {
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detail);
      errorMsg += "email address (e.g., user@example.com)";
    } else if (type === "phone") {
      isValid = /^\d{10}$/.test(detail.replace(/\D/g, ""));
      errorMsg += "phone number (10 digits, e.g., 9876543210)";
    } else if (type === "identity") {
      isValid = detail.trim().length >= 5;
      errorMsg += "identity number (minimum 5 characters)";
    } else if (type === "address") {
      isValid = detail.trim().length >= 15;
      errorMsg += "complete address (minimum 15 characters, e.g., 123 Main St, City, State 12345)";
    }

    if (!isValid) {
      alert(errorMsg);
      return;
    }

    // Move to step 2 (code/verification entry)
    setVerificationStep({
      ...verificationStep,
      [type]: 2,
    });
  };

  const handleVerificationSubmit = (type) => {
    const code = verificationCodes[type];
    
    if (code.trim().length < 3) {
      alert("Please enter a valid verification code");
      return;
    }

    const newVerifications = {
      ...verifications,
      [type]: true,
    };
    setVerifications(newVerifications);

    // Add to history
    const newHistory = [
      ...verificationHistory,
      {
        id: Date.now(),
        type,
        status: "Verified",
        timestamp: new Date().toLocaleString(),
        detail: verificationDetails[type],
        code: code,
      },
    ];
    setVerificationHistory(newHistory);

    // Save to localStorage
    const verificationData = JSON.parse(localStorage.getItem("verification_data") || "{}");
    verificationData[customerId] = {
      ...newVerifications,
      history: newHistory,
    };
    localStorage.setItem("verification_data", JSON.stringify(verificationData));

    // Close modal and reset
    setVerificationModals({
      ...verificationModals,
      [type]: false,
    });
    setVerificationCodes({
      ...verificationCodes,
      [type]: "",
    });
    setVerificationDetails({
      ...verificationDetails,
      [type]: "",
    });
    setVerificationStep({
      ...verificationStep,
      [type]: 1,
    });
  };

  const handleUnverify = (type) => {
    const newVerifications = {
      ...verifications,
      [type]: false,
    };
    setVerifications(newVerifications);

    // Add to history
    const newHistory = [
      ...verificationHistory,
      {
        id: Date.now(),
        type,
        status: "Unverified",
        timestamp: new Date().toLocaleString(),
      },
    ];
    setVerificationHistory(newHistory);

    // Save to localStorage
    const verificationData = JSON.parse(localStorage.getItem("verification_data") || "{}");
    verificationData[customerId] = {
      ...newVerifications,
      history: newHistory,
    };
    localStorage.setItem("verification_data", JSON.stringify(verificationData));
  };

  const closeVerificationModal = (type) => {
    setVerificationModals({
      ...verificationModals,
      [type]: false,
    });
    setVerificationCodes({
      ...verificationCodes,
      [type]: "",
    });
    setVerificationDetails({
      ...verificationDetails,
      [type]: "",
    });
    setVerificationStep({
      ...verificationStep,
      [type]: 1,
    });
  };

  const setDocumentVerificationStatus = (docId, status) => {
    const updatedDocs = documents.map((d) =>
      d.id === docId ? { ...d, verificationStatus: status } : d
    );
    setDocuments(updatedDocs);

    // Save to localStorage
    const profileData = JSON.parse(localStorage.getItem("profile_data") || "{}");
    profileData[customerId] = profileData[customerId] || {};
    profileData[customerId].documents = updatedDocs;
    localStorage.setItem("profile_data", JSON.stringify(profileData));
  };

  if (!isOpen) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>✕</button>
        
        {loading ? (
          <div className="profile-loading">Loading profile...</div>
        ) : (
          <>
            {/* Header with photo and basic info */}
            <div className="profile-header">
              <div className="profile-photo-section">
                <div className="profile-photo-container">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="profile-photo" />
                  ) : (
                    <div className="profile-photo-placeholder">📷</div>
                  )}
                </div>
                <label className="photo-upload-label">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>
              </div>
              
              <div className="profile-basic-info">
                <h2>Customer {customerId}</h2>
                <p className="profile-account-age">Account Age: <strong>{stats.accountAge}</strong></p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="profile-stats">
              {/* Trust Rating */}
              <div className="stat-card trust-card">
                <div className="stat-label">Trust Rating</div>
                <div className="stat-value">{stats.trustRating}%</div>
                <div className="stat-bar">
                  <div className="stat-fill" style={{ width: `${stats.trustRating}%` }}></div>
                </div>
              </div>

              {/* Total Transactions */}
              <div className="stat-card transaction-card">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{stats.totalTransactions}</div>
                <div className="stat-detail">transactions analyzed</div>
              </div>

              {/* Legitimate Transactions */}
              <div className="stat-card legit-card">
                <div className="stat-label">✓ Legitimate</div>
                <div className="stat-value">{stats.legitCount}</div>
                <div className="stat-percentage">{stats.totalTransactions > 0 ? Math.round((stats.legitCount / stats.totalTransactions) * 100) : 0}%</div>
              </div>

              {/* Fraud Transactions */}
              <div className="stat-card fraud-card">
                <div className="stat-label">✗ Fraud</div>
                <div className="stat-value">{stats.fraudCount}</div>
                <div className="stat-percentage">{stats.totalTransactions > 0 ? Math.round((stats.fraudCount / stats.totalTransactions) * 100) : 0}%</div>
              </div>

              {/* KYC Status */}
              <div className="stat-card kyc-card">
                <div className="stat-label">KYC Status</div>
                <div className={`kyc-status ${stats.kycStatus === "Verified" ? "verified" : "pending"}`}>
                  {stats.kycStatus === "Verified" ? "✓ " : "⏳ "}
                  {stats.kycStatus}
                </div>
                {stats.kycType && <div className="stat-detail">{stats.kycType}</div>}
              </div>

              {/* Risk Level */}
              <div className="stat-card risk-card">
                <div className="stat-label">Risk Level</div>
                <div className={`risk-badge risk-${stats.riskLevel.toLowerCase()}`}>
                  {stats.riskLevel}
                </div>
              </div>
            </div>

            {/* Verification Section */}
            <div className="profile-verification">
              <h3>🔐 Verification Status</h3>
              <div className="verification-grid">
                {Object.entries(verifications).map(([type, isVerified]) => (
                  <div key={type} className="verification-item">
                    <div className="verification-header">
                      <span className="verification-label">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Verification
                      </span>
                      <button
                        className={`verification-toggle ${isVerified ? "verified" : "unverified"}`}
                        onClick={() => toggleVerification(type)}
                        disabled={isVerified}
                      >
                        {isVerified ? "✓ Verified" : "✗ Unverified"}
                      </button>
                    </div>
                    <div className={`verification-status ${isVerified ? "verified" : "pending"}`}>
                      {isVerified
                        ? `✓ ${type.charAt(0).toUpperCase() + type.slice(1)} verified on ${new Date().toLocaleDateString()}`
                        : `⏳ Pending ${type.charAt(0).toLowerCase() + type.slice(1)} verification`}
                    </div>
                    {isVerified && (
                      <button
                        className="unverify-btn"
                        onClick={() => handleUnverify(type)}
                        style={{ marginTop: "8px", padding: "4px 8px", fontSize: "11px" }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Verification Modals */}
              {Object.entries(verificationModals).map(([type, isOpen]) =>
                isOpen ? (
                  <div key={`modal-${type}`} className="verification-modal-overlay">
                    <div className="verification-modal">
                      {verificationStep[type] === 1 ? (
                        <>
                          <h4>Verify {type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                          
                          {/* Verification Rules */}
                          <div style={{
                            padding: "12px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "6px",
                            marginBottom: "16px",
                            fontSize: "12px",
                            color: "#1565c0",
                            border: "1px solid #bbdefb"
                          }}>
                            <strong>📋 Verification Requirements:</strong>
                            {type === "email" && (
                              <div style={{ marginTop: "6px" }}>
                                • Valid email address format<br/>
                                • You'll receive an OTP code<br/>
                                • OTP expires in 10 minutes
                              </div>
                            )}
                            {type === "phone" && (
                              <div style={{ marginTop: "6px" }}>
                                • Valid 10-digit phone number<br/>
                                • SMS OTP will be sent to this number<br/>
                                • Ensure you have access to the phone<br/>
                                • OTP expires in 10 minutes
                              </div>
                            )}
                            {type === "identity" && (
                              <div style={{ marginTop: "6px" }}>
                                • Valid Government ID number (Aadhaar/PAN/DL)<br/>
                                • Minimum 5 characters required<br/>
                                • OTP will be sent for verification<br/>
                                • May take 24-48 hours for final approval
                              </div>
                            )}
                            {type === "address" && (
                              <div style={{ marginTop: "6px" }}>
                                • Complete residential address (minimum 15 chars)<br/>
                                • Must match bank/government records<br/>
                                • Format: Street, City, State, Postal Code<br/>
                                • Will be verified against official databases<br/>
                                • No OTP needed - direct verification
                              </div>
                            )}
                          </div>

                          <p style={{ marginBottom: "12px" }}>
                            {type === "address"
                              ? "Enter your complete address for verification"
                              : `Please enter your ${type} to receive a verification code`}
                          </p>
                          <input
                            type={type === "email" ? "email" : "text"}
                            placeholder={
                              type === "email"
                                ? "user@example.com"
                                : type === "phone"
                                ? "9876543210"
                                : type === "identity"
                                ? "AADHAAR/PAN/DL number"
                                : "123 Main St, City, State 12345"
                            }
                            value={verificationDetails[type]}
                            onChange={(e) =>
                              setVerificationDetails({
                                ...verificationDetails,
                                [type]: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "10px",
                              marginBottom: "16px",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              fontSize: "14px",
                              boxSizing: "border-box",
                            }}
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="primary-btn"
                              onClick={() => handleSendVerificationCode(type)}
                              style={{ flex: 1 }}
                            >
                              {type === "address" ? "Verify Address" : "Send Code"}
                            </button>
                            <button
                              className="secondary-btn"
                              onClick={() => closeVerificationModal(type)}
                              style={{ flex: 1 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {type === "address" ? (
                            <>
                              <h4>Address Verification</h4>
                              <div style={{
                                padding: "12px",
                                backgroundColor: "#f1f8e9",
                                borderRadius: "6px",
                                marginBottom: "16px",
                                fontSize: "12px",
                                color: "#558b2f",
                                border: "1px solid #c5e1a5"
                              }}>
                                <strong>✓ Address Received:</strong>
                                <div style={{ marginTop: "6px" }}>
                                  <strong>Submitted Address:</strong><br/>
                                  {verificationDetails[type]}<br/><br/>
                                  <strong>Verification Process:</strong><br/>
                                  ✓ Validating address format<br/>
                                  ✓ Cross-checking with postal database<br/>
                                  ✓ Verifying with official records<br/>
                                  Estimated time: 24-48 hours
                                </div>
                              </div>
                              <div style={{
                                padding: "12px",
                                backgroundColor: "#fff3e0",
                                borderRadius: "6px",
                                marginBottom: "16px",
                                fontSize: "12px",
                                color: "#e65100",
                                border: "1px solid #ffe0b2"
                              }}>
                                📌 <strong>Important:</strong> Address will be verified against government and bank records. Make sure it matches exactly.
                              </div>
                              <textarea
                                placeholder="Add any reference/notes (optional)"
                                value={verificationCodes[type]}
                                onChange={(e) =>
                                  setVerificationCodes({
                                    ...verificationCodes,
                                    [type]: e.target.value,
                                  })
                                }
                                style={{
                                  width: "100%",
                                  padding: "10px",
                                  marginBottom: "16px",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  fontSize: "14px",
                                  boxSizing: "border-box",
                                  minHeight: "60px",
                                  fontFamily: "inherit",
                                }}
                              />
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="primary-btn"
                                  onClick={() => handleVerificationSubmit(type)}
                                  style={{ flex: 1 }}
                                >
                                  Submit for Verification
                                </button>
                                <button
                                  className="secondary-btn"
                                  onClick={() => {
                                    setVerificationStep({
                                      ...verificationStep,
                                      [type]: 1,
                                    });
                                    setVerificationCodes({
                                      ...verificationCodes,
                                      [type]: "",
                                    });
                                  }}
                                  style={{ flex: 1 }}
                                >
                                  Back
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <h4>Enter Verification Code</h4>
                              <div style={{
                                padding: "12px",
                                backgroundColor: "#f0f7ff",
                                borderRadius: "6px",
                                marginBottom: "16px",
                                fontSize: "12px",
                                color: "#1976d2",
                                border: "1px solid #bbdefb"
                              }}>
                                <strong>📱 Code Sent:</strong>
                                <div style={{ marginTop: "6px" }}>
                                  {type === "email" && `✓ OTP sent to ${verificationDetails[type]}`}
                                  {type === "phone" && `✓ OTP sent to ${verificationDetails[type]}`}
                                  {type === "identity" && `✓ OTP sent for ID verification`}
                                  <br/>
                                  <br/>
                                  <strong>For Demo:</strong> Enter any 6-digit code (e.g., 123456)
                                </div>
                              </div>
                              <input
                                type="text"
                                placeholder="Enter 6-digit OTP code"
                                value={verificationCodes[type]}
                                onChange={(e) =>
                                  setVerificationCodes({
                                    ...verificationCodes,
                                    [type]: e.target.value,
                                  })
                                }
                                style={{
                                  width: "100%",
                                  padding: "10px",
                                  marginBottom: "16px",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  fontSize: "14px",
                                  boxSizing: "border-box",
                                }}
                              />
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="primary-btn"
                                  onClick={() => handleVerificationSubmit(type)}
                                  style={{ flex: 1 }}
                                >
                                  Verify
                                </button>
                                <button
                                  className="secondary-btn"
                                  onClick={() => {
                                    setVerificationStep({
                                      ...verificationStep,
                                      [type]: 1,
                                    });
                                    setVerificationCodes({
                                      ...verificationCodes,
                                      [type]: "",
                                    });
                                  }}
                                  style={{ flex: 1 }}
                                >
                                  Back
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : null
              )}

              {verificationHistory.length > 0 && (
                <div className="verification-history">
                  <h4>Verification History</h4>
                  <div className="history-list">
                    {verificationHistory.slice().reverse().map((entry) => (
                      <div key={entry.id} className="history-item">
                        <span className="history-type">{entry.type}</span>
                        <span className={`history-status ${entry.status.toLowerCase()}`}>
                          {entry.status}
                        </span>
                        <span className="history-time">{entry.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="profile-documents">
              <h3>📄 Documents Uploaded</h3>
              
              <label className="doc-upload-label">
                <span>📄 Upload Document</span>
                <input type="file" onChange={handleDocumentUpload} hidden />
              </label>

              {documents.length === 0 ? (
                <p className="no-documents">No documents uploaded yet</p>
              ) : (
                <div className="documents-list">
                  {documents.map((doc) => (
                    <div key={doc.id} className="document-item">
                      <div className="doc-info">
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-date">{doc.uploadedAt}</div>
                      </div>
                      <div className="doc-verification">
                        <select 
                          className={`doc-status ${doc.verificationStatus?.toLowerCase()}`}
                          value={doc.verificationStatus || "Pending"}
                          onChange={(e) => setDocumentVerificationStatus(doc.id, e.target.value)}
                        >
                          <option value="Pending">⏳ Pending</option>
                          <option value="Verified">✓ Verified</option>
                          <option value="Rejected">✗ Rejected</option>
                        </select>
                      </div>
                      <button 
                        className="doc-remove-btn"
                        onClick={() => removeDocument(doc.id)}
                        title="Remove document"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
