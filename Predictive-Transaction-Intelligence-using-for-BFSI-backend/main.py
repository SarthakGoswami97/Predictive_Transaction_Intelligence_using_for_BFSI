from dotenv import load_dotenv
import os

load_dotenv()
from fastapi import FastAPI
from src.api.transactions import router as transaction_router
from src.preprocessing.cleaning_pipeline import pipeline
from src.preprocessing.train_test_split import create_train_test_split
from src.database.db import create_fraud_alerts_table, create_transactions_table, insert_processed_data
from src.api.predict import router as predict_router
from src.api.metrics import router as metrics_router
from src.api.alerts import router as alert_router
from src.ml.train_model import train
from src.api.auth import router as auth_router



app = FastAPI(title="Transaction API Backend")

# Register API routes
app.include_router(auth_router)
app.include_router(transaction_router)
app.include_router(predict_router)
app.include_router(metrics_router)
app.include_router(alert_router)


@app.get("/")
def home():
    return {"message": "Backend Running"}


@app.on_event("startup")
def run_pipeline_on_start():
    print("Running preprocessing pipeline...")
    pipeline()
    print("Pipeline finished!")
    create_train_test_split()
    
    create_transactions_table()
    create_fraud_alerts_table()
    insert_processed_data()
    train()
    

