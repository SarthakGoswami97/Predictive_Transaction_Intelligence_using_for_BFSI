# Quick Reference Guide - Fraud Detection System

## 🚀 Start the System

### Option 1: Mock Data (No Backend Required)
```bash
npm start
# Open http://localhost:3000
# Login: admin@gmail.com / admin123
```

### Option 2: Full Stack
```bash
# Terminal 1: Backend
cd Predictive-Transaction-Intelligence-using-for-BFSI-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
npm install && REACT_APP_USE_MOCK=false npm start
```

### Option 3: Docker
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

---

## 📖 Documentation Map

| Need | Document | Link |
|------|----------|------|
| **Overview** | README.md | [Link](README.md) |
| **API Details** | API_DOCUMENTATION.md | [Link](API_DOCUMENTATION.md) |
| **How to Test** | TESTING_GUIDE.md | [Link](TESTING_GUIDE.md) |
| **How to Deploy** | DEPLOYMENT_GUIDE.md | [Link](DEPLOYMENT_GUIDE.md) |
| **Presentation** | PRESENTATION_GUIDE.md | [Link](PRESENTATION_GUIDE.md) |
| **Technical Info** | TECHNICAL_REPORT.md | [Link](TECHNICAL_REPORT.md) |
| **Summary** | MILESTONE_4_SUMMARY.md | [Link](MILESTONE_4_SUMMARY.md) |

---

## 🔧 Common Commands

### Frontend Development
```bash
npm install              # Install dependencies
npm start               # Start dev server (port 3000)
npm build               # Build for production
npm test                # Run tests
npm run lint            # Check code quality
```

### Backend Development
```bash
python -m venv venv     # Create virtual environment
source venv/bin/activate # Activate (Windows: venv\Scripts\activate)
pip install -r requirements.txt  # Install dependencies
python -m uvicorn main:app --reload  # Start dev server
python -m pytest        # Run tests
```

### Docker Operations
```bash
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
docker-compose logs -f  # View logs
docker ps               # List containers
docker exec -it <container> bash  # Enter container
```

### Git Workflow
```bash
git status              # Check changes
git add .               # Stage changes
git commit -m "Message" # Commit
git push                # Push to GitHub
git pull                # Pull from GitHub
```

---

## 🔐 Default Credentials

```
Email:    admin@gmail.com
Password: admin123
```

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| ML Accuracy | 93% |
| Prediction Speed | 2.5 seconds |
| False Positive Rate | 10% |
| Detection Rate | 88% |
| Uptime | 99.9% |

---

## 🧪 Quick Tests

### Test Legitimate Transaction
```json
{
  "transaction_id": "TXN001",
  "customer_id": "CUST001",
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
**Expected**: Fraud = 0.15 (LOW RISK)

### Test Fraudulent Transaction
```json
{
  "transaction_id": "TXN002",
  "customer_id": "CUST002",
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
**Expected**: Fraud = 0.87 (HIGH RISK)

---

## 🐛 Troubleshooting

| Error | Fix |
|-------|-----|
| Port 3000 in use | `PORT=3001 npm start` |
| Backend not responding | Check if running on port 8000 |
| CORS error | Update `REACT_APP_BACKEND_URL` in .env |
| Database locked | Restart backend service |
| Slow predictions | Check Gemini API quota |

---

## 📁 Important Files

```
Frontend:
├── src/components/DashboardEnhanced.jsx  (Main dashboard)
├── src/components/PredictionForm.jsx    (Prediction form)
├── src/api.js                           (API config)
└── .env                                 (Environment vars)

Backend:
├── src/api/predict.py                   (Prediction endpoint)
├── src/ml/fraud_model.pkl               (ML model)
├── src/llm/gemini_client.py             (LLM integration)
└── main.py                              (FastAPI app)

Config:
├── docker-compose.yml                   (Docker setup)
├── requirements.txt                     (Dependencies)
└── package.json                         (NPM dependencies)
```

---

## 🔗 Useful Links

- **GitHub Repo**: https://github.com/SarthakGoswami97/Predictive_Transaction_Intelligence_using_for_BFSI
- **FastAPI Docs**: http://localhost:8000/docs (when running)
- **React Docs**: https://react.dev
- **Gemini API**: https://ai.google.dev

---

## 📞 Support

- **Issues**: Create a GitHub issue
- **Email**: sarthak.goswami97@example.com
- **Questions**: Check documentation first

---

## ✅ Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Backend running successfully
- [ ] Frontend accessible
- [ ] API endpoints tested
- [ ] Database initialized
- [ ] SSL certificates ready (production)
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Documentation reviewed

---

## 🎯 Next Steps

1. **Local Testing**: Run system locally with TESTING_GUIDE.md
2. **Configuration**: Set up .env files with your API keys
3. **Deployment**: Follow DEPLOYMENT_GUIDE.md for your platform
4. **Monitoring**: Set up logging and alerts
5. **Optimization**: Fine-tune based on production metrics

---

## 📝 Notes

- System uses SQLite for local development
- Production should use PostgreSQL
- Gemini API requires valid credentials
- CORS must be configured for frontend URL
- JWT tokens expire in 30 minutes

---

**Happy deploying! 🚀**
