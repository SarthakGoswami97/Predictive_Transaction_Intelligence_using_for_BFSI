# src/database/db.py
import sqlite3
import pandas as pd
import os

DB_PATH = "src/database/transactions.db"


def create_transactions_table():
    os.makedirs("src/database", exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT,
            customer_id TEXT,
            kyc_verified INTEGER,
            account_age_days INTEGER,
            transaction_amount REAL,
            channel TEXT,
            timestamp TEXT,
            is_fraud INTEGER,
            hour INTEGER,
            weekday INTEGER,
            month INTEGER,
            is_high_value INTEGER
        )
    """)

    conn.commit()
    conn.close()
    print("Transactions table ready.")


def insert_processed_data(csv_path="data/processed/transactions_processed.csv"):
    df = pd.read_csv(csv_path)

    conn = sqlite3.connect(DB_PATH)
    df.to_sql("transactions", conn, if_exists="append", index=False)

    conn.close()
    print("Processed data inserted successfully.")

def create_fraud_alerts_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fraud_alerts (
            alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT,
            customer_id TEXT,
            risk_score REAL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print("Fraud alerts table ready.")


def insert_processed_data(csv_path="data/processed/transactions_processed.csv"):
    df = pd.read_csv(csv_path)
    conn = sqlite3.connect(DB_PATH)
    df.to_sql("transactions", conn, if_exists="append", index=False)
    conn.close()
