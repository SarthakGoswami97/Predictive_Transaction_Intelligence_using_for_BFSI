from fastapi import APIRouter, HTTPException
import sqlite3

from src.auth.utils import (
    hash_password,
    verify_password,
    create_token,
    decode_token
)
from src.utils.email_utils import send_email

DB_PATH = "src/database/users.db"

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    return sqlite3.connect(DB_PATH)

# ---------- REGISTER ----------
@router.post("/register")
def register(username:str, email: str, password: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    cursor.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?)",
        (username, email, hash_password(password))
    )
    conn.commit()
    conn.close()

    token = create_token({"email": email})
    verify_link = f"http://localhost:8000/auth/verify-email?token={token}"

    send_email(email, "Verify your email", verify_link)
    return {"message": "Verification email sent"}

# ---------- VERIFY EMAIL ----------
@router.get("/verify-email")
def verify_email(token: str):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET is_verified = 1 WHERE email = ?",
        (payload["email"],)
    )
    conn.commit()
    conn.close()

    return {"message": "Email verified successfully"}

# ---------- LOGIN ----------
@router.post("/login")
def login(email: str, password: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT password, is_verified FROM users WHERE email = ?",
        (email,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(password, row[0]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not row[1]:
        raise HTTPException(status_code=403, detail="Email not verified")

    token = create_token({"email": email})
    return {"access_token": token, "token_type": "bearer"}

# ---------- FORGOT PASSWORD ----------
@router.post("/forgot-password")
def forgot_password(email: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    token = create_token({"email": email}, expires_minutes=15)
    reset_link = f"http://localhost:8000/auth/reset-password?token={token}"

    send_email(email, "Reset Password", reset_link)
    conn.close()

    return {"message": "Password reset email sent"}

# ---------- RESET PASSWORD ----------
@router.post("/reset-password")
def reset_password(token: str, new_password: str):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET password = ? WHERE email = ?",
        (hash_password(new_password), payload["email"])
    )
    conn.commit()
    conn.close()

    return {"message": "Password reset successful"}
