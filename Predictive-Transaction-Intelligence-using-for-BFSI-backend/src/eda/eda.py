import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# =============================
# LOAD PROCESSED DATA
# =============================
df = pd.read_csv("data/processed/transactions_processed.csv")

# Create output folder for graphs
os.makedirs("docs/graphs", exist_ok=True)

# =============================
# 1. FRAUD % VS LEGIT %
# =============================
plt.figure(figsize=(6,4))
sns.countplot(x='is_fraud', data=df)
plt.title("Fraud vs Legit Transactions")
plt.savefig("docs/graphs/fraud_vs_legit.png")
plt.close()

# =============================
# 2. Average amount in fraud vs non-fraud
# =============================
plt.figure(figsize=(6,4))
sns.boxplot(x='is_fraud', y='transaction_amount', data=df)
plt.title("Transaction Amount: Fraud vs Non-Fraud")
plt.savefig("docs/graphs/amount_fraud_vs_nonfraud.png")
plt.close()

# =============================
# 3. Transactions by hour
# =============================
plt.figure(figsize=(8,4))
sns.countplot(x='transaction_hour', data=df)
plt.title("Transactions by Hour")
plt.xticks(rotation=90)
plt.savefig("docs/graphs/transactions_by_hour.png")
plt.close()

# =============================
# 4. Transactions by channel
# =============================
if "channel" in df.columns:
    plt.figure(figsize=(6,4))
    sns.countplot(x='channel', data=df)
    plt.title("Transactions by Channel")
    plt.savefig("docs/graphs/transactions_by_channel.png")
    plt.close()

# =============================
# 5. Transactions by city
# =============================
if "city" in df.columns:
    plt.figure(figsize=(8,4))
    sns.countplot(x='city', data=df)
    plt.title("Transactions by City")
    plt.xticks(rotation=90)
    plt.savefig("docs/graphs/transactions_by_city.png")
    plt.close()

print("EDA Completed! Graphs saved in docs/graphs/")
