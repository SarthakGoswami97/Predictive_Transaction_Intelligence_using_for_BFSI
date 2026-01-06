import pandas as pd
from sklearn.model_selection import train_test_split
import os

# Path setup
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
PROCESSED_DATA_PATH = os.path.join(BASE_DIR, "data/processed/transactions_processed.csv")
TRAIN_PATH = os.path.join(BASE_DIR, "data/processed/train.csv")
TEST_PATH = os.path.join(BASE_DIR, "data/processed/test.csv")



def create_train_test_split(test_size=0.2, random_state=42):
    """
    Load processed dataset and split into train and test CSVs.
    """
    print("Loading processed dataset:", PROCESSED_DATA_PATH)
    df = pd.read_csv(PROCESSED_DATA_PATH)

    print("Splitting into train & test...")
    train_df, test_df = train_test_split(df, test_size=test_size, random_state=random_state)

    # Ensure folder exists
    os.makedirs(os.path.join(BASE_DIR, "data/processed"), exist_ok=True)

    # Save files
    train_df.to_csv(TRAIN_PATH, index=False)
    test_df.to_csv(TEST_PATH, index=False)

    print(f"Train file created at: {TRAIN_PATH}")
    print(f"Test file created at:  {TEST_PATH}")


if __name__ == "__main__":
    create_train_test_split()
