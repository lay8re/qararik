

const BANK_CUSTOMER = {
  name:          'محمد أحمد العتيبي',
  applicantAge:  37,
  salary:        18500,
  employer:      'شركة الاتصالات السعودية',
  obligations:   1800
};

const smartFinanceCard = document.getElementById('smartFinanceCard');
const smartFinanceDesc = document.getElementById('smartFinanceDesc');
const consentOverlay   = document.getElementById('consentOverlay');

/*
  حالة "قيد المراجعة" تُقرأ من رابط الصفحة (?submitted=1) وليس من التخزين الدائم،
  ويُزال الرابط فوراً من شريط العنوان. بهذا الشكل تظهر الحالة فقط في اللحظة القادمة
  مباشرة من تقديم الطلب، وأي تحديث لاحق للصفحة (F5) يعيدها لوضعها الافتراضي
  الجاهز لتجربة جديدة أمام شخص آخر.
*/
const justSubmitted = new URLSearchParams(window.location.search).get('submitted') === '1';

if (justSubmitted) {
  smartFinanceCard.classList.add('is-pending');
  smartFinanceDesc.innerHTML =
    'حلّل أهليتك ، جرّب سيناريوهات التمويل ثم قدّم طلبك للبنك' +
    '<br><span class="bank-smart-finance-status"><i class="fa-solid fa-hourglass-half"></i> طلب التمويل قيد المراجعة</span>';

  history.replaceState({}, '', window.location.pathname);
}

smartFinanceCard.addEventListener('click', () => {
  if (justSubmitted) return; // الطلب قيد المراجعة، لا حاجة لفتح النافذة مجدداً
  consentOverlay.classList.add('is-open');
});

document.getElementById('closeConsentBtn').addEventListener('click', () => {
  consentOverlay.classList.remove('is-open');
});

consentOverlay.addEventListener('click', (e) => {
  if (e.target === consentOverlay) consentOverlay.classList.remove('is-open');
});

document.getElementById('startFinanceBtn').addEventListener('click', () => {
  localStorage.setItem('qararikFromBank', '1');
  localStorage.setItem('qararikBankData', JSON.stringify(BANK_CUSTOMER));
  window.location.href = 'inputs.html';
});
