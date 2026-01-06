from fastapi import APIRouter, HTTPException
import os, joblib, sqlite3
import pandas as pd

from src.rules.rule_engine import apply_rules
from src.llm.gemini_client import generate_explanation

router = APIRouter()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PATH = os.path.join(BASE_DIR, "src", "ml", "fraud_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "src", "ml", "scaler.pkl")
DB_PATH = os.path.join(BASE_DIR, "src", "database", "transactions.db")

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

@router.post("/api/predict")
def predict_transaction(data: dict):
    try:
        df = pd.DataFrame([data])

        # -----------------------------
        # Encode categorical features
        # -----------------------------
        kyc_map = {"Yes": 1, "No": 0, "Y": 1, "N": 0, True: 1, False: 0}
        df["kyc_verified"] = df["kyc_verified"].map(kyc_map)

        # -----------------------------
        # Select model features ONLY
        # -----------------------------
        feature_cols = [
            "kyc_verified",
            "account_age_days",
            "transaction_amount",
            "hour",
            "weekday",
            "month",
            "is_high_value"
        ]

        features = df[feature_cols]

        # Ensure all numeric
        features = features.apply(pd.to_numeric, errors="coerce")

        if features.isnull().any().any():
            raise HTTPException(
                status_code=400,
                detail="Invalid or missing numeric values in input"
            )

        # -----------------------------
        # ML Prediction
        # -----------------------------
        scaled = scaler.transform(features)
        prediction = int(model.predict(scaled)[0])
        risk_score = float(model.predict_proba(scaled)[0][1])

        # -----------------------------
        # Rule Engine
        # -----------------------------
        rules_triggered = apply_rules(data)

        final_decision = prediction == 1 or len(rules_triggered) > 0

        # -----------------------------
        # LLM Explanation (Gemini)
        # -----------------------------
        explanation = generate_explanation(
            transaction=data,
            prediction="Fraud" if final_decision else "Legit",
            risk_score=risk_score,
            rules_triggered=rules_triggered
        )

        # -----------------------------
        # Store fraud alert
        # -----------------------------
        if final_decision:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO fraud_alerts
                (transaction_id, customer_id, risk_score, reason)
                VALUES (?, ?, ?, ?)
            """, (
                data.get("transaction_id"),
                data.get("customer_id"),
                risk_score,
                ", ".join(rules_triggered) or "ML model flagged transaction"
            ))
            conn.commit()
            conn.close()

        return {
            "transaction_id": data.get("transaction_id"),
            "prediction": "Fraud" if final_decision else "Legit",
            "risk_score": risk_score,
            "rules_triggered": rules_triggered,
            "explanation": explanation
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
