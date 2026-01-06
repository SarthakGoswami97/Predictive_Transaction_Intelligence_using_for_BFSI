import pandas as pd
import os

# resolve root directory relative to THIS file
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

RAW_DATA_PATH = os.path.join(BASE_DIR, "data/raw/raw.csv")
PROCESSED_DATA_PATH = os.path.join(BASE_DIR, "data/processed/transactions_processed.csv")


def load_raw_data():
    print("Loading raw dataset from:", RAW_DATA_PATH)
    return pd.read_csv(RAW_DATA_PATH)


def clean_data(df):
    df["kyc_verified"] = df["kyc_verified"].fillna("No")
    df.dropna(subset=["transaction_amount"], inplace=True)
    df.drop_duplicates(subset="transaction_id", inplace=True)

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["channel"] = df["channel"].astype(str).str.title()
    df["transaction_amount"] = df["transaction_amount"].astype(float)

    df["hour"] = df["timestamp"].dt.hour
    df["weekday"] = df["timestamp"].dt.weekday
    df["month"] = df["timestamp"].dt.month
    df["is_high_value"] = (df["transaction_amount"] > 50000).astype(int)

    return df


def save_processed_data(df):
    os.makedirs(os.path.join(BASE_DIR, "data/processed"), exist_ok=True)
    df.to_csv(PROCESSED_DATA_PATH, index=False)
    print(f"Processed data saved at: {PROCESSED_DATA_PATH}")


def pipeline():
    df = load_raw_data()
    df_clean = clean_data(df)
    save_processed_data(df_clean)
    print("Pipeline complete!")
