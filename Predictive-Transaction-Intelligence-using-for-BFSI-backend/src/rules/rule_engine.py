from datetime import datetime

def apply_rules(txn: dict):
    reasons = []

    amount = txn.get("transaction_amount", 0)
    channel = txn.get("channel", "").lower()
    kyc = txn.get("kyc_verified", 0)
    hour = txn.get("hour")

    if amount > 50000:
        reasons.append("Transaction amount unusually high")

    if channel == "international" and kyc == 0:
        reasons.append("International transaction without KYC")

    if hour is not None and (2 <= hour <= 4):
        reasons.append("Transaction at suspicious early-morning hours")

    return reasons
