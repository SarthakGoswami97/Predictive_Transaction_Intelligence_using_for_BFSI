import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

print("API KEY:", os.getenv("GEMINI_API_KEY"))

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-pro")
response = model.generate_content("Say hello in one sentence")

print(response.text)
