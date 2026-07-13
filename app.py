import os
from flask import Flask, request, jsonify, send_from_directory
from ai_advisor import generate_ai_recommendation
from loan_logic import analyze_loan

app = Flask(__name__)

@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/<path:filename>")
def pages(filename):
    return send_from_directory(".", filename)

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    result = analyze_loan(
        salary=float(data["salary"]),
        loan_amount=float(data["loan_amount"]),
        years=int(data["years"]),
        current_obligations=float(data["current_obligations"]),
        debt_ratio=float(data.get("debt_ratio", 0)),
        remaining_income=float(data.get("remaining_income", 0))
    )

    result["recommendation"] = generate_ai_recommendation(result)

    return jsonify(result)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
