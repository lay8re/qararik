
let selectedType = null;


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
document.getElementById('salary').addEventListener('input', function () {
  if (+this.value > 0) { hideError('salaryError'); markValid('salary'); }
});
document.getElementById('loanAmount').addEventListener('input', function () {
  if (+this.value > 0) { hideError('loanError'); markValid('loanAmount'); }
});
document.getElementById('obligations').addEventListener('input', function () {
  if (this.value !== '') { hideError('obligationsError'); markValid('obligations'); }
});
document.getElementById('applicantAge').addEventListener('input', function () {
  if (+this.value > 0) { hideError('applicantAgeError'); markValid('applicantAge'); }
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
  if (!salary || salary <= 0) {
    document.getElementById('salaryError').textContent = '⚠ الرجاء إدخال الراتب الشهري';
    showError('salaryError'); markInvalid('salary'); valid = false;
  } else if (salary < 3000) {
    document.getElementById('salaryError').textContent = '⚠ الحد الأدنى لصافي الراتب يبدأ من 3000 ريال';
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

  const obligations = document.getElementById('obligations').value;
  if (obligations === '') {
    showError('obligationsError'); markInvalid('obligations'); valid = false;
  } else {
    hideError('obligationsError'); markValid('obligations');
  }

  hideError('expectedRetirementAgeError');

  const ApplicantAge = +document.getElementById('applicantAge').value;
  if (!ApplicantAge || ApplicantAge <= 0) {
    document.getElementById('applicantAgeError').textContent = '⚠ الرجاء إدخال عمر العميل';
    showError('applicantAgeError'); markInvalid('applicantAge'); valid = false;
  } else if (ApplicantAge < 18) {
    document.getElementById('applicantAgeError').textContent = '⚠ الحد الأدنى للعمر المسموح به للتمويل هو 18 سنة';
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
    applicantAge:           +document.getElementById('applicantAge').value,
    expectedRetirementAge:  +document.getElementById('expectedRetirementAge').value,
    postRetirementSalary:   +document.getElementById('postRetirementSalary').value || 0
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
