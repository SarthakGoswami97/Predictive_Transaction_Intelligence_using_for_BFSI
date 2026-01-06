import os
import google.generativeai as genai

def generate_explanation(transaction, prediction, risk_score, rules_triggered):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return "LLM explanation unavailable (API key not configured)"

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are a fraud detection expert.

Transaction details:
{transaction}

Model prediction: {prediction}
Risk score: {risk_score}
Rules triggered: {rules_triggered}

Explain in simple human language why this transaction is flagged or safe.
"""

    response = model.generate_content(prompt)
    return response.text
