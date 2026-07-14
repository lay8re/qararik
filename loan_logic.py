def analyze_loan(
    salary,
    loan_amount,
    years,
    current_obligations,
    monthly_installment=None,
    debt_ratio=None,
    remaining_income=None,
):
    if salary <= 0 or loan_amount <= 0 or years <= 0:
        raise ValueError("salary, loan_amount and years must be positive")

    # نستخدم القسط المحسوب في الواجهة حتى تكون أرقام الرسم والمستشار متطابقة.
    if monthly_installment is None or monthly_installment <= 0:
        monthly_installment = loan_amount / (years * 12)

    total_obligations = current_obligations + monthly_installment

    if debt_ratio is None:
        debt_ratio = (total_obligations / salary) * 100

    if remaining_income is None:
        remaining_income = salary - total_obligations

    if debt_ratio <= 33:
        risk_level = "آمن"
        recommendation = (
            f"وضعك المالي آمن. نسبة الالتزامات {debt_ratio:.1f}% "
            f"ويبقى لديك {remaining_income:.0f} ريال بعد السداد."
        )
    elif debt_ratio <= 45:
        risk_level = "متوسط"
        recommendation = (
            f"الخيار ممكن، لكنه يحتاج حذرًا. نسبة الالتزامات {debt_ratio:.1f}% "
            f"ويبقى لديك {remaining_income:.0f} ريال. حاول تقليل مبلغ القرض أو زيادة مدة السداد."
        )
    else:
        risk_level = "خطر"
        recommendation = (
            f"لا ننصح بهذا الخيار. نسبة الالتزامات {debt_ratio:.1f}% قد تسبب ضغطًا ماليًا عاليًا، "
            "والأفضل تقليل مبلغ القرض أو زيادة مدة السداد."
        )

    if remaining_income < salary * 0.2:
        recommendation += " الدخل المتبقي منخفض، لذلك يُفضّل ترك هامش للطوارئ."

    return {
        "monthly_installment": round(monthly_installment, 2),
        "debt_ratio": round(debt_ratio, 2),
        "remaining_income": round(remaining_income, 2),
        "risk_level": risk_level,
        "recommendation": recommendation,
    }

