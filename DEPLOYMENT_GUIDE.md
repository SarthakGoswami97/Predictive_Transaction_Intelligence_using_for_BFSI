# Deployment Guide - Fraud Detection System

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Heroku Deployment](#heroku-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

- **Python**: 3.8+
- **Node.js**: 16+
- **npm**: 8+
- **Git**: 2.30+
- **Docker** (optional): 20.10+
- **PostgreSQL** (optional): 12+

---

## Local Development Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd Predictive-Transaction-Intelligence-using-for-BFSI-backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your settings
# GEMINI_API_KEY=your_key_here
# DATABASE_URL=sqlite:///transactions.db

# Run migrations (if using database)
# python -m alembic upgrade head

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd ..

# Install dependencies
npm install

# Create .env file
cp .env.example .env.local

# Update .env.local
# REACT_APP_BACKEND_URL=http://localhost:8000
# REACT_APP_USE_MOCK=false

# Start development server
npm start
```

Frontend will run at: `http://localhost:3000`

### 3. Verify Installation

- Backend health check: `http://localhost:8000/`
- Frontend: `http://localhost:3000/`
- API docs: `http://localhost:8000/docs`

---

## Docker Deployment

### Backend Docker Setup

#### 1. Create Dockerfile (Backend)

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2. Create Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: fraud_detection
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./Predictive-Transaction-Intelligence-using-for-BFSI-backend
    environment:
      DATABASE_URL: postgresql://admin:your_secure_password@postgres:5432/fraud_detection
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    volumes:
      - ./Predictive-Transaction-Intelligence-using-for-BFSI-backend:/app

  frontend:
    build: .
    environment:
      REACT_APP_BACKEND_URL: http://localhost:8000
      REACT_APP_USE_MOCK: "false"
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 3. Build and Run

```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop containers
docker-compose down
```

---

## Heroku Deployment

### Backend Deployment

```bash
# 1. Create Heroku app
heroku create fraud-detection-api

# 2. Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# 3. Set environment variables
heroku config:set GEMINI_API_KEY=your_key
heroku config:set JWT_SECRET=your_secret
heroku config:set ENVIRONMENT=production

# 4. Deploy
git push heroku main

# 5. Check logs
heroku logs --tail

# 6. View app
heroku open
```

### Frontend Deployment (Netlify)

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Create production build
npm run build

# 3. Deploy to Netlify
netlify deploy --prod --dir=build

# 4. Set environment variable
# Go to Netlify dashboard → Settings → Environment
# REACT_APP_BACKEND_URL = https://fraud-detection-api.herokuapp.com
```

---

## AWS Deployment

### Option 1: EC2 + Nginx

```bash
# 1. Launch EC2 instance (Ubuntu 20.04)

# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Install dependencies
sudo apt install -y python3-pip python3-venv nodejs npm nginx git

# 5. Clone repository
git clone https://github.com/your-repo.git
cd your-repo

# 6. Setup backend
cd Predictive-Transaction-Intelligence-using-for-BFSI-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 7. Create systemd service for backend
sudo nano /etc/systemd/system/fraud-api.service
```

**fraud-api.service:**
```ini
[Unit]
Description=Fraud Detection API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/fraud-detection-backend
ExecStart=/home/ubuntu/fraud-detection-backend/venv/bin/gunicorn -w 4 -b 0.0.0.0:8000 main:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 8. Start service
sudo systemctl daemon-reload
sudo systemctl start fraud-api
sudo systemctl enable fraud-api

# 9. Setup frontend
cd ../
npm install
npm run build

# 10. Configure Nginx
sudo nano /etc/nginx/sites-available/fraud-detection
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /home/ubuntu/fraud-detection/build;
        try_files $uri /index.html;
    }
}
```

```bash
# 11. Enable and start Nginx
sudo ln -s /etc/nginx/sites-available/fraud-detection /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 12. Setup SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Option 2: ECS (Recommended)

1. Push Docker image to ECR
2. Create ECS cluster
3. Create task definition
4. Create service
5. Configure load balancer

---

## Environment Configuration

### Backend .env Template

```dotenv
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fraud_db
# or for SQLite:
# DATABASE_URL=sqlite:///fraud.db

# API Keys
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret_key

# Server
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
```

### Frontend .env.local Template

```dotenv
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_USE_MOCK=false
```

---

## Monitoring & Logging

### Application Monitoring

```python
# Add to main.py for monitoring
from prometheus_client import Counter, Histogram
import time

# Metrics
prediction_counter = Counter('predictions_total', 'Total predictions', ['status'])
prediction_latency = Histogram('prediction_latency_seconds', 'Prediction latency')

@app.middleware("http")
async def add_metrics(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    prediction_latency.observe(duration)
    return response
```

### Log Aggregation Setup

```bash
# Using ELK Stack
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.14.0
docker pull docker.elastic.co/kibana/kibana:7.14.0

# Configure logstash to forward application logs
```

### Health Checks

```bash
# Kubernetes health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }
```

---

## Troubleshooting

### Common Issues

**1. CORS Error**
```
Solution: Update CORS_ORIGINS in backend .env
```

**2. Database Connection Failed**
```
Solution: Verify DATABASE_URL and ensure database service is running
```

**3. API Key Invalid**
```
Solution: Check GEMINI_API_KEY in environment variables
```

**4. Port Already in Use**
```
Solution: Change port in application or kill process using port
```

---

## Performance Optimization

```python
# Enable caching
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend
from redis import aioredis

FastAPICache2.init(RedisBackend(aioredis.create_redis_pool("redis://localhost")), prefix="fastapi-cache")

# Add model caching
@app.get("/metrics")
@cached(namespace="metrics", expire=3600)
async def get_metrics():
    # Returns cached for 1 hour
    pass
```

---

## Security Checklist

- [ ] Change default credentials
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall rules
- [ ] Enable rate limiting
- [ ] Setup API key rotation
- [ ] Enable request logging
- [ ] Setup monitoring & alerts
- [ ] Regular security updates
- [ ] Database backups
- [ ] API authentication enabled

---

## Support & Documentation

- **API Docs**: `/docs` (Swagger UI)
- **GitHub**: [Your Repository URL]
- **Issues**: [GitHub Issues]

---

**Last Updated**: January 2026
**Maintained By**: BFSI Predictive AI Team
