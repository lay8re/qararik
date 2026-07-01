def analyze_loan(salary, loan_amount, years, current_obligations):
    monthly_installment = loan_amount / (years * 12)
    total_obligations = current_obligations + monthly_installment
    debt_ratio = (total_obligations / salary) * 100
    remaining_income = salary - total_obligations

    if debt_ratio <= 33:
        risk_level = "آمن"
        recommendation = f"وضعك المالي آمن. نسبة الالتزامات {round(debt_ratio, 1)}%، وسيبقى لديك {round(remaining_income)} ريال بعد الالتزامات."
    elif debt_ratio <= 45:
        risk_level = "متوسط"
        recommendation = f"الخطة ممكنة لكن تحتاج حذر. نسبة الالتزامات {round(debt_ratio, 1)}%، حاول تترك هامش للطوارئ."
    else:
        risk_level = "خطر"
        recommendation = f"لا ننصح بهذا الخيار. نسبة الالتزامات {round(debt_ratio, 1)}% وقد تسبب ضغط مالي عالي."

    if remaining_income < salary * 0.2:
        recommendation += " الدخل المتبقي منخفض، يفضل تقليل مبلغ القرض أو زيادة مدة السداد."

    return {
        "monthly_installment": round(monthly_installment, 2),
        "debt_ratio": round(debt_ratio, 2),
        "remaining_income": round(remaining_income, 2),
        "risk_level": risk_level,
        "recommendation": recommendation
    }