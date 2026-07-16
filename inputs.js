
let selectedType = null;

/*
  رحلة "قرارك" عبر البنك: إذا وصل المستخدم من الصفحة الرئيسية لبنك الإنماء،
  تُعبَّأ بياناته الموثقة تلقائياً وتُقفل، دون التأثير على الاستخدام المباشر للمنصة.
*/
const BANK_FLOW = localStorage.getItem('qararikFromBank') === '1';
const bankData  = BANK_FLOW ? JSON.parse(localStorage.getItem('qararikBankData') || '{}') : null;

function lockBankField(inputId, badgeId) {
  const input = document.getElementById(inputId);
  const badge = document.getElementById(badgeId);
  input.readOnly = true;
  input.tabIndex = -1;
  input.classList.add('locked-field');
  if (badge) badge.style.display = 'inline-flex';
}

function applyBankFlow() {
  if (!BANK_FLOW || !bankData) return;

  document.getElementById('bankBridgeBar').style.display = 'block';
  document.getElementById('bankDataBanner').style.display = 'flex';

  document.getElementById('bankName').value     = bankData.name || '';
  document.getElementById('bankEmployer').value = bankData.employer || '';

  document.getElementById('salary').value       = bankData.salary;
  document.getElementById('applicantAge').value = bankData.applicantAge;
  document.getElementById('obligations').value  = bankData.obligations;

  lockBankField('salary', 'salaryBankBadge');
  lockBankField('applicantAge', 'applicantAgeBankBadge');
  lockBankField('obligations', 'obligationsBankBadge');
}

applyBankFlow();


function selectType(type) {
  selectedType = type;

  document.getElementById('btnPersonal').classList.toggle('active', type === 'personal');
  document.getElementById('btnRealEstate').classList.toggle('active', type === 'realEstate');

  hideError('typeError');
  document.getElementById('btnPersonal').classList.remove('invalid-btn');
  document.getElementById('btnRealEstate').classList.remove('invalid-btn');

  if (type === 'personal') {
    updateSliderConfig(1, 5, 1, 3, ['1','2','3','4','5']);
  } else {
    updateSliderConfig(1, 30, 1, 15, ['1','10','20','30']);
  }
}


const slider  = document.getElementById('durationSlider');
const valEl   = document.getElementById('sliderValue');
const unitEl  = document.getElementById('sliderUnit');
const ticksEl = document.getElementById('sliderTicks');

function updateSliderConfig(min, max, step, defaultVal, ticks) {
  slider.min   = min;
  slider.max   = max;
  slider.step  = step;
  slider.value = defaultVal;
  ticksEl.innerHTML = ticks.map(t => `<span>${t}</span>`).join('');
  refreshSliderUI();
}

function refreshSliderUI() {
  const val = +slider.value;
  const min = +slider.min;
  const max = +slider.max;
  const pct = ((val - min) / (max - min)) * 100;

  slider.style.background =
    `linear-gradient(to right, var(--primary-color) ${pct}%, #e2e8f0 ${pct}%)`;

  valEl.textContent  = val;
  unitEl.textContent = val === 1 ? 'سنة' : 'سنوات';

  //animation
  valEl.classList.remove('value-pop');
  void valEl.offsetWidth;
  valEl.classList.add('value-pop');
}

slider.addEventListener('input', refreshSliderUI);
refreshSliderUI();

// error message
function showError(id)      { document.getElementById(id).style.display = 'flex'; }
function hideError(id)      { document.getElementById(id).style.display = 'none'; }
function markInvalid(inputId) { document.getElementById(inputId).classList.add('invalid'); }
function markValid(inputId)   { document.getElementById(inputId).classList.remove('invalid'); }

// delete error message
document.getElementById('loanAmount').addEventListener('input', function () {
  if (+this.value > 0) { hideError('loanError'); markValid('loanAmount'); }
});
document.getElementById('expectedRetirementAge').addEventListener('input', function () {
  hideError('expectedRetirementAgeError');
  markValid('expectedRetirementAge');
});



function validateForm() {
  let valid = true;

  if (!selectedType) {
    showError('typeError');
    document.getElementById('btnPersonal').classList.add('invalid-btn');
    document.getElementById('btnRealEstate').classList.add('invalid-btn');
    valid = false;
  }


  const salary = +document.getElementById('salary').value;
  if (salary < 3000) {
    showError('salaryError'); markInvalid('salary'); valid = false;
  } else {
    hideError('salaryError'); markValid('salary');
  }

  const loan = +document.getElementById('loanAmount').value;
  if (!loan || loan <= 0) {
    showError('loanError'); markInvalid('loanAmount'); valid = false;
  } else {
    hideError('loanError'); markValid('loanAmount');
  }

  hideError('expectedRetirementAgeError');

  const ApplicantAge = +document.getElementById('applicantAge').value;
  if (ApplicantAge < 18) {
    showError('applicantAgeError'); markInvalid('applicantAge'); valid = false;
  } else {
    hideError('applicantAgeError'); markValid('applicantAge');
  }

  const ExpectedRetirementAge = +document.getElementById('expectedRetirementAge').value;
  if (!ExpectedRetirementAge || ExpectedRetirementAge <= 0) {
    showError('expectedRetirementAgeError'); markInvalid('expectedRetirementAge'); valid = false;
  } else if (ApplicantAge > 0 && ExpectedRetirementAge <= ApplicantAge) {
    showError('expectedRetirementAgeError'); markInvalid('expectedRetirementAge'); valid = false;
  } else {
    markValid('expectedRetirementAge');
  }

  return valid;
}

//load
const MESSAGES = [
  'جاري قراءة وتحليل البيانات المالية...',
  'جاري دراسة تأثير القرض على استقرارك المادي لخمس سنوات قادمة...',
  'جاري بناء السيناريوهات الذكية لقرارك...'
];

document.getElementById('startBtn').addEventListener('click', function () {
  if (!validateForm()) return;

  localStorage.setItem('qararikData', JSON.stringify({
    type:                  selectedType,
    salary:                +document.getElementById('salary').value,
    loanAmount:             +document.getElementById('loanAmount').value,
    duration:               +document.getElementById('durationSlider').value,
    obligations:            +document.getElementById('obligations').value,
    additionalObligations:  +document.getElementById('additionalObligations').value || 0,
    applicantAge:           +document.getElementById('applicantAge').value,
    expectedRetirementAge:  +document.getElementById('expectedRetirementAge').value,
    postRetirementSalary:   +document.getElementById('postRetirementSalary').value || 0,
    fromBank:               BANK_FLOW
  }));

  this.disabled = true;

  const card   = document.getElementById('inputCard');
  const screen = document.getElementById('loadingScreen');
  const textEl = document.getElementById('loadingText');

  card.classList.add('card-exit');
  setTimeout(() => {
    card.style.display   = 'none';
    screen.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      screen.style.opacity = '1';
    }));
  }, 380);

  let idx = 0;
  textEl.textContent = MESSAGES[0];

  // timer to change the text
  const cycle = setInterval(() => {
    idx++;
    if (idx < MESSAGES.length) {
      textEl.classList.add('text-fade');
      setTimeout(() => {
        textEl.textContent = MESSAGES[idx];
        textEl.classList.remove('text-fade');
      }, 280);
    } else {
      clearInterval(cycle);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1400);
    }
  }, 1800);
});
