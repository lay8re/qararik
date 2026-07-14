import os
from google import genai


def build_fallback_recommendation(result: dict) -> str:
    risk_level = result.get("risk_level")
    debt_ratio = result.get("debt_ratio")
    monthly_installment = result.get("monthly_installment")
    remaining_income = result.get("remaining_income")

    if risk_level == "آمن":
        general = "وضعك المالي آمن حالياً، ونسبة الاستقطاع لديك ضمن الحدود المريحة."
    elif risk_level == "متوسط":
        general = "وضعك المالي يحتاج بعض الحذر، فنسبة الاستقطاع مرتفعة نسبيًا."
    else:
        general = "وضعك المالي الحالي يشكّل ضغطًا كبيرًا، فنسبة الاستقطاع تجاوزت الحدود الآمنة."

    summary = (
        f"نسبة الاستقطاع الحالية {debt_ratio}% مقابل قسط شهري قدره {monthly_installment:,.0f} ريال، "
        f"ويتبقى لديك نحو {remaining_income:,.0f} ريال شهريًا بعد السداد."
    )

    suggested_years = result.get("suggested_years")
    suggested_loan_amount = result.get("suggested_loan_amount")
    extends = result.get("extends_beyond_retirement")
    incomplete = result.get("post_retirement_incomplete")
    post_dti = result.get("post_retirement_dti")
    post_retirement_risk = result.get("post_retirement_risk")

    if extends and incomplete:
        summary += " كما تمتد مدة التمويل إلى ما بعد التقاعد ، ولم يُدخل الراتب المتوقع بعدها بعد"
    elif extends and post_dti is not None:
        summary += f" كما تمتد مدة التمويل إلى ما بعد التقاعد، وستكون نسبة الاستقطاع حينها نحو {post_dti:.0f}%."

    advice = []
    if suggested_years:
        advice.append(f"زيادة مدة السداد إلى {suggested_years} سنة قد تخفف القسط الشهري وتحسّن وضعك المالي")
    if suggested_loan_amount:
        advice.append(f"قد يساعد تخفيض مبلغ التمويل إلى نحو {suggested_loan_amount:,.0f} ريال في تحسين مؤشرك المالي.")
    if post_retirement_risk:
        if risk_level == "آمن":
            advice.append(
                "وضعك الحالي آمن ولا داعي للقلق الآن، لكن يُستحسن البدء بالتخطيط المبكر لتغطية القسط بعد التقاعد "
                f"لأن نسبة الاستقطاع المتوقعة حينها نحو {post_dti:.0f}%."
            )
        else:
            advice.append(
                "يُستحسن أيضًا التخطيط المبكر لتغطية القسط بعد التقاعد "
                f"لأن نسبة الاستقطاع المتوقعة حينها نحو {post_dti:.0f}%."
            )

    if not advice:
        advice.append("يُفضّل الاحتفاظ بجزء من دخلك كصندوق للطوارئ ومواصلة الادخار، مع التفكير بالسداد المبكر عند توفر سيولة إضافية.")

    recommendations = "\n".join(advice[:2])

    return (
        f"التقييم العام\n{general}\n\n"
        f"ملخص التحليل\n{summary}\n\n"
        f"التوصيات\n{recommendations}"
    )


def generate_ai_recommendation(result: dict) -> str:
    fallback = build_fallback_recommendation(result)
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("Gemini disabled: GEMINI_API_KEY is missing", flush=True)
        return fallback

    financing_label = {
        "personal": "تمويل شخصي",
        "realEstate": "تمويل عقاري",
    }.get(result.get("financing_type"), "غير محدد")

    prompt = f"""
أنت مستشار مالي متخصص في التمويل الشخصي والعقاري في المملكة العربية السعودية.
النظام (Python) قام بجميع الحسابات مسبقًا. مهمتك فقط فهم القيم التالية واختيار الجمل المناسبة لصياغة توصية طبيعية، دون أي حساب أو استنتاج رقمي من عندك.

القيم الجاهزة من النظام:
- نوع التمويل: {financing_label}
- مدة التمويل الحالية: {result.get("years")} سنة
- القسط الشهري: {result.get("monthly_installment")} ريال
- نسبة الاستقطاع الحالية: {result.get("debt_ratio")}%
- الدخل المتبقي شهريًا: {result.get("remaining_income")} ريال
- مستوى المخاطر: {result.get("risk_level")}
- مدة سداد مقترحة (إن وُجدت، تُحسّن الحالة إلى المنطقة الآمنة): {result.get("suggested_years") or "لا يوجد اقتراح"}
- مبلغ تمويل مقترح (إن وُجد، يُحسّن الحالة إلى المنطقة الآمنة): {result.get("suggested_loan_amount") or "لا يوجد اقتراح"}
- هل يمتد التمويل إلى ما بعد التقاعد: {"نعم" if result.get("extends_beyond_retirement") else "لا"}
- بيانات ما بعد التقاعد ناقصة (لم يُدخل الراتب المتوقع): {"نعم" if result.get("post_retirement_incomplete") else "لا"}
- نسبة الاستقطاع المتوقعة بعد التقاعد (إن وُجدت): {result.get("post_retirement_dti") if result.get("post_retirement_dti") is not None else "غير متوفرة"}
- نسبة الاستقطاع بعد التقاعد مرتفعة وتستحق تخطيطًا مبكرًا: {"نعم" if result.get("post_retirement_risk") else "لا"}

التزم بالقواعد التالية بدقة:
- ممنوع إجراء أي عملية حسابية أو تقدير رقمي بنفسك. استخدم فقط الأرقام المذكورة أعلاه كما هي، دون تعديل أو تقريب مختلف.
- ممنوع اختراع أي معلومة أو رقم غير موجود في القيم أعلاه.
- ممنوع الادّعاء بمعرفة قرار البنك أو الموافقة على التمويل.
- إذا كانت "مدة سداد مقترحة" أو "مبلغ تمويل مقترح" تساوي "لا يوجد اقتراح"، فلا تقترح تغيير المدة أو المبلغ إطلاقًا.
- اذكر فقط الاقتراحات (المدة أو المبلغ) الموجودة فعليًا في البيانات؛ لا تفترض أن كليهما متاح إن لم يُذكر.
- إذا كان يمتد إلى ما بعد التقاعد، تحدث عن ذلك بإيجاز حسب البيانات المذكورة فقط (نسبة الاستقطاع المتوقعة، أو نقص البيانات إن كانت ناقصة).
- إذا كانت "نسبة الاستقطاع بعد التقاعد مرتفعة وتستحق تخطيطًا مبكرًا" = نعم، أضف توصية بهذا الخصوص حتى لو كان مستوى المخاطر الحالي "آمن". لا تصفها كمشكلة حالية أو تنذر بها؛ وضّح أن الوضع الحالي آمن (إن كان كذلك) وأن هذا تخطيط استباقي للمستقبل فقط.
- إذا لم تتوفر أي اقتراحات تحسين (لا مدة ولا مبلغ) ولا تخطيط تقاعد مطلوب، اكتب بدلًا من ذلك نصيحة مالية عامة واحدة أو اثنتين مثل: الاحتفاظ بصندوق للطوارئ، ادخار جزء من الدخل، أو التفكير بالسداد المبكر عند توفر سيولة.
- لا تعرض كل الاقتراحات المتاحة بالضرورة؛ اختر ما هو الأنسب فقط (توصية واحدة أو اثنتان كحد أقصى).
- لا تكتب الرد على شكل "الحل الأول" و"الحل الثاني" أو أي ترقيم أو رموز نقطية. إن كانت هناك توصيتان، اكتب كل واحدة كجملة كاملة مستقلة على سطر خاص بها (سطر فاصل بينهما)، لا تدمجهما في جملة واحدة متصلة بفاصلة أو نقطة.
- لا تكرر كل الأرقام الظاهرة أعلاه حرفيًا؛ اذكر فقط ما يخدم التوضيح.
- لا تستخدم رموزًا تعبيرية أو Markdown مثل ** أو ### أو أي رمز آخر.
- لا تستخدم عبارات مبالغًا فيها أو مخيفة، ولا عبارات توحي بضمان الموافقة أو الرفض.
- اكتب بالعربية الفصحى بأسلوب احترافي، طبيعي، وواضح.

اكتب الرد بهذا الشكل بالضبط، بحيث يكون كل عنوان من العناوين الثلاثة التالية على سطر مستقل تمامًا كما هو مكتوب هنا (بدون أي رمز أو تعديل على نص العنوان نفسه):

التقييم العام
اكتب جملة أو جملتين فقط توضحان الحالة المالية العامة بناءً على مستوى المخاطر.

ملخص التحليل
اشرح بإيجاز أهم العوامل الظاهرة في البيانات: نسبة الاستقطاع مقابل القسط الشهري والدخل، ومدة التمويل، وأثر التقاعد فقط إذا كانت البيانات تشير إلى امتداد التمويل بعد التقاعد.

التوصيات
اكتب توصية واحدة إلى اثنتين كحد أقصى، مبنية فقط على المدة المقترحة أو مبلغ التمويل المقترح أو التخطيط المبكر للتقاعد إن وُجدت فعليًا في البيانات؛ وإن لم توجد أي منها فاكتب نصيحة مالية عامة أو اثنتين بدلًا منها. إذا كتبت توصيتين، ضع كل واحدة في سطر منفصل.

لا تضف أي عنوان إضافي، ولا مقدمة قبل "التقييم العام"، ولا خاتمة بعد "التوصيات".
"""

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
        )

        text = (response.text or "").strip()

        if text:
            print("Gemini response generated successfully", flush=True)
            return text

        print("Gemini returned an empty response; using fallback", flush=True)
        return fallback

    except Exception as error:
        print(f"Gemini API error: {type(error).__name__}: {error}", flush=True)
        return fallback
