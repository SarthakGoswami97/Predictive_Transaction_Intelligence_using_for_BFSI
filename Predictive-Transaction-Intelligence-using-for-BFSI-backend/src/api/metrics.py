from fastapi import APIRouter
import json

router = APIRouter()

@router.get("/api/metrics")
def get_metrics():
    with open("src/ml/metrics.json", "r") as f:
        metrics = json.load(f)
    return metrics
