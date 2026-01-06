from fastapi import APIRouter
import sqlite3

router = APIRouter()
DB_PATH = "src/database/transactions.db"

@router.get("/api/alerts")
def get_alerts(limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT * FROM fraud_alerts
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,)).fetchall()

    conn.close()
    return [dict(row) for row in rows]
