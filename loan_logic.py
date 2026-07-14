SAFE_DTI_THRESHOLD = 33
MAX_YEARS_BY_TYPE = {"personal": 5, "realEstate": 30}


def calc_profit_rate(financing_type, years):
    if financing_type == "personal":
        return 3.0 + (years - 1) * 0.2
    return 3.0 + (years - 1) * 0.06


def calc_monthly_payment(loan_amount, annual_rate, years):
    n = years * 12
    r = (annual_rate / 100) / 12

    if r == 0:
        return loan_amount / n

    factor = (1 + r) ** n
    return loan_amount * (r * factor) / (factor - 1)


def find_suggested_years(financing_type, loan_amount, salary, current_obligations, years):
    if not financing_type:
        return None

    max_years = MAX_YEARS_BY_TYPE.get(financing_type)
    if not max_years:
        return None

    for candidate in range(years + 1, max_years + 1):
        rate = calc_profit_rate(financing_type, candidate)
        monthly = calc_monthly_payment(loan_amount, rate, candidate)
        dti = ((monthly + current_obligations) / salary) * 100
        if dti <= SAFE_DTI_THRESHOLD:
            return candidate

    return None


def find_suggested_loan_amount(financing_type, loan_amount, salary, current_obligations, years):
    if not financing_type:
        return None

    target_monthly = salary * (SAFE_DTI_THRESHOLD / 100) - current_obligations
    if target_monthly <= 0:
        return None

    rate = calc_profit_rate(financing_type, years)
    n = years * 12
    r = (rate / 100) / 12

    if r == 0:
        suggested = target_monthly * n
    else:
        factor = (1 + r) ** n
        suggested = target_monthly * (factor - 1) / (r * factor)

    if suggested <= 0 or suggested >= loan_amount:
        return None

    return round(suggested / 1000) * 1000


def analyze_post_retirement(applicant_age, expected_retirement_age, years, monthly_installment, post_retirement_salary):
    if not applicant_age or not expected_retirement_age:
        return {
            "extends_beyond_retirement": False,
            "post_retirement_incomplete": False,
            "post_retirement_dti": None,
            "post_retirement_risk": False,
        }

    age_at_loan_end = applicant_age + years
    extends_beyond_retirement = age_at_loan_end > expected_retirement_age

    if not extends_beyond_retirement:
        return {
            "extends_beyond_retirement": False,
            "post_retirement_incomplete": False,
            "post_retirement_dti": None,
            "post_retirement_risk": False,
        }

    if not post_retirement_salary or post_retirement_salary <= 0:
        return {
            "extends_beyond_retirement": True,
            "post_retirement_incomplete": True,
            "post_retirement_dti": None,
            "post_retirement_risk": False,
        }

    post_retirement_dti = (monthly_installment / post_retirement_salary) * 100
    return {
        "extends_beyond_retirement": True,
        "post_retirement_incomplete": False,
        "post_retirement_dti": round(post_retirement_dti, 2),
        "post_retirement_risk": post_retirement_dti > SAFE_DTI_THRESHOLD,
    }


def analyze_loan(
    salary,
    loan_amount,
    years,
    current_obligations,
    monthly_installment=None,
    debt_ratio=None,
    remaining_income=None,
    financing_type=None,
    applicant_age=None,
    expected_retirement_age=None,
    post_retirement_salary=None,
):
    if salary <= 0 or loan_amount <= 0 or years <= 0:
        raise ValueError("salary, loan_amount and years must be positive")

    
    if monthly_installment is None or monthly_installment <= 0:
        monthly_installment = loan_amount / (years * 12)

    total_obligations = current_obligations + monthly_installment

    if debt_ratio is None:
        debt_ratio = (total_obligations / salary) * 100

    if remaining_income is None:
        remaining_income = salary - total_obligations

    if debt_ratio <= 33:
        risk_level = "آمن"
    elif debt_ratio <= 45:
        risk_level = "متوسط"
    else:
        risk_level = "خطر"

    suggested_years = None
    suggested_loan_amount = None
    if debt_ratio > SAFE_DTI_THRESHOLD:
        suggested_years = find_suggested_years(
            financing_type, loan_amount, salary, current_obligations, years
        )
        suggested_loan_amount = find_suggested_loan_amount(
            financing_type, loan_amount, salary, current_obligations, years
        )

    retirement_analysis = analyze_post_retirement(
        applicant_age, expected_retirement_age, years, monthly_installment, post_retirement_salary
    )

    return {
        "financing_type": financing_type,
        "years": years,
        "monthly_installment": round(monthly_installment, 2),
        "debt_ratio": round(debt_ratio, 2),
        "remaining_income": round(remaining_income, 2),
        "risk_level": risk_level,
        "suggested_years": suggested_years,
        "suggested_loan_amount": suggested_loan_amount,
        "extends_beyond_retirement": retirement_analysis["extends_beyond_retirement"],
        "post_retirement_incomplete": retirement_analysis["post_retirement_incomplete"],
        "post_retirement_dti": retirement_analysis["post_retirement_dti"],
        "post_retirement_risk": retirement_analysis["post_retirement_risk"],
    }
