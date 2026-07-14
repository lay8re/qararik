import os
from flask import Flask, request, jsonify, send_from_directory
from ai_advisor import generate_ai_recommendation
from loan_logic import analyze_loan

app = Flask(__name__)


@app.after_request
def disable_static_cache(response):
    """يمنع المتصفح من استخدام نسخة JavaScript قديمة بعد النشر."""
    if request.path.endswith((".html", ".js")) or request.path == "/":
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def pages(filename):
    return send_from_directory(".", filename)


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}

    required_fields = ("salary", "loan_amount", "years", "current_obligations")
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        result = analyze_loan(
            salary=float(data["salary"]),
            loan_amount=float(data["loan_amount"]),
            years=int(data["years"]),
            current_obligations=float(data["current_obligations"]),
            monthly_installment=float(data.get("monthly_installment", 0)) or None,
            debt_ratio=float(data.get("debt_ratio", 0)) or None,
            remaining_income=float(data.get("remaining_income", 0)) or None,
        )
    except (TypeError, ValueError, ZeroDivisionError) as error:
        print(f"Analyze input error: {error}", flush=True)
        return jsonify({"error": "Invalid financial inputs"}), 400

    result["recommendation"] = generate_ai_recommendation(result)
    return jsonify(result)


@app.route("/health")
def health():
    return jsonify({"status": "ok", "gemini_key_configured": bool(os.getenv("GEMINI_API_KEY"))})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
