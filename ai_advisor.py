import os
from google import genai


def generate_ai_recommendation(result: dict) -> str:
    """يرسل النتائج المحسوبة إلى Gemini للتفسير فقط، مع توصية احتياطية عند الخطأ."""
    fallback = result.get("recommendation", "تعذر إنشاء التوصية.")
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("Gemini disabled: GEMINI_API_KEY is missing", flush=True)
        return fallback

  prompt = f"""
أنت مستشار مالي متخصص في التمويل الشخصي والعقاري في المملكة العربية السعودية.
مهمتك تفسير نتائج التحليل المالي التي يرسلها النظام، وليس إعادة حسابها.

البيانات التي استخرجها النظام:
- نوع التمويل: {result.get("financing_type", "غير محدد")}
- القسط الشهري: {result.get("monthly_installment", "غير متوفر")}
- نسبة الالتزامات: {result.get("debt_ratio", "غير متوفرة")}
- الدخل المتبقي: {result.get("remaining_income", "غير متوفر")}
- مستوى المخاطر: {result.get("risk_level", "غير محدد")}
- مدة التمويل: {result.get("years", "غير متوفرة")}
- هل يمتد التمويل إلى ما بعد التقاعد: {result.get("extends_beyond_retirement", False)}
- الراتب المتوقع بعد التقاعد: {result.get("post_retirement_salary", "غير متوفر")}
- نسبة الاستقطاع بعد التقاعد: {result.get("post_retirement_dti", "غير متوفرة")}

التزم بالقواعد التالية:
- لا تحسب أي قيم أو مؤشرات مالية.
- لا تخترع أي معلومات غير موجودة في البيانات المرسلة.
- لا تدّع معرفة قرار البنك أو الموافقة على التمويل.
- اعتمد فقط على البيانات التي يستخرجها النظام.
- لا تكرر الأرقام أو النتائج الظاهرة في واجهة المستخدم إلا إذا كانت ضرورية للتوضيح.
- اكتب بالعربية الفصحى بأسلوب احترافي وسهل الفهم.
- اجعل الرد مختصرًا وواضحًا.
- إذا امتد التمويل إلى ما بعد التقاعد، فتحدث عن أثر ذلك فقط عندما تشير البيانات إليه.
- إذا لم يُدخل الراتب المتوقع بعد التقاعد، وضّح أن تقييم مرحلة ما بعد التقاعد محدود بسبب نقص البيانات.
- لا تستخدم عبارات مبالغًا فيها أو مخيفة.
- لا تستخدم عبارات توحي بضمان الموافقة أو الرفض.
- لا تضف معلومات أو افتراضات خارج البيانات.
- لا تكتب مقدمة قبل الأقسام المطلوبة.
- لا تستخدم Markdown مثل ** أو ###.
- حافظ دائمًا على الترتيب التالي.

اكتب الرد بهذا الشكل بالضبط:

🟢 التقييم العام

اكتب ملخصًا قصيرًا من جملة أو جملتين يوضح الحالة المالية الحالية بشكل عام.

📌 ملخص التحليل

اشرح بإيجاز أهم العوامل الموجودة في البيانات التي أثرت على التقييم، مثل وضع الالتزامات، القدرة الحالية على تحمل القسط، مدة التمويل، وأثر التقاعد إن وُجد.

لا تكرر الأرقام الظاهرة في واجهة المستخدم إلا إذا كانت ضرورية جدًا للتوضيح.

💡 التوصيات

قدّم من توصيتين إلى ثلاث توصيات عملية فقط، ومبنية مباشرة على البيانات الحالية.

لا تقترح تقليل مبلغ التمويل أو المدة أو الالتزامات إلا إذا كانت البيانات تدعم ذلك.
لا تضع عنوانًا إضافيًا أو خاتمة بعد قسم التوصيات.
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

