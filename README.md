# 🔐 BFSI Predictive Fraud Detection System

An AI-powered fraud detection dashboard for Banking, Financial Services, and Insurance (BFSI) sector. This system uses machine learning models and LLM-based explanations to detect and analyze fraudulent transactions.

## 🚀 Features

- **Dashboard** - Real-time fraud statistics, charts, and analytics
- **Fraud Prediction** - Single transaction and bulk CSV prediction
- **Model Metrics** - Accuracy, Precision, Recall, F1-Score visualization
- **Transaction History** - Searchable, filterable transaction logs
- **KYC Verification** - Built-in Aadhaar/PAN verification
- **Dark/Light Theme** - Toggle between themes
- **Responsive Design** - Works on desktop and mobile

## 📦 Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | Frontend framework |
| Chart.js | Data visualization |
| Framer Motion | Animations |
| Axios | API communication |
| React Toastify | Notifications |

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/SarthakGoswami97/bfsi_predictive_ai.git
   cd bfsi_predictive_ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your settings
   # REACT_APP_BACKEND_URL=http://localhost:8000
   # REACT_APP_USE_MOCK=true
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   Opens at [http://localhost:3001](http://localhost:3001)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API URL | `http://localhost:8000` |
| `REACT_APP_USE_MOCK` | Use mock data (no backend) | `true` |

### Switching to Real Backend

1. Set up your Flask/FastAPI backend
2. Update `.env`:
   ```
   REACT_APP_BACKEND_URL=http://your-backend-url:8000
   REACT_APP_USE_MOCK=false
   ```
3. Restart the app

## 📡 API Endpoints (Expected from Backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict` | POST | Fraud prediction |
| `/api/explain` | POST | LLM explanation |
| `/api/metrics` | GET | Model performance metrics |
| `/api/auth/login` | POST | User authentication |
| `/api/history` | GET | Transaction history |

### Sample Request/Response

**POST /api/predict**
```json
// Request
{
  "customer_id": "C001",
  "transaction_amount": 50000,
  "channel": "Online",
  "account_age_days": 180,
  "kyc_verified": 1
}

// Response
{
  "transaction_id": "TXN12345",
  "prediction": "Fraud",
  "confidence": 0.85,
  "explanation": "High amount and unusual channel detected"
}
```

## 👤 Default Login

```
Email: admin@gmail.com
Password: admin123
```

## 📁 Project Structure

```
src/
├── api.js              # API configuration (mock/real)
├── App.js              # Main app component
├── ThemeContext.jsx    # Dark/Light theme provider
├── utils/
│   └── toast.js        # Notification utilities
├── components/
│   ├── Dashboard.jsx   # Main dashboard with charts
│   ├── Navbar.jsx      # Top navigation
│   ├── Sidebar.jsx     # Side navigation
│   ├── Profile.jsx     # User profile panel
│   └── Loader.jsx      # Loading spinners
└── pages/
    ├── Login.jsx       # Login page
    ├── Predict.jsx     # Fraud prediction page
    ├── Metrics.jsx     # Model metrics page
    └── History.jsx     # Transaction history page
```

## 🏗️ Building for Production

```bash
npm run build
```

The build output will be in the `build/` folder, ready for deployment.

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload build/ folder to Netlify
```

## 📊 Milestones

- [x] **Milestone 1**: Data preprocessing and initial setup
- [x] **Milestone 2**: ML model development
- [x] **Milestone 3**: LLM integration for explanations
- [ ] **Milestone 4**: Full integration and deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is for educational purposes as part of Infosys training.

---

**Built with ❤️ for BFSI Fraud Detection**
