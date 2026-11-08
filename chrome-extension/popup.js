import { UNITS, SAMPLE_DISH, costDish, lineCost, isCompatible } from './lib/foodCost.js';

const STORAGE_KEY = 'currentDish';
const UNIT_ORDER = ['kg', 'g', 'L', 'ml', 'each', 'dozen', 'lb', 'oz', 'gal', 'qt', 'fl oz'];
const $ = (id) => document.getElementById(id);

// chrome.storage.local when running as an extension; nothing when opened as a plain file.
const store = globalThis.chrome && chrome.storage && chrome.storage.local ? chrome.storage.local : null;

const money = (n) =>
  Number.isFinite(n) ? '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '–';
const pct = (n) => (Number.isFinite(n) ? n.toFixed(1) + '%' : '–');

const exampleState = () => ({
  dish: SAMPLE_DISH.name,
  menuPrice: String(SAMPLE_DISH.menuPrice),
  taxRate: String(SAMPLE_DISH.taxRate),
  targetPct: String(SAMPLE_DISH.targetPct),
  ingredients: SAMPLE_DISH.ingredients.map((r) => ({
    name: r.name,
    packPrice: r.packPrice.toFixed(2),
    packSize: String(r.packSize),
    packUnit: r.packUnit,
    qtyUsed: String(r.qtyUsed),
    qtyUnit: r.qtyUnit,
    yieldPct: String(r.yieldPct),
  })),
});
const blankIngredient = () => ({ name: '', packPrice: '', packSize: '1', packUnit: 'kg', qtyUsed: '', qtyUnit: 'g', yieldPct: '100' });
const blankState = () => ({ dish: '', menuPrice: '', taxRate: '0.1', targetPct: '30', ingredients: [blankIngredient(), blankIngredient(), blankIngredient()] });

let state = exampleState();

// ---------------------------------------------------------------- persistence
let saveTimer = 0;
function save() {
  if (!store) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set({ [STORAGE_KEY]: state }), 250);
}
async function load() {
  if (!store) return;
  try {
    const got = await store.get(STORAGE_KEY);
    const s = got && got[STORAGE_KEY];
    if (s && Array.isArray(s.ingredients)) state = { ...blankState(), ...s };
  } catch {
    /* keep the example */
  }
}

// ---------------------------------------------------------------- rendering
const tpl = $('ing-tpl');
const list = $('ings');

function fillUnits(select, value) {
  select.replaceChildren(
    ...UNIT_ORDER.filter((u) => UNITS[u]).map((u) => {
      const o = document.createElement('option');
      o.value = u;
      o.textContent = u;
      return o;
    }),
  );
  select.value = UNITS[value] ? value : 'kg';
}

function renderRows() {
  list.replaceChildren();
  state.ingredients.forEach((ing, i) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    li.dataset.index = String(i);
    li.querySelector('.i-name').value = ing.name;
    li.querySelector('.i-price').value = ing.packPrice;
    li.querySelector('.i-size').value = ing.packSize;
    fillUnits(li.querySelector('.i-punit'), ing.packUnit);
    li.querySelector('.i-qty').value = ing.qtyUsed;
    fillUnits(li.querySelector('.i-qunit'), ing.qtyUnit);
    li.querySelector('.i-yield').value = ing.yieldPct;
    const n = i + 1;
    for (const [sel, label] of [
      ['.i-price', 'Pack price'], ['.i-size', 'Pack size'], ['.i-punit', 'Pack unit'],
      ['.i-qty', 'Quantity used'], ['.i-qunit', 'Quantity unit'], ['.i-yield', 'Yield percent'],
    ]) li.querySelector(sel).setAttribute('aria-label', `${label}, ingredient ${n}`);
    list.appendChild(li);
  });
}

function renderInputs() {
  $('dish').value = state.dish;
  $('price').value = state.menuPrice;
  $('target').value = state.targetPct;
  $('tax').value = state.taxRate === '0' || state.taxRate === 0 ? '0' : '0.1';
  renderRows();
}

function compute() {
  const taxRate = parseFloat(state.taxRate) || 0;
  const r = costDish({ ingredients: state.ingredients, menuPrice: state.menuPrice, taxRate, targetPct: state.targetPct });
  const target = parseFloat(state.targetPct) || 30;

  // per-line costs
  list.querySelectorAll('.ing').forEach((li) => {
    const ing = state.ingredients[Number(li.dataset.index)];
    const ok = isCompatible(ing.packUnit, ing.qtyUnit);
    li.classList.toggle('bad', !ok);
    li.querySelector('.i-err').hidden = ok;
    li.querySelector('.i-cost').textContent = ok ? money(lineCost(ing)) : '–';
  });

  $('out-fc').textContent = pct(r.foodCostPct);
  $('out-plate').textContent = money(r.plateCost);
  $('out-gp').innerHTML = '';
  $('out-gp').append(money(r.grossProfit));
  if (Number.isFinite(r.gpPct)) {
    const s = document.createElement('small');
    s.textContent = ` ${r.gpPct.toFixed(0)}%`;
    $('out-gp').append(s);
  }
  $('out-target-label').textContent = `Price at ${target}%`;
  $('out-sugg').textContent = money(r.menuPriceAtTarget);

  const chip = $('out-status');
  const verdict = $('out-verdict');
  chip.className = 'chip';
  verdict.className = 'verdict';
  if (r.hasMismatch) {
    chip.hidden = false;
    chip.classList.add('warn');
    chip.textContent = 'Check units';
    verdict.textContent = 'One line mixes weight, volume and count. It is left out of the plate cost until the units match.';
  } else if (!r.status) {
    chip.hidden = true;
    verdict.textContent = 'Enter a menu price to see your food cost.';
  } else {
    chip.hidden = false;
    chip.classList.add(r.status);
    chip.textContent = r.statusLabel;
    const incl = taxRate > 0 ? ' incl GST' : '';
    if (r.status === 'over') {
      verdict.classList.add('over');
      verdict.textContent = `Over by ${(r.foodCostPct - target).toFixed(1)} points. ${money(r.menuPriceAtTarget)}${incl} on the menu would bring it back to ${target}%.`;
    } else if (r.status === 'under') {
      verdict.textContent = 'Well under target. This dish is carrying margin for the rest of the menu.';
    } else {
      verdict.textContent = 'On target. Watch the most expensive line: it moves most when supplier prices change.';
    }
  }
}

// ---------------------------------------------------------------- events
const FIELD = { 'i-name': 'name', 'i-price': 'packPrice', 'i-size': 'packSize', 'i-punit': 'packUnit', 'i-qty': 'qtyUsed', 'i-qunit': 'qtyUnit', 'i-yield': 'yieldPct' };

function onRowInput(e) {
  const li = e.target.closest('.ing');
  if (!li) return;
  const key = Object.keys(FIELD).find((c) => e.target.classList.contains(c));
  if (!key) return;
  state.ingredients[Number(li.dataset.index)][FIELD[key]] = e.target.value;
  compute();
  save();
}
list.addEventListener('input', onRowInput);
list.addEventListener('change', onRowInput);
list.addEventListener('click', (e) => {
  const btn = e.target.closest('.i-del');
  if (!btn) return;
  const i = Number(btn.closest('.ing').dataset.index);
  state.ingredients.splice(i, 1);
  renderRows();
  compute();
  save();
  const next = list.querySelectorAll('.i-del')[Math.min(i, state.ingredients.length - 1)];
  (next || $('add')).focus();
});

for (const [id, key] of [['dish', 'dish'], ['price', 'menuPrice'], ['target', 'targetPct'], ['tax', 'taxRate']]) {
  const el = $(id);
  const handler = () => {
    state[key] = el.value;
    compute();
    save();
  };
  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
}

$('add').addEventListener('click', () => {
  state.ingredients.push(blankIngredient());
  renderRows();
  compute();
  save();
  list.lastElementChild.querySelector('.i-name').focus();
});
$('example').addEventListener('click', () => {
  state = exampleState();
  renderInputs();
  compute();
  save();
});
$('clear').addEventListener('click', () => {
  state = blankState();
  renderInputs();
  compute();
  save();
  $('dish').focus();
});

await load();
renderInputs();
compute();
document.documentElement.dataset.ready = '1';
