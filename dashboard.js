
const saved    = JSON.parse(localStorage.getItem('qararikData') || '{}');
const DEFAULTS = {
  type: 'personal', salary: 10000, loanAmount: 50000, duration: 3, obligations: 0,
  additionalObligations: 0,
  applicantAge: 30, expectedRetirementAge: 60, postRetirementSalary: 0
};
const init     = { ...DEFAULTS, ...saved };


document.getElementById('dashType').value        = init.type;
document.getElementById('dashSalary').value      = init.salary;
document.getElementById('dashLoan').value        = init.loanAmount;
document.getElementById('dashDuration').max      = init.type === 'personal' ? 5 : 30;
document.getElementById('dashDuration').value    = init.duration;
document.getElementById('dashObligations').value = init.obligations;
document.getElementById('dashAdditionalObligations').value = init.additionalObligations || '';
document.getElementById('dashApplicantAge').value          = init.applicantAge;
document.getElementById('dashExpectedRetirementAge').value = init.expectedRetirementAge;
document.getElementById('dashPostRetirementSalary').value   = init.postRetirementSalary || '';

/*
  رحلة "قرارك" عبر البنك: البيانات الموثقة من البنك تبقى مقفلة هنا أيضاً،
  ويظهر زر تقديم الطلب للبنك فقط في هذا المسار، دون أي تأثير على الاستخدام المباشر للمنصة.
*/
const BANK_FLOW = !!init.fromBank;

function lockDashField(inputId, badgeId) {
  const input = document.getElementById(inputId);
  const badge = document.getElementById(badgeId);
  input.readOnly = true;
  input.tabIndex = -1;
  input.classList.add('locked-field');
  if (badge) badge.style.display = 'inline-flex';
}

if (BANK_FLOW) {
  document.getElementById('bankBridgeBar').style.display = 'block';
  document.getElementById('bankSubmitSection').style.display = '';
  lockDashField('dashSalary', 'dashSalaryBankBadge');
  lockDashField('dashApplicantAge', 'dashApplicantAgeBankBadge');
  lockDashField('dashObligations', 'dashObligationsBankBadge');
}


let needleAngle = -90;
let animId      = null;

/* 
      حساب نسبة الربح 
      شخصي : تبدأ 3.0% + 0.2% لكل سنة إضافية
      عقاري: تبدأ 4.0% + 0.1% لكل سنة إضافية
      + 0.5% إذا القرض > 25 ضعف الراتب الشهري
*/
function calcProfitRate(type, salary, loanAmount, years) {
  if (type === 'personal') {
    return 3.0 + (years - 1) * 0.2;
  } else {
    let rate = 3.0 + (years - 1) * 0.06;
    //if (salary > 0 && loanAmount > salary * 25) rate += 0.5;
    return rate;
  }
}

/* 
     حساب القسط بمعادلة الأقساط المتناقصة (Annuity Formula)
      القسط = P × [r(1+r)^n] / [(1+r)^n - 1]
      r = معدل شهري (نسبة سنوية ÷ 12)
      n = عدد الأشهر (سنوات × 12)
 */
function calcPayment(loanAmount, annualRate, years) {
  const n = years * 12;
  const r = (annualRate / 100) / 12;

  if (r === 0) {
    return { monthly: loanAmount / n, totalProfit: 0 };
  }

  const factor      = Math.pow(1 + r, n);
  const monthly     = loanAmount * (r * factor) / (factor - 1);
  const totalProfit = (monthly * n) - loanAmount;
  return { monthly, totalProfit };
}

/* 
     حساب نسبة الاستقطاع الكلية DTI (Debt-To-Income)
      DTI = ((القسط الجديد + الالتزامات الشهرية) ÷ الراتب) × 100
*/
function calcDTI(monthly, obligations, salary) {
  if (salary <= 0) return 0;
  return ((monthly + obligations) / salary) * 100;
}

/* 
     تحديد المنطقة بناءً على معايير ساما  (DTI)
      ≤ 33%        → أمان مالي
      34% – 45%    → ضغط مالي مقبول
      > 45%        → منطقة خطر (تجاوز الحد النظامي)
*/
function getZone(dti) {
  if (dti <= 33) return { key: 'green',  color: '#22c55e', label: 'أمان مالي'                      };
  if (dti <= 45) return { key: 'orange', color: '#f97316', label: 'ضغط مالي مقبول'                 };
  return               { key: 'red',    color: '#ef4444', label: 'منطقة خطر (تجاوز الحد النظامي)' };
}

/* 
     شروط الأهلية الرسمية
      - العمر أقل من 18 سنة → إيقاف جميع العمليات الحسابية
      - الراتب الشهري أقل من 3000 ريال → إيقاف جميع العمليات الحسابية
*/
const MIN_AGE    = 18;
const MIN_SALARY = 3000;

function checkEligibility(applicantAge, salary) {
  if (applicantAge < MIN_AGE) {
    return `الحد الأدنى للعمر المسموح به للتمويل هو ${MIN_AGE} سنة.`;
  }
  if (salary < MIN_SALARY) {
    return `الحد الأدنى لصافي الراتب الشهري يبدأ من ${MIN_SALARY} ريال.`;
  }
  return null;
}

/* 
    الرسوم الإدارية
*/
function calcAdministrativeFee(loanAmount) {
  return Math.min(loanAmount * 0.005, 2500);
}

/* 
      تحليل ما بعد التقاعد
      العمر عند نهاية التمويل = العمر الحالي + مدة السداد 
      إذا تجاوز العمر عند نهاية التمويل سن التقاعد المتوقع، يمتد التمويل
      إلى ما بعد التقاعد ويُفعَّل تحليل إضافي دون رفض التمويل
*/
function analyzePostRetirement(applicantAge, expectedRetirementAge, duration, monthly, postRetirementSalary) {
  const ageAtLoanEnd = applicantAge + duration;
  const extendsBeyondRetirement = ageAtLoanEnd > expectedRetirementAge;

  if (!extendsBeyondRetirement) {
    return { extendsBeyondRetirement: false, incomplete: false, postRetirementDTI: null };
  }

  if (!postRetirementSalary || postRetirementSalary <= 0) {
    return { extendsBeyondRetirement: true, incomplete: true, postRetirementDTI: null };
  }

  const postRetirementDTI = (monthly / postRetirementSalary) * 100;
  return { extendsBeyondRetirement: true, incomplete: false, postRetirementDTI };
}

/* 
     تحليل ما بعد التقاعد
      لا يغيّر أي مؤشر أساسي في الصفحة 
      - لا يمتد التمويل بعد التقاعد        → الصندوق مخفي بالكامل
      - يمتد ولا يوجد راتب متوقع بعد التقاعد → تنبيه بسيط فقط
      - يمتد ويوجد راتب متوقع بعد التقاعد    → صندوق بنسبة الاستقطاع المتوقعة فقط
*/
function updateRetirementNote(retirementAnalysis) {
  const box   = document.getElementById('retirementNote');
  const title = document.getElementById('retirementNoteTitle');
  const text  = document.getElementById('retirementNoteText');

  if (!retirementAnalysis.extendsBeyondRetirement) {
    box.style.display = 'none';
    return;
  }

  box.style.display = 'block';

  if (retirementAnalysis.incomplete) {
    title.style.display = 'none';
    text.textContent = 'تمتد مدة التمويل إلى ما بعد التقاعد، ولكن لم يتم إدخال الراتب المتوقع بعد التقاعد ، لذلك لا يمكن حساب نسبة الاستقطاع بعد التقاعد.';
    return;
  }

  title.style.display = '';
  text.textContent = `تمتد مدة التمويل إلى ما بعد التقاعد ، وستصبح نسبة الاستقطاع ${Math.round(retirementAnalysis.postRetirementDTI)}% اعتمادًا على الراتب المتوقع بعد التقاعد.`;
}


function animateNeedle(targetAngle) {
  if (animId) cancelAnimationFrame(animId);
  const startAngle = needleAngle;
  const startTime  = performance.now();
  const DURATION   = 650;

  function step(now) {
    const t     = Math.min((now - startTime) / DURATION, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const angle = startAngle + (targetAngle - startAngle) * eased;
    document.getElementById('gaugeNeedle')
      .setAttribute('transform', `rotate(${angle}, 110, 110)`);
    if (t < 1) animId = requestAnimationFrame(step);
    else needleAngle = targetAngle;
  }
  animId = requestAnimationFrame(step);
}


function setBankSubmitEligibility(eligible) {
  if (!BANK_FLOW) return;
  const btn  = document.getElementById('submitToBankBtn');
  const hint = document.getElementById('submitHint');
  btn.disabled = !eligible;
  hint.classList.toggle('is-eligible', eligible);
  hint.textContent = eligible
    ? 'وضعك المالي مؤهل حالياً لتقديم طلب التمويل إلى البنك.'
    : 'يتفعّل هذا الزر عند انخفاض نسبة الاستقطاع عن 30% ومستوى المخاطر منخفض.';
}

function updateAdvisor(color) {
  const panel = document.getElementById('advisorPanel');
  const dot   = document.getElementById('advisorDot');

  dot.style.background         = color;
  panel.style.borderRightColor = color;
}

const ADVISOR_HEADINGS = ['التقييم العام', 'ملخص التحليل', 'التوصيات'];

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatAdvisorHtml(text) {
  let html = escapeHtml(text.replace(/\r\n/g, '\n'));
  ADVISOR_HEADINGS.forEach(heading => {
    const headingLine = new RegExp(`(^|\\n)${heading}(\\n|$)`, 'g');
    html = html.replace(headingLine, `$1<strong>${heading}</strong>$2`);
  });
  return html;
}

function setAdvisorText(text) {
  const textEl = document.getElementById('advisorText');
  textEl.style.opacity = '0';
  setTimeout(() => {
    textEl.innerHTML     = formatAdvisorHtml(text);
    textEl.style.opacity = '1';
  }, 220);
}


const budgetChart = new Chart(
  document.getElementById('budgetChart').getContext('2d'),
  {
    type: 'doughnut',
    data: {
      labels: ['قسط التمويل الجديد', 'الالتزامات الحالية', 'المتبقي للادخار'],
      datasets: [{
        data:            [1, 1, 1],
        backgroundColor: ['#2563EB', '#f97316', '#22c55e'],
        borderWidth:     0,
        hoverOffset:     10
      }]
    },
    options: {
      animation: { duration: 500, easing: 'easeInOutQuart' },
      cutout:    '62%',
      plugins: {
        legend: {
          position: 'bottom',
          rtl:      true,
          labels: {
            font:      { family: 'inherit', size: 11 },
            padding:   14,
            boxWidth:  12,
            boxHeight: 12
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmtNum(ctx.raw)} ريال`
          }
        }
      }
    }
  }
);


function updateChart(monthly, obligations, salary) {
  const remaining = Math.max(0, salary - monthly - obligations);
  budgetChart.data.datasets[0].data = [
    Math.round(monthly),
    Math.round(obligations),
    Math.round(remaining)
  ];
  budgetChart.update();
  document.getElementById('chartRemaining').textContent = fmtNum(Math.round(remaining));
}


function fmtNum(n) { return n.toLocaleString('en-US'); }


let advisorRequestId = 0;

function updateSidebarSlider(type) {
  const slider = document.getElementById('dashDuration');
  const ticks  = document.getElementById('sbTicks');

  if (type === 'personal') {
    slider.max  = 5;
    slider.step = 1;
    if (+slider.value > 5) slider.value = 5;
    ticks.innerHTML = '<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>';
  } else {
    slider.max  = 30;
    slider.step = 1;
    ticks.innerHTML = '<span>1</span><span>10</span><span>20</span><span>30</span>';
  }
  refreshSbSlider();
}

function refreshSbSlider() {
  const slider = document.getElementById('dashDuration');
  const val    = +slider.value;
  const pct    = ((val - +slider.min) / (+slider.max - +slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--primary-color) ${pct}%, #e2e8f0 ${pct}%)`;
  document.getElementById('sbVal').textContent  = val;
  document.getElementById('sbUnit').textContent = val === 1 ? 'سنة' : 'سنوات';
}

function onTypeChange()     { updateSidebarSlider(document.getElementById('dashType').value); updateDashboard(); }
function onDurationChange() { refreshSbSlider(); updateDashboard(); }

/* 
   حفظ التعديلات الحالية في لوحة التحكم بحيث لا تُفقد عند تحديث الصفحة
*/
function persistDashboardState() {
  localStorage.setItem('qararikData', JSON.stringify({
    type:                  document.getElementById('dashType').value,
    salary:                +document.getElementById('dashSalary').value      || 0,
    loanAmount:            +document.getElementById('dashLoan').value        || 0,
    duration:              +document.getElementById('dashDuration').value    || 1,
    obligations:           +document.getElementById('dashObligations').value || 0,
    additionalObligations: +document.getElementById('dashAdditionalObligations').value || 0,
    applicantAge:          +document.getElementById('dashApplicantAge').value          || 0,
    expectedRetirementAge: +document.getElementById('dashExpectedRetirementAge').value || 0,
    postRetirementSalary:  +document.getElementById('dashPostRetirementSalary').value  || 0
  }));
}


function updateDashboard() {
  persistDashboardState();

  const type        = document.getElementById('dashType').value;
  const salary      = +document.getElementById('dashSalary').value      || 0;
  const loanAmount  = +document.getElementById('dashLoan').value        || 0;
  const duration    = +document.getElementById('dashDuration').value    || 1;
  const obligations           = +document.getElementById('dashObligations').value           || 0;
  const additionalObligations = +document.getElementById('dashAdditionalObligations').value  || 0;

  /*
    إجمالي الالتزامات = الالتزامات المالية الموثقة (من البنك) + الالتزامات الشهرية الإضافية (يدوية)
    كل الحسابات والمؤشرات والتوصيات أدناه تعتمد على هذا المتغير الموحّد فقط.
  */
  const totalObligations = obligations + additionalObligations;

  if (salary <= 0 || loanAmount <= 0) return;

  const ApplicantAge           = +document.getElementById('dashApplicantAge').value          || 0;
  const ExpectedRetirementAge  = +document.getElementById('dashExpectedRetirementAge').value || 0;
  const PostRetirementSalary   = +document.getElementById('dashPostRetirementSalary').value  || 0;

  const eligibilityMessage = checkEligibility(ApplicantAge, salary);

  if (eligibilityMessage) {
    const dtiEl  = document.getElementById('gaugeDTI');
    const zoneEl = document.getElementById('gaugeZone');
    dtiEl.textContent  = '—';
    dtiEl.style.color  = '#ef4444';
    zoneEl.textContent = 'غير مؤهل';
    zoneEl.style.color = '#ef4444';

    document.getElementById('gaugeMonthly').textContent = '—';
    document.getElementById('gaugeRate').textContent    = '—';
    document.getElementById('sbMonthly').textContent     = '—';
    document.getElementById('sbRate').textContent        = '—';
    document.getElementById('sbTotalProfit').textContent = '—';
    document.getElementById('sbAdminFee').textContent    = '—';

    animateNeedle(90);
    updateAdvisor('#ef4444');
    advisorRequestId++; // إبطال أي رد سابق من Flask قيد التحميل
    setAdvisorText(`لا يمكن إتمام الحساب: ${eligibilityMessage}`);
    document.getElementById('retirementNote').style.display = 'none';
    setBankSubmitEligibility(false);
    return;
  }

  const rate                     = calcProfitRate(type, salary, loanAmount, duration);
  const { monthly, totalProfit } = calcPayment(loanAmount, rate, duration);
  const dti                      = calcDTI(monthly, totalObligations, salary);
  const zone                     = getZone(dti);
  const { color, label }         = zone;

  const retirementAnalysis = analyzePostRetirement(ApplicantAge, ExpectedRetirementAge, duration, monthly, PostRetirementSalary);
  updateRetirementNote(retirementAnalysis);

  const adminFee = calcAdministrativeFee(loanAmount);
  document.getElementById('sbAdminFee').textContent = fmtNum(Math.round(adminFee)) + ' ريال';


  animateNeedle(-90 + (Math.min(dti, 100) / 100) * 180);


  const dtiEl  = document.getElementById('gaugeDTI');
  const zoneEl = document.getElementById('gaugeZone');
  dtiEl.textContent  = Math.round(dti) + '%';
  dtiEl.style.color  = color;
  zoneEl.textContent = label;
  zoneEl.style.color = color;

 
  document.getElementById('gaugeMonthly').textContent = fmtNum(Math.round(monthly)) + ' ريال';
  document.getElementById('gaugeRate').textContent    = rate.toFixed(1) + '%';


  updateChart(monthly, totalObligations, salary);


  document.getElementById('sbMonthly').textContent     = fmtNum(Math.round(monthly))    + ' ريال';
  document.getElementById('sbRate').textContent        = rate.toFixed(1)                 + '%';
  document.getElementById('sbTotalProfit').textContent = fmtNum(Math.round(totalProfit)) + ' ريال';


  setBankSubmitEligibility(dti < 30 && zone.key === 'green');

  updateAdvisor(color);
  setAdvisorText('جاري تحليل بياناتك...');

  const requestId = ++advisorRequestId;

  fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  salary: salary,
  loan_amount: loanAmount,
  years: duration,
  current_obligations: totalObligations,
  monthly_installment: monthly,
  debt_ratio: dti,
  remaining_income: salary - totalObligations - monthly,
  financing_type: type,
  applicant_age: ApplicantAge,
  expected_retirement_age: ExpectedRetirementAge,
  post_retirement_salary: PostRetirementSalary
})
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (requestId !== advisorRequestId) return;
      setAdvisorText(data.recommendation);
    })
    .catch(err => {
      if (requestId !== advisorRequestId) return;
      console.error("Backend error:", err);
      setAdvisorText('تعذر الاتصال بالمستشار الذكي');
    });
}


updateSidebarSlider(init.type);
updateDashboard();

/*
  محاكاة تقديم الطلب إلى البنك — لا يتم إرسال أي بيانات حقيقية،
  هذه محاكاة بصرية فقط لتكامل مستقبلي مع البنك.
*/
if (BANK_FLOW) {
  const confirmOverlay = document.getElementById('confirmOverlay');
  const processOverlay = document.getElementById('bankProcessOverlay');
  const processLoading = document.getElementById('bankProcessLoading');
  const processSuccess = document.getElementById('bankProcessSuccess');

  document.getElementById('submitToBankBtn').addEventListener('click', () => {
    confirmOverlay.classList.add('is-open');
  });

  document.getElementById('confirmCancelBtn').addEventListener('click', () => {
    confirmOverlay.classList.remove('is-open');
  });

  document.getElementById('confirmSubmitBtn').addEventListener('click', () => {
    confirmOverlay.classList.remove('is-open');
    processLoading.style.display = '';
    processSuccess.style.display = 'none';
    processOverlay.classList.add('is-open');

    setTimeout(() => {
      processLoading.style.display = 'none';
      processSuccess.style.display = '';
    }, 1800);
  });

  document.getElementById('backToBankBtn').addEventListener('click', () => {
    window.location.href = 'bank-home.html?submitted=1';
  });
}
