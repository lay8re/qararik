def analyze_loan(salary, loan_amount, years, current_obligations, debt_ratio=None, remaining_income=None):
    monthly_installment = loan_amount / (years * 12)
    total_obligations = current_obligations + monthly_installment

    if debt_ratio is None or debt_ratio == 0:
        debt_ratio = (total_obligations / salary) * 100

    if remaining_income is None or remaining_income == 0:
        remaining_income = salary - total_obligations

    if debt_ratio <= 33:
        risk_level = "آمن"
        recommendation = f"وضعك المالي آمن. نسبة الالتزامات {debt_ratio:.1f}% ويبقى لديك {remaining_income:.0f} ريال بعد السداد."
    elif debt_ratio <= 45:
        risk_level = "متوسط"
        recommendation = f"الخيار ممكن، لكن يحتاج حذر. نسبة الالتزامات {debt_ratio:.1f}% ويبقى لديك {remaining_income:.0f} ريال، حاول تقليل مبلغ القرض أو زيادة مدة السداد."
    else:
        risk_level = "خطر"
        recommendation = f"لا ننصح بهذا الخيار. نسبة الالتزامات {debt_ratio:.1f}% وقد تسبب ضغط مالي عالي، الأفضل تقليل مبلغ القرض أو زيادة الراتب/مدة السداد."

    if remaining_income < salary * 0.2:
        recommendation += " كما أن الدخل المتبقي منخفض، لذلك يُفضل ترك هامش للطوارئ."

    return {
        "monthly_installment": round(monthly_installment, 2),
        "debt_ratio": round(debt_ratio, 2),
        "remaining_income": round(remaining_income, 2),
        "risk_level": risk_level,
        "recommendation": recommendation
    }
