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

فسّر النتائج التالية فقط، ولا تُعِد حسابها ولا تغيّر أي رقم:
- القسط الشهري: {result['monthly_installment']} ريال
- نسبة الالتزامات DTI: {result['debt_ratio']}%
- الدخل المتبقي: {result['remaining_income']} ريال
- مستوى المخاطر: {result['risk_level']}

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
            model="gemini-2.5-flash-lite",
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

