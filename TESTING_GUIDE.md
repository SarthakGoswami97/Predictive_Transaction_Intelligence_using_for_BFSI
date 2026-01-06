# End-to-End Testing Guide - Milestone 4

## Overview
This guide provides step-by-step instructions to test the complete fraud detection system from frontend to backend.

---

## Prerequisites

✅ **Installations Required:**
1. Node.js v16+ and npm
2. Python 3.8+ and pip
3. Postman or Insomnia (for API testing)
4. Git
5. Virtual Environment (conda or venv)

---

## Part 1: Backend Setup & Testing

### Step 1: Start Backend Server

```bash
# Navigate to backend folder
cd Predictive-Transaction-Intelligence-using-for-BFSI-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
# Create .env file in backend root:
# GEMINI_API_KEY=your_api_key_here
# DATABASE_URL=sqlite:///transactions.db

# Start backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 2: Test Backend APIs with Postman

#### Test 1: Health Check
```
GET http://localhost:8000/
```
**Expected Response:**
```json
{
  "message": "Backend Running"
}
```

#### Test 2: User Registration
```
POST http://localhost:8000/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123!"
}
```
**Expected Response:** 200 OK with verification email message

#### Test 3: User Login
```
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```
**Expected Response:** 200 OK with `access_token`

#### Test 4: Legitimate Transaction Prediction
```
POST http://localhost:8000/api/predict
Content-Type: application/json

{
  "transaction_id": "TXN_LEGIT_001",
  "customer_id": "CUST_001",
  "transaction_amount": 5000,
  "account_age_days": 730,
  "kyc_verified": "Yes",
  "channel": "Online",
  "hour": 14,
  "weekday": 2,
  "month": 1,
  "is_high_value": 0
}
```
**Expected Response:**
```json
{
  "transaction_id": "TXN_LEGIT_001",
  "prediction": "Legit",
  "confidence": 0.85,
  "risk_score": 0.15,
  "explanation": "Transaction appears normal...",
  "rules_triggered": [],
  "status": "success"
}
```

#### Test 5: Fraudulent Transaction Prediction
```
POST http://localhost:8000/api/predict
Content-Type: application/json

{
  "transaction_id": "TXN_FRAUD_001",
  "customer_id": "CUST_002",
  "transaction_amount": 500000,
  "account_age_days": 30,
  "kyc_verified": "No",
  "channel": "Mobile",
  "hour": 3,
  "weekday": 0,
  "month": 1,
  "is_high_value": 1
}
```
**Expected Response:**
```json
{
  "transaction_id": "TXN_FRAUD_001",
  "prediction": "Fraud",
  "confidence": 0.92,
  "risk_score": 0.92,
  "explanation": "High risk detected. Multiple fraud indicators...",
  "rules_triggered": [
    "Unusual amount for customer",
    "Transaction outside normal hours"
  ],
  "status": "success"
}
```

#### Test 6: Get Metrics
```
GET http://localhost:8000/api/metrics
```
**Expected Response:**
```json
{
  "accuracy": 93,
  "precision": 90,
  "recall": 88,
  "f1_score": 89,
  "auc": 92,
  "total_predictions": 1500,
  "fraud_detected": 220,
  "legit_detected": 1280
}
```

#### Test 7: Get Transaction History
```
GET http://localhost:8000/api/history
```
**Expected Response:** Array of transaction records

#### Test 8: Get Active Alerts
```
GET http://localhost:8000/api/alerts
```
**Expected Response:** Array of fraud alerts

---

## Part 2: Frontend Setup & Testing

### Step 1: Start Frontend Server

```bash
# Navigate to frontend folder
cd ..

# Install dependencies
npm install

# Create .env file
# REACT_APP_BACKEND_URL=http://localhost:8000
# REACT_APP_USE_MOCK=false

# Start development server
npm start
```

**Expected Output:**
```
React app running on http://localhost:3000
```

---

## Part 3: End-to-End User Flow Testing

### Scenario 1: User Registration & Login

**Steps:**
1. ✅ Open browser → http://localhost:3000
2. ✅ Click "Sign Up" / "Register"
3. ✅ Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `TestPass123!`
4. ✅ Click "Register"
5. ✅ Wait for verification email
6. ✅ Go back to login
7. ✅ Enter email and password
8. ✅ Click "Login"

**Expected Result:**
- ✅ User redirected to Dashboard
- ✅ User info displayed in Navbar
- ✅ localStorage has `auth_token`

---

### Scenario 2: Make a Prediction (Legitimate Transaction)

**Steps:**
1. ✅ Login to dashboard
2. ✅ Navigate to "Prediction" tab
3. ✅ Fill form:
   - Transaction ID: `TXN001`
   - Customer ID: `CUST001`
   - Transaction Amount: `5000`
   - KYC Verified: `Yes`
   - Channel: `Online`
   - Hour: `14`
   - Day: `Tuesday`
   - High Value: `No`
4. ✅ Click "Analyze Transaction"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Success notification shows
- ✅ Result card appears with:
  - Prediction: **Legit** (green badge)
  - Confidence: ~85%
  - Risk Score bar showing low risk
  - AI explanation from Gemini
- ✅ Transaction saved to history

---

### Scenario 3: Make a Prediction (High Risk Transaction)

**Steps:**
1. ✅ Still in Prediction tab
2. ✅ Fill form:
   - Transaction ID: `TXN_RISK_001`
   - Customer ID: `CUST_RISK`
   - Transaction Amount: `500000`
   - Account Age: `30`
   - KYC Verified: `No`
   - Channel: `Mobile`
   - Hour: `3`
   - Day: `Monday`
   - High Value: `Yes`
3. ✅ Click "Analyze Transaction"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Success notification shows
- ✅ Result card appears with:
  - Prediction: **Fraud** (red badge)
  - Confidence: ~90%
  - Risk Score bar showing high risk (red)
  - AI explanation highlighting fraud indicators
  - Rules triggered list displayed
- ✅ Transaction saved to history

---

### Scenario 4: Check Transaction History

**Steps:**
1. ✅ Click on "History" tab
2. ✅ View transaction table with columns:
   - Transaction ID
   - Customer ID
   - Prediction
   - Confidence
   - Risk Score
   - Timestamp

**Expected Result:**
- ✅ Both previous predictions visible in table
- ✅ First prediction shows "Legit" badge (green)
- ✅ Second prediction shows "Fraud" badge (red)
- ✅ Risk scores displayed correctly with bars
- ✅ Timestamps show transaction times

---

### Scenario 5: Check Performance Metrics

**Steps:**
1. ✅ Click on "Performance" tab
2. ✅ View metric cards:
   - Accuracy
   - Precision
   - Recall
   - F1-Score
   - AUC-ROC
   - Total Predictions

**Expected Result:**
- ✅ All metrics display with values
- ✅ Progress bars show metric percentages
- ✅ Values match backend metrics API response
- ✅ Cards animate on load

---

### Scenario 6: Check Dashboard Overview

**Steps:**
1. ✅ Click on "Overview" tab
2. ✅ View dashboard with:
   - Transaction stats cards
   - Line charts
   - Pie charts
   - Bar charts

**Expected Result:**
- ✅ All charts display properly
- ✅ Stats cards show aggregated data
- ✅ Charts are interactive (hover shows tooltips)
- ✅ No console errors

---

## Part 4: Error Handling Testing

### Test 1: Invalid Prediction Input

**Steps:**
1. ✅ Go to Prediction tab
2. ✅ Leave Transaction ID blank
3. ✅ Click "Analyze Transaction"

**Expected Result:**
- ✅ Error notification appears: "Please fill in Transaction ID and Customer ID"
- ✅ Form not submitted

### Test 2: Invalid Transaction Amount

**Steps:**
1. ✅ Go to Prediction tab
2. ✅ Fill all fields correctly
3. ✅ Enter "abc" in Transaction Amount
4. ✅ Click "Analyze Transaction"

**Expected Result:**
- ✅ Error notification appears: "Please enter a valid transaction amount"

### Test 3: Backend Unavailable

**Steps:**
1. ✅ Stop backend server (Ctrl+C)
2. ✅ Go to Prediction tab
3. ✅ Try to make prediction
4. ✅ Wait for timeout

**Expected Result:**
- ✅ Error notification appears
- ✅ User can retry
- ✅ No app crash

### Test 4: Network Error Recovery

**Steps:**
1. ✅ Disable internet
2. ✅ Try to make prediction
3. ✅ Re-enable internet
4. ✅ Retry prediction

**Expected Result:**
- ✅ First attempt: Network error message
- ✅ Second attempt: Prediction succeeds

---

## Part 5: API Response Validation

### Checklist

- [ ] Prediction endpoint returns correct JSON structure
- [ ] Confidence field (0-1) present in response
- [ ] Risk score matches confidence
- [ ] Explanation text is meaningful (from LLM)
- [ ] Rules triggered array populated when fraud detected
- [ ] Metrics endpoint returns all required fields
- [ ] History endpoint returns array of transactions
- [ ] Alerts endpoint returns alert objects
- [ ] Error responses have proper HTTP status codes
- [ ] CORS headers present in responses

---

## Part 6: Performance Testing

### Load Test (Using Apache Bench)

```bash
# Test prediction endpoint with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:8000/api/metrics

# Expected: Response time < 100ms per request
```

### Database Query Test

```bash
# Monitor backend logs during high traffic
# Look for slow query warnings
```

---

## Part 7: Security Testing

### Checklist

- [ ] JWT tokens expire correctly
- [ ] Invalid tokens are rejected (401)
- [ ] CORS only allows whitelisted origins
- [ ] SQL injection attempts blocked
- [ ] XSS prevention working (sanitized outputs)
- [ ] HTTPS redirected in production
- [ ] API keys not exposed in frontend code
- [ ] Sensitive data not logged

---

## Part 8: Browser Compatibility Testing

Test on:
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Part 9: Responsive Design Testing

Test layouts on:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Debugging Tips

### Backend Issues

```bash
# Check logs
tail -f backend.log

# Test specific endpoint
curl -X GET http://localhost:8000/api/metrics

# Check database
sqlite3 transactions.db ".tables"

# Check environment variables
echo $GEMINI_API_KEY
```

### Frontend Issues

```bash
# Open browser console
F12 → Console tab

# Check network requests
F12 → Network tab

# Check localStorage
F12 → Application → LocalStorage
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot POST /api/predict" | Backend not running; check port 8000 |
| CORS error in console | Add frontend URL to backend CORS config |
| Predictions take 30+ seconds | LLM API latency; check Gemini API status |
| History not loading | Check localStorage in DevTools |
| Charts not showing | Check if CSV data is uploaded |
| "401 Unauthorized" | Token expired; re-login |

---

## Test Result Summary Template

```markdown
## Test Results - [Date]

### Backend API Tests
- [ ] Health Check: PASS
- [ ] Registration: PASS
- [ ] Login: PASS
- [ ] Legitimate Prediction: PASS
- [ ] Fraudulent Prediction: PASS
- [ ] Metrics: PASS
- [ ] History: PASS
- [ ] Alerts: PASS

### Frontend Tests
- [ ] Login flow: PASS
- [ ] Prediction form: PASS
- [ ] History display: PASS
- [ ] Performance metrics: PASS
- [ ] Error handling: PASS
- [ ] Responsive design: PASS

### End-to-End Flow
- [ ] Complete user journey: PASS

### Issues Found
- None

### Recommendations
- System ready for deployment
```

---

## Deployment Checklist

After passing all tests:

- [ ] All tests documented
- [ ] No console errors in frontend
- [ ] No backend errors in logs
- [ ] Performance metrics acceptable
- [ ] Security tests passed
- [ ] Browser compatibility verified
- [ ] Responsive design tested
- [ ] Ready for production deployment

---

**Next Steps:** If all tests pass, proceed to deployment guide.
