import os
from google import genai


def generate_ai_recommendation(result: dict) -> str:
    """
    يرسل النتائج المحسوبة مسبقًا إلى Gemini لتفسيرها فقط.
    إذا تعطل Gemini، يرجع للتوصية الأصلية.
    """

    fallback = result.get("recommendation", "تعذر إنشاء التوصية.")
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return fallback

    prompt = f"""
أنت مستشار مالي متخصص في التمويل الشخصي والعقاري في المملكة العربية السعودية.

فسّر النتائج التالية فقط، ولا تُعِد حسابها ولا تغيّر أي رقم:

- القسط الشهري: {result["monthly_installment"]} ريال
- نسبة الالتزامات DTI: {result["debt_ratio"]}%
- الدخل المتبقي: {result["remaining_income"]} ريال
- مستوى المخاطر: {result["risk_level"]}

التزم بالتالي:
- لا تخترع أي معلومات.
- لا تتوقع موافقة البنك أو رفضه.
- لا تكرر البيانات في قائمة.
- اكتب توصية عربية واضحة من جملتين إلى ثلاث جمل.
- اقترح إجراءً عمليًا مناسبًا للحالة.
- اكتب التوصية فقط، دون عنوان أو مقدمة.
"""

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )

        text = (response.text or "").strip()
        return text if text else fallback

    except Exception as error:
        print(f"Gemini API error: {error}")
        return fallback
