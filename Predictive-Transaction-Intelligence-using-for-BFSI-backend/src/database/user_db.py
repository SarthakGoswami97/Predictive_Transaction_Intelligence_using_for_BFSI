import sqlite3
import os

DB_PATH = "src/database/users.db"

def create_user_db():
    os.makedirs("src/database", exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_verified INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()
    print("User database ready.")

if __name__ == "__main__":
    create_user_db()
