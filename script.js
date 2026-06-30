
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  // squares -> background
  const GRID_ROWS = 9;
  const GRID_COLS = 12;
  const GRID_COLOR = 'rgba(148, 163, 184, 0.18)'; 

  // الخطوط
  const waves = [
   
    { r: 0.22, a: 10, f: 0.012, s: 0.28, c: 'rgba(37,  99, 235, 0.10)', w: 0.8 },
    { r: 0.34, a: 22, f: 0.008, s: 0.40, c: 'rgba(37,  99, 235, 0.14)', w: 1.1 },
    { r: 0.46, a: 14, f: 0.015, s: 0.22, c: 'rgba(37,  99, 235, 0.08)', w: 0.7 },
    { r: 0.56, a: 30, f: 0.010, s: 0.50, c: 'rgba(37,  99, 235, 0.16)', w: 1.3 }, 
    { r: 0.66, a: 12, f: 0.009, s: 0.32, c: 'rgba(37,  99, 235, 0.09)', w: 0.7 },
    { r: 0.76, a: 20, f: 0.013, s: 0.45, c: 'rgba(37,  99, 235, 0.11)', w: 0.9 },
    { r: 0.86, a:  8, f: 0.017, s: 0.18, c: 'rgba(37,  99, 235, 0.07)', w: 0.6 },
  ];

  // تعتمد على ابعاد الشاشه
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function drawGrid() {
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth   = 0.5;

    const rowStep = H / GRID_ROWS;
    for (let i = 1; i < GRID_ROWS; i++) {
      const y = i * rowStep;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const colStep = W / GRID_COLS;
    for (let j = 1; j < GRID_COLS; j++) {
      const x = j * colStep;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  function drawWave(wave, t) {
    const baseY = wave.r * H;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const y = baseY + Math.sin(x * wave.f + t * wave.s) * wave.a;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = wave.c;
    ctx.lineWidth   = wave.w;
    ctx.stroke();
  }


  function animate(timestamp) {
    ctx.clearRect(0, 0, W, H);
    const t = timestamp * 0.001;
    drawGrid();
    waves.forEach(w => drawWave(w, t));
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);
})();

////
