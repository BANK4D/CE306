// ===== State =====
const STORAGE_KEY = 'ledgerTransactions';
let transactions = loadTransactions();

// ===== DOM references =====
const entryForm = document.getElementById('entryForm');
const itemNameInput = document.getElementById('itemName');
const itemAmountInput = document.getElementById('itemAmount');
const itemTypeSelect = document.getElementById('itemType');
const itemCategorySelect = document.getElementById('itemCategory');
const customCategoryField = document.getElementById('customCategoryField');
const customCategoryInput = document.getElementById('customCategory');

const searchInput = document.getElementById('searchInput');
const historyList = document.getElementById('historyList');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAllBtn');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const totalBalanceEl = document.getElementById('totalBalance');

// ===== Storage helpers =====
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('อ่านข้อมูลไม่สำเร็จ', e);
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// ===== Formatting =====
function formatBaht(amount) {
  return '฿' + amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== Category select toggle (task 1: custom category) =====
itemCategorySelect.addEventListener('change', () => {
  const isOther = itemCategorySelect.value === 'other';
  customCategoryField.hidden = !isOther;
  customCategoryInput.required = isOther;
  if (isOther) customCategoryInput.focus();
});

// ===== Add transaction (task 1) =====
entryForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const amount = parseFloat(itemAmountInput.value);
  const type = itemTypeSelect.value;
  let category = itemCategorySelect.value;

  if (category === 'other') {
    category = customCategoryInput.value.trim() || 'อื่นๆ';
  }

  if (!name || isNaN(amount) || amount <= 0) return;

  const nextId = transactions.length
    ? Math.max(...transactions.map(t => t.id)) + 1
    : 1;

  transactions.push({ id: nextId, name, amount, type, category });
  saveTransactions();

  entryForm.reset();
  customCategoryField.hidden = true;

  render();
});

// ===== Search / filter (task 2, real-time) =====
searchInput.addEventListener('input', render);

// ===== Clear all (task 5) =====
clearAllBtn.addEventListener('click', () => {
  if (transactions.length === 0) return;
  const confirmed = confirm('ต้องการล้างข้อมูลรายการทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้');
  if (confirmed) {
    transactions = [];
    saveTransactions();
    render();
  }
});

// ===== Render history list (task 1 + task 3) =====
function render() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = transactions.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.category.toLowerCase().includes(query)
  );

  historyList.innerHTML = '';

  filtered.forEach((t, index) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <span class="h-id">${index + 1}</span>
      <span class="h-type ${t.type}">${t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span>
      <span class="h-main">
        <span class="h-name">${escapeHtml(t.name)}</span>
        <span class="h-category">${escapeHtml(t.category)}</span>
      </span>
      <span class="h-amount ${t.type}">${t.type === 'expense' ? '-' : '+'}${formatBaht(t.amount)}</span>
    `;
    historyList.appendChild(li);
  });

  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';

  updateSummary();
}

// ===== Summary (task 4) =====
function updateSummary() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  totalIncomeEl.textContent = formatBaht(totalIncome);
  totalExpenseEl.textContent = formatBaht(totalExpense);
  totalBalanceEl.textContent = formatBaht(balance);
}

// ===== Utility: prevent HTML injection from user input =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== Init =====
render();