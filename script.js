'use strict';

const display = document.querySelector('.display');
const resultEl = document.querySelector('.result');
const expressionEl = document.querySelector('.expression');
const calculator = document.querySelector('.calculator');

let current = '0';
let expression = '';
let justEvaluated = false;
let hasError = false;

// ─── Render ────────────────────────────────────────────────────────────────

function render() {
  // Font size based on length
  resultEl.classList.remove('long', 'error');
  if (hasError) {
    resultEl.classList.add('error');
  } else if (current.length > 10) {
    resultEl.classList.add('long');
  }

  resultEl.textContent = current;
  expressionEl.textContent = expression;
}

// ─── Flash & Shake ─────────────────────────────────────────────────────────

function flashDisplay() {
  display.classList.remove('flash');
  void display.offsetWidth; // reflow
  display.classList.add('flash');
  display.addEventListener('animationend', () => display.classList.remove('flash'), { once: true });
}

function shakeCalc() {
  calculator.classList.remove('shake');
  void calculator.offsetWidth;
  calculator.classList.add('shake');
  calculator.addEventListener('animationend', () => calculator.classList.remove('shake'), { once: true });
}

// ─── Ripple ────────────────────────────────────────────────────────────────

function addRipple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = (e.clientX - rect.left) - size / 2;
  const y = (e.clientY - rect.top) - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ─── Format number ─────────────────────────────────────────────────────────

function formatNumber(num) {
  if (!isFinite(num)) return 'ERROR';
  // Limit to 12 significant digits
  let str = parseFloat(num.toPrecision(12)).toString();
  return str;
}

// ─── Core Logic ────────────────────────────────────────────────────────────

function inputDigit(digit) {
  if (hasError) { clear(); }
  if (justEvaluated) {
    current = digit;
    expression = '';
    justEvaluated = false;
  } else {
    if (current === '0' && digit !== '.') {
      current = digit;
    } else {
      if (current.length >= 15) return; // max digits
      current += digit;
    }
  }
  render();
}

function inputDecimal() {
  if (hasError) return;
  if (justEvaluated) { current = '0.'; expression = ''; justEvaluated = false; render(); return; }
  if (!current.includes('.')) {
    current += '.';
    render();
  }
}

function inputOperator(op) {
  if (hasError) return;
  justEvaluated = false;

  // Replace last operator if expression ends with one
  const lastChar = expression.trim().slice(-1);
  const ops = ['+', '-', '×', '÷', '%'];
  if (ops.includes(lastChar)) {
    expression = expression.slice(0, -2) + ' ' + op + ' ';
  } else {
    expression += current + ' ' + op + ' ';
    current = '0';
  }
  render();
}

function calculate() {
  if (hasError) return;
  if (!expression) return;

  const fullExpr = expression + current;
  expressionEl.textContent = fullExpr + ' =';

  // Replace display symbols with JS operators
  const jsExpr = fullExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/(\d)\s*%/g, '($1/100)');

  try {
    // Safe eval using Function
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + jsExpr + ')')();

    if (!isFinite(result) || isNaN(result)) {
      throw new Error('Math error');
    }

    current = formatNumber(result);
    expression = fullExpr + ' =';
    justEvaluated = true;
    hasError = false;
    flashDisplay();
  } catch {
    current = 'MATH ERROR';
    expression = '';
    hasError = true;
    shakeCalc();
  }

  render();
}

function clear() {
  current = '0';
  expression = '';
  justEvaluated = false;
  hasError = false;
  render();
}

function backspace() {
  if (hasError) { clear(); return; }
  if (justEvaluated) { clear(); return; }
  if (current.length <= 1 || current === '0') {
    current = '0';
  } else {
    current = current.slice(0, -1);
  }
  render();
}

function toggleSign() {
  if (hasError) return;
  if (current !== '0') {
    current = current.startsWith('-') ? current.slice(1) : '-' + current;
    render();
  }
}

// ─── Button Click Handler ──────────────────────────────────────────────────

document.querySelector('.btn-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  addRipple(btn, e);

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  switch (action) {
    case 'digit':    inputDigit(value); break;
    case 'decimal':  inputDecimal(); break;
    case 'operator': inputOperator(value); break;
    case 'equals':   calculate(); break;
    case 'clear':    clear(); break;
    case 'backspace':backspace(); break;
    case 'sign':     toggleSign(); break;
  }
});

// ─── Keyboard Support ─────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') { inputDigit(e.key); highlight(e.key); }
  else if (e.key === '.')           { inputDecimal(); }
  else if (e.key === '+')           { inputOperator('+'); highlight('+'); }
  else if (e.key === '-')           { inputOperator('-'); highlight('-'); }
  else if (e.key === '*')           { inputOperator('×'); highlight('×'); }
  else if (e.key === '/')           { e.preventDefault(); inputOperator('÷'); highlight('÷'); }
  else if (e.key === '%')           { inputOperator('%'); }
  else if (e.key === 'Enter' || e.key === '=') { calculate(); }
  else if (e.key === 'Backspace')   { backspace(); }
  else if (e.key === 'Escape')      { clear(); }
});

function highlight(key) {
  const btn = document.querySelector(`[data-value="${key}"]`);
  if (btn) {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = '', 100);
  }
}

// Initial render
render();
