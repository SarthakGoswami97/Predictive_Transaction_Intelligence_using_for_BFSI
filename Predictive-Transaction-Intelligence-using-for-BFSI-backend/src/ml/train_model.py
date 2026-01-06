import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import os
import json

# Project root (two levels up from src/ml/)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Paths
PROCESSED_PATH = os.path.join(BASE_DIR, "data", "processed", "transactions_processed.csv")
MODEL_DIR = os.path.join(BASE_DIR, "src", "ml")
MODEL_PATH = os.path.join(MODEL_DIR, "fraud_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def load_data():
    if not os.path.exists(PROCESSED_PATH):
        raise FileNotFoundError(f"Processed data not found at: {PROCESSED_PATH}")
    return pd.read_csv(PROCESSED_PATH)

def train():
    df = load_data()

    # -------------------------
    # Preprocessing 
    # -------------------------

    # Map common boolean-like strings to integers
    bool_map = {"Yes": 1, "No": 0, "Y": 1, "N": 0, "True": 1, "False": 0, True: 1, False: 0}

    expected_numeric = [
        "kyc_verified",
        "account_age_days",
        "transaction_amount",
        "hour",
        "weekday",
        "month",
        "is_high_value",
    ]

    # Map boolean-like columns first
    for col in ["kyc_verified", "is_high_value"]:
        if col in df.columns:
            df[col] = df[col].map(bool_map).fillna(df[col])

    # Coerce expected numeric columns to numeric type
    for col in expected_numeric:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Impute numeric NaNs with median
    for col in expected_numeric:
        if col in df.columns:
            if df[col].isna().any():
                median = df[col].median()
                df[col].fillna(median, inplace=True)

    # Ensure target exists
    if "is_fraud" not in df.columns:
        raise KeyError("Target column 'is_fraud' not found in processed data.")

    # Drop rows with missing target
    df = df.dropna(subset=["is_fraud"])

    # -------------------------
    # Feature selection
    # -------------------------
    # Validate required features are present
    for c in expected_numeric:
        if c not in df.columns:
            raise KeyError(f"Required feature column missing from processed data: {c}")

    X = df[expected_numeric].copy()
    y = pd.to_numeric(df["is_fraud"], errors="coerce")

    # Drop rows where target couldn't be converted
    mask = ~y.isna()
    X = X.loc[mask].reset_index(drop=True)
    y = y.loc[mask].astype(int).reset_index(drop=True)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(y.unique()) > 1 else None
    )

    # Scale
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Model
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train_scaled, y_train)

    # Predictions & metrics
    y_pred = model.predict(X_test_scaled)
    try:
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
    except Exception:
        # Fallback if predict_proba not available
        y_prob = np.zeros_like(y_pred, dtype=float)

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "auc": float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else None
    }

    # Save model, scaler, metrics
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=4)

    print("\nModel trained & saved successfully:")
    print(f"- Model: {MODEL_PATH}")
    print(f"- Scaler: {SCALER_PATH}")
    print(f"- Metrics: {METRICS_PATH}")
    print(metrics)

if __name__ == "__main__":
    train()