
const saved    = JSON.parse(localStorage.getItem('qararikData') || '{}');
const DEFAULTS = { type: 'personal', salary: 10000, loanAmount: 50000, duration: 3, obligations: 0 };
const init     = { ...DEFAULTS, ...saved };


document.getElementById('dashType').value        = init.type;
document.getElementById('dashSalary').value      = init.salary;
document.getElementById('dashLoan').value        = init.loanAmount;
document.getElementById('dashDuration').value    = init.duration;
document.getElementById('dashObligations').value = init.obligations;


let needleAngle = -90;
let animId      = null;

/* ================================================================
   ④ حساب نسبة الربح (Risk-Based Pricing)
      شخصي : تبدأ 3.0% + 0.2% لكل سنة إضافية
      عقاري: تبدأ 4.0% + 0.1% لكل سنة إضافية
              + 0.5% إذا القرض > 25 ضعف الراتب الشهري
================================================================ */
function calcProfitRate(type, salary, loanAmount, years) {
  if (type === 'personal') {
    return 3.0 + (years - 1) * 0.2;
  } else {
    let rate = 4.0 + (years - 1) * 0.1;
    if (salary > 0 && loanAmount > salary * 25) rate += 0.5;
    return rate;
  }
}

/* ================================================================
   ⑤ حساب القسط بمعادلة الأقساط المتناقصة (Annuity Formula)
      القسط = P × [r(1+r)^n] / [(1+r)^n - 1]
      r = معدل شهري (نسبة سنوية ÷ 12)
      n = عدد الأشهر (سنوات × 12)
================================================================ */
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

/* ================================================================
   ⑥ حساب نسبة الاستقطاع الكلية DTI (Debt-To-Income)
      DTI = ((القسط الجديد + الالتزامات الشهرية) ÷ الراتب) × 100
================================================================ */
function calcDTI(monthly, obligations, salary) {
  if (salary <= 0) return 0;
  return ((monthly + obligations) / salary) * 100;
}

/* ================================================================
   ⑦ تحديد المنطقة بناءً على معايير ساما الرسمية (DTI)
      ≤ 33%        → أمان مالي
      34% – 45%    → ضغط مالي مقبول
      > 45%        → منطقة خطر (تجاوز الحد النظامي)
================================================================ */
function getZone(dti) {
  if (dti <= 33) return { key: 'green',  color: '#22c55e', label: 'أمان مالي'                      };
  if (dti <= 45) return { key: 'orange', color: '#f97316', label: 'ضغط مالي مقبول'                 };
  return               { key: 'red',    color: '#ef4444', label: 'منطقة خطر (تجاوز الحد النظامي)' };
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


const AI_MESSAGES = {
  green:  'وضوحك المالي في أمان! 🟢 نسبتك المئوية في حدود الأمان الرسمية، والفائض المتبقي في جيبك ممتاز لإدارة حياتك براحة تامة.',
  orange: 'دخلت منطقة الضغط المالي المقبول نظاماً. ⚠️ الأقساط تأخذ مساحة من راتبك، لكن ميزانيتك قادرة على الصمود لوجود فائض نقدي جيد في جيبك.',
  red:    'يا ليت تعيد النظر فوراً! النسبة هنا تجاوزت الحد الأعلى المسموح به من البنك المركزي (45%). 🚨 القرار مرفوض نظاماً وسيقوم البنك برفض المعاملة لحمايتك من التعثر.'
};


function updateAdvisor(zoneKey, color) {
  const panel  = document.getElementById('advisorPanel');
  const dot    = document.getElementById('advisorDot');
  const textEl = document.getElementById('advisorText');

  dot.style.background         = color;
  panel.style.borderRightColor = color;

  textEl.style.opacity = '0';
  setTimeout(() => {
    textEl.textContent   = AI_MESSAGES[zoneKey];
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


function fmtNum(n) { return n.toLocaleString('ar-SA'); }


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


function updateDashboard() {
  const type        = document.getElementById('dashType').value;
  const salary      = +document.getElementById('dashSalary').value      || 0;
  const loanAmount  = +document.getElementById('dashLoan').value        || 0;
  const duration    = +document.getElementById('dashDuration').value    || 1;
  const obligations = +document.getElementById('dashObligations').value || 0;

  if (salary <= 0 || loanAmount <= 0) return;

  const rate                     = calcProfitRate(type, salary, loanAmount, duration);
  const { monthly, totalProfit } = calcPayment(loanAmount, rate, duration);
  const dti                      = calcDTI(monthly, obligations, salary);
  const { key, color, label }    = getZone(dti);


  animateNeedle(-90 + (Math.min(dti, 100) / 100) * 180);


  const dtiEl  = document.getElementById('gaugeDTI');
  const zoneEl = document.getElementById('gaugeZone');
  dtiEl.textContent  = Math.round(dti) + '%';
  dtiEl.style.color  = color;
  zoneEl.textContent = label;
  zoneEl.style.color = color;

 
  document.getElementById('gaugeMonthly').textContent = fmtNum(Math.round(monthly)) + ' ريال';
  document.getElementById('gaugeRate').textContent    = rate.toFixed(1) + '%';


  updateChart(monthly, obligations, salary);


  document.getElementById('sbMonthly').textContent     = fmtNum(Math.round(monthly))    + ' ريال';
  document.getElementById('sbRate').textContent        = rate.toFixed(1)                 + '%';
  document.getElementById('sbTotalProfit').textContent = fmtNum(Math.round(totalProfit)) + ' ريال';


  updateAdvisor(key, color);
}


updateSidebarSlider(init.type);
updateDashboard();

