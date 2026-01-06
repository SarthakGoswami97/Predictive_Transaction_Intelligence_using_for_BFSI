from fastapi import APIRouter
import sqlite3
import pandas as pd

router = APIRouter()
DB_PATH = "src/database/transactions.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  
    return conn


@router.get("/api/transactions")
def get_transactions(limit: int = 50, offset: int = 0, fraud_only: bool = False):

    conn = get_connection()

    base_query = "SELECT * FROM transactions"
    
    if fraud_only:
        base_query += " WHERE is_fraud = 1"

    base_query += " ORDER BY timestamp DESC"
    base_query += f" LIMIT {limit} OFFSET {offset}"

    df = pd.read_sql_query(base_query, conn)
    conn.close()

    # Convert to list of dicts
    return df.to_dict(orient="records")
