
// ========== TAB NAVIGATION ==========
const TAB_MAP = {
  'tinh-gia': 'page-tinh-gia',
  'thong-ke': 'page-thong-ke',
  'ads-gmv': 'page-ads-gmv',
  'phan-tich-gmv-max': 'page-phan-tich-gmv-max',
  'quan-ly-san-pham': 'page-quan-ly-san-pham',
  'roi-huy': 'page-roi-huy',
  'khung-gio': 'page-khung-gio',
  'bao-cao': 'page-bao-cao',
  'bao-cao-chua': 'page-bao-cao-chua',
  'huong-dan': 'page-huong-dan',
  'ho-tro': 'page-ho-tro',
  'sp-tinh-gia': 'page-sp-tinh-gia',
  'sp-thong-ke': 'page-sp-thong-ke',
  'sp-roi-huy': 'page-sp-roi-huy',
  'sp-khung-gio': 'page-sp-khung-gio',
  'sp-bao-cao': 'page-sp-bao-cao',
};

let currentSpPage = null;

function swapShopeeIds(pageEl, addPrefix) {
  // When entering Shopee page: remove sp_ prefix from all IDs so functions work
  // When leaving: add sp_ prefix back to avoid conflicts
  const els = pageEl.querySelectorAll('[id]');
  els.forEach(el => {
    if (el.id === 'page-sp-tinh-gia') return;
    if (addPrefix && !el.id.startsWith('sp_')) {
      el.id = 'sp_' + el.id;
    } else if (!addPrefix && el.id.startsWith('sp_')) {
      el.id = el.id.substring(3);
    }
  });
}

function toggleBaoCao() {
  const group = document.getElementById('subGroup-bao-cao');
  const isActive = document.getElementById('tab-bao-cao').classList.contains('active');
  if (isActive && group.classList.contains('show')) {
    group.classList.remove('show');
  } else {
    switchTab('bao-cao');
  }
}

function switchTab(tabId) {
  const tabEl = document.getElementById('tab-' + tabId);
  if (tabEl && tabEl.classList.contains('coming')) return;

  // Check sub-tab coming state
  const subTabCheck = document.getElementById('subtab-' + tabId);
  if (subTabCheck && subTabCheck.classList.contains('coming')) return;

  // If leaving Shopee tinh-gia, restore sp_ prefix
  if (currentSpPage) {
    swapShopeeIds(currentSpPage, true);
    currentSpPage = null;
  }

  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));

  // Activate tab (or parent tab for sub-tabs)
  const parentMap = { 'bao-cao': 'bao-cao', 'bao-cao-chua': 'bao-cao' };
  const parentId = parentMap[tabId];
  const activeTabEl = tabEl || (parentId ? document.getElementById('tab-' + parentId) : null);
  if (activeTabEl) activeTabEl.classList.add('active');

  const pageEl = document.getElementById(TAB_MAP[tabId]);
  if (pageEl) pageEl.classList.add('active');

  // Toggle sub-tabs active state and visibility
  document.querySelectorAll('.nav-sub-group').forEach(g => g.classList.remove('show'));
  document.querySelectorAll('.nav-sub-tab').forEach(t => t.classList.remove('active'));
  if (parentId) {
    const group = document.getElementById('subGroup-' + parentId);
    if (group) group.classList.add('show');
    if (subTabCheck) subTabCheck.classList.add('active');
  }

  // If entering Shopee tinh-gia, remove sp_ prefix so all functions work
  if (tabId === 'sp-tinh-gia') {
    // First, add sp_ prefix to TikTok page to avoid conflicts
    const tikPage = document.getElementById('page-tinh-gia');
    if (tikPage) {
      tikPage.querySelectorAll('[id]').forEach(el => {
        if (el.id === 'page-tinh-gia') return;
        el.id = 'tik_' + el.id;
      });
    }
    swapShopeeIds(pageEl, false);
    currentSpPage = pageEl;
    // Swap commission data to Shopee
    COMMISSION_DATA = window.SHOPEE_COMMISSION_DATA || COMMISSION_DATA;
    initCategorySearch();
    const opsContainer = document.getElementById('shopOpsRows');
    if (opsContainer && opsContainer.children.length === 0) {
      setCostRows('shopOpsRows', DEFAULT_SHOP_OPS_ROWS);
    }
    const packContainer = document.getElementById('packCostRows');
    if (packContainer && packContainer.children.length === 0) {
      setCostRows('packCostRows', DEFAULT_PACK_COST_ROWS);
    }
    // Trigger recalc for Shopee
    recalc();
  } else if (tabId === 'tinh-gia') {
    // Restore TikTok IDs if they were prefixed
    const tikPage = document.getElementById('page-tinh-gia');
    if (tikPage) {
      tikPage.querySelectorAll('[id]').forEach(el => {
        if (el.id.startsWith('tik_')) {
          el.id = el.id.substring(4);
        }
      });
    }
    // Swap commission data back to TikTok
    COMMISSION_DATA = window.COMMISSION_DATA_LOCAL || COMMISSION_DATA;
    initCategorySearch();
    // Đặt lại chế độ Hộ KD / Công ty: lúc ở trang Shopee các id bị đổi tiền tố
    // nên khối Công ty không được cập nhật. Gọi lại để bày đúng, có recalc() sẵn.
    setHinhThuc(hinhThucKD);
  }

  // Về đầu trang khi đổi tab — nếu không, đang cuộn giữa trang cũ thì trang mới
  // hiện ra ở lưng chừng, nhìn như tab chưa nhảy và phải bấm lần 2.
  // Nhớ tab đang xem để tải lại trang thì quay về đúng chỗ, không nhảy về
  // "Tính Giá Bán" làm mất chỗ đang làm dở.
  try { localStorage.setItem(TAB_DANG_XEM, tabId); } catch (e) {}

  window.scrollTo(0, 0);
}

const TAB_DANG_XEM = 'hadaplus_tab_dang_xem';
const TC_KEY = 'hadaplus_da_ghi_truy_cap';   // nhớ đã ghi lượt truy cập ngày nào

// Mở lại đúng tab lần trước. Bỏ qua nếu tab đó không còn hoặc đang khoá.
function moLaiTabCu() {
  var t;
  try { t = localStorage.getItem(TAB_DANG_XEM); } catch (e) { return; }
  if (!t || t === 'tinh-gia' || !TAB_MAP[t]) return;
  if (!document.getElementById(TAB_MAP[t])) return;
  var nut = document.getElementById('tab-' + t);
  if (nut && nut.classList.contains('coming')) return;
  switchTab(t);
}

// ========== COMMISSION DATA ==========
let COMMISSION_DATA = null;

// ========== STATE ==========
let sellerType = 'standard';
let products = [];
const LOCAL_PRODUCTS_KEY = 'tiktok_products';
const SUPABASE_CONFIG = {
  url: 'https://qotrwydgsnpqzvausldc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdHJ3eWRnc25wcXp2YXVzbGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjkyOTgsImV4cCI6MjA4ODg0NTI5OH0.Fl3zryvbRjfwuDWg_s1d-4UDTp3Hmn4RcuxY-YBCYXk',
  bucket: 'tiktok-data',
  getPath: function() {
    var uid = window._currentUserId || 'anonymous';
    return uid + '/products.json';
  }
};
let supabaseClient = null;

// ── Lưu / tải danh sách sản phẩm ─────────────────────────────────────────
// Nguyên tắc: KHÔNG BAO GIỜ để F5 làm mất thứ khách vừa thấy trên màn hình.
//   - Mỗi bản danh sách mang một mốc thời gian (capNhat). Máy và cloud, bản nào
//     mới hơn thì thắng. Trước đây cloud luôn ghi đè máy, nên chỉ cần một lần
//     lưu cloud bị lỗi là F5 tải về bản cũ và xoá mất sản phẩm vừa thêm.
//   - Dùng chung kết nối đăng nhập của trang (window.__sb), không tạo kết nối
//     thứ hai: hai kết nối cùng tự làm mới token sẽ giẫm chân nhau.
//   - Chỉ đồng bộ khi đã biết người dùng là ai, không bao giờ ghi vào "anonymous".
const LOCAL_PRODUCTS_TIME = 'tiktok_products_capnhat';

function initSupabaseStorage() {
  supabaseClient = window.__sb || null;   // null -> chỉ lưu trên máy
}

function docSpMay() {
  var items = [];
  try { items = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '[]'); } catch (e) {}
  var t = 0;
  try { t = +(localStorage.getItem(LOCAL_PRODUCTS_TIME) || 0) || 0; } catch (e) {}
  return { items: Array.isArray(items) ? items : [], capNhat: t };
}

function ghiSpMay(items, capNhat) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(items));
    localStorage.setItem(LOCAL_PRODUCTS_TIME, String(capNhat));
  } catch (e) { console.warn('Không lưu được vào máy:', e); }
}

// Chọn bản nào để dùng. Trả về: 'cloud' (lấy cloud về) | 'day' (đẩy bản máy lên) | 'giu'
function chonBanSP(may, cloud) {
  if (!cloud) return may.items.length ? 'day' : 'giu';
  if (cloud.capNhat > may.capNhat) return 'cloud';
  if (may.capNhat > cloud.capNhat) return 'day';
  // Bằng nhau — thường là cả hai đều là dữ liệu cũ, chưa có mốc thời gian
  if (!may.items.length && cloud.items.length) return 'cloud';   // máy mới, chưa có gì
  if (may.items.length && cloud.capNhat === 0) return 'day';     // giữ bản đang thấy
  return 'giu';
}

function choDangNhap(toiDa) {
  return new Promise(function (xong) {
    if (window._currentUserId) return xong(window._currentUserId);
    var batDau = Date.now();
    var h = setInterval(function () {                // chỉ đọc biến, không gọi mạng
      if (window._currentUserId) { clearInterval(h); xong(window._currentUserId); }
      else if (Date.now() - batDau > toiDa) { clearInterval(h); xong(null); }
    }, 200);
  });
}

async function dayLenCloud(items, capNhat) {
  var uid = window._currentUserId;
  if (!uid || !supabaseClient) return false;
  var body = JSON.stringify({ v: 2, capNhat: capNhat, items: items });
  var r = await supabaseClient.storage.from(SUPABASE_CONFIG.bucket).upload(
    uid + '/products.json',
    new Blob([body], { type: 'application/json' }),
    { upsert: true, contentType: 'application/json' });
  if (r && r.error) {
    // Không mất dữ liệu: bản trên máy vẫn còn và mới hơn, lần mở sau sẽ đẩy lại
    console.warn('Lưu danh sách sản phẩm lên cloud lỗi:', r.error.message || r.error);
    return false;
  }
  return true;
}

async function dongBoCloud() {
  if (!supabaseClient) return;
  var uid = await choDangNhap(20000);
  if (!uid) return;
  var may = docSpMay(), cloud = null;
  try {
    var r = await supabaseClient.storage.from(SUPABASE_CONFIG.bucket).download(uid + '/products.json');
    if (r && !r.error && r.data) {
      var raw = JSON.parse((await r.data.text()) || '[]');
      cloud = Array.isArray(raw)
        ? { items: raw, capNhat: 0 }                                  // file kiểu cũ
        : { items: Array.isArray(raw.items) ? raw.items : [], capNhat: +raw.capNhat || 0 };
    }
  } catch (e) {
    console.warn('Tải danh sách sản phẩm từ cloud lỗi — giữ bản trên máy.', e);
    return;
  }

  var chon = chonBanSP(may, cloud);
  if (chon === 'cloud') {
    products = cloud.items;
    ghiSpMay(products, cloud.capNhat);
    try { renderTable(); } catch (e) {}
  } else if (chon === 'day') {
    var t = may.capNhat || Date.now();
    ghiSpMay(may.items, t);
    await dayLenCloud(may.items, t);
  }
}

async function loadProducts() {
  products = docSpMay().items;          // hiện ngay bản trên máy, không chờ mạng
  dongBoCloud();                        // đồng bộ chạy nền, xong sẽ tự vẽ lại bảng
}

async function loadCommissionData() {
  if (typeof window.COMMISSION_DATA_LOCAL !== 'undefined') {
    COMMISSION_DATA = window.COMMISSION_DATA_LOCAL;
    console.log('[Commission] Loaded from local file ✅');
  } else {
    COMMISSION_DATA = {};
    console.error('[Commission] ERROR: commission_data_full.js not loaded! Make sure file is in same folder.');
  }
}

// ========== HELPERS ==========
function fmt(n) {
  if (n == null || isNaN(n)) return '--';
  return Math.round(n).toLocaleString('vi-VN');
}
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function fmtMoneyInput(el) {
  const pos = el.selectionStart;
  const oldLen = el.value.length;
  const raw = el.value.replace(/[^\d]/g, '');
  el.value = raw ? parseInt(raw).toLocaleString('vi-VN') : '';
  const newLen = el.value.length;
  el.setSelectionRange(pos + newLen - oldLen, pos + newLen - oldLen);
}
function getMoneyVal(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseFloat(el.value.replace(/[.\s]/g, '')) || 0;
}
function setEl(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

// Context prefix for Shopee/TikTok page
let activeCalcPrefix = '';
function el(id) { return document.getElementById(activeCalcPrefix ? activeCalcPrefix + '_' + id : id); }
function elV(id) { const e = el(id); return e ? (e.value || '') : ''; }
function elN(id) { return parseFloat(elV(id)) || 0; }

// Prefix-aware wrapper: temporarily override getElementById for Shopee context
function withPrefix(prefix, fn) {
  const origGetById = document.getElementById.bind(document);
  if (prefix) {
    document.getElementById = function(id) {
      // Try prefixed first, fallback to original
      return origGetById(prefix + '_' + id) || origGetById(id);
    };
  }
  try { fn(); } finally {
    if (prefix) document.getElementById = origGetById;
  }
}
function fmtPercent(n) {
  if (n == null || isNaN(n)) return '--';
  return n.toFixed(1) + '%';
}

// ========== SELLER TYPE ==========
function setSellerType(type) {
    sellerType = type;
    document.getElementById('btnStandard').classList.toggle('active', type === 'standard');
    document.getElementById('btnMall').classList.toggle('active', type === 'mall');
    if (selectedCat) {
      const rate = COMMISSION_DATA[selectedCat.cat1]?.[sellerType]?.[selectedCat.cat2]?.[selectedCat.cat3]?.rate;
      if (rate != null) {
        selectedCat.rate = rate;
        document.getElementById('catCommission').textContent = rate.toFixed(1) + '%';
        document.getElementById('feeCommission').value = rate;
        document.getElementById('selectedCatRate').textContent = rate.toFixed(1) + '%';
      }
    }
    recalc();
}

// ========== CATEGORY SEARCH ==========
let selectedCat = null;
let acActiveIndex = -1;
let allCategories = [];

function buildCategoryList() {
  allCategories = [];
  for (const [cat1, types] of Object.entries(COMMISSION_DATA)) {
    for (const [cat2, items] of Object.entries(types.standard)) {
      for (const [cat3, data] of Object.entries(items)) {
        allCategories.push({
          cat1, cat2, cat3,
          standardRate: data.rate,
          mallRate: COMMISSION_DATA[cat1]?.mall?.[cat2]?.[cat3]?.rate || data.rate,
          searchText: (cat1 + ' ' + cat2 + ' ' + cat3).toLowerCase()
        });
      }
    }
  }
}

function getCatRate(cat) {
  return sellerType === 'mall' ? cat.mallRate : cat.standardRate;
}

function highlightMatch(text, query) {
  if (!query) return text;
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  let result = text;
  for (const word of words) {
    const regex = new RegExp('(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    result = result.replace(regex, '<span class="highlight">$1</span>');
  }
  return result;
}

function searchCategories(query) {
  if (!query || query.length < 1) return allCategories.slice(0, 15);
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const scored = allCategories.map(cat => {
    let score = 0;
    const text = cat.searchText;
    for (const word of words) {
      if (text.includes(word)) {
        score += 10;
        if (cat.cat3.toLowerCase().includes(word)) score += 20;
        if (cat.cat3.toLowerCase().startsWith(word)) score += 10;
      }
    }
    return { ...cat, score };
  }).filter(c => c.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}

function renderDropdown(results, query) {
  const dropdown = document.getElementById('acDropdown');
  if (results.length === 0) {
    dropdown.innerHTML = '<div class="ac-hint">Không tìm thấy ngành hàng phù hợp.</div>';
    dropdown.classList.add('show');
    return;
  }
  let html = '';
  let lastCat1 = '';
  results.forEach((cat, i) => {
    if (cat.cat1 !== lastCat1) {
      lastCat1 = cat.cat1;
      html += `<div class="ac-group-label">${cat.cat1}</div>`;
    }
    const path = `${cat.cat2} › ${cat.cat3}`;
    const highlighted = highlightMatch(path, query);
    const rate = getCatRate(cat);
    html += `<div class="ac-item${i === acActiveIndex ? ' active' : ''}" data-index="${i}" onmousedown="selectCategory(${i})" onmouseenter="acActiveIndex=${i}">
      <div class="ac-item-path">${highlighted}</div>
      <div class="ac-item-rate">${rate.toFixed(1)}%</div>
    </div>`;
  });
  dropdown.innerHTML = html;
  dropdown.classList.add('show');
}

let currentResults = [];

function onCatSearchInput() {
  const input = document.getElementById('catSearch');
  const clearBtn = document.getElementById('searchClear');
  const query = input.value.trim();
  clearBtn.style.display = query ? 'block' : 'none';
  acActiveIndex = -1;
  currentResults = searchCategories(query);
  renderDropdown(currentResults, query);
}

function onCatSearchFocus() {
  const query = document.getElementById('catSearch').value.trim();
  currentResults = searchCategories(query);
  renderDropdown(currentResults, query);
}

function onCatSearchBlur() {
  setTimeout(() => {
    document.getElementById('acDropdown').classList.remove('show');
  }, 200);
}

function onCatSearchKeydown(e) {
  const dropdown = document.getElementById('acDropdown');
  if (!dropdown.classList.contains('show')) return;
  const items = dropdown.querySelectorAll('.ac-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    acActiveIndex = Math.min(acActiveIndex + 1, items.length - 1);
    updateActiveItem(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    acActiveIndex = Math.max(acActiveIndex - 1, 0);
    updateActiveItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (acActiveIndex >= 0 && acActiveIndex < currentResults.length) selectCategory(acActiveIndex);
  } else if (e.key === 'Escape') {
    dropdown.classList.remove('show');
    document.getElementById('catSearch').blur();
  }
}

function updateActiveItem(items) {
  items.forEach((item, i) => {
    item.classList.toggle('active', i === acActiveIndex);
    if (i === acActiveIndex) item.scrollIntoView({ block: 'nearest' });
  });
}

function selectCategory(index) {
  const cat = currentResults[index];
  if (!cat) return;
  const rate = getCatRate(cat);
  selectedCat = { cat1: cat.cat1, cat2: cat.cat2, cat3: cat.cat3, rate };
  document.getElementById('catCommission').textContent = rate.toFixed(1) + '%';
  document.getElementById('feeCommission').value = rate;
  const selDiv = document.getElementById('selectedCategory');
  document.getElementById('selectedCatPath').innerHTML =
    `<span>${cat.cat1} ›</span> ${cat.cat2} › <strong>${cat.cat3}</strong>`;
  document.getElementById('selectedCatRate').textContent = rate.toFixed(1) + '%';
  selDiv.style.display = 'flex';
  document.getElementById('catSearch').value = '';
  document.getElementById('searchClear').style.display = 'none';
  document.getElementById('acDropdown').classList.remove('show');
  recalc();
}

function clearCatSearch() {
  selectedCat = null;
  document.getElementById('catSearch').value = '';
  document.getElementById('searchClear').style.display = 'none';
  document.getElementById('acDropdown').classList.remove('show');
  document.getElementById('selectedCategory').style.display = 'none';
  document.getElementById('catCommission').textContent = '0%';
  recalc();
}

// ========== SHOP OPS ==========
const DEFAULT_SHOP_OPS_ROWS = [
  { label: 'Tiền điện', amount: 0 },
  { label: 'Tiền nước', amount: 0 },
  { label: 'Tiền gửi xe', amount: 0 },
  { label: 'Tiền internet', amount: 0 },
  { label: 'Tiền xăng', amount: 0 },
  { label: 'Hao mòn xe', amount: 0 },
  { label: 'Tiền điện thoại', amount: 0 },
  { label: 'Chi phí khác', amount: 0 },
  { label: 'Lương nhân viên', amount: 0 },
  { label: 'Lương bản thân', amount: 0 },
  { label: 'Tiền thưởng', amount: 0 },
  { label: 'Tiền ship bù', amount: 0 },
  { label: 'Tiền hàng hỏng', amount: 0 },
  { label: 'Thuê nhà', amount: 0 }
];
const DEFAULT_PACK_COST_ROWS = [
  { label: 'Tiền bóng xốp', amount: 0 },
  { label: 'Tiền hộp', amount: 0 },
  { label: 'Tiền băng keo', amount: 0 },
  { label: 'Tiền túi nilon', amount: 0 },
  { label: 'Tiền giấy in đơn', amount: 0 },
  { label: 'Tiền mực in', amount: 0 },
  { label: 'Tiền sửa máy in', amount: 0 }
];

function parseMoneyInput(value) {
  const digits = String(value || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function formatMoneyInput(value) {
  const amount = typeof value === 'number' ? value : parseMoneyInput(value);
  return amount.toLocaleString('vi-VN');
}

function bindMoneyInput(input) {
  if (!input) return;
  input.addEventListener('input', function() {
    const amount = parseMoneyInput(input.value);
    input.value = amount ? formatMoneyInput(amount) : '';
  });
}

function setMoneyInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = formatMoneyInput(Number(value) || 0);
}

function createCostRow(label = '', amount = 0) {
  const row = document.createElement('div');
  row.className = 'cost-row';
  row.innerHTML =
    `<input type="text" class="cost-row-label" placeholder="Tên khoản phí" value="${label}">` +
    `<input type="text" inputmode="numeric" class="cost-row-amount" placeholder="Số tiền" value="${amount ? formatMoneyInput(amount) : ''}">` +
    `<button type="button" class="cost-row-remove" title="Xóa">&times;</button>`;
  row.querySelector('.cost-row-label').addEventListener('input', recalc);
  bindMoneyInput(row.querySelector('.cost-row-amount'));
  row.querySelector('.cost-row-amount').addEventListener('input', recalc);
  row.querySelector('.cost-row-remove').addEventListener('click', function() { row.remove(); recalc(); });
  return row;
}

function setCostRows(containerId, rows) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  rows.forEach(row => container.appendChild(createCostRow(row.label, row.amount)));
}

function addCostRow(containerId, label = '', amount = 0) {
  document.getElementById(containerId).appendChild(createCostRow(label, amount));
  recalc();
}

function getCostRowsTotal(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} .cost-row`)).reduce((sum, row) => {
    return sum + parseMoneyInput(row.querySelector('.cost-row-amount').value);
  }, 0);
}

function initCostRows() {
  setCostRows('shopOpsRows', DEFAULT_SHOP_OPS_ROWS);
  setCostRows('packCostRows', DEFAULT_PACK_COST_ROWS);
  ['feeFixedProcessing', 'feeFixedShipping', 'prodCost', 'prodRef'].forEach(id => bindMoneyInput(document.getElementById(id)));
  setMoneyInputValue('feeFixedProcessing', parseMoneyInput(document.getElementById('feeFixedProcessing').value));
  setMoneyInputValue('feeFixedShipping', parseMoneyInput(document.getElementById('feeFixedShipping').value));
}

function toggleShopOpsSection() {
  const enabled = document.getElementById('enableShopOps').checked;
  document.getElementById('shopOpsSection').style.display = enabled ? '' : 'none';
  document.getElementById('feeOps').readOnly = enabled;
  recalc();
}

function resetShopCosts() {
  setCostRows('shopOpsRows', DEFAULT_SHOP_OPS_ROWS);
  setCostRows('packCostRows', DEFAULT_PACK_COST_ROWS);
  recalc();
}

function initCategorySearch() {
  buildCategoryList();
  const input = document.getElementById('catSearch');
  if (!input) return;
  // Remove old listeners to prevent duplicates on re-init
  input.removeEventListener('input', onCatSearchInput);
  input.removeEventListener('focus', onCatSearchFocus);
  input.removeEventListener('blur', onCatSearchBlur);
  input.removeEventListener('keydown', onCatSearchKeydown);
  // Add fresh listeners
  input.addEventListener('input', onCatSearchInput);
  input.addEventListener('focus', onCatSearchFocus);
  input.addEventListener('blur', onCatSearchBlur);
  input.addEventListener('keydown', onCatSearchKeydown);
}

// ========== CALCULATIONS ==========
function getFees() {
  const sellingPrice = parseMoneyInput(document.getElementById('prodRef').value);
  const shopOpsEnabled = document.getElementById('enableShopOps').checked;
  const pct = {
    tax: parseFloat(document.getElementById('feeTax').value) || 0,
    transaction: parseFloat(document.getElementById('feeTransaction').value) || 0,
    commission: parseFloat(document.getElementById('feeCommission').value) || 0,
    aff: parseFloat(document.getElementById('feeAff').value) || 0,
    voucher: parseFloat(document.getElementById('feeVoucher').value) || 0,
    ops: parseFloat(document.getElementById('feeOps').value) || 0,
    ads: parseFloat(document.getElementById('feeAds').value) || 0,
    other: parseFloat(document.getElementById('feeOther').value) || 0,
  };
  const fixedProcessing = parseMoneyInput(document.getElementById('feeFixedProcessing').value);
  const fixedShipping = parseMoneyInput(document.getElementById('feeFixedShipping').value);
  const shopMonthlyOrders = parseFloat(document.getElementById('shopMonthlyOrders').value) || 0;
  const shopOpsMonthlyTotal = getCostRowsTotal('shopOpsRows');
  const packCostMonthlyTotal = getCostRowsTotal('packCostRows');
  const rawShopMonthlyOpsCost = shopOpsMonthlyTotal + packCostMonthlyTotal;
  const rawShopOpsPerOrder = shopMonthlyOrders > 0 ? (shopOpsMonthlyTotal / shopMonthlyOrders) : 0;
  const rawPackCostPerOrder = shopMonthlyOrders > 0 ? (packCostMonthlyTotal / shopMonthlyOrders) : 0;
  const shopMonthlyOpsCost = shopOpsEnabled ? rawShopMonthlyOpsCost : 0;
  const shopOpsPerOrder = shopOpsEnabled ? rawShopOpsPerOrder : 0;
  const packCostPerOrder = shopOpsEnabled ? rawPackCostPerOrder : 0;
  const combinedOpsPerOrder = shopOpsEnabled ? (shopOpsPerOrder + packCostPerOrder) : 0;
  const linkedOpsPct = shopOpsEnabled && sellingPrice > 0 ? (combinedOpsPerOrder / sellingPrice) * 100 : 0;
  if (shopOpsEnabled) {
    pct.ops = linkedOpsPct;
    document.getElementById('feeOps').value = linkedOpsPct > 0 ? linkedOpsPct.toFixed(2) : 0;
  }
  // Khi bật ô "Tính chi phí vận hành", tiền vận hành ĐÃ nằm trong fixedTotal
  // (tính theo đồng/đơn). Ô "Vận hành (%)" lúc này do tool tự điền từ chính khoản
  // tiền đó, chỉ để Sếp biết nó chiếm bao nhiêu phần trăm giá bán — KHÔNG được
  // cộng vào tổng phí nữa, cộng là trừ cùng một khoản tiền hai lần.
  const opsTrongFixed = shopOpsEnabled;
  const opsVaoPct = opsTrongFixed ? 0 : pct.ops;
  const totalPct = pct.tax + pct.transaction + pct.commission + pct.aff + pct.voucher + opsVaoPct + pct.ads + pct.other;
  const fixedTotal = fixedProcessing + fixedShipping + shopOpsPerOrder + packCostPerOrder;
  setMoneyInputValue('shopOpsMonthlyTotal', Math.round(shopOpsMonthlyTotal));
  setMoneyInputValue('packCostMonthlyTotal', Math.round(packCostMonthlyTotal));
  setMoneyInputValue('shopMonthlyOpsCost', Math.round(shopMonthlyOpsCost));
  setMoneyInputValue('shopOpsPerOrderDisplay', Math.round(shopOpsPerOrder));
  setMoneyInputValue('packCostPerOrderDisplay', Math.round(packCostPerOrder));
  return { pct, totalPct, opsTrongFixed, fixedProcessing, fixedShipping, shopOpsEnabled, shopMonthlyOrders, shopMonthlyOpsCost, shopOpsMonthlyTotal, packCostMonthlyTotal, shopOpsPerOrder, packCostPerOrder, combinedOpsPerOrder, opsPct: pct.ops, linkedOpsPct, fixedTotal };
}

function getSettlementConfig() {
  return {
    enabled: document.getElementById('settlementMode').value === 'over3b',
    vatPct: parseFloat(document.getElementById('settlementVat').value) || 0,
    pitPct: parseFloat(document.getElementById('settlementPit').value) || 0,
    tempTaxPct: parseFloat(document.getElementById('feeTax').value) || 0,
  };
}

function calcBreakeven(cost, totalPctDecimal, fixedTotal) {
  if (totalPctDecimal >= 1) return Infinity;
  return (cost + fixedTotal) / (1 - totalPctDecimal);
}

function calcSellingPrice(cost, marginPct, totalPctDecimal, fixedTotal) {
  const marginDecimal = marginPct / 100;
  if (totalPctDecimal + marginDecimal >= 1) return Infinity;
  return (cost + fixedTotal) / (1 - totalPctDecimal - marginDecimal);
}

function calcProfit(sellingPrice, cost, totalPctDecimal, fixedTotal) {
  return sellingPrice - (sellingPrice * totalPctDecimal) - fixedTotal - cost;
}

function calcSettlementProfit(sellingPrice, cost, totalPctDecimal, fixedTotal, settlement) {
  const currentProfit = calcProfit(sellingPrice, cost, totalPctDecimal, fixedTotal);
  const tempTax = sellingPrice * (settlement.tempTaxPct / 100);
  const preSettlementProfit = currentProfit + tempTax;
  if (!settlement.enabled) {
    return { currentProfit, tempTax, preSettlementProfit, finalVat: 0, finalPit: 0, settlementDelta: 0, netProfit: currentProfit };
  }
  const finalVat = sellingPrice * (settlement.vatPct / 100);
  const finalPit = Math.max(preSettlementProfit, 0) * (settlement.pitPct / 100);
  const settlementDelta = finalVat + finalPit - tempTax;
  const netProfit = currentProfit - settlementDelta;
  return { currentProfit, tempTax, preSettlementProfit, finalVat, finalPit, settlementDelta, netProfit };
}

function calcProfitPercent(profit, basePrice) {
  if (!basePrice || basePrice === 0) return 0;
  return (profit / basePrice) * 100;
}

// ═══════════════════════════════════════════════════════════════════
// CHẾ ĐỘ CÔNG TY — tính giá bán có VAT khấu trừ + thuế TNDN
//
// Khác hộ kinh doanh ở 3 điểm căn bản:
//   1. Giá trên sàn là giá ĐÃ gồm VAT -> doanh thu thật = giá / (1 + VAT).
//   2. VAT không phải chi phí, chỉ nộp phần chênh đầu ra trừ đầu vào.
//   3. Thuế TNDN đánh trên LỢI NHUẬN, và chỉ được trừ chi phí CÓ HOÁ ĐƠN.
//      Khoản thiếu hoá đơn vẫn mất tiền thật nhưng không được trừ -> doanh
//      nghiệp đóng thuế trên khoản lãi không hề tồn tại. Đây là cái bẫy lớn
//      nhất với dân TMDT (nhập chợ, chạy ads bằng thẻ cá nhân, trả lương tay).
// ═══════════════════════════════════════════════════════════════════
var hinhThucKD = 'hkd';
var HT_KEY = 'hadaplus_hinh_thuc_kd';

function setHinhThuc(v) {
  hinhThucKD = (v === 'cty') ? 'cty' : 'hkd';
  try { localStorage.setItem(HT_KEY, hinhThucKD); } catch (e) {}
  var la = hinhThucKD === 'cty';
  var b1 = document.getElementById('btnHtHkd'), b2 = document.getElementById('btnHtCty');
  if (b1) b1.classList.toggle('active', !la);
  if (b2) b2.classList.toggle('active', la);
  var cf = document.getElementById('ctyConfig');    if (cf) cf.style.display = la ? 'block' : 'none';
  var kq = document.getElementById('ctyResult');    if (kq) kq.style.display = la ? 'block' : 'none';
  var qt = document.getElementById('cardQuyetToan');if (qt) qt.style.display = la ? 'none' : '';
  // Class này khiến CSS ẩn bảng kết quả + phân tích cũ (tính theo hộ KD),
  // để chế độ Công ty chỉ còn đúng một cách tính, không bày hai kiểu lẫn lộn.
  document.body.classList.toggle('che-do-cty', la);
  recalc();
}

function getCtyCfg() {
  var so = function (id, md) {
    var e = document.getElementById(id), v = e ? parseFloat(e.value) : NaN;
    return isNaN(v) ? md : v;
  };
  // Mỗi khoản chi có 3 trạng thái, vì "có hoá đơn" và "được khấu trừ VAT" là
  // HAI chuyện khác nhau: mua của hộ kinh doanh vẫn có hoá đơn bán hàng hợp lệ
  // để tính chi phí, nhưng trên đó không có VAT nên không khấu trừ được gì.
  //   gtgt  = hoá đơn GTGT      -> được trừ chi phí + khấu trừ VAT
  //   ct    = chứng từ, không VAT -> được trừ chi phí, không khấu trừ VAT
  //   khong = không có gì        -> không được trừ gì
  var ch = function (id) {
    var e = document.getElementById(id);
    var v = e ? e.value : 'gtgt';
    return (v === 'ct' || v === 'khong') ? v : 'gtgt';
  };
  return {
    vat:  so('ctyVat', 10) / 100,
    tndn: so('ctyTndn', 20) / 100,
    hd: { von: ch('ctyHdVon'), san: ch('ctyHdSan'), ads: ch('ctyHdAds'),
          ops: ch('ctyHdOps'), other: ch('ctyHdOther'), codinh: ch('ctyHdCoDinh') }
  };
}

// P = giá người mua trả (đã gồm VAT). adsGhiDe: ép số tiền ads, dùng khi dò ROI.
// Lưu ý 2 điểm:
//   - Ô "Thuế %" là thuế khoán hộ kinh doanh nên KHÔNG đưa vào đây.
//   - "Voucher extra" là khoản shop TRẢ CHO SÀN, không phải giảm giá cho khách.
//     Khách vẫn trả đủ giá bán, nên nó nằm ở nhóm chi phí trả cho sàn và ăn theo
//     đúng loại chứng từ của phí sàn.
function ctTinh(P, cost, fees, cfg, adsGhiDe) {
  var v = cfg.vat, t = cfg.tndn, pc = fees.pct;
  var tienAds = (adsGhiDe == null) ? P * (pc.ads || 0) / 100 : adsGhiDe;

  // Tiền vận hành: hoặc do Sếp gõ tay theo %, hoặc do ô tick tính ra đồng/đơn —
  // không bao giờ cả hai, nếu không là tính trùng.
  var tienVanHanh = (fees.opsTrongFixed ? 0 : P * (pc.ops || 0) / 100) + (fees.shopOpsPerOrder || 0);
  // Phí cố định còn lại sau khi đã tách phần vận hành ra
  var tienCoDinh  = (fees.fixedProcessing || 0) + (fees.fixedShipping || 0) + (fees.packCostPerOrder || 0);

  var kh = [
    ['Giá vốn hàng',  cost,                            cfg.hd.von],
    ['Phí giao dịch', P * (pc.transaction || 0) / 100, cfg.hd.san],
    ['Hoa hồng sàn',  P * (pc.commission  || 0) / 100, cfg.hd.san],
    ['Phí AFF',       P * (pc.aff         || 0) / 100, cfg.hd.san],
    ['Voucher extra', P * (pc.voucher     || 0) / 100, cfg.hd.san],
    ['Vận hành',      tienVanHanh,                     cfg.hd.ops],
    ['Quảng cáo',     tienAds,                         cfg.hd.ads],
    ['Phí khác',      P * (pc.other       || 0) / 100, cfg.hd.other],
    ['Phí cố định',   tienCoDinh,                      cfg.hd.codinh]
  ];

  var R = P / (1 + v), vatRa = P - R;
  var vatVao = 0, tru = 0, loai = 0, dsLoai = [], ct = [], vatMat = 0, tongChi = 0;
  for (var i = 0; i < kh.length; i++) {
    var ten = kh[i][0], tien = kh[i][1], tt = kh[i][2];
    if (!(tien > 0)) continue;
    tongChi += tien;                        // tiền mặt thực sự chi ra, gồm cả VAT
    if (tt === 'gtgt') {                    // bóc VAT ra, phần còn lại là chi phí
      var net = tien / (1 + v);
      vatVao += tien - net;
      tru    += net;
      ct.push({ ten: ten, tien: tien, tt: tt, net: net, vat: tien - net });
    } else if (tt === 'ct') {               // được tính chi phí đủ, không có VAT
      tru += tien;
      ct.push({ ten: ten, tien: tien, tt: tt, net: tien, vat: 0 });
    } else {                                // mất tiền mà không được trừ gì
      loai   += tien;
      vatMat += tien - tien / (1 + v);      // phần VAT lẽ ra khấu trừ được
      dsLoai.push(ten);
      ct.push({ ten: ten, tien: tien, tt: tt, net: 0, vat: 0 });
    }
  }
  var lnKt   = R - tru - loai;              // lãi thật, tiền vào túi trước thuế TNDN
  var lnThue = R - tru;                     // lãi mà cơ quan thuế nhìn thấy
  var thue   = Math.max(0, lnThue) * t;
  return { R: R, tongChi: tongChi, vatRa: vatRa, vatVao: vatVao,
           vatNop: vatRa - vatVao, vatMat: vatMat,
           lnKt: lnKt, lnThue: lnThue, thue: thue, sauThue: lnKt - thue,
           loai: loai, dsLoai: dsLoai, tienAds: tienAds, tru: tru, ct: ct };
}

// Dò nhị phân thay vì giải công thức: an toàn hơn vì hàm có max(0, ...) gãy khúc.
function ctGiaHoaVon(cost, fees, cfg) {
  var f = function (x) { return ctTinh(x, cost, fees, cfg, null).sauThue; };
  var lo = 0, hi = (Math.max(cost, 1000) + fees.fixedTotal) * 200 + 1e7;
  if (!(f(hi) > 0)) return null;            // phí quá cao, bán giá nào cũng lỗ
  for (var i = 0; i < 80; i++) {
    var mid = (lo + hi) / 2;
    if (f(mid) >= 0) hi = mid; else lo = mid;
  }
  return hi;
}

// Ngân sách quảng cáo tối đa mà vẫn hoà vốn SAU THUẾ, ở mức giá bán hiện tại.
function ctAdsToiDa(P, cost, fees, cfg) {
  var f = function (a) { return ctTinh(P, cost, fees, cfg, a).sauThue; };
  if (!(f(0) > 0)) return 0;                // chưa chi ads đã lỗ
  if (f(P) > 0) return P;
  var lo = 0, hi = P;
  for (var i = 0; i < 80; i++) {
    var mid = (lo + hi) / 2;
    if (f(mid) >= 0) lo = mid; else hi = mid;
  }
  return lo;
}

var CT_NHAN = { gtgt: '✓ hoá đơn GTGT', ct: '◐ chứng từ, không VAT', khong: '✗ không chứng từ' };

function veCongTy(fees, cost, refPrice) {
  var kq = document.getElementById('ctyResult');
  if (!kq) return;                          // trang Shopee chưa có khối này
  var cfg = getCtyCfg();

  // Tô màu ô chọn cho dễ nhìn: vàng = không VAT, đỏ = không chứng từ
  ['ctyHdVon','ctyHdSan','ctyHdAds','ctyHdOps','ctyHdOther','ctyHdCoDinh'].forEach(function (id) {
    var e = document.getElementById(id);
    if (!e || !e.parentNode || !e.parentNode.classList) return;
    e.parentNode.classList.toggle('ct',    e.value === 'ct');
    e.parentNode.classList.toggle('khong', e.value === 'khong');
  });

  var ht = document.getElementById('htSummary');
  if (ht) {
    ht.innerHTML = hinhThucKD === 'cty'
      ? '<div class="fee-item">Đang tính theo: <span>Công ty — VAT ' + fmtPercent(cfg.vat * 100)
        + ' · TNDN ' + fmtPercent(cfg.tndn * 100) + '</span></div>'
        + '<div class="fee-item">Ô <b>Thuế ' + fmtPercent(fees.pct.tax || 0)
        + '</b> ở khung dưới là thuế khoán của hộ kinh doanh — chế độ Công ty <b>tự bỏ qua</b>, không tính hai lần.</div>'
      : '<div class="fee-item">Đang tính theo: <span>Cá nhân / Hộ kinh doanh</span> — thuế khoán tính thẳng trên doanh thu.</div>';
  }
  if (hinhThucKD !== 'cty') return;

  var setTx = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  var setMau = function (id, c) { var e = document.getElementById(id); if (e) e.style.color = c; };
  var soRoi = function (v) { return v.toFixed(2).replace('.', ','); };
  var trong = function () {
    ['ctTongPhi','ctDt','ctVat','ctLnKt','ctLnThue','ctThue','ctTongThue','ctSauThue','ctHoaVon','ctRoi','ctAdsNay','ctRoiNay','ctMat']
      .forEach(function (id) { setTx(id, '--'); });
    ['ctTongPhiSub','ctDtSub','ctVatSub','ctLnKtSub','ctLnThueSub','ctThueSub','ctTongThueSub','ctSauThueSub','ctHoaVonSub','ctRoiSub','ctAdsNaySub','ctRoiNaySub','ctMatSub']
      .forEach(function (id) { setTx(id, ''); });
  };

  // Tổng phí của công ty = tổng phí trên khung dưới TRỪ thuế khoán hộ KD
  var phiCty = Math.max(0, fees.totalPct - (fees.pct.tax || 0));
  setTx('ctTongPhi', fmtPercent(phiCty));
  setTx('ctTongPhiSub', (fees.pct.tax > 0 ? 'Đã trừ thuế khoán ' + fmtPercent(fees.pct.tax) + ' · ' : '')
    + 'Cộng phí cố định ' + fmt(fees.fixedTotal) + 'đ/đơn');

  var adsNay = refPrice * (fees.pct.ads || 0) / 100;
  setTx('ctAdsNay', fmt(adsNay));
  setTx('ctAdsNaySub', (fees.pct.ads || 0) > 0
    ? 'Quảng cáo ' + fmtPercent(fees.pct.ads) + ' × giá bán'
    : 'Chưa đặt % quảng cáo');

  var boxMat = document.getElementById('ctBoxMat');
  var note = document.getElementById('ctNote');
  var ph = document.getElementById('ctPhanTich');
  if (!(refPrice > 0)) {
    trong();
    if (ph) ph.style.display = 'none';
    setTx('ctDt', 'Nhập giá bán');
    if (note) note.innerHTML = '<div class="fee-item">Nhập <b>Giá bán</b> và <b>Giá vốn</b> để xem kết quả sau thuế.</div>';
    return;
  }

  var r = ctTinh(refPrice, cost, fees, cfg, null);
  // Kịch bản đối chiếu: giả sử mọi khoản đều có hoá đơn GTGT
  var chuan = ctTinh(refPrice, cost, fees,
    { vat: cfg.vat, tndn: cfg.tndn,
      hd: { von: 'gtgt', san: 'gtgt', ads: 'gtgt', ops: 'gtgt', other: 'gtgt', codinh: 'gtgt' } }, null);
  var mat = chuan.sauThue - r.sauThue;

  setTx('ctDt', fmt(r.R));
  setTx('ctDtSub', 'Giá bán ' + fmt(refPrice) + 'đ ÷ ' + (1 + cfg.vat).toFixed(2).replace('.', ','));

  setTx('ctVat', fmt(r.vatNop));
  setTx('ctVatSub', 'Đầu ra ' + fmt(r.vatRa) + 'đ − đầu vào ' + fmt(r.vatVao) + 'đ');

  setTx('ctLnKt', fmt(r.lnKt));
  setTx('ctLnKtSub', 'Lãi thật (' + calcProfitPercent(r.lnKt, r.R).toFixed(1) + '% doanh thu)');
  setMau('ctLnKt', r.lnKt >= 0 ? '' : '#dc2626');

  setTx('ctLnThue', fmt(r.lnThue));
  setTx('ctLnThueSub', r.loai > 0
    ? '⚠️ Cao hơn lãi thật ' + fmt(r.lnThue - r.lnKt) + 'đ do thiếu chứng từ'
    : 'Bằng lợi nhuận trước thuế — đủ chứng từ');
  setMau('ctLnThue', r.loai > 0 ? '#dc2626' : '');

  setTx('ctThue', fmt(r.thue));
  setTx('ctThueSub', fmtPercent(cfg.tndn * 100) + ' × lợi nhuận chịu thuế');

  // Cộng 2 số ĐÃ làm tròn, không cộng số gốc: nếu không thì màn hình hiện
  // "6.182đ + 3.328đ = 9.509đ" — nhìn như tool cộng sai, khách mất niềm tin ngay.
  var tongThue = Math.round(r.vatNop) + Math.round(r.thue);
  setTx('ctTongThue', fmt(tongThue));
  setTx('ctTongThueSub', 'VAT ' + fmt(r.vatNop) + 'đ + TNDN ' + fmt(r.thue) + 'đ');

  setTx('ctSauThue', fmt(r.sauThue));
  setTx('ctSauThueSub', 'Đã trừ cả VAT và TNDN · '
    + calcProfitPercent(r.sauThue, refPrice).toFixed(1) + '% giá bán');
  setMau('ctSauThue', r.sauThue >= 0 ? '' : '#dc2626');

  var hv = ctGiaHoaVon(cost, fees, cfg);
  setTx('ctHoaVon', hv == null ? 'Không có' : fmt(hv));
  setTx('ctHoaVonSub', hv == null
    ? 'Phí quá cao, giá nào cũng lỗ'
    : (refPrice >= hv ? 'Giá hiện tại đang trên ngưỡng ✓' : '⚠️ Giá hiện tại thấp hơn ' + fmt(hv - refPrice) + 'đ'));

  var adsMax = ctAdsToiDa(refPrice, cost, fees, cfg);
  var roiHV = adsMax > 0 ? refPrice / adsMax : null;
  setTx('ctRoi', roiHV ? soRoi(roiHV) : 'Lỗ');
  setTx('ctRoiSub', roiHV
    ? 'Ads tối đa ' + fmt(adsMax) + 'đ (' + (adsMax / refPrice * 100).toFixed(1) + '%)'
    : 'Không chạy ads cũng đã lỗ');

  if (boxMat) boxMat.className = 'result-box ' + (mat > 0.5 ? 'breakeven' : 'profit');
  setTx('ctMat', mat > 0.5 ? '−' + fmt(mat) : '0');
  setTx('ctMatSub', mat > 0.5
    ? 'Mỗi đơn · 1.000 đơn/tháng = ' + fmt(mat * 1000) + 'đ'
    : 'Đủ hoá đơn GTGT — không mất đồng nào');
  setMau('ctMat', mat > 0.5 ? '#dc2626' : '');

  var roiNay = adsNay > 0 ? refPrice / adsNay : null;
  setTx('ctRoiNay', roiNay ? soRoi(roiNay) : '—');
  if (!roiNay) {
    setTx('ctRoiNaySub', 'Nhập % quảng cáo để tính');
    setMau('ctRoiNay', '');
  } else if (!roiHV) {
    setTx('ctRoiNaySub', 'Giá bán chưa đủ bù chi phí');
    setMau('ctRoiNay', '#dc2626');
  } else if (roiNay >= roiHV) {
    setTx('ctRoiNaySub', 'Trên ngưỡng hòa vốn ' + soRoi(roiHV) + ' — có lãi');
    setMau('ctRoiNay', '#16a34a');
  } else {
    setTx('ctRoiNaySub', 'Dưới ngưỡng hòa vốn ' + soRoi(roiHV) + ' — lỗ');
    setMau('ctRoiNay', '#dc2626');
  }

  // ── Bảng giải thích từng bước, thay cho "Phân tích giá bán" của hộ KD ──
  if (ph) {
    ph.style.display = 'block';
    var heSo = (1 + cfg.vat).toFixed(2).replace('.', ',');
    var tsVat = fmtPercent(cfg.vat * 100);
    var d = '';

    d += '<h5>① Doanh thu</h5><div class="d">'
       + 'Giá người mua trả: <b>' + fmt(refPrice) + 'đ</b> (đã gồm VAT)<br>'
       + '− VAT đầu ra ' + tsVat + ': <b>' + fmt(r.vatRa) + 'đ</b><br>'
       + '= Doanh thu ghi nhận: <b>' + fmt(r.R) + 'đ</b></div>';

    d += '<h5>② Chi phí — cột sau là phần được trừ thuế</h5><div class="d">';
    for (var i = 0; i < r.ct.length; i++) {
      var k = r.ct[i];
      var lop = k.tt === 'gtgt' ? 'ok' : (k.tt === 'ct' ? 'cn' : 'no');
      d += '• ' + k.ten + ': <b>' + fmt(k.tien) + 'đ</b> → '
         + '<span class="' + lop + '">' + fmt(k.net) + 'đ ' + CT_NHAN[k.tt] + '</span><br>';
    }
    d += '<b>Tổng tiền chi ra: ' + fmt(r.tongChi) + 'đ</b> '
       + '<span class="ct-n">— cộng cột TRÁI, là tiền mặt thật sự bỏ ra (đã gồm VAT)</span><br>'
       + 'Trong đó được trừ thuế: <b>' + fmt(r.tru) + 'đ</b> '
       + '<span class="ct-n">— cộng cột PHẢI</span>'
       + (r.loai > 0 ? ' · <span class="no">Bị loại: ' + fmt(r.loai) + 'đ</span>' : '')
       + '</div>';

    d += '<h5>③ Thuế phải nộp</h5><div class="d">';

    d += '<div class="ct-b">ⓐ VAT phải nộp</div>'
       + '<span class="ct-f">= VAT đầu ra − VAT đầu vào được khấu trừ</span>';

    d += '<div class="ct-i"><b>VAT đầu ra</b> — thu hộ của khách<br>'
       + '<span class="ct-f">= Giá bán × ' + tsVat + ' ÷ ' + heSo + '</span><br>'
       + '= ' + fmt(refPrice) + ' × ' + tsVat + ' ÷ ' + heSo + ' = <b>' + fmt(r.vatRa) + 'đ</b>'
       + '<i>Số này nằm sẵn trong ' + fmt(refPrice) + 'đ khách trả, không phải cộng thêm.</i></div>';

    var dsGtgt = r.ct.filter(function (x) { return x.tt === 'gtgt'; });
    var dsCt   = r.ct.filter(function (x) { return x.tt === 'ct'; });
    d += '<div class="ct-i"><b>VAT đầu vào</b> — đã trả cho nhà cung cấp, được khấu trừ<br>'
       + '<span class="ct-f">= Cộng VAT bóc ra từ các khoản có <u>hoá đơn GTGT</u></span><br>';
    if (dsGtgt.length) {
      for (var j = 0; j < dsGtgt.length; j++) {
        d += '• ' + dsGtgt[j].ten + ': ' + fmt(dsGtgt[j].tien) + 'đ × ' + tsVat + ' ÷ ' + heSo
           + ' = <b>' + fmt(dsGtgt[j].vat) + 'đ</b><br>';
      }
      d += 'Cộng lại: <b>' + fmt(r.vatVao) + 'đ</b>';
    } else {
      d += 'Không khoản nào có hoá đơn GTGT → <b>0đ</b>';
    }
    if (dsCt.length) {
      d += '<br><span class="cn">◐ ' + dsCt.map(function (x) { return x.ten; }).join(' · ')
         + ': có chứng từ nhưng không có VAT → khấu trừ 0đ</span>'
         + '<i>Vẫn được tính đủ vào chi phí khi tính thuế TNDN, chỉ là không có VAT để khấu trừ.</i>';
    }
    if (r.dsLoai.length) {
      d += '<br><span class="no">✗ ' + r.dsLoai.join(' · ') + ': không chứng từ → khấu trừ 0đ</span>'
         + '<i>Nếu lấy được hoá đơn GTGT cho các khoản này thì khấu trừ thêm được '
         + fmt(r.vatMat) + 'đ.</i>';
    }
    d += '</div>';

    d += '<div class="ct-i"><b>VAT phải nộp</b> = ' + fmt(r.vatRa) + 'đ − ' + fmt(r.vatVao)
       + 'đ = <b>' + fmt(r.vatNop) + 'đ</b>'
       + '<i>VAT không phải chi phí — là tiền của nhà nước mình thu hộ rồi nộp lại phần chênh, '
       + 'nên nó không làm giảm lợi nhuận.</i></div>';

    d += '<div class="ct-b">ⓑ Lợi nhuận trước thuế <span class="ct-n">— lãi thật, tiền đã vào túi</span></div>'
       + '<span class="ct-f">= Doanh thu chưa VAT − Tổng chi phí thực chi</span><br>'
       + '= ' + fmt(r.R) + 'đ − ' + fmt(r.tru) + 'đ'
       + (r.loai > 0 ? ' − ' + fmt(r.loai) + 'đ' : '')
       + ' = <b>' + fmt(r.lnKt) + 'đ</b>'
       + (r.loai > 0 ? '<i>Khoản ' + fmt(r.loai) + 'đ thiếu chứng từ vẫn là tiền chi thật '
                     + 'nên vẫn trừ ở đây.</i>' : '');

    d += '<div class="ct-b">ⓒ Lợi nhuận chịu thuế <span class="ct-n">— con số cơ quan thuế nhìn thấy</span></div>'
       + '<span class="ct-f">= Doanh thu chưa VAT − Chi phí ĐƯỢC TRỪ (có chứng từ hợp lệ)</span><br>'
       + '= ' + fmt(r.R) + 'đ − ' + fmt(r.tru) + 'đ = <b>' + fmt(r.lnThue) + 'đ</b><br>'
       + (r.loai > 0
          ? '<span class="no">⚠️ Cao hơn lãi thật ' + fmt(r.lnThue - r.lnKt) + 'đ</span> — vì '
            + fmt(r.loai) + 'đ thiếu chứng từ <b>không được trừ</b>. Công ty phải đóng thuế '
            + 'trên khoản lãi không hề tồn tại.'
          : '<span class="ok">✓ Bằng đúng lợi nhuận trước thuế</span> vì mọi khoản đều có chứng từ hợp lệ.');

    d += '<div class="ct-b">ⓓ Thuế TNDN</div>'
       + '<span class="ct-f">= Thuế suất × Lợi nhuận chịu thuế</span><br>'
       + '= ' + fmtPercent(cfg.tndn * 100) + ' × ' + fmt(Math.max(0, r.lnThue))
       + 'đ = <b>' + fmt(r.thue) + 'đ</b>';
    d += '</div>';

    d += '<h5>④ Còn lại trong túi <span class="ct-n">— lợi nhuận sau thuế</span></h5><div class="d">'
       + '<span class="ct-f">= Lợi nhuận trước thuế − Thuế TNDN</span><br>'
       + '= ' + fmt(r.lnKt) + 'đ − ' + fmt(r.thue) + 'đ = <b style="font-size:14px;color:'
       + (r.sauThue >= 0 ? '#16a34a' : '#dc2626') + '">' + fmt(r.sauThue) + 'đ</b><br>'
       + '<span class="ct-f">Tỷ suất</span> = ' + fmt(r.sauThue) + ' ÷ ' + fmt(refPrice) + ' = <b>'
       + calcProfitPercent(r.sauThue, refPrice).toFixed(1) + '%</b> trên giá bán'
       + ' · ' + calcProfitPercent(r.sauThue, r.R).toFixed(1) + '% trên doanh thu chưa VAT</div>';

    d += '<h5>⑤ Tổng kết</h5><div class="d">'
       + '<div class="ct-b">Tổng thuế nộp cho nhà nước</div>'
       + '<span class="ct-f">= VAT phải nộp + Thuế TNDN</span><br>'
       + '= ' + fmt(r.vatNop) + 'đ + ' + fmt(r.thue) + 'đ = <b>' + fmt(tongThue) + 'đ</b>'
       + '<div class="ct-i"><b>Cả hai khoản này ĐỀU đã được trừ rồi:</b><br>'
       + '• VAT <b>' + fmt(r.vatNop) + 'đ</b> — trừ ngay từ <b>mục ①</b>, lúc đổi giá bán '
       + fmt(refPrice) + 'đ thành doanh thu ghi nhận ' + fmt(r.R) + 'đ. '
       + '<span class="no">Đừng trừ thêm lần nữa, sẽ thành trừ hai lần.</span><br>'
       + '• TNDN <b>' + fmt(r.thue) + 'đ</b> — trừ ở <b>mục ④</b>.<br>'
       + '<b>Vậy Lợi nhuận sau thuế ' + fmt(r.sauThue) + 'đ là số cuối cùng, '
       + 'đã sạch cả VAT lẫn TNDN.</b></div>'
       + '<div class="ct-b">Kiểm chứng bằng dòng tiền</div>'
       + '<span class="ct-f">= Giá bán − Tổng tiền chi ra − Tổng thuế nộp</span><br>'
       + 'Bước 1 — trừ tiền hàng và VAT:<br>'
       + '= ' + fmt(refPrice) + 'đ − ' + fmt(r.tongChi) + 'đ − ' + fmt(r.vatNop) + 'đ = <b>'
       + fmt(Math.round(refPrice) - Math.round(r.tongChi) - Math.round(r.vatNop)) + 'đ</b> '
       + '<span class="ok">← đúng bằng Lợi nhuận trước thuế ở mục ⓑ</span><br>'
       + 'Bước 2 — trừ tiếp thuế TNDN:<br>'
       + '− ' + fmt(r.thue) + 'đ = <b style="font-size:14px;color:'
       + (r.sauThue >= 0 ? '#16a34a' : '#dc2626') + '">'
       + fmt(Math.round(refPrice) - Math.round(r.tongChi) - tongThue) + 'đ</b> '
       + '<span class="ok">← đúng bằng Lợi nhuận sau thuế ở mục ④</span>'
       + '<i>' + fmt(r.tongChi) + 'đ là <b>tổng tiền chi ra</b> ở cuối mục ② — cộng nguyên '
       + 'giá đã gồm VAT của tất cả các khoản, không phải con số ' + fmt(r.tru)
       + 'đ được trừ thuế.<br>'
       + 'Phép tính này trừ thẳng VAT bằng tiền mặt mà vẫn ra đúng con số của mục ⓑ — '
       + 'đó là bằng chứng VAT <b>đã được tính rồi</b>, chênh vài đồng là do làm tròn.</i></div>';

    d += '<h5>⑥ Hai ngưỡng hoà vốn</h5><div class="d">'
       + '<div class="ct-b">Giá hoà vốn sau thuế: <b>' + (hv == null ? 'không có' : fmt(hv) + 'đ') + '</b></div>'
       + '<span class="ct-f">= mức giá bán mà Lợi nhuận sau thuế (mục ④) đúng bằng 0</span><br>';
    if (hv == null) {
      d += 'Phí đã vượt quá doanh thu nên bán giá nào cũng lỗ.';
    } else {
      d += 'Tool dò dần mức giá cho tới khi mục ④ về 0. Sếp thử gõ <b>' + fmt(hv)
         + '</b> vào ô Giá bán sẽ thấy mục ④ ra đúng 0đ.<br>'
         + (r.loai > 0
            ? '<span class="no">⚠️ Đang có ' + fmt(r.loai) + 'đ thiếu chứng từ</span> — nên dù lãi thật '
              + 'bằng 0, công ty <b>vẫn phải đóng thuế TNDN</b> trên phần đó. Vì vậy giá hoà vốn bị '
              + 'đội cao hơn so với khi đủ chứng từ.'
            : '<span class="ok">Ở mức giá này lãi bằng 0 nên thuế TNDN cũng bằng 0</span> — '
              + 'giá hoà vốn không bị thuế đội lên.');
    }

    d += '<div class="ct-b">ROI hoà vốn sau thuế: <b>' + (roiHV ? soRoi(roiHV) : 'Lỗ') + '</b></div>'
       + '<span class="ct-f">= Giá bán ÷ Ngân sách quảng cáo tối đa</span><br>';
    if (!roiHV) {
      d += 'Chưa chi đồng ads nào đã lỗ, nên không có ngưỡng ROI.';
    } else {
      d += '= ' + fmt(refPrice) + 'đ ÷ ' + fmt(adsMax) + 'đ = <b>' + soRoi(roiHV) + '</b><br>'
         + '<b>' + fmt(adsMax) + 'đ</b> là toàn bộ lợi nhuận còn lại khi <b>chưa chi đồng ads nào</b>. '
         + 'Đổ hết chừng đó vào quảng cáo thì lãi về đúng 0.<br>'
         + 'Chạy ads đạt ROI <b>trên ' + soRoi(roiHV) + '</b> → có lãi. '
         + '<span class="no">Dưới ' + soRoi(roiHV) + ' → lỗ.</span>';
    }
    d += '</div>';

    // Mỗi dòng hiển thị đã làm tròn tới đồng, còn các ô tổng tính từ số gốc chưa
    // làm tròn. Cộng tay từng dòng vì thế có thể lệch vài đồng — nói trước để
    // Sếp và khách không tưởng tool tính sai.
    d += '<div style="margin-top:10px;font-size:11.5px;color:var(--text-muted);line-height:1.7">'
       + 'Ghi chú: các dòng trên được làm tròn tới đồng, còn số tổng tính từ giá trị gốc. '
       + 'Cộng tay từng dòng có thể lệch vài đồng so với tổng — đó là do làm tròn, không phải sai số.</div>';
    ph.innerHTML = d;
  }

  if (note) {
    var h = '';
    if (r.dsLoai.length) {
      h += '<div class="fee-item" style="color:#b91c1c"><b>Đang thiếu chứng từ:</b> '
         + r.dsLoai.join(' · ') + ' — tổng <b>' + fmt(r.loai) + 'đ/đơn</b> không được trừ thuế.</div>';
    }
    if (mat > 0.5) {
      h += '<div class="fee-item">Nếu lấy đủ hoá đơn GTGT cho mọi khoản, lợi nhuận sau thuế lên <b>'
         + fmt(chuan.sauThue) + 'đ</b> thay vì ' + fmt(r.sauThue) + 'đ.</div>';
    }
    if (!h) h = '<div class="fee-item">✓ Đủ hoá đơn GTGT cho mọi khoản — không mất thuế oan.</div>';
    h += '<div class="fee-item" style="margin-top:6px;color:#94a3b8">Voucher extra được tính là khoản trả cho sàn nên đi chung chứng từ với phí sàn. '
       + 'Kết quả mang tính tham khảo để định giá, <b>không thay thế tư vấn kế toán</b> — thuế thực tế phụ thuộc chứng từ và chế độ kế toán của từng doanh nghiệp.</div>';
    note.innerHTML = h;
  }
}

function recalc() {
  const fees = getFees();
  const settlement = getSettlementConfig();
  const totalPctDecimal = fees.totalPct / 100;
  const cost = parseMoneyInput(document.getElementById('prodCost').value);
  const refPrice = parseMoneyInput(document.getElementById('prodRef').value);
  try { veCongTy(fees, cost, refPrice); } catch (e) { console.warn('Cty:', e); }
  // Fee summary
  document.getElementById('feeSummary').innerHTML =
    `<div class="fee-item">Tổng phí: <span>${fmtPercent(fees.totalPct)}</span></div>` +
    `<div class="fee-item">Phí cố định: <span>${fmt(fees.fixedTotal)} đ/đơn</span></div>` +
    `<div class="fee-item">(Xử lý: ${fmt(fees.fixedProcessing)}đ + Hoàn VC: ${fmt(fees.fixedShipping)}đ + VH: ${fmt(fees.shopOpsPerOrder)}đ + Đóng hàng: ${fmt(fees.packCostPerOrder)}đ)</div>` +
    (fees.opsTrongFixed
      ? `<div class="fee-item" style="color:#b45309">Ô <b>Vận hành ${fees.pct.ops.toFixed(2)}%</b> chỉ để xem — tiền vận hành đã nằm trong Phí cố định, không cộng vào tổng phí lần nữa.</div>`
      : '') +
    ((typeof hinhThucKD !== 'undefined' && hinhThucKD === 'cty' && fees.pct.tax > 0)
      ? `<div class="fee-item" style="color:#2563eb">Chế độ <b>Công ty</b> dùng ${fmtPercent(fees.totalPct)} − thuế khoán ${fmtPercent(fees.pct.tax)} = <b>${fmtPercent(fees.totalPct - fees.pct.tax)}</b> — nên ô Tổng phí bên phải hiện con số đó.</div>`
      : '');

  const shopOpsPctOnSelling = refPrice > 0 ? (fees.shopOpsPerOrder / refPrice) * 100 : 0;
  const packCostPctOnSelling = refPrice > 0 ? (fees.packCostPerOrder / refPrice) * 100 : 0;
  const combinedOpsPctOnSelling = refPrice > 0 ? (fees.combinedOpsPerOrder / refPrice) * 100 : 0;

  document.getElementById('shopOpsSummary').innerHTML = fees.shopOpsEnabled
    ? `<div class="fee-item">Tổng vận hành/tháng: <span>${fmt(fees.shopOpsMonthlyTotal)} đ</span></div>` +
      `<div class="fee-item">Tổng đóng hàng/tháng: <span>${fmt(fees.packCostMonthlyTotal)} đ</span></div>` +
      `<div class="fee-item">Số đơn/tháng: <span>${fmt(fees.shopMonthlyOrders)}</span></div>` +
      `<div class="fee-item">Phí VH shop/đơn: <span>${fmt(fees.shopOpsPerOrder)} đ</span></div>` +
      `<div class="fee-item">% VH/giá bán: <span>${refPrice > 0 ? shopOpsPctOnSelling.toFixed(2) + '%' : '--'}</span></div>` +
      `<div class="fee-item">Phí đóng hàng/đơn: <span>${fmt(fees.packCostPerOrder)} đ</span></div>` +
      `<div class="fee-item">% đóng hàng/giá bán: <span>${refPrice > 0 ? packCostPctOnSelling.toFixed(2) + '%' : '--'}</span></div>`
    : `<div class="fee-item">Chưa tính chi phí vận hành — có thể nhập thủ công ô Vận hành (%) phía trên</div>`;

  document.getElementById('settlementSummary').innerHTML = settlement.enabled
    ? `<div class="fee-item">Chế độ: <span>Shop trên 3 tỷ/năm</span></div>` +
      `<div class="fee-item">VAT QT: <span>${settlement.vatPct}%</span></div>` +
      `<div class="fee-item">TNCN/LN: <span>${settlement.pitPct}%</span></div>` +
      `<br><div class="fee-item">Cách tính: <span>(${settlement.vatPct}% VAT + ${settlement.pitPct}% TNCN/LN) - ${settlement.tempTaxPct}% tạm thu</span></div>`
    : `<div class="fee-item">Chưa áp dụng quyết toán cuối năm</div>`;

  // Results
  document.getElementById('rTotalFee').textContent = fmtPercent(fees.totalPct);
  document.getElementById('rFixedFee').textContent = `Phí cố định: ${fmt(fees.fixedTotal)}đ`;

  if (cost > 0) {
    const breakeven = calcBreakeven(cost, totalPctDecimal, fees.fixedTotal);
    document.getElementById('rBreakeven').textContent = fmt(breakeven);
    // Tiền quảng cáo ứng với chính mức giá hòa vốn này (khác với ads tính trên
    // giá bán hiện tại) — để Sếp biết bán ở giá hòa vốn thì ads được bao nhiêu.
    {
      const eSub = document.getElementById('rBreakevenSub');
      if (eSub) {
        const adsTaiHV = isFinite(breakeven) ? breakeven * ((fees.pct.ads || 0) / 100) : 0;
        eSub.textContent = isFinite(breakeven)
          ? `Ads tương ứng: ${fmt(adsTaiHV)}đ (${fees.pct.ads || 0}%)`
          : '';
      }
    }

    // ===== ROI theo giá bán hiện tại =====
    // Tách quảng cáo ra khỏi tổng phí. Phần lợi nhuận còn lại TRƯỚC khi chi ads
    // chính là ngân sách ads tối đa để hoà vốn -> ROI hoà vốn = giá bán / ngân sách đó.
    const adsPct    = (fees.pct.ads || 0) / 100;
    const pctNoAds  = totalPctDecimal - adsPct;
    const setTx = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    const setMau = (id, c) => { const e = document.getElementById(id); if (e) e.style.color = c; };
    const soRoi = v => v.toFixed(2).replace('.', ',');

    if (refPrice > 0) {
      const adsToiDa = refPrice - refPrice * pctNoAds - fees.fixedTotal - cost;
      const coLai    = adsToiDa > 0;
      const roiHV    = coLai ? refPrice / adsToiDa : null;
      const adsCost  = refPrice * adsPct;
      const roiNay   = adsCost > 0 ? refPrice / adsCost : null;
      const lnNay    = calcProfit(refPrice, cost, totalPctDecimal, fees.fixedTotal);

      setTx('rRoiBreak', coLai ? soRoi(roiHV) : 'Lỗ');
      setTx('rRoiBreakSub', coLai
        ? `Ads tối đa: ${fmt(adsToiDa)}đ (${(adsToiDa / refPrice * 100).toFixed(1)}%)`
        : 'Lỗ dù không chạy ads');

      setTx('rCurPrice', fmt(refPrice));
      setTx('rCurProfit', `LN: ${fmt(lnNay)}đ (${calcProfitPercent(lnNay, refPrice).toFixed(1)}%)`);
      setMau('rCurProfit', lnNay >= 0 ? '' : '#dc2626');

      setTx('rAdsCost', adsPct > 0 ? fmt(adsCost) : '0');
      setTx('rAdsCostSub', adsPct > 0
        ? `Quảng cáo ${fees.pct.ads}% × giá bán`
        : 'Chưa đặt % quảng cáo');

      if (!roiNay) {
        setTx('rRoiNow', '—');
        setTx('rRoiNowSub', 'Nhập % quảng cáo để tính');
        setMau('rRoiNow', '');
      } else {
        setTx('rRoiNow', soRoi(roiNay));
        if (!coLai) {
          setTx('rRoiNowSub', 'Giá bán chưa đủ bù chi phí');
          setMau('rRoiNow', '#dc2626');
        } else if (roiNay >= roiHV) {
          setTx('rRoiNowSub', `Trên ngưỡng hòa vốn ${soRoi(roiHV)} — có lãi`);
          setMau('rRoiNow', '#16a34a');
        } else {
          setTx('rRoiNowSub', `Dưới ngưỡng hòa vốn ${soRoi(roiHV)} — lỗ`);
          setMau('rRoiNow', '#dc2626');
        }
      }
    } else {
      ['rRoiBreak','rCurPrice','rAdsCost','rRoiNow'].forEach(id => setTx(id, '--'));
      ['rRoiBreakSub','rCurProfit','rAdsCostSub','rRoiNowSub'].forEach(id => setTx(id, ''));
      setMau('rRoiNow', ''); setMau('rCurProfit', '');
      setTx('rCurPrice', 'Nhập giá bán');
    }

    if (refPrice > 0) {
      const refSettlement = calcSettlementProfit(refPrice, cost, totalPctDecimal, fees.fixedTotal, settlement);
      const refProfit = refSettlement.currentProfit;
      const refProfitPct = calcProfitPercent(refProfit, refPrice);
      const refNetProfitPct = calcProfitPercent(refSettlement.netProfit, refPrice);
      const refDiv = document.getElementById('refAnalysis');
      refDiv.style.display = 'block';
      refDiv.className = 'ref-analysis ' + (refSettlement.netProfit >= 0 ? 'positive' : 'negative');

      // Chi tiết phí theo %
      const feePhiPct = refPrice * totalPctDecimal;
      const feeTaxAmt = refPrice * (fees.pct.tax / 100);
      const feeTransAmt = refPrice * (fees.pct.transaction / 100);
      const feeCommAmt = refPrice * (fees.pct.commission / 100);
      const feeAffAmt = refPrice * (fees.pct.aff / 100);
      const feeVoucherAmt = refPrice * (fees.pct.voucher / 100);
      const feeOpsAmt = refPrice * (fees.pct.ops / 100);
      const feeAdsAmt = refPrice * (fees.pct.ads / 100);
      const feeOtherAmt = refPrice * (fees.pct.other / 100);

      let html = '';
      html += `<div style="font-size:1.05em;font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid rgba(0,0,0,0.1);">📊 Phân tích chi tiết cách tính</div>`;

      // Bước 1: Tổng phí
      html += `<div style="font-weight:700;color:#1d4ed8;margin-bottom:6px;">① Tổng phí trên giá bán (${fees.totalPct.toFixed(1)}% × ${fmt(refPrice)}đ = ${fmt(feePhiPct)}đ)</div>`;
      html += `<div style="padding-left:16px;font-size:0.88em;line-height:2;border-left:3px solid #dbeafe;margin-bottom:12px;">`;
      if (fees.pct.tax > 0) html += `<div>• Thuế: ${fees.pct.tax}% × ${fmt(refPrice)} = <strong>${fmt(feeTaxAmt)}đ</strong></div>`;
      if (fees.pct.transaction > 0) html += `<div>• Phí giao dịch: ${fees.pct.transaction}% × ${fmt(refPrice)} = <strong>${fmt(feeTransAmt)}đ</strong></div>`;
      if (fees.pct.commission > 0) html += `<div>• Hoa hồng: ${fees.pct.commission}% × ${fmt(refPrice)} = <strong>${fmt(feeCommAmt)}đ</strong></div>`;
      if (fees.pct.aff > 0) html += `<div>• Phí AFF: ${fees.pct.aff}% × ${fmt(refPrice)} = <strong>${fmt(feeAffAmt)}đ</strong></div>`;
      if (fees.pct.voucher > 0) html += `<div>• Voucher extra: ${fees.pct.voucher}% × ${fmt(refPrice)} = <strong>${fmt(feeVoucherAmt)}đ</strong></div>`;
      if (fees.pct.ops > 0 && !fees.opsTrongFixed) html += `<div>• Vận hành: ${fees.pct.ops.toFixed(2)}% × ${fmt(refPrice)} = <strong>${fmt(feeOpsAmt)}đ</strong></div>`;
      if (fees.opsTrongFixed && fees.pct.ops > 0) html += `<div style="color:#b45309">• Vận hành ${fees.pct.ops.toFixed(2)}% không tính ở đây — đã nằm ở mục ② Phí cố định</div>`;
      if (fees.pct.ads > 0) html += `<div>• Quảng cáo: ${fees.pct.ads}% × ${fmt(refPrice)} = <strong>${fmt(feeAdsAmt)}đ</strong></div>`;
      if (fees.pct.other > 0) html += `<div>• Phí khác: ${fees.pct.other}% × ${fmt(refPrice)} = <strong>${fmt(feeOtherAmt)}đ</strong></div>`;
      html += `</div>`;

      // Bước 2: Phí cố định
      html += `<div style="font-weight:700;color:#1d4ed8;margin-bottom:6px;">② Phí cố định / đơn: <strong>${fmt(fees.fixedTotal)}đ</strong></div>`;
      html += `<div style="padding-left:16px;font-size:0.88em;line-height:2;border-left:3px solid #dbeafe;margin-bottom:12px;">`;
      html += `<div>• Xử lý đơn: <strong>${fmt(fees.fixedProcessing)}đ</strong></div>`;
      html += `<div>• Hoàn vận chuyển: <strong>${fmt(fees.fixedShipping)}đ</strong></div>`;
      if (fees.shopOpsPerOrder > 0) html += `<div>• Vận hành shop: <strong>${fmt(fees.shopOpsPerOrder)}đ</strong></div>`;
      if (fees.packCostPerOrder > 0) html += `<div>• Đóng hàng: <strong>${fmt(fees.packCostPerOrder)}đ</strong></div>`;
      html += `</div>`;

      // Bước 3: Lợi nhuận
      html += `<div style="font-weight:700;color:#16a34a;margin-bottom:6px;">③ Lợi nhuận</div>`;
      html += `<div style="padding-left:16px;font-size:0.88em;line-height:2;border-left:3px solid #dcfce7;margin-bottom:12px;">`;
      html += `<div>= Giá bán - Phí % - Phí cố định - Giá vốn</div>`;
      html += `<div>= ${fmt(refPrice)} - ${fmt(feePhiPct)} - ${fmt(fees.fixedTotal)} - ${fmt(cost)}</div>`;
      html += `<div>= <strong style="font-size:1.1em;color:#16a34a">${fmt(refProfit)}đ</strong> (${refProfitPct.toFixed(1)}% trên giá bán)</div>`;
      html += `<div>Tỉ lệ giá bán / giá vốn: <strong>${(refPrice/cost).toFixed(2)}x</strong></div>`;
      html += `</div>`;

      // Bước 4: Quyết toán (nếu có)
      if (settlement.enabled) {
        html += `<div style="font-weight:700;color:#d97706;margin-bottom:6px;">④ Quyết toán cuối năm (Shop trên 3 tỷ/năm)</div>`;
        html += `<div style="padding-left:16px;font-size:0.88em;line-height:2;border-left:3px solid #fef3c7;margin-bottom:12px;">`;
        html += `<div>• Thuế sàn tạm thu: ${settlement.tempTaxPct}% × ${fmt(refPrice)} = <strong>${fmt(refSettlement.tempTax)}đ</strong> <span style="color:var(--text-muted)">(sàn đã giữ)</span></div>`;
        html += `<div>• Lợi nhuận trước thuế: ${fmt(refProfit)} + ${fmt(refSettlement.tempTax)} = <strong>${fmt(refSettlement.preSettlementProfit)}đ</strong> <span style="color:var(--text-muted)">(cộng lại tạm thu)</span></div>`;
        html += `<div>• VAT quyết toán: ${settlement.vatPct}% × ${fmt(refPrice)} = <strong>${fmt(refSettlement.finalVat)}đ</strong></div>`;
        html += `<div>• TNCN/LN: ${settlement.pitPct}% × ${fmt(refSettlement.preSettlementProfit)} = <strong>${fmt(refSettlement.finalPit)}đ</strong></div>`;
        html += `<div>• Tổng thuế thực tế: ${fmt(refSettlement.finalVat)} + ${fmt(refSettlement.finalPit)} = <strong>${fmt(refSettlement.finalVat + refSettlement.finalPit)}đ</strong></div>`;
        html += `<div>• Phải nộp thêm: ${fmt(refSettlement.finalVat + refSettlement.finalPit)} - ${fmt(refSettlement.tempTax)} = <strong style="color:#d97706">${fmt(refSettlement.settlementDelta)}đ</strong></div>`;
        html += `<div style="margin-top:4px;font-weight:600">→ Lợi nhuận sau quyết toán: ${fmt(refProfit)} - ${fmt(refSettlement.settlementDelta)} = <strong style="font-size:1.1em;color:${refSettlement.netProfit >= 0 ? '#16a34a' : '#dc2626'}">${fmt(refSettlement.netProfit)}đ</strong> (${refNetProfitPct.toFixed(1)}%)</div>`;
        html += `</div>`;
      }

      // Kết luận
      html += `<div style="margin-top:8px;padding:10px 14px;border-radius:8px;font-weight:600;${refSettlement.netProfit >= 0 ? 'background:#f0fdf4;color:#16a34a;' : 'background:#fef2f2;color:#dc2626;'}">${refSettlement.netProfit >= 0 ? '✅ Bạn có lãi với giá bán này.' : '⚠️ Cảnh báo: Bạn sẽ bị lỗ với giá bán này!'}</div>`;
      html += `<div style="margin-top:8px;color:#dc2626;font-weight:600;font-size:0.85em;">⚠️ Lưu ý: Bảng tính chỉ mang tính tham khảo, hãy tính lại tùy theo trường hợp shop.</div>`;

      document.getElementById('refAnalysisContent').innerHTML = html;
    } else {
      document.getElementById('refAnalysis').style.display = 'none';
    }
  } else {
    document.getElementById('rBreakeven').textContent = '--';
    ['rRoiBreak','rCurPrice','rAdsCost','rRoiNow'].forEach(id => {
      const e = document.getElementById(id); if (e) e.textContent = '--';
    });
    ['rBreakevenSub','rRoiBreakSub','rCurProfit','rAdsCostSub','rRoiNowSub'].forEach(id => {
      const e = document.getElementById(id); if (e) e.textContent = '';
    });
    document.getElementById('refAnalysis').style.display = 'none';
  }
}

// ========== PRODUCT MANAGEMENT ==========
async function addProduct() {
  const code = document.getElementById('prodCode').value.trim();
  const name = document.getElementById('prodName').value.trim();
  const cost = parseMoneyInput(document.getElementById('prodCost').value);
  const refPrice = parseMoneyInput(document.getElementById('prodRef').value);
  const prodType = document.getElementById('prodType').value;

  if (!code || !name || cost <= 0) {
    alert('Vui lòng nhập đầy đủ: Mã SP, Tên SP và Giá vốn!');
    return;
  }

  const fees = getFees();
  const settlement = getSettlementConfig();
  const totalPctDecimal = fees.totalPct / 100;
  const breakeven = calcBreakeven(cost, totalPctDecimal, fees.fixedTotal);

  const refSettlement = refPrice > 0
    ? calcSettlementProfit(refPrice, cost, totalPctDecimal, fees.fixedTotal, settlement)
    : { currentProfit: 0, netProfit: 0 };
  const refProfit = refPrice > 0 ? refSettlement.currentProfit : 0;
  const refProfitPct = refPrice > 0 ? calcProfitPercent(refProfit, refPrice) : 0;
  const refNetProfit = refPrice > 0 ? refSettlement.netProfit : 0;

  const product = {
    id: Date.now(), code, name, cost, refPrice, prodType,
    cheDo: 'hkd',
    totalPct: fees.totalPct, fixedTotal: fees.fixedTotal,
    breakeven,
    refProfit, refProfitPct, refNetProfit,
    settlementMode: settlement.enabled ? 'over3b' : 'off',
    fees: { ...fees.pct, fixedProcessing: fees.fixedProcessing, fixedShipping: fees.fixedShipping }
  };

  // Đang ở chế độ Công ty thì phải lưu số của Công ty, không lưu số hộ kinh doanh —
  // nếu không, bảng và file Excel sẽ hiện một đằng còn màn hình hiện một nẻo.
  if (typeof hinhThucKD !== 'undefined' && hinhThucKD === 'cty' && typeof ctTinh === 'function') {
    const cfg = getCtyCfg();
    const hv = ctGiaHoaVon(cost, fees, cfg);
    product.cheDo    = 'cty';
    product.totalPct = Math.max(0, fees.totalPct - (fees.pct.tax || 0));   // công ty không có thuế khoán
    product.breakeven = (hv == null) ? Infinity : hv;                      // hoà vốn SAU thuế
    if (refPrice > 0) {
      const r = ctTinh(refPrice, cost, fees, cfg, null);
      product.refProfit    = r.lnKt;                                      // lợi nhuận TRƯỚC thuế
      product.refProfitPct = calcProfitPercent(r.lnKt, refPrice);
      product.refNetProfit = r.sauThue;                                   // lợi nhuận SAU thuế
      product.ctVatNop     = r.vatNop;
      product.ctThue       = r.thue;
      product.ctThieuCT    = r.loai;
    } else {
      product.refProfit = 0; product.refProfitPct = 0; product.refNetProfit = 0;
      product.ctVatNop = 0; product.ctThue = 0; product.ctThieuCT = 0;
    }
    product.ctVat = cfg.vat * 100;
    product.ctTndn = cfg.tndn * 100;
  }

  products.push(product);
  await saveProducts();
  renderTable();
  clearForm();
}

async function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  await saveProducts();
  renderTable();
}

async function clearAll() {
  if (!confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm không?')) return;
  products = [];
  await saveProducts();
  renderTable();
}

async function saveProducts() {
  var bayGio = Date.now();
  ghiSpMay(products, bayGio);           // lưu trên máy TRƯỚC, có mốc thời gian
  try { await dayLenCloud(products, bayGio); }
  catch (e) { console.warn('Lưu danh sách sản phẩm lên cloud lỗi.', e); }
}

function renderTable() {
  const body = document.getElementById('productBody');
  const empty = document.getElementById('emptyState');
  if (products.length === 0) { body.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  const typeLabels = { pheu: 'Phễu', lai_tb: 'Lãi TB', chu_luc: 'Chủ lực' };
  body.innerHTML = products.map((p, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${esc(p.code)}</td>
      <td>${esc(p.name)}</td>
      <td class="text-center">${esc(typeLabels[p.prodType] || p.prodType)}</td>
      <td class="text-center">${p.cheDo === 'cty' ? '🏛️ Công ty' : 'Hộ KD'}</td>
      <td class="text-right">${fmt(p.cost)}</td>
      <td class="text-right">${fmtPercent(p.totalPct)}</td>
      <td class="text-right text-yellow">${fmt(p.breakeven)}</td>
      <td class="text-right">${p.refPrice > 0 ? fmt(p.refPrice) : '--'}</td>
      <td class="text-right ${p.refProfit >= 0 ? 'text-green' : 'text-red'}">${p.refPrice > 0 ? fmt(p.refProfit) : '--'}</td>
      <td class="text-right ${p.refProfitPct >= 0 ? 'text-green' : 'text-red'}">${p.refPrice > 0 ? p.refProfitPct.toFixed(1) + '%' : '--'}</td>
      <td class="text-right ${p.refNetProfit >= 0 ? 'text-green' : 'text-red'}">${p.refPrice > 0 ? fmt(p.refNetProfit) : '--'}</td>
      <td class="text-center"><button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Xóa</button></td>
    </tr>
  `).join('');
}

function clearForm() {
  document.getElementById('prodCode').value = '';
  document.getElementById('prodName').value = '';
  document.getElementById('prodCost').value = '';
  document.getElementById('prodRef').value = '';
  recalc();
}

// ========== CSV EXPORT ==========
function exportCSV() {
  if (products.length === 0) { alert('Chưa có sản phẩm nào để xuất!'); return; }
  if (typeof XLSX === 'undefined') { alert('Chưa tải được thư viện Excel. Vui lòng tải lại trang.'); return; }

  const typeLabels = { pheu: 'Phễu', lai_tb: 'Lãi TB', chu_luc: 'Chủ lực' };
  const rows = [
    ['BẢNG GIÁ SẢN PHẨM — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleString('vi-VN'), '', 'Số sản phẩm:', products.length],
    [],
    ['STT','Mã SP','Tên sản phẩm','Phân loại','Chế độ','Giá vốn','Tổng phí %','Giá hòa vốn',
     'Giá bán','Lợi nhuận trước thuế','% Lợi nhuận','LN cuối (sau thuế/QT)','VAT phải nộp','Thuế TNDN']
  ];

  // Giữ nguyên dạng SỐ (không kèm chữ đ, không đổi thành chuỗi) thì Excel mới
  // cộng và lọc được. Phần trăm để dạng thập phân rồi định dạng ô ở dưới.
  products.forEach((p, i) => {
    const coGia = p.refPrice > 0;
    const laCty = p.cheDo === 'cty';
    rows.push([
      i + 1, p.code || '', p.name || '', typeLabels[p.prodType] || p.prodType || '',
      laCty ? 'Công ty' : 'Hộ KD',
      Math.round(p.cost), Number((p.totalPct / 100).toFixed(4)),
      isFinite(p.breakeven) ? Math.round(p.breakeven) : 'Không có',
      coGia ? Math.round(p.refPrice) : '',
      coGia ? Math.round(p.refProfit) : '',
      coGia ? Number((p.refProfitPct / 100).toFixed(4)) : '',
      coGia ? Math.round(p.refNetProfit) : '',
      (laCty && coGia) ? Math.round(p.ctVatNop || 0) : '',
      (laCty && coGia) ? Math.round(p.ctThue || 0) : ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 34 }, { wch: 11 }, { wch: 10 }, { wch: 12 },
                 { wch: 11 }, { wch: 13 }, { wch: 13 }, { wch: 18 }, { wch: 11 }, { wch: 19 },
                 { wch: 14 }, { wch: 12 }];

  // Tiền hiện dấu phân cách nghìn, phần trăm hiện dạng %
  for (let r = 0; r < products.length; r++) {
    const d = 4 + r;                                  // dòng dữ liệu, tính từ 0
    [5, 7, 8, 9, 11, 12, 13].forEach(c => {           // cột tiền
      const o = ws[XLSX.utils.encode_cell({ r: d, c })];
      if (o && typeof o.v === 'number') o.z = '#,##0';
    });
    [6, 10].forEach(c => {                            // cột phần trăm
      const o = ws[XLSX.utils.encode_cell({ r: d, c })];
      if (o && typeof o.v === 'number') o.z = '0.0%';
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bảng giá');
  XLSX.writeFile(wb, `Bang_gia_san_pham_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ========== COLLAPSIBLE ==========
function toggleCollapse(header) {
  header.classList.toggle('collapsed');
  const body = header.nextElementSibling;
  if (body && body.classList.contains('collapsible-body')) {
    body.style.display = body.style.display === 'none' ? '' : 'none';
  }
}

// ========== ORDER STATISTICS ==========
let chartPie = null, chartDaily = null, chartRevenue = null, chartCancelReasons = null;

function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Fix: TikTok income files have wrong dimension tag
        // Recalculate actual range by scanning cell keys
        let maxR = 0, maxC = 0;
        for (const key of Object.keys(ws)) {
          if (key[0] === '!') continue;
          const m = key.match(/^([A-Z]+)(\d+)$/);
          if (!m) continue;
          const r = parseInt(m[2]) - 1;
          let c = 0;
          for (let i = 0; i < m[1].length; i++) c = c * 26 + m[1].charCodeAt(i) - 64;
          c--;
          if (r > maxR) maxR = r;
          if (c > maxC) maxC = c;
        }
        if (maxR > 0 || maxC > 0) {
          const oldRef = ws['!ref'];
          ws['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:maxR,c:maxC}});
          if (oldRef !== ws['!ref']) console.log('[XLSX] Fixed ref:', oldRef, '->', ws['!ref']);
        }

        // Use sheet_to_json for reliable parsing
        const jsonRaw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        if (!jsonRaw.length) { resolve({ headers: [], rows: [] }); return; }

        // Row 0 = headers
        const headers = jsonRaw[0].map(h => h != null ? String(h).trim() : '');

        // Check row 1 for TikTok description row (starts with letter)
        const r1v = jsonRaw[1] && jsonRaw[1][0] ? String(jsonRaw[1][0]) : '';
        const skipDesc = r1v.length > 0 && /^[A-Za-z]/.test(r1v);
        const dataStart = skipDesc ? 2 : 1;

        const rows = [];
        for (let r = dataStart; r < jsonRaw.length; r++) {
          const rawRow = jsonRaw[r];
          if (!rawRow) continue;
          const row = {};
          let has = false;
          for (let c = 0; c < headers.length; c++) {
            const v = rawRow[c];
            row[headers[c]] = v != null ? v : null;
            if (v != null) has = true;
          }
          if (has) rows.push(row);
        }

        console.log('[XLSX]', file.name, headers.filter(h=>h).length, 'cols,', rows.length, 'rows, skipDesc:', skipDesc);
        if (rows[0]) console.log('[XLSX] sample:', JSON.stringify(rows[0]).slice(0, 400));
        resolve({ headers, rows });
      } catch (err) { console.error('[XLSX]', err); reject(err); }
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

function parseDate(str) {
  if (!str) return null;
  const s = String(str);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function dateFmt(d) {
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);
}

function destroyCharts() {
  [chartPie, chartDaily, chartRevenue, chartCancelReasons].forEach(c => { if (c) c.destroy(); });
  chartPie = chartDaily = chartRevenue = chartCancelReasons = null;
}

async function processOrderFiles() {
  const fileAll = document.getElementById('fileAllOrders').files[0];
  if (!fileAll) { alert('Vui lòng chọn file "Tất cả đơn hàng"!'); return; }

  showLoading('⏳ Đang phân tích đơn hàng...', 'Đang đọc file ' + fileAll.name);

  try {
    await new Promise(r => setTimeout(r, 100)); // cho UI render loading
    const allData = await parseXlsx(fileAll);
    document.getElementById('hintAllOrders').textContent = `✅ ${fileAll.name} — ${allData.rows.length} dòng`;
    document.getElementById('hintAllOrders').className = 'file-hint loaded';

    let returnData = null;
    const fileReturn = document.getElementById('fileReturnOrders').files[0];
    if (fileReturn) {
      returnData = await parseXlsx(fileReturn);
      document.getElementById('hintReturnOrders').textContent = `✅ ${fileReturn.name} — ${returnData.rows.length} dòng`;
      document.getElementById('hintReturnOrders').className = 'file-hint loaded';
    }

    renderOrderStats(allData.rows, returnData ? returnData.rows : []);
    hideLoading();
  } catch (err) {
    hideLoading();
    alert('Lỗi đọc file: ' + err.message);
    console.error(err);
  }
}

function parseCurrency(val) {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[₫đ\s.]/gi, '').replace(/,/g, '').trim();
  return parseInt(s, 10) || 0;
}

const REASON_VI = {
  'No longer needed': 'Không còn nhu cầu',
  'Item too big or too small': 'Sản phẩm quá lớn hoặc quá nhỏ',
  "Product doesn't match description": 'Sản phẩm không đúng mô tả',
  'Wrong product sent': 'Gửi sai sản phẩm',
  'Poor quality': 'Chất lượng kém',
  'Congrats on meeting your refundable sample criteria!': 'Đủ điều kiện hoàn tiền mẫu thử',
  'Package or product is damaged': 'Kiện hàng hoặc sản phẩm bị hư hỏng',
  'Received parcel, but some items were missing': 'Nhận hàng nhưng thiếu sản phẩm',
  'No longer needed (Item must be in sealed/original condition)': 'Không còn nhu cầu (hàng phải nguyên seal)',
  'Did not receive parcel': 'Không nhận được hàng',
  'Item is defective': 'Sản phẩm bị lỗi',
  'Missing accessories': 'Thiếu phụ kiện',
  'Received wrong item': 'Nhận sai hàng',
  'Item does not match listing': 'Hàng không khớp tin đăng',
  'Change of mind': 'Khách đổi ý',
  'Suspected counterfeit': 'Nghi ngờ hàng giả',
  'Seller sent wrong item': 'Người bán gửi sai hàng',
  'Damaged during delivery': 'Hư hỏng khi vận chuyển',
  'Item is fake': 'Hàng giả / hàng nhái',
  'Empty parcel': 'Kiện hàng rỗng',
  'Return and refund': 'Trả hàng + hoàn tiền',
  'Refund only': 'Chỉ hoàn tiền (không trả hàng)',
};

function translateReason(text) {
  if (!text) return '--';
  const vi = REASON_VI[text];
  if (vi) return esc(text) + '<br><span style="color:var(--blue);font-weight:600;font-size:0.9em">(' + esc(vi) + ')</span>';
  return esc(text);
}

// ==================== THỐNG KÊ ĐƠN HÀNG ====================
// Dùng chung bộ hiển thị của tab Phân Tích GMV MAX: pgCard / pgTable / pgPct / pgScrollNote

// Thư cảm ơn / quà tặng kèm đi theo hầu hết đơn -> làm nhiễu bảng "top sản phẩm"
function tkIsGift(name) {
  var s = String(name || '').toUpperCase();
  return /CẢM ƠN|CAM ON|ỦNG HỘ|UNG HO|QUÀ TẶNG|QUA TANG|THƯ TAY|THU TAY/.test(s);
}

function tkKpi(lab, val, sub, col, bd) {
  return '<div style="border:2px solid ' + (bd || '#e2e8f0') + ';border-radius:12px;padding:13px 15px;text-align:center;">'
    + '<div style="font-size:0.7em;font-weight:700;color:#64748b;text-transform:uppercase;">' + lab + '</div>'
    + '<div style="font-size:1.35em;font-weight:800;color:' + (col || '#1e293b') + ';margin:4px 0 2px;">' + val + '</div>'
    + '<div style="font-size:0.7em;color:#94a3b8;">' + (sub || '') + '</div></div>';
}
function tkKpiRow(inner) {
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">' + inner + '</div>';
}

// Bảng "hạng mục | số lượng | tỉ lệ" dùng lại nhiều chỗ
function tkRankTable(entries, total, colName, opts) {
  opts = opts || {};
  var max = entries.length ? entries[0][1] : 0;
  var body = entries.map(function (e, i) {
    var pct = total > 0 ? (e[1] / total * 100) : 0;
    var w = max > 0 ? (e[1] / max * 100) : 0;
    var color = opts.color || '#dc2626';
    var label = opts.render ? opts.render(e[0]) : esc(e[0] || '(không rõ)');
    // Tên sản phẩm rất dài -> ép xuống dòng trong khung hẹp, nếu không nó đẩy
    // các cột số ra khỏi màn hình và phải kéo ngang mới thấy.
    label = '<div style="max-width:min(640px,52vw);white-space:normal;word-break:break-word;line-height:1.5;">' + label + '</div>';
    return {
      cells: [
        '<span style="color:#94a3b8;font-weight:700;">' + (i + 1) + '</span>',
        label,
        '<b style="white-space:nowrap;">' + fmt(e[1]) + '</b>',
        '<div style="min-width:96px;"><div style="font-weight:700;color:' + color + ';white-space:nowrap;">' + pct.toFixed(2).replace('.', ',') + '%</div>'
        + '<div style="height:4px;background:#e2e8f0;border-radius:3px;margin-top:3px;overflow:hidden;"><div style="height:100%;width:' + w + '%;background:' + color + ';"></div></div></div>'
      ]
    };
  });
  var vis = opts.rows || 10;
  return pgTable(
    [{ t: '#', a: 'left' }, { t: colName, a: 'left' }, { t: opts.unit || 'Số đơn', a: 'right' }, { t: '% ' + (opts.pctOf || 'tổng'), a: 'right' }],
    body,
    { scrollRows: entries.length > vis ? vis : 0, more: pgScrollNote(entries.length, vis) }
  );
}

function tkCount(list, key) {
  var m = {};
  for (var i = 0; i < list.length; i++) {
    var k = (list[i][key] || '').trim() || '(không rõ)';
    m[k] = (m[k] || 0) + 1;
  }
  return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
}

function renderOrderStats(rawRows, returns) {
  var html = '';

  // ---------- Gộp dòng SKU thành đơn hàng ----------
  var orders = {}, skuRows = 0;
  for (var i = 0; i < rawRows.length; i++) {
    var r = rawRows[i];
    var oid = String(r['Order ID'] == null ? '' : r['Order ID']).trim();
    if (!oid || oid.indexOf('Platform unique') === 0) continue;
    skuRows++;
    if (!orders[oid]) {
      orders[oid] = {
        id: oid,
        status: String(r['Order Status'] || '').trim(),
        sub: String(r['Order Substatus'] || '').trim(),
        cancelBy: String(r['Cancel By'] || '').trim(),
        reason: String(r['Cancel Reason'] || '').trim(),
        amount: parseCurrency(r['Order Amount']),
        products: []
      };
    }
    var pn = String(r['Product Name'] || '').trim();
    if (pn && orders[oid].products.indexOf(pn) < 0) orders[oid].products.push(pn);
  }
  var list = Object.keys(orders).map(function (k) { return orders[k]; });
  var total = list.length;
  if (!total) { alert('Không đọc được đơn hàng nào trong file!'); return; }

  var byStatus = {};
  for (var i = 0; i < list.length; i++) {
    var s = list[i].status || '(không rõ)';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  var hoanTat = 0, vanChuyen = 0, huy = 0, khac = 0;
  Object.keys(byStatus).forEach(function (s) {
    if (/hoàn tất|completed/i.test(s)) hoanTat += byStatus[s];
    // "Cần vận chuyển" / "To ship" là ĐANG CHỜ gửi, không phải đã gửi -> xếp vào Khác
    else if (/vận chuyển|shipped/i.test(s) && !/cần|chờ|to ship|awaiting|pending/i.test(s)) vanChuyen += byStatus[s];
    else if (/hủy|huỷ|cancel/i.test(s)) huy += byStatus[s];
    else khac += byStatus[s];
  });
  var gmvTong = list.reduce(function (s, o) { return s + o.amount; }, 0);

  // ---------- 1. TỔNG QUAN ----------
  var retRows = (returns || []).filter(function (r) { return String(r['Return Order ID'] || '').trim(); });
  var retOrderIds = {};
  retRows.forEach(function (r) { var k = String(r['Order ID'] || '').trim(); if (k) retOrderIds[k] = 1; });
  var soDonTra = Object.keys(retOrderIds).length;

  // Đơn trả hàng nằm ở nhóm trạng thái nào? (để nói rõ chúng KHÔNG cộng thêm vào tổng)
  var traTrongHoanTat = 0, traTrongVanChuyen = 0, traTrongHuy = 0, traKhongCo = 0, traKhac = 0;
  Object.keys(retOrderIds).forEach(function (k) {
    var o = orders[k];
    if (!o) { traKhongCo++; return; }
    var s = o.status || '';
    if (/hoàn tất|completed/i.test(s)) traTrongHoanTat++;
    else if (/hủy|huỷ|cancel/i.test(s)) traTrongHuy++;
    else if (/vận chuyển|shipped/i.test(s)) traTrongVanChuyen++;
    else traKhac++;
  });

  var ov = tkKpiRow(
    tkKpi('Tổng đơn hàng', fmt(total), fmt(skuRows) + ' dòng SKU', '#1d4ed8', '#bfdbfe')
    + tkKpi('Đã hoàn tất', fmt(hoanTat), pgPct(hoanTat / total, 1), '#16a34a', '#bbf7d0')
    + tkKpi('Đã vận chuyển', fmt(vanChuyen), pgPct(vanChuyen / total, 1), '#b45309', '#fde68a')
    + tkKpi('Đã huỷ', fmt(huy), pgPct(huy / total, 1), '#dc2626', '#fecaca')
    + tkKpi('Trả hàng / Hoàn tiền', fmt(soDonTra),
        soDonTra ? pgPct(soDonTra / total, 1) + ' — <b style="color:#7c3aed">đã nằm trong các nhóm trên</b>' : 'chưa có file',
        '#7c3aed', '#ddd6fe')
  );
  // thanh tỉ lệ trạng thái
  var seg = function (v, c, t) {
    var p = total > 0 ? v / total * 100 : 0;
    return p <= 0 ? '' : '<div title="' + t + ': ' + fmt(v) + ' đơn" style="width:' + p + '%;background:' + c + ';display:flex;align-items:center;justify-content:center;">' + (p >= 7 ? p.toFixed(1).replace('.', ',') + '%' : '') + '</div>';
  };
  ov += '<div style="font-size:0.75em;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Tỉ lệ trạng thái đơn hàng</div>';
  ov += '<div style="display:flex;height:28px;border-radius:8px;overflow:hidden;font-size:0.72em;font-weight:700;color:#fff;">'
    + seg(hoanTat, '#16a34a', 'Đã hoàn tất') + seg(vanChuyen, '#f59e0b', 'Đã vận chuyển')
    + seg(huy, '#dc2626', 'Đã huỷ') + seg(khac, '#94a3b8', 'Khác') + '</div>';
  ov += '<div style="margin-top:8px;font-size:0.8em;color:#64748b;">Tổng GMV (giá trị đơn đặt): <b style="color:#1e293b;">' + fmt(gmvTong) + 'đ</b></div>';

  if (soDonTra) {
    var chiTiet = [];
    if (traTrongHoanTat) chiTiet.push('<b>' + fmt(traTrongHoanTat) + '</b> ở <b>Đã hoàn tất</b>');
    if (traTrongVanChuyen) chiTiet.push('<b>' + fmt(traTrongVanChuyen) + '</b> ở <b>Đã vận chuyển</b>');
    if (traTrongHuy) chiTiet.push('<b>' + fmt(traTrongHuy) + '</b> ở <b>Đã huỷ</b>');
    if (traKhac) chiTiet.push('<b>' + fmt(traKhac) + '</b> ở trạng thái khác');
    if (traKhongCo) chiTiet.push('<b>' + fmt(traKhongCo) + '</b> không có trong file "Tất cả đơn hàng" (đơn phát sinh ngoài kỳ xuất file)');

    ov += '<div style="margin-top:10px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:11px 15px;font-size:0.8em;color:#5b21b6;line-height:1.85;">'
      + 'ℹ️ <b>' + fmt(soDonTra) + ' đơn Trả hàng / Hoàn tiền KHÔNG cộng thêm vào tổng ' + fmt(total) + ' đơn</b> — chúng đã nằm sẵn trong các nhóm trên: '
      + chiTiet.join(' · ') + '.'
      + (traTrongHuy === 0
          ? '<br><span style="color:#7c3aed;">Không có đơn nào vừa Huỷ vừa Trả hàng — <b>huỷ</b> là khách chưa nhận hàng, <b>trả hàng</b> là đã nhận rồi mới trả. Hai nhóm này tách bạch, cộng chung là tính trùng.</span>'
          : '<br><span style="color:#b45309;">Có <b>' + fmt(traTrongHuy) + '</b> đơn vừa bị huỷ vừa có yêu cầu hoàn tiền — nếu cộng cả 2 nhóm sẽ bị tính trùng số này.</span>')
      + '</div>';
  }
  html += pgCard('📦 Tổng quan đơn hàng', ov, '#2563eb');

  // ---------- 2. ĐƠN HUỶ ----------
  var cancels = list.filter(function (o) { return /hủy|huỷ|cancel/i.test(o.status); });
  var gmvHuy = cancels.reduce(function (s, o) { return s + o.amount; }, 0);
  // Giao không thành công: nhận diện theo lý do huỷ
  var failDeliver = cancels.filter(function (o) { return /giao.*thất bại|thất bại.*giao|delivery fail|failed deliver/i.test(o.reason); });
  var gmvFail = failDeliver.reduce(function (s, o) { return s + o.amount; }, 0);

  var ch = tkKpiRow(
    tkKpi('Tổng đơn huỷ', fmt(huy), pgPct(huy / total, 1) + ' tổng đơn', '#dc2626', '#fecaca')
    + tkKpi('GMV mất do huỷ', fmt(gmvHuy) + 'đ', gmvTong > 0 ? pgPct(gmvHuy / gmvTong, 1) + ' tổng GMV' : '', '#dc2626', '#fecaca')
    + tkKpi('Giao không thành công', fmt(failDeliver.length), huy > 0 ? pgPct(failDeliver.length / huy, 1) + ' số đơn huỷ' : '', '#c2410c', '#fed7aa')
    + tkKpi('GMV giao thất bại', fmt(gmvFail) + 'đ', 'tiền ship đã mất', '#c2410c', '#fed7aa')
  );

  if (failDeliver.length) {
    ch += '<div style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:0.86em;color:#7c2d12;line-height:1.8;">'
      + '🚚 <b>' + fmt(failDeliver.length) + ' đơn giao không thành công</b> — hàng đã lên đường rồi mới huỷ, tức <b>mất cả phí ship hai chiều</b> chứ không chỉ mất đơn. '
      + 'Chiếm <b>' + pgPct(failDeliver.length / huy, 1) + '</b> tổng số đơn huỷ. Đây là nhóm tốn tiền nhất trong các loại huỷ — soi kỹ vùng giao, đơn vị vận chuyển và chất lượng số điện thoại khách.'
      + '</div>';
  }

  // Ai huỷ đơn
  ch += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:14px 0 6px;">👤 Ai huỷ đơn</div>';
  var byWho = tkCount(cancels, 'cancelBy');
  var WHO_VI = { 'User': 'Khách hàng', 'System': 'Hệ thống TikTok', 'Seller': 'Người bán (shop)', 'Operator': 'Nhân viên vận hành TikTok' };
  ch += tkRankTable(byWho, huy, 'Người huỷ', {
    color: '#dc2626', pctOf: 'đơn huỷ', rows: 10,
    render: function (k) {
      var vi = WHO_VI[k];
      return '<b>' + esc(k) + '</b>' + (vi ? '<div style="font-size:0.85em;color:#94a3b8;">' + vi + '</div>' : '');
    }
  });

  // Lý do huỷ
  ch += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:18px 0 6px;">📋 Lý do huỷ đơn</div>';
  var byReason = tkCount(cancels, 'reason');
  ch += tkRankTable(byReason, huy, 'Lý do', {
    color: '#dc2626', pctOf: 'đơn huỷ', rows: 10,
    render: function (k) {
      var isFail = /giao.*thất bại|thất bại.*giao/i.test(k);
      return esc(k) + (isFail ? ' <span style="background:#fed7aa;color:#7c2d12;padding:1px 6px;border-radius:4px;font-size:0.78em;font-weight:700;">GIAO THẤT BẠI</span>' : '');
    }
  });

  // Top sản phẩm bị huỷ
  var prodCount = {};
  cancels.forEach(function (o) {
    o.products.forEach(function (p) { prodCount[p] = (prodCount[p] || 0) + 1; });
  });
  var prodList = Object.keys(prodCount).map(function (k) { return [k, prodCount[k]]; })
    .sort(function (a, b) { return b[1] - a[1]; });
  var giftN = prodList.filter(function (e) { return tkIsGift(e[0]); }).length;
  var prodReal = prodList.filter(function (e) { return !tkIsGift(e[0]); });

  ch += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:18px 0 6px;">📦 Sản phẩm bị huỷ nhiều nhất</div>';
  if (giftN) {
    ch += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:9px 13px;margin-bottom:8px;font-size:0.8em;color:#92400e;">'
      + '🎁 Đã lọc bỏ <b>' + giftN + ' mục quà tặng / thư cảm ơn</b> — chúng đi kèm hầu hết đơn nên luôn đứng đầu bảng, không phản ánh sản phẩm nào thực sự bị huỷ.'
      + '</div>';
  }
  ch += tkRankTable(prodReal, huy, 'Sản phẩm', { color: '#dc2626', pctOf: 'đơn huỷ', rows: 10 });

  html += pgCard('❌ Phân tích đơn huỷ', ch, '#dc2626');

  // ---------- 3. TRẢ HÀNG / HOÀN TIỀN ----------
  if (!retRows.length) {
    html += pgCard('🔄 Trả hàng / Hoàn tiền',
      '<div style="font-size:0.88em;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">'
      + '⚠️ Chưa upload file <b>"Đơn trả hàng / hoàn tiền"</b> nên chưa phân tích được phần này. File này không bắt buộc nhưng nên có — nó cho biết khách trả hàng vì lý do gì và sản phẩm nào bị trả nhiều nhất.</div>',
      '#7c3aed');
  } else {
    var maTra = {}, giaTriTra = 0;
    retRows.forEach(function (r) {
      maTra[String(r['Return Order ID'] || '').trim()] = 1;
      var up = parseCurrency(r['Return unit price']);
      var q = parseFloat(r['Return Quantity']) || 1;
      giaTriTra += up * q;
    });
    var soMaTra = Object.keys(maTra).length;

    var rh = tkKpiRow(
      tkKpi('Mã trả hàng', fmt(soMaTra), fmt(retRows.length) + ' dòng SKU', '#7c3aed', '#ddd6fe')
      + tkKpi('Đơn gốc bị trả', fmt(soDonTra), pgPct(soDonTra / total, 1) + ' tổng đơn', '#7c3aed', '#ddd6fe')
      + tkKpi('Giá trị hàng trả', fmt(giaTriTra) + 'đ', 'đơn giá × số lượng trả', '#dc2626', '#fecaca')
      + tkKpi('TB / đơn trả', fmt(soDonTra ? giaTriTra / soDonTra : 0) + 'đ', '', '#1e293b', '#e2e8f0')
    );

    var pick = function (k) { return retRows.map(function (r) { return { v: String(r[k] || '').trim() }; }); };

    // Trạng thái xử lý
    var ST_VI = { 'Completed': 'Đã hoàn tất', 'Refund rejected': 'Từ chối hoàn tiền', 'To Process': 'Chờ xử lý', 'In Process': 'Đang xử lý', 'Cancelled': 'Đã huỷ yêu cầu' };
    rh += '<div style="font-weight:700;font-size:0.85em;color:#6d28d9;margin:14px 0 6px;">📌 Trạng thái xử lý trả hàng</div>';
    rh += tkRankTable(tkCount(pick('Return Status'), 'v'), retRows.length, 'Trạng thái', {
      color: '#7c3aed', unit: 'Số mã', pctOf: 'mã trả', rows: 10,
      render: function (k) {
        var vi = ST_VI[k];
        var bad = /reject/i.test(k);
        return '<b style="color:' + (bad ? '#dc2626' : '#1e293b') + ';">' + esc(k) + '</b>'
          + (vi ? '<div style="font-size:0.85em;color:#94a3b8;">' + vi + '</div>' : '');
      }
    });

    // Loại trả hàng
    var TY_VI = { 'Return and refund': 'Trả hàng + hoàn tiền', 'Refund only': 'Chỉ hoàn tiền (không trả hàng)' };
    rh += '<div style="font-weight:700;font-size:0.85em;color:#6d28d9;margin:18px 0 6px;">🔀 Loại yêu cầu</div>';
    rh += tkRankTable(tkCount(pick('Return Type'), 'v'), retRows.length, 'Loại', {
      color: '#7c3aed', unit: 'Số mã', pctOf: 'mã trả', rows: 10,
      render: function (k) {
        var vi = TY_VI[k];
        return '<b>' + esc(k) + '</b>' + (vi ? '<div style="font-size:0.85em;color:#94a3b8;">' + vi + '</div>' : '');
      }
    });

    // Lý do trả hàng
    rh += '<div style="font-weight:700;font-size:0.85em;color:#6d28d9;margin:18px 0 6px;">📋 Lý do khách trả hàng</div>';
    rh += tkRankTable(tkCount(pick('Return Reason'), 'v'), retRows.length, 'Lý do', {
      color: '#7c3aed', unit: 'Số mã', pctOf: 'mã trả', rows: 10,
      render: function (k) { return translateReason(k); }
    });

    // Top sản phẩm bị trả
    var rp = {};
    retRows.forEach(function (r) {
      var p = String(r['Product Name'] || '').trim() || '(không rõ)';
      rp[p] = (rp[p] || 0) + 1;
    });
    var rpList = Object.keys(rp).map(function (k) { return [k, rp[k]]; })
      .filter(function (e) { return !tkIsGift(e[0]); })
      .sort(function (a, b) { return b[1] - a[1]; });
    rh += '<div style="font-weight:700;font-size:0.85em;color:#6d28d9;margin:18px 0 6px;">📦 Sản phẩm bị trả nhiều nhất</div>';
    rh += tkRankTable(rpList, retRows.length, 'Sản phẩm', { color: '#7c3aed', unit: 'Số mã', pctOf: 'mã trả', rows: 10 });

    html += pgCard('🔄 Phân tích trả hàng / hoàn tiền', rh, '#7c3aed');
  }

  window._orderStats = { orders: list, total: total, cancels: cancels, returns: retRows };
  var dash = document.getElementById('statsDashboard');
  dash.innerHTML = html;
  dash.style.display = '';
}

function clearOrderStats() {
  destroyCharts();
  document.getElementById('statsDashboard').style.display = 'none';
  document.getElementById('statsDashboard').innerHTML = '';
  window._orderStats = null;
  document.getElementById('fileAllOrders').value = '';
  document.getElementById('fileReturnOrders').value = '';
  document.getElementById('hintAllOrders').textContent = 'Chưa chọn file';
  document.getElementById('hintAllOrders').className = 'file-hint';
  document.getElementById('hintReturnOrders').textContent = 'Chưa chọn file';
  document.getElementById('hintReturnOrders').className = 'file-hint';
}

// ========== SHOPEE ORDER STATS ==========
let spCharts = {};
async function processShopeeOrders() {
  const files = document.getElementById('spFileOrders').files;
  if (!files.length) return alert('Vui lòng chọn file đơn hàng Shopee!');
  showLoading('📊 Đang phân tích đơn hàng Shopee...', 'Đang đọc ' + files.length + ' file, vui lòng chờ');
  await new Promise(r => setTimeout(r, 100));
  try {
    let allRows = [];
    for (const file of files) {
      try {
        const result = await parseXlsx(file);
        if (result.rows.length > 0) allRows = allRows.concat(result.rows);
      } catch (e) { console.error('Error parsing', file.name, e); }
    }
    if (!allRows.length) { hideLoading(); return alert('Không đọc được dữ liệu!'); }
    renderShopeeStats(allRows);
  } catch (e) { console.error(e); alert('Lỗi: ' + e.message); }
  hideLoading();
}

function clearShopeeStats() {
  document.getElementById('spStatsDashboard').style.display = 'none';
  document.getElementById('spStatsDashboard').innerHTML = '';
  window._spOrderStats = null;
  document.getElementById('spFileOrders').value = '';
  document.getElementById('spHintOrders').textContent = 'Chưa chọn file';
  Object.values(spCharts).forEach(c => c.destroy());
  spCharts = {};
}

// Shopee ghi tiền dạng "118897.00" — dấu chấm là THẬP PHÂN, không phải phân cách nghìn.
// parseCurrency() của tool xoá dấu chấm nên sẽ ra sai gấp 100 lần. Dùng hàm riêng.
function spNum(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  var s = String(v).trim().replace(/[₫đ\s]/gi, '');
  if (!s || s === '-') return 0;
  if (/^-?\d+(\.\d{1,2})?$/.test(s)) return parseFloat(s) || 0;      // 118897.00
  return parseFloat(s.replace(/\./g, '').replace(/,/g, '.')) || 0;   // 1.347.460.600
}

// Lý do huỷ Shopee là 1 chuỗi gộp: "Hủy bởi người mua  lí do là: Thay đổi đơn hàng"
// -> tách thành ai huỷ + lý do
function spSplitCancel(txt) {
  var t = String(txt || '').trim();
  if (!t) return { who: '(không rõ)', why: '(không ghi lý do)' };
  var m = t.match(/^(.*?)\s*l[íi]\s*do\s*l[àa]\s*:\s*(.*)$/i);
  if (!m) return { who: '(không rõ)', why: t };
  return { who: m[1].trim() || '(không rõ)', why: m[2].trim() || '(không ghi lý do)' };
}

// Vài lý do Shopee trả về tiếng Anh — gộp về cùng một nhãn tiếng Việt để không bị đếm tách đôi
var SP_REASON_MAP = {
  'need to change delivery address': 'Muốn thay đổi địa chỉ giao hàng',
  'need to change order': 'Thay đổi đơn hàng',
  'change of mind': 'Đổi ý, không muốn mua nữa',
  'found cheaper elsewhere': 'Tìm thấy giá rẻ hơn ở chỗ khác',
  'others': 'Lý do khác',
  'other': 'Lý do khác',
  'lí do khác': 'Lý do khác',
  'ly do khac': 'Lý do khác'
};
function spNormReason(s) {
  var k = String(s || '').trim().toLowerCase();
  return SP_REASON_MAP[k] || String(s || '').trim() || '(không ghi lý do)';
}

function renderShopeeStats(rawRows) {
  const keys = Object.keys(rawRows[0] || {});
  const fk = (s) => keys.find(k => k && k.includes(s)) || '';
  const C = {
    id: fk('Mã đơn hàng'),
    status: fk('Trạng Thái Đơn Hàng') || fk('Trạng thái đơn hàng') || fk('Trạng Thái'),
    product: fk('Tên sản phẩm'),
    amount: fk('Tổng giá trị đơn hàng'),
    qty: fk('Số lượng'),
    date: fk('Ngày đặt hàng'),
    cancelReason: fk('Lý do hủy'),
    returnStatus: fk('Trả hàng/Hoàn tiền') || fk('Trạng thái Trả hàng'),
    returnQty: fk('Số lượng sản phẩm được hoàn trả'),
    ship: fk('Đơn Vị Vận Chuyển'),
  };

  // ---- Gộp dòng SKU thành đơn ----
  const om = {};
  let skuRows = 0;
  for (const row of rawRows) {
    const oid = String(row[C.id] || '').trim();
    if (!oid) continue;
    skuRows++;
    if (!om[oid]) {
      om[oid] = {
        id: oid, status: '', reason: '', retStatus: '', ship: '',
        amount: 0, retQty: 0, products: []
      };
    }
    const o = om[oid];
    // Các trường mô tả đơn có thể chỉ điền ở MỘT dòng SKU -> lấy dòng nào có giá trị
    if (!o.status) o.status = String(row[C.status] || '').trim();
    if (!o.reason) o.reason = String(row[C.cancelReason] || '').trim();
    if (!o.retStatus) o.retStatus = String(row[C.returnStatus] || '').trim();
    if (!o.ship) o.ship = String(row[C.ship] || '').trim();
    // Giá trị đơn lặp trên mọi dòng SKU -> lấy giá trị lớn nhất, không cộng dồn
    const amt = spNum(row[C.amount]);
    if (amt > o.amount) o.amount = amt;
    o.retQty += spNum(row[C.returnQty]);
    const pn = String(row[C.product] || '').trim();
    if (pn && o.products.indexOf(pn) < 0) o.products.push(pn);
  }
  const list = Object.keys(om).map(k => om[k]);
  const total = list.length;
  if (!total) { alert('Không đọc được đơn hàng nào trong file!'); return; }

  const isCancel = o => /hủy|huỷ|cancel/i.test(o.status);
  const isDone = o => /hoàn thành|completed/i.test(o.status);
  const hasReturn = o => !!o.retStatus || o.retQty > 0;

  const cancels = list.filter(isCancel);
  const dones = list.filter(isDone);
  const others = list.filter(o => !isCancel(o) && !isDone(o));
  const returns = list.filter(hasReturn);
  const gmvTong = list.reduce((s, o) => s + o.amount, 0);
  const gmvHuy = cancels.reduce((s, o) => s + o.amount, 0);
  const gmvTra = returns.reduce((s, o) => s + o.amount, 0);
  const rate = (a, b) => b > 0 ? a / b : 0;

  let html = '';

  // ============ 1. TỔNG QUAN ============
  let ov = tkKpiRow(
    tkKpi('Tổng đơn hàng', fmt(total), fmt(skuRows) + ' dòng SKU', '#1d4ed8', '#bfdbfe')
    + tkKpi('Hoàn thành', fmt(dones.length), pgPct(rate(dones.length, total), 1), '#16a34a', '#bbf7d0')
    + tkKpi('Đã huỷ', fmt(cancels.length), pgPct(rate(cancels.length, total), 1), '#dc2626', '#fecaca')
    + tkKpi('Trả hàng / Hoàn tiền', fmt(returns.length),
        returns.length ? pgPct(rate(returns.length, total), 1) + ' — <b style="color:#7c3aed">nằm trong nhóm trên</b>' : '0%',
        '#7c3aed', '#ddd6fe')
    + (others.length ? tkKpi('Trạng thái khác', fmt(others.length), pgPct(rate(others.length, total), 1), '#64748b', '#e2e8f0') : '')
  );

  const seg = (v, c, t) => {
    const p = total > 0 ? v / total * 100 : 0;
    return p <= 0 ? '' : '<div title="' + t + ': ' + fmt(v) + ' đơn" style="width:' + p + '%;background:' + c + ';display:flex;align-items:center;justify-content:center;">' + (p >= 7 ? p.toFixed(1).replace('.', ',') + '%' : '') + '</div>';
  };
  ov += '<div style="font-size:0.75em;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Tỉ lệ trạng thái đơn hàng</div>';
  ov += '<div style="display:flex;height:28px;border-radius:8px;overflow:hidden;font-size:0.72em;font-weight:700;color:#fff;">'
    + seg(dones.length, '#16a34a', 'Hoàn thành') + seg(cancels.length, '#dc2626', 'Đã huỷ') + seg(others.length, '#94a3b8', 'Khác') + '</div>';
  ov += '<div style="margin-top:8px;font-size:0.8em;color:#64748b;">Tổng giá trị đơn hàng: <b style="color:#1e293b;">' + fmt(gmvTong) + 'đ</b></div>';

  if (returns.length) {
    const traTrongHT = returns.filter(isDone).length;
    const traTrongHuy = returns.filter(isCancel).length;
    const ct = [];
    if (traTrongHT) ct.push('<b>' + fmt(traTrongHT) + '</b> ở <b>Hoàn thành</b>');
    if (traTrongHuy) ct.push('<b>' + fmt(traTrongHuy) + '</b> ở <b>Đã huỷ</b>');
    const khac = returns.length - traTrongHT - traTrongHuy;
    if (khac) ct.push('<b>' + fmt(khac) + '</b> ở trạng thái khác');
    ov += '<div style="margin-top:10px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:11px 15px;font-size:0.8em;color:#5b21b6;line-height:1.85;">'
      + 'ℹ️ <b>' + fmt(returns.length) + ' đơn Trả hàng / Hoàn tiền KHÔNG cộng thêm vào tổng ' + fmt(total) + ' đơn</b> — đã nằm sẵn trong: ' + ct.join(' · ') + '.'
      + (traTrongHuy === 0
          ? '<br><span style="color:#7c3aed;">Không đơn nào vừa huỷ vừa trả hàng — <b>huỷ</b> là khách chưa nhận hàng, <b>trả hàng</b> là đã nhận rồi mới trả.</span>'
          : '<br><span style="color:#b45309;">Có <b>' + fmt(traTrongHuy) + '</b> đơn vừa huỷ vừa trả — cộng cả 2 nhóm sẽ bị tính trùng.</span>')
      + '</div>';
  }
  html += pgCard('📦 Tổng quan đơn hàng Shopee', ov, '#ee4d2d');

  // ============ 2. ĐƠN HUỶ ============
  const parsed = cancels.map(o => Object.assign({}, o, spSplitCancel(o.reason)));
  const failDeliver = parsed.filter(o => /giao hàng thất bại|giao thất bại|delivery fail/i.test(o.why));
  const gmvFail = failDeliver.reduce((s, o) => s + o.amount, 0);

  let ch = tkKpiRow(
    tkKpi('Tổng đơn huỷ', fmt(cancels.length), pgPct(rate(cancels.length, total), 1) + ' tổng đơn', '#dc2626', '#fecaca')
    + tkKpi('Giá trị mất do huỷ', fmt(gmvHuy) + 'đ', gmvTong > 0 ? pgPct(rate(gmvHuy, gmvTong), 1) + ' tổng GMV' : '', '#dc2626', '#fecaca')
    + tkKpi('Giao hàng thất bại', fmt(failDeliver.length), cancels.length ? pgPct(rate(failDeliver.length, cancels.length), 1) + ' số đơn huỷ' : '', '#c2410c', '#fed7aa')
    + tkKpi('Giá trị giao thất bại', fmt(gmvFail) + 'đ', 'mất cả phí ship 2 chiều', '#c2410c', '#fed7aa')
  );

  if (failDeliver.length) {
    ch += '<div style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:0.86em;color:#7c2d12;line-height:1.8;">'
      + '🚚 <b>' + fmt(failDeliver.length) + ' đơn giao hàng thất bại</b> — hàng đã lên đường rồi mới huỷ nên <b>mất cả phí ship hai chiều</b>, không chỉ mất đơn. '
      + 'Chiếm <b>' + pgPct(rate(failDeliver.length, cancels.length), 1) + '</b> số đơn huỷ. Soi lại vùng giao, đơn vị vận chuyển và chất lượng số điện thoại khách.</div>';
  }

  // Ai huỷ
  ch += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:14px 0 6px;">👤 Ai huỷ đơn</div>';
  const whoCnt = {};
  parsed.forEach(o => { whoCnt[o.who] = (whoCnt[o.who] || 0) + 1; });
  ch += tkRankTable(Object.keys(whoCnt).map(k => [k, whoCnt[k]]).sort((a, b) => b[1] - a[1]),
    cancels.length, 'Người huỷ', { color: '#dc2626', pctOf: 'đơn huỷ', rows: 10 });

  // Lý do huỷ
  ch += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:18px 0 6px;">📋 Lý do huỷ đơn</div>';
  const whyCnt = {};
  parsed.forEach(o => { const k = spNormReason(o.why); whyCnt[k] = (whyCnt[k] || 0) + 1; });
  ch += tkRankTable(Object.keys(whyCnt).map(k => [k, whyCnt[k]]).sort((a, b) => b[1] - a[1]),
    cancels.length, 'Lý do', {
      color: '#dc2626', pctOf: 'đơn huỷ', rows: 10,
      render: k => esc(k) + (/giao hàng thất bại/i.test(k) ? ' <span style="background:#fed7aa;color:#7c2d12;padding:1px 6px;border-radius:4px;font-size:0.78em;font-weight:700;">GIAO THẤT BẠI</span>' : '')
    });

  // Top SP huỷ
  const pc = {};
  cancels.forEach(o => o.products.forEach(p => { pc[p] = (pc[p] || 0) + 1; }));
  const pcList = Object.keys(pc).map(k => [k, pc[k]]).filter(e => !tkIsGift(e[0])).sort((a, b) => b[1] - a[1]);
  ch += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:18px 0 6px;">📦 Sản phẩm bị huỷ nhiều nhất</div>';
  ch += tkRankTable(pcList, cancels.length, 'Sản phẩm', { color: '#dc2626', pctOf: 'đơn huỷ', rows: 10 });

  html += pgCard('❌ Phân tích đơn huỷ', ch, '#dc2626');

  // ============ 3. TRẢ HÀNG / HOÀN TIỀN ============
  if (!returns.length) {
    html += pgCard('🔄 Trả hàng / Hoàn tiền',
      '<div style="font-size:0.88em;color:#166534;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;">✅ Kỳ này không có đơn trả hàng / hoàn tiền nào.</div>',
      '#7c3aed');
  } else {
    const retSKU = returns.reduce((s, o) => s + o.retQty, 0);
    let rh = tkKpiRow(
      tkKpi('Đơn trả hàng', fmt(returns.length), pgPct(rate(returns.length, total), 1) + ' tổng đơn', '#7c3aed', '#ddd6fe')
      + tkKpi('Giá trị đơn bị trả', fmt(gmvTra) + 'đ', gmvTong > 0 ? pgPct(rate(gmvTra, gmvTong), 1) + ' tổng GMV' : '', '#dc2626', '#fecaca')
      + tkKpi('Số SKU hoàn trả', fmt(retSKU), 'sản phẩm khách gửi lại', '#7c3aed', '#ddd6fe')
      + tkKpi('TB / đơn trả', fmt(returns.length ? gmvTra / returns.length : 0) + 'đ', '', '#1e293b', '#e2e8f0')
    );

    const stCnt = {};
    returns.forEach(o => { const k = o.retStatus || '(không ghi trạng thái)'; stCnt[k] = (stCnt[k] || 0) + 1; });
    rh += '<div style="font-weight:700;font-size:0.85em;color:#6d28d9;margin:14px 0 6px;">📌 Trạng thái xử lý trả hàng</div>';
    rh += tkRankTable(Object.keys(stCnt).map(k => [k, stCnt[k]]).sort((a, b) => b[1] - a[1]),
      returns.length, 'Trạng thái', { color: '#7c3aed', unit: 'Số đơn', pctOf: 'đơn trả', rows: 10 });

    const rp = {};
    returns.forEach(o => o.products.forEach(p => { rp[p] = (rp[p] || 0) + 1; }));
    const rpList = Object.keys(rp).map(k => [k, rp[k]]).filter(e => !tkIsGift(e[0])).sort((a, b) => b[1] - a[1]);
    rh += '<div style="font-weight:700;font-size:0.85em;color:#6d28d9;margin:18px 0 6px;">📦 Sản phẩm bị trả nhiều nhất</div>';
    rh += tkRankTable(rpList, returns.length, 'Sản phẩm', { color: '#7c3aed', unit: 'Số đơn', pctOf: 'đơn trả', rows: 10 });

    rh += '<div style="margin-top:10px;font-size:0.78em;color:#64748b;line-height:1.8;">'
      + 'File đơn hàng Shopee chỉ có <b>trạng thái xử lý</b> trả hàng, <b>không có lý do trả</b> như TikTok. '
      + 'Muốn biết khách trả vì sao thì phải xuất riêng báo cáo Trả hàng/Hoàn tiền trong Kênh Người Bán.</div>';

    html += pgCard('🔄 Phân tích trả hàng / hoàn tiền', rh, '#7c3aed');
  }

  window._spOrderStats = { orders: list, total: total, cancels: cancels, returns: returns };
  const dash = document.getElementById('spStatsDashboard');
  dash.innerHTML = html;
  dash.style.display = '';
}

// ========== SHOPEE REVENUE REPORT ==========
let spRevenueData = null;

async function processShopeeRevenue() {
  const pdfFiles = document.getElementById('spIncomeFiles').files;
  if (!pdfFiles.length) return alert('Vui lòng chọn file báo cáo thu nhập Shopee (.pdf)!');

  showLoading('📊 Đang phân tích báo cáo Shopee...', 'Đang đọc ' + pdfFiles.length + ' file PDF');
  await new Promise(r => setTimeout(r, 100));

  try {
    // Parse all PDFs and aggregate
    const agg = { productPrice: 0, refund: 0, shopeeSubsidy: 0, sellerDiscount: 0, shipBuyer: 0, shipActual: 0, shipSubsidy: 0, shipReturnRefund: 0, shipPiship: 0, shipReturnFail: 0, feeFixed: 0, feeService: 0, feeProcess: 0, feeAff: 0, feePiship: 0, taxVAT: 0, taxPIT: 0, totalSettlement: 0, adjustTotal: 0, adjustRefund: 0 };

    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    for (const file of pdfFiles) {
      try {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf, disableWorker: true }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          fullText += tc.items.map(it => it.str).join(' ') + '\n';
        }
      // Parse values from text
      const g = (label) => {
        // Match: "Label Number" or "Label -Number" with comma separators
        const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const m = fullText.match(new RegExp(esc + '\\s+(-?[\\d,]+\\.?\\d*)'));
        if (m) return parseFloat(m[1].replace(/,/g, '')) || 0;
        return 0;
      };

      agg.productPrice += g('Giá sản phẩm');
      agg.refund += g('Số tiền hoàn lại');
      agg.shopeeSubsidy += g('Sản phẩm được trợ giá từ Shopee');
      agg.sellerDiscount += g('Mã ưu đãi do Người Bán chịu');
      agg.shipBuyer += g('Phí vận chuyển Người mua trả');
      agg.shipActual += g('Phí vận chuyển thực tế');
      agg.shipSubsidy += g('Phí vận chuyển được trợ giá từ Shopee');
      agg.shipReturnRefund += g('Phí vận chuyển trả hàng \\(đơn Trả hàng/hoàn tiền\\)');
      agg.shipPiship += g('Phí vận chuyển được hoàn bởi PiShip');
      agg.shipReturnFail += g('Phí vận chuyển trả hàng \\(đơn giao không thành công\\)');
      agg.feeFixed += g('Phí cố định');
      agg.feeService += g('Phí Dịch Vụ');
      agg.feeProcess += g('Phí xử lý giao dịch');
      agg.feeAff += g('Phí hoa hồng Tiếp thị liên kết');
      agg.feePiship += g('Phí dịch vụ PiShip');
      agg.taxVAT += g('Thuế GTGT');
      agg.taxPIT += g('Thuế TNCN');

      // Total settlement - look for pattern "₫NNN,NNN,NNN" or "Tổng thanh toán đã chuyển ₫..."
      const mTotal = fullText.match(/Tổng thanh toán đã chuyển\s+₫([\d,]+)/);
      if (mTotal) agg.totalSettlement += parseFloat(mTotal[1].replace(/,/g, '')) || 0;

      // Adjustments
      const mAdj = fullText.match(/Tổng số tiền đã điều chỉnh \(VND\)\s+-?₫?([\d,]+)/);
      if (mAdj) agg.adjustTotal += parseFloat(mAdj[1].replace(/,/g, '')) || 0;
      const mRef = fullText.match(/Trả hàng\/ Hoàn tiền\s+-([\d,]+)/);
      if (mRef) agg.adjustRefund += parseFloat(mRef[1].replace(/,/g, '')) || 0;
      console.log('[Shopee PDF]', file.name, 'settlement:', agg.totalSettlement);
      } catch (fileErr) { console.error('[Shopee PDF] Error parsing', file.name, fileErr); }
    }

    spRevenueData = agg;
    renderShopeeRevenue(agg);
  } catch (e) {
    console.error(e);
    alert('Lỗi đọc PDF: ' + e.message);
  }
  hideLoading();
}

function renderShopeeRevenue(d) {
  const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

  const totalProduct = d.productPrice + d.refund;
  const totalDiscount = d.shopeeSubsidy + d.sellerDiscount;
  const totalFee = Math.abs(d.feeFixed) + Math.abs(d.feeService) + Math.abs(d.feeProcess) + Math.abs(d.feeAff) + Math.abs(d.feePiship);
  const totalTax = Math.abs(d.taxVAT) + Math.abs(d.taxPIT);
  const shipNet = d.shipBuyer + d.shipActual + d.shipSubsidy + d.shipReturnRefund + d.shipPiship + d.shipReturnFail;

  // ROW 1
  const base = Math.abs(totalProduct) || 1;
  const pct = (v) => ((Math.abs(v) / base) * 100).toFixed(2) + '%';
  setEl('spRvSettlement', fmt(d.totalSettlement) + 'đ');
  setEl('spRvSettlementPct', pct(d.totalSettlement));
  setEl('spRvProduct', fmt(totalProduct) + 'đ');
  setEl('spRvDiscount', fmt(totalDiscount) + 'đ');
  setEl('spRvDiscountPct', pct(totalDiscount));
  setEl('spRvFee', fmt(totalFee) + 'đ');
  setEl('spRvFeePct', pct(totalFee));
  setEl('spRvTax', fmt(totalTax) + 'đ');
  setEl('spRvTaxPct', pct(totalTax));

  // ROW 2
  setEl('spRvFeeFixed', fmt(Math.abs(d.feeFixed)) + 'đ');
  setEl('spRvFeeFixedPct', pct(d.feeFixed));
  setEl('spRvFeeService', fmt(Math.abs(d.feeService)) + 'đ');
  setEl('spRvFeeServicePct', pct(d.feeService));
  setEl('spRvFeeProcess', fmt(Math.abs(d.feeProcess)) + 'đ');
  setEl('spRvFeeProcessPct', pct(d.feeProcess));
  setEl('spRvFeeAff', fmt(Math.abs(d.feeAff)) + 'đ');
  setEl('spRvFeeAffPct', pct(d.feeAff));
  setEl('spRvFeePiship', fmt(Math.abs(d.feePiship)) + 'đ');
  setEl('spRvFeePishipPct', pct(d.feePiship));
  setEl('spRvTaxVAT', fmt(Math.abs(d.taxVAT)) + 'đ');
  setEl('spRvTaxVATPct', pct(d.taxVAT));
  setEl('spRvTaxPIT', fmt(Math.abs(d.taxPIT)) + 'đ');
  setEl('spRvTaxPITPct', pct(d.taxPIT));
  setEl('spRvShipNet', fmt(shipNet) + 'đ');
  setEl('spRvShipNetPct', pct(shipNet));

  // ROW 3: Voucher & Support stats from ORDER FILE
  const orderFiles = document.getElementById('spRevenueOrders').files;
  if (orderFiles && orderFiles.length > 0) {
    (async () => {
      let oRows = [];
      for (const f of orderFiles) {
        try { const r = await parseXlsx(f); oRows = oRows.concat(r.rows); } catch(e) {}
      }
      if (!oRows.length) return;
      const oKeys = Object.keys(oRows[0] || {});
      const ofk = (s) => oKeys.find(k => k && k.normalize('NFC').includes(s.normalize('NFC'))) || '';
      const cShopeeVc = ofk('Mã giảm giá của Shopee');
      const cShipFee = ofk('Phí vận chuyển (dự kiến)') || ofk('vận chuyển dự kiến');
      const cShipBuyer = ofk('Phí vận chuyển mà người mua trả');
      const cShipSubsidy = ofk('Phí vận chuyển tài trợ bởi Shopee');
      const cSellerTotal = ofk('Tổng số tiền được người bán trợ giá');
      const cShopVc = ofk('Mã giảm giá của Shop');
      const cStatus = ofk('Trạng Thái Đơn Hàng') || ofk('Trạng thái');
      const cOrderId = ofk('Mã đơn hàng');
      const cAmount = ofk('Tổng giá trị đơn hàng');

      const oMap = {};
      for (const row of oRows) {
        const oid = String(row[cOrderId] || '').trim();
        if (!oid) continue;
        const sv = Math.abs(spNum(row[cShopeeVc]));
        const shipS = Math.abs(spNum(row[cShipSubsidy]));
        const shipB = Math.abs(spNum(row[cShipBuyer]));
        const sellerT = Math.abs(spNum(row[cSellerTotal]));
        const shopVc = Math.abs(spNum(row[cShopVc]));
        const amount = Math.abs(spNum(row[cAmount]));
        const status = (row[cStatus] || '').trim();
        if (!oMap[oid]) {
          oMap[oid] = { sv, shipS, shipB, sellerT, shopVc, amount, status };
        } else {
          // "Mã giảm giá của Shopee/Shop" và "Tổng giá trị đơn hàng" là số của CẢ ĐƠN,
          // Shopee lặp lại y hệt trên từng dòng SKU -> lấy max, cộng dồn là thổi phồng.
          // Riêng "trợ giá người bán" mới là số theo từng SKU -> cộng dồn mới đúng.
          if (sv > oMap[oid].sv) oMap[oid].sv = sv;
          if (shopVc > oMap[oid].shopVc) oMap[oid].shopVc = shopVc;
          if (amount > oMap[oid].amount) oMap[oid].amount = amount;
          oMap[oid].sellerT += sellerT;
        }
      }

      let totalPlatVc = 0, totalShipSub = 0, totalSellerVc = 0;
      let ordPlatform = 0, ordSeller = 0, ordShip = 0, ordPayShip = 0;
      let vcR0 = 0, vcR20 = 0, vcR50 = 0, vcR100 = 0;
      for (const v of Object.values(oMap)) {
        if (v.status !== 'Hoàn thành') continue;
        totalPlatVc += v.sv;
        totalShipSub += v.shipS;
        totalSellerVc += v.sellerT;
        if (v.sv > 0) ordPlatform++;
        if (v.shopVc > 0 || v.sellerT > 0) ordSeller++;
        if (v.shipS > 0) ordShip++;
        if (v.shipB > 0) ordPayShip++;
        if (v.sv > 0 && v.sv <= 20000) vcR0++;
        else if (v.sv > 20000 && v.sv <= 50000) vcR20++;
        else if (v.sv > 50000 && v.sv <= 100000) vcR50++;
        else if (v.sv > 100000) vcR100++;
      }

      setEl('spRvVcPlatform', fmt(totalPlatVc) + 'đ');
      setEl('spRvVcShip', fmt(totalShipSub) + 'đ');
      setEl('spRvVcTotal', fmt(totalPlatVc + totalShipSub) + 'đ');
      const spTotalFee = Math.abs(spRevenueData ? spRevenueData.feeFixed + spRevenueData.feeService + spRevenueData.feeProcess + spRevenueData.feeAff + spRevenueData.feePiship : 0);
      const vcRatio = spTotalFee > 0 ? ((totalPlatVc + totalShipSub) / spTotalFee) : 0;
      setEl('spRvVcRatio', vcRatio.toFixed(2));
      setEl('spRvVcOrdPlatform', fmt(ordPlatform));
      setEl('spRvVcOrdSeller', fmt(ordSeller));
      setEl('spRvVcOrdShip', fmt(ordShip));
      setEl('spRvVcOrdPayShip', fmt(ordPayShip));
      setEl('spRvVcR0', fmt(vcR0));
      setEl('spRvVcR20', fmt(vcR20));
      setEl('spRvVcR50', fmt(vcR50));
      setEl('spRvVcR100', fmt(vcR100));

      // ===== PHÂN TÍCH VOUCHER THEO MỨC GIÁ ĐƠN =====
      const spDone = Object.values(oMap).filter(v => v.status === 'Hoàn thành');
      const spTotalDone = spDone.length;
      const spPriceRanges = [
        { label: '< 100K', min: 0, max: 100000 },
        { label: '100K – 150K', min: 100000, max: 150000 },
        { label: '150K – 200K', min: 150000, max: 200000 },
        { label: '200K – 300K', min: 200000, max: 300000 },
        { label: '300K – 500K', min: 300000, max: 500000 },
        { label: '500K+', min: 500000, max: Infinity }
      ];
      const spRangeStats = spPriceRanges.map(r => {
        const os = spDone.filter(v => v.amount >= r.min && v.amount < r.max);
        const withVc = os.filter(v => v.sv > 0);
        const vcTotal = withVc.reduce((a, v) => a + v.sv, 0);
        return {
          label: r.label, count: os.length,
          pct: spTotalDone > 0 ? (os.length / spTotalDone * 100) : 0,
          aov: os.length > 0 ? Math.round(os.reduce((a, v) => a + v.amount, 0) / os.length) : 0,
          vcCount: withVc.length, vcTotal: vcTotal,
          vcAvg: withVc.length > 0 ? Math.round(vcTotal / withVc.length) : 0
        };
      });
      const spMaxCount = Math.max.apply(null, spRangeStats.map(r => r.count));
      document.getElementById('spRvVcPriceRangeTable').innerHTML = spRangeStats.map(r =>
        `<tr style="${r.count === spMaxCount && r.count > 0 ? 'font-weight:700;background:rgba(37,99,235,0.06);' : ''}">
          <td style="padding:10px 12px;">${r.label}</td>
          <td style="text-align:right;padding:10px 12px;">${fmt(r.count)}</td>
          <td style="text-align:right;padding:10px 12px;">${r.pct.toFixed(1)}%</td>
          <td style="text-align:right;padding:10px 12px;">${fmt(r.aov)}</td>
          <td style="text-align:right;padding:10px 12px;">${fmt(r.vcCount)}</td>
          <td style="text-align:right;padding:10px 12px;">${fmt(r.vcTotal)}đ</td>
          <td style="text-align:right;padding:10px 12px;">${fmt(r.vcAvg)}đ</td>
        </tr>`
      ).join('');

      // ===== TOP VOUCHER PHỔ BIẾN NHẤT =====
      const spVcValues = {};
      for (const v of spDone) {
        if (v.sv <= 0) continue;
        const rounded = Math.round(v.sv);
        spVcValues[rounded] = (spVcValues[rounded] || 0) + 1;
      }
      const spTop = Object.keys(spVcValues).map(k => ({ val: parseInt(k), cnt: spVcValues[k] }))
        .sort((a, b) => b.cnt - a.cnt).slice(0, 10);
      const spTopTotal = spTop.reduce((a, v) => a + v.cnt, 0);
      document.getElementById('spRvVcTopTable').innerHTML = spTop.length
        ? spTop.map((v, i) =>
            `<tr style="${i < 3 ? 'font-weight:700;color:#f59e0b;' : ''}">
              <td style="padding:10px 12px;">${fmt(v.val)} đ</td>
              <td style="text-align:right;padding:10px 12px;">${fmt(v.cnt)}</td>
              <td style="text-align:right;padding:10px 12px;">${spTopTotal > 0 ? (v.cnt / spTopTotal * 100).toFixed(1) : 0}%</td>
            </tr>`).join('')
        : '<tr><td colspan="3" class="text-center" style="padding:20px;color:var(--text-muted);">Không có đơn nào dùng voucher Shopee</td></tr>';

      // Build COGS table from order data
      buildSpCOGSTable(oRows);
    })();
  }

  recalcShopeeRevenue();
  document.getElementById('spRevDashboard').style.display = '';
}

function recalcShopeeRevenue() {
  if (!spRevenueData) return;
  const d = spRevenueData;
  const cogs = getMoneyVal('spRvInputCogs');
  const ads = getMoneyVal('spRvInputAds');
  const ops = getMoneyVal('spRvInputOps');
  const extra = getMoneyVal('spRvInputExtra');

  const totalProduct = d.productPrice + d.refund;
  const base = Math.abs(totalProduct) || 1;
  const pct = (v) => ((Math.abs(v) / base) * 100).toFixed(2) + '%';

  const profitBefore = d.totalSettlement - cogs - ads - ops - extra;
  const yearTax = Math.max(profitBefore, 0) * 0.17;
  const netProfit = profitBefore - yearTax;

  const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

  // ROW 4: Lợi nhuận
  setEl('spRvProfit', fmt(profitBefore) + 'đ');
  setEl('spRvProfitPct', pct(profitBefore));
  setEl('spRvSettlement2', fmt(d.totalSettlement) + 'đ');
  setEl('spRvSettlement2Pct', pct(d.totalSettlement));
  setEl('spRvCogs', fmt(cogs) + 'đ');
  setEl('spRvCogsPct', pct(cogs));
  setEl('spRvAds', fmt(ads) + 'đ');
  setEl('spRvAdsPct', pct(ads));
  setEl('spRvOps', fmt(ops) + 'đ');
  setEl('spRvOpsPct', pct(ops));
  setEl('spRvExtra', fmt(extra) + 'đ');
  setEl('spRvExtraPct', pct(extra));

  // ROW 5: Sau thuế
  setEl('spRvNetProfit', fmt(netProfit) + 'đ');
  setEl('spRvNetProfitPct', pct(netProfit));
  setEl('spRvProfitBefore2', fmt(profitBefore) + 'đ');
  setEl('spRvProfitBefore2Pct', pct(profitBefore));
  setEl('spRvYearTax', fmt(yearTax) + 'đ');
  setEl('spRvYearTaxPct', pct(yearTax));

  // ===== Tổng báo cáo kinh doanh =====
  const fee = -(Math.abs(d.feeFixed) + Math.abs(d.feeService) + Math.abs(d.feeProcess) + Math.abs(d.feeAff) + Math.abs(d.feePiship));
  const tax = -(Math.abs(d.taxVAT) + Math.abs(d.taxPIT));
  const summaryRows = [
    { label: '📊 DOANH THU', value: totalProduct, bold: true, bg: '#dbeafe' },
    { label: '   Tổng tiền sản phẩm', value: d.productPrice },
    { label: '   Hoàn tiền cho khách', value: d.refund },
    { label: '🎁 GIẢM GIÁ & TRỢ GIÁ', value: (d.shopeeSubsidy || 0) + (d.sellerDiscount || 0), bold: true, bg: '#fef3c7' },
    { label: '📋 TỔNG PHÍ CHO SÀN', value: fee, bold: true, bg: '#fee2e2' },
    { label: '   Phí cố định', value: -Math.abs(d.feeFixed) },
    { label: '   Phí Dịch Vụ', value: -Math.abs(d.feeService) },
    { label: '   Phí xử lý giao dịch', value: -Math.abs(d.feeProcess) },
    { label: '   Phí hoa hồng Tiếp thị liên kết', value: -Math.abs(d.feeAff) },
    { label: '   Phí dịch vụ PiShip', value: -Math.abs(d.feePiship) },
    { label: '🏛️ THUẾ SÀN KHẤU TRỪ (GTGT + TNCN)', value: tax, bold: true, bg: '#ffedd5' },
    { label: '   Thuế GTGT', value: -Math.abs(d.taxVAT) },
    { label: '   Thuế TNCN', value: -Math.abs(d.taxPIT) },
    { label: '💰 TIỀN QUYẾT TOÁN', value: d.totalSettlement, bold: true, bg: '#dcfce7' },
    { label: '', value: null, sep: true },
    { label: '📦 TRỪ GIÁ VỐN HÀNG BÁN', value: cogs ? -cogs : 0, bold: true, bg: '#fee2e2' },
    { label: '📢 TRỪ CHI PHÍ QUẢNG CÁO', value: ads ? -ads : 0, bold: true, bg: '#fee2e2' },
    { label: '⚙️ TRỪ CHI PHÍ VẬN HÀNH', value: ops ? -ops : 0, bold: true, bg: '#fee2e2' },
    { label: '📎 TRỪ CHI PHÍ PHỤ', value: extra ? -extra : 0, bold: true, bg: '#fee2e2' },
    { label: '', value: null, sep: true },
    { label: '✅ LỢI NHUẬN TRƯỚC THUẾ', value: profitBefore, bold: true, bg: '#bbf7d0' },
    { label: '🏦 THUẾ ĐÓNG CUỐI NĂM (17%)', value: -Math.max(yearTax, 0), bold: true, bg: '#fecaca' },
    { label: '🎯 LỢI NHUẬN SAU THUẾ', value: netProfit, bold: true, bg: '#86efac' },
  ];
  window._spRvSummaryData = summaryRows;
  let sHtml = '';
  for (const r of summaryRows) {
    if (r.sep) { sHtml += '<tr><td colspan="3" style="padding:4px;border:none;"></td></tr>'; continue; }
    const st = (r.bold ? 'font-weight:700;' : '') + (r.bg ? 'background:' + r.bg + ';' : '');
    const vc = r.value > 0 ? '#16a34a' : r.value < 0 ? '#dc2626' : '';
    sHtml += '<tr style="' + st + '"><td style="padding:10px 12px;">' + r.label + '</td>';
    sHtml += '<td style="text-align:right;padding:10px 12px;color:' + vc + ';">' + (r.value !== null ? fmt(r.value) + 'đ' : '') + '</td>';
    sHtml += '<td style="text-align:right;padding:10px 12px;">' + (r.value !== null ? pct(r.value) : '') + '</td></tr>';
  }
  const sBody = document.getElementById('spRvSummaryBody');
  if (sBody) sBody.innerHTML = sHtml;
  const sCard = document.getElementById('spRvSummaryCard');
  if (sCard) sCard.style.display = '';
}

function exportShopeeRevenueReport() {
  if (!window._spRvSummaryData) { alert('Chưa có dữ liệu báo cáo!'); return; }
  const d = spRevenueData;
  const base = Math.abs(d.productPrice + d.refund) || 1;
  const rows = [
    ['BÁO CÁO KINH DOANH SHOPEE — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['Hạng mục', 'Số tiền (VND)', 'Tỷ lệ / Doanh thu'],
  ];
  for (const r of window._spRvSummaryData) {
    if (r.sep) { rows.push([]); continue; }
    rows.push([r.label.replace(/^\s+/, '   '), r.value, ((Math.abs(r.value) / base) * 100).toFixed(2) + '%']);
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 44 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo Shopee');
  XLSX.writeFile(wb, 'Bao_cao_kinh_doanh_Shopee_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function clearShopeeRevenue() {
  document.getElementById('spRevDashboard').style.display = 'none';
  document.getElementById('spIncomeFiles').value = '';
  document.getElementById('spRevenueOrders').value = '';
  document.getElementById('spHintIncome').textContent = 'Chưa chọn file';
  document.getElementById('spHintRevOrders').textContent = 'Chưa chọn file';
  const sc = document.getElementById('spRvSummaryCard');
  if (sc) sc.style.display = 'none';
  window._spRvSummaryData = null;
  spRevenueData = null;
}

function switchSpRvTab(id) {
  document.querySelectorAll('#spRevDashboard .rv-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#spRevDashboard .rv-page').forEach(p => p.classList.remove('active'));
  document.getElementById('spRvTab-' + id).classList.add('active');
  document.getElementById('spRvPage-' + id).classList.add('active');
}

// Shopee COGS
let spCogsProductsByName = [];
let spCogsProductsByVariant = [];

function switchSpCogsView(view) {
  document.querySelectorAll('[id^="spCogsViewTab-"]').forEach(t => t.classList.remove('active'));
  document.getElementById('spCogsViewTab-' + view).classList.add('active');
  document.getElementById('spCogsView-name').style.display = view === 'name' ? '' : 'none';
  document.getElementById('spCogsView-variant').style.display = view === 'variant' ? '' : 'none';
}

function buildSpCOGSTable(orderRows) {
  const oKeys = Object.keys(orderRows[0] || {});
  const ofk = (s) => oKeys.find(k => k && k.normalize('NFC').includes(s.normalize('NFC'))) || '';
  const cName = ofk('Tên sản phẩm');
  const cVariant = ofk('Tên phân loại hàng');
  const cQty = ofk('Số lượng');
  const cStatus = ofk('Trạng Thái Đơn Hàng') || ofk('Trạng thái');

  const byName = {};
  const byVariant = {};
  for (const r of orderRows) {
    const status = String(r[cStatus] || '').trim();
    if (status !== 'Hoàn thành') continue;
    const name = String(r[cName] || '').trim();
    const variation = String(r[cVariant] || '').trim();
    const qty = parseInt(r[cQty]) || 0;
    if (!name) continue;
    if (!byName[name]) byName[name] = { name, qty: 0, price: 0 };
    byName[name].qty += qty;
    const vKey = name + '|||' + variation;
    if (!byVariant[vKey]) byVariant[vKey] = { name, variation, qty: 0, price: 0 };
    byVariant[vKey].qty += qty;
  }

  spCogsProductsByName = Object.values(byName).sort((a, b) => b.qty - a.qty);
  spCogsProductsByVariant = Object.values(byVariant).sort((a, b) => b.qty - a.qty);

  if (spCogsProductsByName.length > 0) {
    document.getElementById('spCogsTableByName').innerHTML = spCogsProductsByName.map((p, i) =>
      `<tr><td class="text-center">${i + 1}</td><td style="max-width:400px;white-space:normal;">${esc(p.name)}</td><td class="text-right">${fmt(p.qty)}</td><td class="text-right"><input type="text" inputmode="numeric" class="sp-cogs-input-name" data-idx="${i}" value="0" style="width:120px;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:0.9em;text-align:right;" oninput="fmtMoneyInput(this);calcSpCOGS('name')"></td><td class="text-right" id="spCogsNameTotal-${i}">0đ</td></tr>`
    ).join('');
  }
  if (spCogsProductsByVariant.length > 0) {
    document.getElementById('spCogsTableByVariant').innerHTML = spCogsProductsByVariant.map((p, i) =>
      `<tr><td class="text-center">${i + 1}</td><td style="max-width:300px;white-space:normal;">${esc(p.name)}</td><td>${esc(p.variation || '--')}</td><td class="text-right">${fmt(p.qty)}</td><td class="text-right"><input type="text" inputmode="numeric" class="sp-cogs-input-variant" data-idx="${i}" value="0" style="width:120px;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:0.9em;text-align:right;" oninput="fmtMoneyInput(this);calcSpCOGS('variant')"></td><td class="text-right" id="spCogsVariantTotal-${i}">0đ</td></tr>`
    ).join('');
  }
}

function calcSpCOGS(view) {
  const isName = view === 'name';
  const products = isName ? spCogsProductsByName : spCogsProductsByVariant;
  const inputClass = isName ? '.sp-cogs-input-name' : '.sp-cogs-input-variant';
  const totalPrefix = isName ? 'spCogsNameTotal-' : 'spCogsVariantTotal-';

  let grandTotal = 0;
  document.querySelectorAll(inputClass).forEach(input => {
    const idx = parseInt(input.dataset.idx);
    const price = parseFloat(String(input.value).replace(/[.\s]/g, '')) || 0;
    const qty = products[idx] ? products[idx].qty : 0;
    const rowTotal = price * qty;
    products[idx].price = price;
    document.getElementById(totalPrefix + idx).textContent = fmt(rowTotal) + 'đ';
    grandTotal += rowTotal;
  });
  document.getElementById('spCogsGrandTotal').textContent = fmt(grandTotal) + 'đ';
  document.getElementById('spRvInputCogs').value = fmt(grandTotal);
  recalcShopeeRevenue();
}

// Shopee Ops
function addSpOpsRow() {
  const row = document.createElement('div');
  row.className = 'ops-row';
  row.innerHTML = `<input type="text" class="ops-name" value="" placeholder="Tên chi phí"><input type="text" inputmode="numeric" class="sp-ops-amount" value="0" placeholder="Số tiền" oninput="fmtMoneyInput(this);calcSpOps()"><button class="cost-row-remove" onclick="this.closest('.ops-row').remove();calcSpOps();">×</button>`;
  document.getElementById('spOpsRows').appendChild(row);
}

function calcSpOps() {
  let total = 0;
  document.querySelectorAll('#spOpsRows .sp-ops-amount').forEach(input => {
    total += parseFloat(input.value.replace(/[.\s]/g, '')) || 0;
  });
  document.getElementById('spOpsGrandTotal').textContent = fmt(total) + 'đ';
  document.getElementById('spRvInputOps').value = fmt(total);
  recalcShopeeRevenue();
}

function clearSpOpsRows() {
  document.querySelectorAll('#spOpsRows .sp-ops-amount').forEach(input => { input.value = 0; });
  calcSpOps();
}

// ========== UNSETTLED ORDERS ==========
let usCharts = {};
async function processUnsettled() {
  const file = document.getElementById('fileUnsettled').files[0];
  if (!file) return alert('Vui lòng chọn file đơn chưa quyết toán!');
  showLoading('📊 Đang phân tích đơn chưa quyết toán...', 'Vui lòng chờ');
  await new Promise(r => setTimeout(r, 100));
  try {
    // Custom parse: headers are NOT at row 1, need to find them
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // Fix dimension tag (same as parseXlsx)
        let maxR = 0, maxC = 0;
        for (const key of Object.keys(ws)) {
          if (key[0] === '!') continue;
          const m = key.match(/^([A-Z]+)(\d+)$/);
          if (!m) continue;
          const r = parseInt(m[2]) - 1;
          let c = 0;
          for (let i = 0; i < m[1].length; i++) c = c * 26 + m[1].charCodeAt(i) - 64;
          c--;
          if (r > maxR) maxR = r;
          if (c > maxC) maxC = c;
        }
        if (maxR > 0) ws['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:maxR,c:maxC}});

        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        // Find header row by looking for "Loại giao dịch"
        let headerIdx = -1;
        for (let i = 0; i < Math.min(raw.length, 10); i++) {
          const row = raw[i];
          if (row && row.some(c => c && String(c).includes('Loại giao dịch'))) { headerIdx = i; break; }
        }
        if (headerIdx < 0) { resolve([]); return; }
        const headers = raw[headerIdx].map(h => h != null ? String(h).trim() : '');
        const rows = [];
        for (let r = headerIdx + 1; r < raw.length; r++) {
          const rawRow = raw[r];
          if (!rawRow) continue;
          const row = {};
          let has = false;
          for (let c = 0; c < headers.length; c++) {
            row[headers[c]] = rawRow[c] != null ? rawRow[c] : null;
            if (rawRow[c] != null) has = true;
          }
          if (has) rows.push(row);
        }
        console.log('[Unsettled] Found headers at row', headerIdx, '—', rows.length, 'data rows');
        resolve(rows);
      };
      reader.onerror = () => reject(new Error('Không đọc được file'));
      reader.readAsArrayBuffer(file);
    });
    if (!data.length) { hideLoading(); return alert('Không đọc được dữ liệu!'); }
    renderUnsettled(data);
  } catch(e) { console.error(e); alert('Lỗi: ' + e.message); }
  hideLoading();
}

function clearUnsettled() {
  document.getElementById('unsettledDashboard').style.display = 'none';
  document.getElementById('fileUnsettled').value = '';
  document.getElementById('hintUnsettled').textContent = 'Chưa chọn file';
  Object.values(usCharts).forEach(c => c.destroy());
  usCharts = {};
}

function renderUnsettled(rows) {
  const keys = Object.keys(rows[0] || {});
  const fk = (s) => keys.find(k => k && k.normalize('NFC').includes(s.normalize('NFC'))) || '';

  const K = {
    type: fk('Loại giao dịch'),
    orderId: fk('ID đơn hàng'),
    date: fk('Ngày tạo giao dịch'),
    settlement: fk('Số tiền quyết toán ước tính'),
    expectedTime: fk('Thời gian quyết toán dự kiến'),
    reason: fk('Lý do chưa quyết toán'),
    revenue: fk('Tổng doanh thu'),
    totalFee: fk('Tổng phí'),
    feeTxn: fk('Phí giao dịch ước tính'),
    feeComm: fk('hoa hồng của TikTok'),
    feeAff: fk('Hoa hồng liên kết ước tính'),
    feeShip: fk('Phí vận chuyển ước tính'),
    feeSFR: fk('Phí dịch vụ SFR'),
    feeVoucher: fk('Voucher Xtra'),
    feeProcess: fk('Phí xử lý đơn hàng'),
    taxVAT: fk('Thuế GTGT'),
    taxPIT: fk('Thuế TNCN'),
  };

  console.log('[Unsettled] Column mapping:', JSON.stringify(K));

  // Aggregate
  let totalSettlement = 0, totalRevenue = 0, totalFee = 0;
  let feeTxn = 0, feeComm = 0, feeAff = 0, feeShip = 0, feeSFR = 0, feeVoucher = 0, feeProcess = 0, taxVAT = 0, taxPIT = 0;
  const reasonMap = {}, timelineMap = {}, dailyMap = {};
  let orderCount = 0;

  const val = (r, k) => { const v = r[k]; return parseFloat(String(v || '0').replace(/[,\s]/g, '')) || 0; };

  for (const r of rows) {
    const type = String(r[K.type] || '').trim();
    if (type !== 'Đơn hàng') continue;
    orderCount++;
    totalSettlement += val(r, K.settlement);
    totalRevenue += val(r, K.revenue);
    totalFee += val(r, K.totalFee);
    feeTxn += Math.abs(val(r, K.feeTxn));
    feeComm += Math.abs(val(r, K.feeComm));
    feeAff += Math.abs(val(r, K.feeAff));
    feeShip += Math.abs(val(r, K.feeShip));
    feeSFR += Math.abs(val(r, K.feeSFR));
    feeVoucher += Math.abs(val(r, K.feeVoucher));
    feeProcess += Math.abs(val(r, K.feeProcess));
    taxVAT += Math.abs(val(r, K.taxVAT));
    taxPIT += Math.abs(val(r, K.taxPIT));

    const reason = String(r[K.reason] || 'Không rõ').trim().slice(0, 50);
    reasonMap[reason] = (reasonMap[reason] || 0) + 1;

    let timeline = String(r[K.expectedTime] || '').replace(/\u00a0/g, ' ').trim();
    if (timeline.includes('ngày sau')) timeline = 'Chờ giao hàng + 3 ngày';
    else if (timeline.match(/^\d{4}/)) timeline = timeline.slice(0, 10);
    else timeline = 'Chưa xác định';
    timelineMap[timeline] = (timelineMap[timeline] || 0) + 1;

    const date = String(r[K.date] || '').trim().slice(0, 10);
    if (date) dailyMap[date] = (dailyMap[date] || 0) + 1;
  }

  const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  const base = Math.abs(totalRevenue) || 1;
  const pct = (v) => ((Math.abs(v) / base) * 100).toFixed(2) + '%';

  // KPIs
  setEl('usKpiTotal', fmt(orderCount));
  setEl('usKpiSettlement', fmt(totalSettlement) + 'đ');
  setEl('usKpiRevenue', fmt(totalRevenue) + 'đ');
  setEl('usKpiFee', fmt(Math.abs(totalFee)) + 'đ');

  // ROW 1
  setEl('usRvSettlement', fmt(totalSettlement) + 'đ');
  setEl('usRvSettlementPct', pct(totalSettlement));
  setEl('usRvRevenue', fmt(totalRevenue) + 'đ');
  setEl('usRvFee', fmt(Math.abs(totalFee)) + 'đ');
  setEl('usRvFeePct', pct(totalFee));

  // ROW 2
  setEl('usFeeTxn', fmt(feeTxn) + 'đ'); setEl('usFeeTxnPct', pct(feeTxn));
  setEl('usFeeComm', fmt(feeComm) + 'đ'); setEl('usFeeCommPct', pct(feeComm));
  setEl('usFeeAff', fmt(feeAff) + 'đ'); setEl('usFeeAffPct', pct(feeAff));
  setEl('usFeeProcess', fmt(feeProcess) + 'đ'); setEl('usFeeProcessPct', pct(feeProcess));
  setEl('usFeeShip', fmt(feeShip) + 'đ'); setEl('usFeeShipPct', pct(feeShip));
  setEl('usFeeSFR', fmt(feeSFR) + 'đ'); setEl('usFeeSFRPct', pct(feeSFR));
  setEl('usFeeVoucher', fmt(feeVoucher) + 'đ'); setEl('usFeeVoucherPct', pct(feeVoucher));
  setEl('usFeeTax', fmt(taxVAT + taxPIT) + 'đ'); setEl('usFeeTaxPct', pct(taxVAT + taxPIT));

  // Charts
  Object.values(usCharts).forEach(c => c.destroy());
  usCharts = {};

  // Reason chart
  const rSorted = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  usCharts.reason = new Chart(document.getElementById('usChartReason').getContext('2d'), {
    type: 'bar',
    data: { labels: rSorted.map(r => r[0]), datasets: [{ data: rSorted.map(r => r[1]), backgroundColor: '#f59e0b' }] },
    options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
  });

  // Timeline chart
  const tSorted = Object.entries(timelineMap).sort();
  usCharts.timeline = new Chart(document.getElementById('usChartTimeline').getContext('2d'), {
    type: 'doughnut',
    data: { labels: tSorted.map(t => t[0]), datasets: [{ data: tSorted.map(t => t[1]), backgroundColor: ['#3b82f6','#16a34a','#f59e0b','#dc2626','#8b5cf6','#ec4899'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // Daily chart
  const dDates = Object.keys(dailyMap).sort();
  usCharts.daily = new Chart(document.getElementById('usChartDaily').getContext('2d'), {
    type: 'bar',
    data: { labels: dDates.map(d => d.slice(5)), datasets: [{ label: 'Đơn chưa QT', data: dDates.map(d => dailyMap[d]), backgroundColor: '#f59e0b' }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
  });

  document.getElementById('unsettledDashboard').style.display = '';
}

// ========== ADS GMV STATS ==========
let chartAffOrders = null, chartAffRevenue = null, chartAffDaily = null, chartAffStatus = null;

function destroyAffCharts() {
  [chartAffOrders, chartAffRevenue, chartAffDaily, chartAffStatus].forEach(c => { if (c) c.destroy(); });
  chartAffOrders = chartAffRevenue = chartAffDaily = chartAffStatus = null;
}

async function processAffiliateFile() {
  const f = document.getElementById('fileAffiliate').files[0];
  if (!f) { alert('Chọn file affiliate orders!'); return; }

  showLoading('⏳ Đang phân tích ADS GMV...', 'Đang đọc file ' + f.name);

  try {
    await new Promise(r => setTimeout(r, 100));
    const data = await parseXlsx(f);
    document.getElementById('hintAffiliate').textContent = '✅ ' + f.name + ' — ' + data.rows.length + ' dòng';
    document.getElementById('hintAffiliate').className = 'file-hint loaded';
    renderAffiliateStats(data.rows);
    hideLoading();
  } catch (err) {
    hideLoading();
    alert('Lỗi: ' + err.message);
    console.error(err);
  }
}

function renderAffiliateStats(rows) {
  destroyAffCharts();

  const organic = { count: 0, revenue: 0, commission: 0, estBase: 0, actualBase: 0, estComm: 0, actualComm: 0 };
  const ads = { count: 0, revenue: 0, commission: 0, estBase: 0, actualBase: 0, estComm: 0, actualComm: 0 };
  const statuses = {}, creators = {}, contentTypes = {};
  const orderIds = {};

  for (const r of rows) {
    const payment = parseFloat(r['Payment Amount'] || r['Giá']) || 0;
    const adsRate = r['Tỷ lệ hoa hồng Quảng cáo cửa hàng'];
    const estBase = parseFloat(r['Cơ sở hoa hồng ước tính']) || 0;
    const actualBase = parseFloat(r['Cơ sở hoa hồng thực tế']) || 0;
    const estStdComm = parseFloat(r['Thanh toán hoa hồng tiêu chuẩn ước tính']) || 0;
    const actualStdComm = parseFloat(r['Thanh toán hoa hồng thực tế']) || 0;
    const estAdsComm = parseFloat(r['Thanh toán hoa hồng Quảng cáo cửa hàng ước tính']) || 0;
    const actualAdsComm = parseFloat(r['Thanh toán hoa hồng Quảng cáo cửa hàng thực tế']) || 0;
    const status = (r['Trạng thái đơn hàng'] || '').trim();
    const creator = (r['Tên người dùng nhà sáng tạo'] || '').trim();
    const ctype = (r['Loại nội dung'] || '').trim();
    const oid = String(r['ID đơn hàng'] || '').trim();
    if (oid) orderIds[oid] = 1;

    const isAds = adsRate && String(adsRate).trim() !== '';
    const bucket = isAds ? ads : organic;
    bucket.count++;
    bucket.revenue += payment;
    bucket.estBase += estBase;
    bucket.actualBase += actualBase;
    if (isAds) {
      bucket.estComm += estAdsComm;
      bucket.actualComm += actualAdsComm;
      bucket.commission += actualAdsComm || estAdsComm;
    } else {
      bucket.estComm += estStdComm;
      bucket.actualComm += actualStdComm;
      bucket.commission += actualStdComm || estStdComm;
    }

    if (status) statuses[status] = (statuses[status] || 0) + 1;
    if (ctype) contentTypes[ctype] = (contentTypes[ctype] || 0) + 1;

    if (creator) {
      if (!creators[creator]) creators[creator] = { count: 0, revenue: 0, commission: 0, orgCount: 0, adsCount: 0 };
      creators[creator].count++;
      creators[creator].revenue += payment;
      creators[creator].commission += isAds ? (actualAdsComm || estAdsComm) : (actualStdComm || estStdComm);
      if (isAds) creators[creator].adsCount++;
      else creators[creator].orgCount++;
    }
  }

  const total = organic.count + ads.count;
  const soDon = Object.keys(orderIds).length;
  const totalRev = organic.revenue + ads.revenue;
  const totalEstBase = organic.estBase + ads.estBase;
  const totalActualBase = organic.actualBase + ads.actualBase;
  const totalEstComm = organic.estComm + ads.estComm;
  const totalActualComm = organic.actualComm + ads.actualComm;
  const rate = (a, b) => b > 0 ? (a / b) : 0;

  let html = '';

  // ============ 1. TỔNG QUAN ============
  let ov = tkKpiRow(
    tkKpi('Đơn hoa hồng', fmt(soDon), fmt(total) + ' dòng SKU', '#1d4ed8', '#bfdbfe')
    + tkKpi('Doanh thu', fmt(totalRev) + 'đ', 'giá trị đơn có hoa hồng', '#1e293b', '#e2e8f0')
    + tkKpi('Đơn tự nhiên', fmt(organic.count), pgPct(rate(organic.count, total), 1) + ' · ' + fmt(organic.revenue) + 'đ', '#16a34a', '#bbf7d0')
    + tkKpi('Đơn quảng cáo', fmt(ads.count), pgPct(rate(ads.count, total), 1) + ' · ' + fmt(ads.revenue) + 'đ', '#b45309', '#fde68a')
    + tkKpi('Hoa hồng thực trả', fmt(totalActualComm) + 'đ', 'ước tính ' + fmt(totalEstComm) + 'đ', '#dc2626', '#fecaca')
  );

  const segOv = (v, c, t) => {
    const p = total > 0 ? v / total * 100 : 0;
    return p <= 0 ? '' : '<div title="' + t + ': ' + fmt(v) + '" style="width:' + p + '%;background:' + c + ';display:flex;align-items:center;justify-content:center;">' + (p >= 8 ? p.toFixed(1).replace('.', ',') + '%' : '') + '</div>';
  };
  ov += '<div style="font-size:0.75em;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Tự nhiên vs Quảng cáo</div>';
  ov += '<div style="display:flex;height:28px;border-radius:8px;overflow:hidden;font-size:0.72em;font-weight:700;color:#fff;">'
    + segOv(organic.count, '#16a34a', 'Tự nhiên') + segOv(ads.count, '#d97706', 'Quảng cáo') + '</div>';

  const tyLeThuc = rate(totalActualComm, totalEstComm);
  ov += '<div style="margin-top:12px;background:' + (tyLeThuc >= 0.8 ? '#f0fdf4' : '#fffbeb') + ';border:1px solid ' + (tyLeThuc >= 0.8 ? '#86efac' : '#fde68a') + ';border-radius:8px;padding:11px 15px;font-size:0.84em;color:' + (tyLeThuc >= 0.8 ? '#166534' : '#92400e') + ';line-height:1.8;">'
    + '💸 Hoa hồng <b>ước tính ' + fmt(totalEstComm) + 'đ</b> nhưng <b>thực trả chỉ ' + fmt(totalActualComm) + 'đ</b> — đạt <b>' + pgPct(tyLeThuc, 1) + '</b>. '
    + 'Phần chênh <b>' + fmt(totalEstComm - totalActualComm) + 'đ</b> là của các đơn chưa quyết toán hoặc không đủ điều kiện.'
    + '</div>';
  html += pgCard('📊 Tổng quan hoa hồng Affiliate', ov, '#2563eb');

  // ============ 2. CƠ SỞ HOA HỒNG ============
  // Gộp "ước tính → thực tế" vào cùng ô cho gọn: 7 cột xuống 4 cột, không phải kéo ngang
  const pairCell = (est, act, color, foot) => {
    const sub = foot ? 'rgba(255,255,255,.65)' : '#94a3b8';
    return '<div style="white-space:nowrap;font-size:0.92em;color:' + sub + ';">' + fmt(est) + 'đ</div>'
      + '<div style="white-space:nowrap;font-weight:800;color:' + color + ';">↓ ' + fmt(act) + 'đ</div>';
  };
  const rowComm = (lab, b, color, foot) => ({
    foot: foot,
    cells: [
      '<b style="color:' + (foot ? '#fff' : color) + ';white-space:nowrap;">' + lab + '</b>',
      pairCell(b.estBase, b.actualBase, foot ? '#fff' : '#1e293b', foot),
      pairCell(b.estComm, b.actualComm, foot ? '#fff' : color, foot),
      '<b style="white-space:nowrap;color:' + (foot ? '#fff' : (rate(b.actualComm, b.estComm) >= 0.7 ? '#16a34a' : '#b45309')) + ';">'
        + pgPct(rate(b.actualComm, b.estComm), 1) + '</b>'
    ]
  });
  const tot = { estBase: totalEstBase, actualBase: totalActualBase, estComm: totalEstComm, actualComm: totalActualComm };
  let ch = pgTable(
    [{ t: 'Loại', a: 'left' },
     { t: 'Cơ sở hoa hồng<div style="font-weight:500;font-size:0.84em;opacity:.75;">ước tính ↓ thực tế</div>', a: 'right' },
     { t: 'Tiền hoa hồng<div style="font-weight:500;font-size:0.84em;opacity:.75;">ước tính ↓ thực trả</div>', a: 'right' },
     { t: '% thực trả', a: 'right' }],
    [rowComm('🌿 Tự nhiên', organic, '#16a34a'), rowComm('📢 Quảng cáo', ads, '#b45309'),
     rowComm('Tổng cộng', tot, '#1e293b', true)]
  );
  ch += '<div style="margin-top:10px;font-size:0.78em;color:#64748b;line-height:1.8;">'
    + '<b>Cơ sở hoa hồng</b> = giá trị đơn dùng để tính hoa hồng. <b>Ước tính</b> tính ngay khi đặt hàng, <b>thực tế</b> chỉ chốt khi đơn đã quyết toán. '
    + 'Cột <b>% thực hiện / % thực trả</b> cho biết bao nhiêu phần đã thật sự về tay nhà sáng tạo.</div>';
  html += pgCard('💰 Chi tiết cơ sở hoa hồng', ch, '#16a34a');

  // ============ 3. TRẠNG THÁI ĐƠN ============
  const stEntries = Object.entries(statuses).sort((a, b) => b[1] - a[1]);
  const stColor = k => /quyết toán|settled/i.test(k) ? '#16a34a'
    : (/không đủ điều kiện/i.test(k) ? '#dc2626' : (/chờ|pending/i.test(k) ? '#b45309' : '#64748b'));
  let sh = tkRankTable(stEntries, total, 'Trạng thái đơn', {
    color: '#2563eb', unit: 'Số dòng', pctOf: 'tổng', rows: 10,
    render: k => '<b style="color:' + stColor(k) + ';">' + esc(k) + '</b>'
  });
  const inel = statuses['Không đủ điều kiện'] || 0;
  if (inel) {
    sh += '<div style="margin-top:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:11px 15px;font-size:0.84em;color:#991b1b;line-height:1.8;">'
      + '⚠️ <b>' + fmt(inel) + ' đơn "Không đủ điều kiện"</b> (' + pgPct(rate(inel, total), 1) + ') — nhà sáng tạo đã kéo được đơn nhưng <b>không được trả hoa hồng</b>. '
      + 'Xem 2 bảng bên dưới để biết sản phẩm nào và nhà sáng tạo nào dính nhiều nhất.</div>';
  }
  html += pgCard('📋 Trạng thái đơn hoa hồng', sh, '#7c3aed');

  // ============ 4. LOẠI NỘI DUNG ============
  const ctEntries = Object.entries(contentTypes).sort((a, b) => b[1] - a[1]);
  if (ctEntries.length) {
    html += pgCard('🎬 Đơn về từ loại nội dung nào',
      tkRankTable(ctEntries, total, 'Loại nội dung', { color: '#0891b2', unit: 'Số dòng', pctOf: 'tổng', rows: 10 }),
      '#0891b2');
  }

  // ============ 5. TOP NHÀ SÁNG TẠO ============
  const topCreators = Object.entries(creators).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 50);
  const crBody = topCreators.map(([name, d], i) => {
    const src = d.adsCount > 0 && d.orgCount > 0 ? '<span style="background:#ede9fe;color:#6d28d9;padding:1px 7px;border-radius:5px;font-size:0.82em;font-weight:700;">Cả hai</span>'
      : (d.adsCount > 0 ? '<span style="background:#fef3c7;color:#b45309;padding:1px 7px;border-radius:5px;font-size:0.82em;font-weight:700;">📢 Ads</span>'
        : '<span style="background:#dcfce7;color:#15803d;padding:1px 7px;border-radius:5px;font-size:0.82em;font-weight:700;">🌿 Tự nhiên</span>');
    return {
      cells: ['<span style="color:#94a3b8;font-weight:700;">' + (i + 1) + '</span>',
        '<div style="max-width:min(320px,26vw);word-break:break-word;"><b>' + esc(name) + '</b></div>',
        src, fmt(d.count), fmt(d.revenue) + 'đ', '<b style="color:#16a34a;">' + fmt(d.commission) + 'đ</b>']
    };
  });
  let crh = '<div style="font-size:0.85em;color:#475569;margin-bottom:10px;">Có <b>' + fmt(Object.keys(creators).length) + ' nhà sáng tạo</b> mang đơn về. Bảng dưới là <b>top 50</b> theo doanh thu.</div>';
  crh += pgTable(
    [{ t: '#', a: 'left' }, { t: 'Nhà sáng tạo', a: 'left' }, { t: 'Nguồn', a: 'left' },
     { t: 'Số dòng', a: 'right' }, { t: 'Doanh thu', a: 'right' }, { t: 'Hoa hồng', a: 'right' }],
    crBody, { scrollRows: crBody.length > 10 ? 10 : 0, more: pgScrollNote(crBody.length, 10) }
  );
  html += pgCard('🏆 Top nhà sáng tạo', crh, '#b45309');

  document.getElementById('affContent').innerHTML = html;
  document.getElementById('affiliateDashboard').style.display = '';

  // ===== KHÔNG ĐỦ ĐIỀU KIỆN =====
  const ineligibleProducts = {}, ineligibleCreators = {}, ineligibleVideos = {};
  const allCreatorTotals = {}, allVideoTotals = {};

  for (const r of rows) {
    const status = (r['Trạng thái đơn hàng'] || '').trim();
    const product = (r['Tên sản phẩm'] || '').trim();
    const creator = (r['Tên người dùng nhà sáng tạo'] || '').trim();
    const payment = parseFloat(r['Payment Amount'] || r['Giá']) || 0;
    const videoId = String(r['Id nội dung'] || r['ID nội dung'] || '').trim();

    if (creator) allCreatorTotals[creator] = (allCreatorTotals[creator] || 0) + 1;
    if (videoId) {
      if (!allVideoTotals[videoId]) allVideoTotals[videoId] = { count: 0, creator: creator };
      allVideoTotals[videoId].count++;
    }
    if (status === 'Không đủ điều kiện') {
      if (product) {
        if (!ineligibleProducts[product]) ineligibleProducts[product] = { count: 0, revenue: 0 };
        ineligibleProducts[product].count++; ineligibleProducts[product].revenue += payment;
      }
      if (creator) {
        if (!ineligibleCreators[creator]) ineligibleCreators[creator] = { count: 0, revenue: 0 };
        ineligibleCreators[creator].count++; ineligibleCreators[creator].revenue += payment;
      }
      if (videoId) {
        if (!ineligibleVideos[videoId]) ineligibleVideos[videoId] = { count: 0, revenue: 0, creator: creator };
        ineligibleVideos[videoId].count++; ineligibleVideos[videoId].revenue += payment;
      }
    }
  }

  const topInelProducts = Object.entries(ineligibleProducts).sort((a, b) => b[1].count - a[1].count).slice(0, 30);
  const topInelCreators = Object.entries(ineligibleCreators).sort((a, b) => b[1].count - a[1].count).slice(0, 30);
  const allInelVideos = Object.entries(ineligibleVideos)
    .map(([vid, d]) => {
      const totalOrders = allVideoTotals[vid] ? allVideoTotals[vid].count : 0;
      return { vid, ...d, totalOrders, rate: totalOrders > 0 ? d.count / totalOrders : 0 };
    })
    .filter(v => v.rate >= 0.2)
    .sort((a, b) => b.count - a.count);

  let ih = '';
  if (topInelProducts.length) {
    ih += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin-bottom:6px;">📦 Sản phẩm dính nhiều nhất</div>';
    ih += pgTable(
      [{ t: '#', a: 'left' }, { t: 'Sản phẩm', a: 'left' }, { t: 'Số đơn', a: 'right' }, { t: 'Doanh thu mất', a: 'right' }],
      topInelProducts.map(([name, d], i) => ({
        cells: ['<span style="color:#94a3b8;font-weight:700;">' + (i + 1) + '</span>',
          '<div style="max-width:min(430px,30vw);word-break:break-word;line-height:1.5;">' + esc(name) + '</div>',
          '<b style="color:#dc2626;white-space:nowrap;">' + fmt(d.count) + '</b>', '<span style="white-space:nowrap;">' + fmt(d.revenue) + 'đ</span>']
      })),
      { scrollRows: topInelProducts.length > 10 ? 10 : 0, more: pgScrollNote(topInelProducts.length, 10) }
    );
  }
  if (topInelCreators.length) {
    ih += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:18px 0 6px;">👤 Nhà sáng tạo dính nhiều nhất</div>';
    ih += pgTable(
      [{ t: '#', a: 'left' }, { t: 'Nhà sáng tạo', a: 'left' }, { t: 'Đơn hỏng', a: 'right' }, { t: 'Tổng đơn', a: 'right' }, { t: 'Tỉ lệ hỏng', a: 'right' }, { t: 'Doanh thu mất', a: 'right' }],
      topInelCreators.map(([name, d], i) => {
        const t2 = allCreatorTotals[name] || 0;
        const rt = t2 > 0 ? d.count / t2 : 0;
        return {
          cells: ['<span style="color:#94a3b8;font-weight:700;">' + (i + 1) + '</span>',
            '<div style="max-width:min(320px,26vw);word-break:break-word;"><b>' + esc(name) + '</b></div>',
            '<b style="color:#dc2626;">' + fmt(d.count) + '</b>', fmt(t2),
            '<b style="color:' + (rt >= 0.5 ? '#dc2626' : (rt >= 0.25 ? '#b45309' : '#64748b')) + ';">' + pgPct(rt, 1) + '</b>',
            fmt(d.revenue) + 'đ']
        };
      }),
      { scrollRows: topInelCreators.length > 10 ? 10 : 0, more: pgScrollNote(topInelCreators.length, 10) }
    );
  }
  if (allInelVideos.length) {
    ih += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:18px 0 6px;">🎬 Video có tỉ lệ đơn hỏng ≥ 20%</div>';
    ih += pgTable(
      [{ t: '#', a: 'left' }, { t: 'ID nội dung', a: 'left' }, { t: 'Nhà sáng tạo', a: 'left' }, { t: 'Đơn hỏng', a: 'right' }, { t: 'Tổng đơn', a: 'right' }, { t: 'Tỉ lệ', a: 'right' }, { t: 'Doanh thu mất', a: 'right' }],
      allInelVideos.map((v, i) => ({
        cells: ['<span style="color:#94a3b8;font-weight:700;">' + (i + 1) + '</span>',
          pgIdCell(v.vid), '<div style="max-width:min(220px,18vw);word-break:break-word;">' + esc(v.creator || '—') + '</div>',
          '<b style="color:#dc2626;">' + fmt(v.count) + '</b>', fmt(v.totalOrders),
          '<b style="color:' + (v.rate >= 0.5 ? '#dc2626' : '#b45309') + ';">' + pgPct(v.rate, 1) + '</b>',
          fmt(v.revenue) + 'đ']
      })),
      { scrollRows: allInelVideos.length > 10 ? 10 : 0, more: pgScrollNote(allInelVideos.length, 10) }
    );
  }
  if (ih) {
    document.getElementById('affContent').innerHTML += pgCard('⚠️ Đơn "Không đủ điều kiện" — mất hoa hồng ở đâu', ih, '#dc2626');
  }

  window._affData = {
    organic: organic, ads: ads, total: total, totalRev: totalRev,
    totalEstBase: totalEstBase, totalActualBase: totalActualBase,
    totalEstComm: totalEstComm, totalActualComm: totalActualComm,
    topCreators: topCreators, topInelProducts: topInelProducts,
    topInelCreators: topInelCreators, allInelVideos: allInelVideos,
    allCreatorTotals: allCreatorTotals, statuses: statuses
  };
}

function clearAffiliateStats() {
  destroyAffCharts();
  document.getElementById('affiliateDashboard').style.display = 'none';
  document.getElementById('fileAffiliate').value = '';
  document.getElementById('hintAffiliate').textContent = 'Chưa chọn file';
  document.getElementById('hintAffiliate').className = 'file-hint';
}

// ========== REVENUE REPORT ==========
let revenueData = null;

async function processRevenueReport() {
  const f1 = document.getElementById('fileRevenueOrders').files[0];
  const f2 = document.getElementById('fileIncome').files[0];
  if (!f2) { alert('Vui lòng chọn file "Income / Thu nhập"!'); return; }

  showLoading('⏳ Đang phân tích doanh thu...', 'Đang đọc file tài chính');

  try {
    await new Promise(r => setTimeout(r, 100));
    const incomeData = await parseXlsx(f2);
    let orderData = null;
    if (f1) orderData = await parseXlsx(f1);

    // Merge file đơn hàng tháng trước (nếu có)
    const f3 = document.getElementById('fileRevenueOrdersPrev').files[0];
    if (f3 && orderData) {
      const prevData = await parseXlsx(f3);
      if (prevData.rows.length > 0) {
        orderData.rows = orderData.rows.concat(prevData.rows);
      }
    }

    renderRevenueReport(incomeData.rows, orderData ? orderData.rows : []);
    hideLoading();
  } catch (err) {
    hideLoading();
    console.error('[Revenue] Error:', err);
    alert('Lỗi: ' + err.message);
  }
}

function renderRevenueReport(incomeRows, orderRows) {
  console.log('[Revenue] Income rows received:', incomeRows.length);
  if (incomeRows.length > 0) {
    console.log('[Revenue] First row keys:', Object.keys(incomeRows[0]).filter(k=>k).join(' | '));
  }

  // Dynamic key matching - find header containing search text
  const keys = incomeRows.length > 0 ? Object.keys(incomeRows[0]) : [];
  const fk = (search) => keys.find(k => k && k.includes(search)) || '';

  const K = {
    txn: fk('Loại giao dịch'),
    settlement: fk('tiền quyết toán'),
    revenue: fk('Tổng doanh thu'),
    subAfter: fk('sau giảm giá của người bán'),
    subBefore: fk('trước giảm giá'),
    sellerDiscount: fk('Giảm giá của người bán'),
    totalFee: fk('Tổng phí'),
    feeTransaction: fk('Phí giao dịch'),
    feeCommission: fk('hoa hồng của TikTok'),
    affiliate: fk('Hoa hồng liên kết'),
    affiliateAds: fk('Quảng cáo cửa hàng liên kết'),
    voucher: fk('Voucher Xtra'),
    sfr: fk('dịch vụ SFR'),
    refundBonus: fk('hoàn tiền thưởng'),
    processing: fk('xử lý đơn hàng'),
    sfp: fk('dịch vụ SFP'),
    shipping: fk('Phí vận chuyển của người bán'),
    taxVAT: fk('Thuế GTGT'),
    taxPIT: fk('Thuế TNCN do'),
    platformDiscount: fk('Giảm giá của nền tảng'),
    platformDiscountRefund: fk('Hoàn tiền giảm giá của nền tảng'),
    customerPaid: fk('Khách thanh toán'),
    customerRefund: fk('Tiền hoàn của khách'),
  };
  console.log('[Revenue] Key mapping:', JSON.stringify(K));

  let orderCount = 0;
  let subtotalBefore = 0, subtotalAfter = 0, sellerDiscount = 0;
  let settlement = 0, totalFee = 0, revenue = 0;
  let feeTransaction = 0, feeCommission = 0, feeAffiliate = 0;
  let feeAffiliateAds = 0, feeVoucher = 0, feeSFR = 0, feeProcessing = 0;
  let feeSFP = 0, feeOther = 0, feeShipping = 0, feeRefundBonus = 0;
  let taxVAT = 0, taxPIT = 0;
  let platformDiscount = 0, platformDiscountRefund = 0;
  let customerPaid = 0, customerRefund = 0;

  for (const r of incomeRows) {
    const txnType = String(r[K.txn] || '').trim();
    if (txnType !== 'Đơn hàng') continue;
    orderCount++;
    settlement += parseFloat(r[K.settlement]) || 0;
    revenue += parseFloat(r[K.revenue]) || 0;
    subtotalAfter += parseFloat(r[K.subAfter]) || 0;
    subtotalBefore += parseFloat(r[K.subBefore]) || 0;
    sellerDiscount += parseFloat(r[K.sellerDiscount]) || 0;
    totalFee += parseFloat(r[K.totalFee]) || 0;
    feeTransaction += parseFloat(r[K.feeTransaction]) || 0;
    feeCommission += parseFloat(r[K.feeCommission]) || 0;
    feeAffiliate += parseFloat(r[K.affiliate]) || 0;
    feeAffiliateAds += parseFloat(r[K.affiliateAds]) || 0;
    feeVoucher += parseFloat(r[K.voucher]) || 0;
    feeSFR += parseFloat(r[K.sfr]) || 0;
    feeRefundBonus += parseFloat(r[K.refundBonus]) || 0;
    feeProcessing += parseFloat(r[K.processing]) || 0;
    feeSFP += parseFloat(r[K.sfp]) || 0;
    feeShipping += parseFloat(r[K.shipping]) || 0;
    taxVAT += parseFloat(r[K.taxVAT]) || 0;
    taxPIT += parseFloat(r[K.taxPIT]) || 0;
    platformDiscount += parseFloat(r[K.platformDiscount]) || 0;
    platformDiscountRefund += parseFloat(r[K.platformDiscountRefund]) || 0;
    customerPaid += parseFloat(r[K.customerPaid]) || 0;
    customerRefund += parseFloat(r[K.customerRefund]) || 0;
  }
  console.log('[Revenue] Orders:', orderCount, 'Settlement:', fmt(settlement), 'TotalFee:', fmt(totalFee), 'SubBefore:', fmt(subtotalBefore));

  // Calculate components
  const totalTax = Math.abs(taxVAT) + Math.abs(taxPIT);
  const totalAffAll = Math.abs(feeAffiliate) + Math.abs(feeAffiliateAds);
  const refundTotal = Math.abs(subtotalAfter - subtotalBefore - sellerDiscount); // Hoàn tiền
  const sellerDiscountAbs = Math.abs(sellerDiscount);
  const base = revenue; // Tổng doanh thu = 100%
  const pct = v => base > 0 ? ((Math.abs(v) / base) * 100).toFixed(2) + '%' : '0%';

  // Adjustment: non-order transactions — split GMV Ads from other adjustments
  let adjustmentOther = 0;
  let adjustmentGMV = 0;
  const kTxn = K.txn;
  for (const r of incomeRows) {
    const txnType = String(r[kTxn] || '').trim();
    if (txnType !== 'Đơn hàng' && txnType !== '') {
      const val = parseFloat(r[K.settlement]) || 0;
      if (txnType.includes('GMV') || txnType.includes('Quảng cáo') || txnType.includes('quảng cáo')) {
        adjustmentGMV += val;
      } else {
        adjustmentOther += val;
      }
    }
  }
  const adjustment = adjustmentOther + adjustmentGMV;

  // Other fees
  const knownFees = Math.abs(feeTransaction) + Math.abs(feeCommission) + Math.abs(feeAffiliate) + Math.abs(feeAffiliateAds) + Math.abs(feeVoucher) + Math.abs(feeSFR) + Math.abs(feeRefundBonus) + Math.abs(feeProcessing) + Math.abs(feeSFP) + Math.abs(feeShipping) + totalTax;
  // Phần chênh giữa 'Tổng phí' của sàn và các mục liệt kê -> gom vào 'Phí khác'
  // để bảng chi tiết luôn cộng đúng bằng tổng, kể cả khi TikTok thêm loại phí mới.
  const feeOtherResidual = Math.max(Math.abs(totalFee) - knownFees, 0);

  // Store for recalc
  revenueData = { base, settlement, totalFee, totalTax, revenue, adjustment, adjustmentOther, adjustmentGMV, sellerDiscountAbs, refundTotal, orderCount, feeTransaction, feeCommission, totalAffAll, feeVoucher, feeSFR, feeRefundBonus, feeProcessing, feeShipping, feeOtherResidual };

  // ROW 1 Line 1: Quyết toán = Doanh thu - Phí + Điều chỉnh
  const totalSettlement = settlement + adjustment; // settlement from orders + adjustment
  setEl('rvSettlement', fmt(totalSettlement) + 'đ');
  setEl('rvSettlementPct', pct(totalSettlement));
  setEl('rvRevenue', fmt(revenue) + 'đ');
  setEl('rvRevenuePct', pct(revenue));
  setEl('rvTotalFee', fmt(Math.abs(totalFee)) + 'đ');
  setEl('rvTotalFeePct', pct(totalFee));
  setEl('rvAdjustment', fmt(adjustmentOther) + 'đ');
  setEl('rvAdjustmentPct', pct(adjustmentOther));
  setEl('rvGmvAds', fmt(Math.abs(adjustmentGMV)) + 'đ');
  setEl('rvGmvAdsPct', pct(adjustmentGMV));

  // Auto-fill chi phí quảng cáo from GMV Ads
  document.getElementById('rvInputAds').value = fmt(Math.abs(adjustmentGMV));

  // ROW 2: Fee details
  // Order count: đếm unique Order ID từ file income
  const incomeOrderIds = {};
  const kCreated = keys.find(k => k && k.includes('Thời gian tạo')) || '';
  for (const r of incomeRows) {
    if (String(r[K.txn] || '').trim() !== 'Đơn hàng') continue;
    const oid = String(r[keys.find(k => k && k.includes('ID đơn hàng')) || ''] || '').trim();
    if (oid && !incomeOrderIds[oid]) {
      incomeOrderIds[oid] = String(r[kCreated] || '').trim().slice(0, 7);
    }
  }
  const uniqueIncomeCount = Object.keys(incomeOrderIds).length;
  // Đếm đơn theo tháng tạo
  const monthCounts = {};
  for (const oid in incomeOrderIds) {
    const m = incomeOrderIds[oid];
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  }
  setEl('rvOrderCount', fmt(uniqueIncomeCount));

  // Cross-reference với file tất cả đơn hàng để phân tích trạng thái
  const noteEl = document.getElementById('rvOrderCountNote');
  if (noteEl) {
    let noteLines = [fmt(orderCount) + ' dòng SKU'];
    // Đếm theo tháng
    const sortedMonths = Object.entries(monthCounts).sort();
    if (sortedMonths.length > 1) {
      const prevMonths = sortedMonths.filter(([m]) => m < sortedMonths[sortedMonths.length - 1][0]);
      const lastMonth = sortedMonths[sortedMonths.length - 1];
      if (prevMonths.length > 0) {
        const prevTotal = prevMonths.reduce((s, [, c]) => s + c, 0);
        noteLines.push('Đơn tháng trước QT sang: ' + fmt(prevTotal));
      }
      noteLines.push('Đơn trong tháng: ' + fmt(lastMonth[1]));
    }
    // Cross-reference trạng thái nếu có orderRows
    if (orderRows.length > 0) {
      const oStatus = Object.keys(orderRows[0]).find(k => k && k.toLowerCase().includes('order status')) || 'Order Status';
      const allOrderStatus = {};
      for (const row of orderRows) {
        const oid = String(row['Order ID'] || '').trim();
        if (oid && !allOrderStatus[oid]) allOrderStatus[oid] = (row[oStatus] || '').trim();
      }
      // Đếm trạng thái của đơn income trong tháng chính
      const lastMonthKey = sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1][0] : '';
      let stCompleted = 0, stShipping = 0, stCancelled = 0, stOther = 0;
      for (const oid in incomeOrderIds) {
        if (sortedMonths.length > 1 && incomeOrderIds[oid] !== lastMonthKey) continue;
        const st = allOrderStatus[oid] || '';
        if (st === 'Đã hoàn tất') stCompleted++;
        else if (st === 'Đã vận chuyển') stShipping++;
        else if (st === 'Đã hủy') stCancelled++;
        else if (st) stOther++;
      }
      if (stCompleted || stShipping) {
        noteLines.push('Trong đó:');
        if (stCompleted) noteLines.push('• Đã hoàn tất: ' + fmt(stCompleted));
        if (stShipping) noteLines.push('• Đã vận chuyển: ' + fmt(stShipping));
        if (stCancelled) noteLines.push('• Đã hủy: ' + fmt(stCancelled));
      }
    }
    noteEl.innerHTML = noteLines.join('<br>');
  }
  setEl('rvFeeTransaction', fmt(Math.abs(feeTransaction)) + 'đ');
  setEl('rvFeeTransactionPct', pct(feeTransaction));
  setEl('rvFeeCommission', fmt(Math.abs(feeCommission)) + 'đ');
  setEl('rvFeeCommissionPct', pct(feeCommission));
  setEl('rvFeeAffiliate', fmt(totalAffAll) + 'đ');
  setEl('rvFeeAffiliatePct', pct(totalAffAll));
  setEl('rvFeeVoucher', fmt(Math.abs(feeVoucher)) + 'đ');
  setEl('rvFeeVoucherPct', pct(feeVoucher));
  setEl('rvFeeSFR', fmt(Math.abs(feeSFR)) + 'đ');
  setEl('rvFeeSFRPct', pct(feeSFR));
  setEl('rvFeeRefundBonus', fmt(Math.abs(feeRefundBonus)) + 'đ');
  setEl('rvFeeRefundBonusPct', pct(feeRefundBonus));
  setEl('rvFeeOther', fmt(feeOtherResidual) + 'đ');
  setEl('rvFeeOtherPct', pct(feeOtherResidual));
  setEl('rvFeeProcessing', fmt(Math.abs(feeProcessing)) + 'đ');
  setEl('rvFeeProcessingPct', pct(feeProcessing));

  // Đối chiếu: các mục liệt kê phải cộng đúng bằng Tổng phí
  var _liet = knownFees + feeOtherResidual;
  var _lech = Math.abs(totalFee) - _liet;
  var _ck = document.getElementById('rvFeeCheck');
  if (_ck) {
    if (Math.abs(_lech) < 1) {
      _ck.style.background = '#f0fdf4'; _ck.style.border = '1px solid #86efac'; _ck.style.color = '#166534';
      _ck.innerHTML = '✅ Các mục trên cộng lại = <b>' + fmt(_liet) + 'đ</b> — khớp đúng Tổng phí cho sàn.';
    } else {
      _ck.style.background = '#fef2f2'; _ck.style.border = '1px solid #fecaca'; _ck.style.color = '#991b1b';
      _ck.innerHTML = '⚠️ Các mục trên cộng lại = <b>' + fmt(_liet) + 'đ</b> nhưng Tổng phí là <b>' + fmt(Math.abs(totalFee)) + 'đ</b> — lệch <b>' + fmt(Math.abs(_lech)) + 'đ</b>.';
    }
  }
  setEl('rvFeeShipping', fmt(Math.abs(feeShipping)) + 'đ');
  setEl('rvFeeShippingPct', pct(feeShipping));
  setEl('rvTaxTotal', fmt(totalTax) + 'đ');
  setEl('rvTaxTotalPct', pct(totalTax));

  // ===== VOUCHER STATS from Order file =====
  if (orderRows.length > 0) {
    const oKeys = Object.keys(orderRows[0] || {});
    const ofk = (s) => oKeys.find(k => k && k.toLowerCase().includes(s.toLowerCase())) || '';
    const cPlatDisc = ofk('SKU Platform Discount') || ofk('Platform Discount');
    const cSellerDisc = ofk('SKU Seller Discount') || ofk('Seller Discount');
    const cShipPlatDisc = ofk('Shipping Fee Platform Discount');
    const cShipAfter = ofk('Shipping Fee After Discount');
    const cStatus = ofk('Order Status');

    const cOrderAmount = ofk('Order Amount');
    const oVoucher = {};
    for (const row of orderRows) {
      const oid = String(row['Order ID'] || '').trim();
      if (!oid) continue;
      const pd = Math.abs(parseFloat(row[cPlatDisc]) || 0);
      const sd = Math.abs(parseFloat(row[cSellerDisc]) || 0);
      const shipPd = Math.abs(parseFloat(row[cShipPlatDisc]) || 0);
      const shipAfter = Math.abs(parseFloat(row[cShipAfter]) || 0);
      const status = (row[cStatus] || '').trim();
      const orderAmt = parseFloat(row[cOrderAmount]) || 0;
      if (!oVoucher[oid]) {
        oVoucher[oid] = { pd, sd, shipSub: shipPd, shipAfter, status, amount: orderAmt };
      } else {
        oVoucher[oid].pd += pd;
        oVoucher[oid].sd += sd;
      }
    }

    let vcPlatform = 0, vcSeller = 0, vcShipSub = 0;
    let vcOrdPlat = 0, vcOrdSeller = 0, vcOrdShip = 0, vcOrdPayShip = 0;
    let vcR0 = 0, vcR20 = 0, vcR50 = 0, vcR100 = 0;

    for (const v of Object.values(oVoucher)) {
      if (v.status !== 'Đã hoàn tất' && v.status !== 'Đã vận chuyển') continue;
      vcPlatform += v.pd;
      vcSeller += v.sd;
      vcShipSub += v.shipSub;
      if (v.pd > 0) vcOrdPlat++;
      if (v.sd > 0) vcOrdSeller++;
      if (v.shipSub > 0) vcOrdShip++;
      if (v.shipAfter > 0) vcOrdPayShip++;
      const vc = v.pd;
      if (vc > 0 && vc <= 20000) vcR0++;
      else if (vc > 20000 && vc <= 50000) vcR20++;
      else if (vc > 50000 && vc <= 100000) vcR50++;
      else if (vc > 100000) vcR100++;
    }

    setEl('rvVcPlatform', fmt(vcPlatform) + 'đ');
    setEl('rvVcShipSub', fmt(vcShipSub) + 'đ');
    setEl('rvVcTotalSupport', fmt(vcPlatform + vcShipSub) + 'đ');
    const feeVoucherXtra = revenueData ? Math.abs(revenueData.feeVoucher || 0) : 0;
    const vcRatio = feeVoucherXtra > 0 ? (vcPlatform / feeVoucherXtra) : 0;
    setEl('rvVcRatio', vcRatio.toFixed(2));
    setEl('rvVcOrdersPlatform', fmt(vcOrdPlat));
    setEl('rvVcOrdersSeller', fmt(vcOrdSeller));
    setEl('rvVcOrdersShip', fmt(vcOrdShip));
    setEl('rvVcOrdersPayShip', fmt(vcOrdPayShip));
    setEl('rvVcR0', fmt(vcR0));
    setEl('rvVcR20', fmt(vcR20));
    setEl('rvVcR50', fmt(vcR50));
    setEl('rvVcR100', fmt(vcR100));
    document.getElementById('rvVoucherCard').style.display = '';

    // ===== PHÂN TÍCH VOUCHER THEO MỨC GIÁ ĐƠN =====
    const priceRanges = [
      { label: '< 100K', min: 0, max: 100000 },
      { label: '100K – 150K', min: 100000, max: 150000 },
      { label: '150K – 200K', min: 150000, max: 200000 },
      { label: '200K – 300K', min: 200000, max: 300000 },
      { label: '300K – 500K', min: 300000, max: 500000 },
      { label: '500K+', min: 500000, max: Infinity }
    ];
    const completedOrders = Object.values(oVoucher).filter(v => v.status === 'Đã hoàn tất' || v.status === 'Đã vận chuyển');
    const totalCompleted = completedOrders.length;
    const rangeStats = priceRanges.map(r => {
      const orders = completedOrders.filter(v => v.amount >= r.min && v.amount < r.max);
      const count = orders.length;
      const totalAmt = orders.reduce((s, v) => s + v.amount, 0);
      const withVc = orders.filter(v => v.pd > 0);
      const vcCount = withVc.length;
      const vcTotal = withVc.reduce((s, v) => s + v.pd, 0);
      return { label: r.label, count, pct: totalCompleted > 0 ? (count / totalCompleted * 100) : 0, aov: count > 0 ? Math.round(totalAmt / count) : 0, vcCount, vcTotal, vcAvg: vcCount > 0 ? Math.round(vcTotal / vcCount) : 0 };
    });
    const maxCount = Math.max(...rangeStats.map(r => r.count));
    document.getElementById('rvVcPriceRangeTable').innerHTML = rangeStats.map(r =>
      `<tr style="${r.count === maxCount && r.count > 0 ? 'font-weight:700;background:rgba(37,99,235,0.06);' : ''}">
        <td style="padding:10px 12px;">${r.label}</td>
        <td style="text-align:right;padding:10px 12px;">${fmt(r.count)}</td>
        <td style="text-align:right;padding:10px 12px;">${r.pct.toFixed(1)}%</td>
        <td style="text-align:right;padding:10px 12px;">${fmt(r.aov)}</td>
        <td style="text-align:right;padding:10px 12px;">${fmt(r.vcCount)}</td>
        <td style="text-align:right;padding:10px 12px;">${fmt(r.vcTotal)}đ</td>
        <td style="text-align:right;padding:10px 12px;">${fmt(r.vcAvg)}đ</td>
      </tr>`
    ).join('');

    // ===== TOP VOUCHER PHỔ BIẾN NHẤT =====
    const vcValues = {};
    for (const v of completedOrders) {
      if (v.pd <= 0) continue;
      const rounded = Math.round(v.pd);
      vcValues[rounded] = (vcValues[rounded] || 0) + 1;
    }
    const topVouchers = Object.entries(vcValues).map(([val, cnt]) => ({ val: parseInt(val), cnt })).sort((a, b) => b.cnt - a.cnt).slice(0, 10);
    const totalVcOrders = topVouchers.reduce((s, v) => s + v.cnt, 0);
    document.getElementById('rvVcTopTable').innerHTML = topVouchers.map((v, i) =>
      `<tr style="${i < 3 ? 'font-weight:700;color:#f59e0b;' : ''}">
        <td style="padding:10px 12px;">${fmt(v.val)} đ</td>
        <td style="text-align:right;padding:10px 12px;">${fmt(v.cnt)}</td>
        <td style="text-align:right;padding:10px 12px;">${totalVcOrders > 0 ? (v.cnt / totalVcOrders * 100).toFixed(1) : 0}%</td>
      </tr>`
    ).join('');
  }

  recalcRevenue();
  // Build COGS table from order data
  if (orderRows.length > 0) buildCOGSTable(orderRows, incomeRows);
  document.getElementById('revenueDashboard').style.display = '';
}

function recalcRevenue() {
  if (!revenueData) return;
  const d = revenueData;
  const cogs = getMoneyVal('rvInputCOGS');
  const ads = getMoneyVal('rvInputAds');
  const ops = getMoneyVal('rvInputOps');
  const extra = getMoneyVal('rvInputExtra');
  const pct = v => d.revenue > 0 ? ((Math.abs(v) / d.revenue) * 100).toFixed(2) + '%' : '0%';

  // Lợi nhuận trước thuế = (Quyết toán đơn hàng + Điều chỉnh khác) - Giá vốn - Ads - Ops - Extra
  // Note: GMV Ads is excluded from settlement base here because it's shown as "Chi phí quảng cáo"
  const settlementBase = d.settlement + (d.adjustmentOther || 0);
  const totalSettlement = d.settlement + (d.adjustment || 0);
  const profitBefore = settlementBase - cogs - ads - ops - extra;

  // Thuế cuối năm = 17% × Lợi nhuận trước thuế
  const yearTax = Math.max(profitBefore, 0) * 0.17;
  const netProfit = profitBefore - yearTax;

  // ROW 3: Profit
  setEl('rvProfitBefore', fmt(profitBefore) + 'đ');
  setEl('rvProfitBeforePct', pct(profitBefore));
  setEl('rvSettlement2', fmt(settlementBase) + 'đ');
  setEl('rvSettlement2Pct', pct(settlementBase));
  setEl('rvCOGS', fmt(cogs) + 'đ');
  setEl('rvCOGSPct', pct(cogs));
  setEl('rvAds', fmt(ads) + 'đ');
  setEl('rvAdsPct', pct(ads));
  setEl('rvOps', fmt(ops) + 'đ');
  setEl('rvOpsPct', pct(ops));
  setEl('rvExtra', fmt(extra) + 'đ');
  setEl('rvExtraPct', pct(extra));

  // ROW 4: After tax
  setEl('rvNetProfit', fmt(netProfit) + 'đ');
  setEl('rvNetProfitPct', pct(netProfit));
  setEl('rvProfitBefore2', fmt(profitBefore) + 'đ');
  setEl('rvProfitBefore2Pct', pct(profitBefore));
  setEl('rvYearTax', fmt(Math.max(yearTax, 0)) + 'đ');
  setEl('rvYearTaxPct', pct(Math.max(yearTax, 0)));

  // ROW 5: Tổng báo cáo
  document.getElementById('rvSummaryCard').style.display = '';
  const summaryRows = [
    { label: '📊 DOANH THU', value: d.revenue, bold: true, bg: '#dbeafe' },
    { label: '   Tổng doanh thu (sau giảm giá & hoàn tiền)', value: d.revenue },
    { label: '📋 TỔNG PHÍ CHO SÀN', value: d.totalFee, bold: true, bg: '#fee2e2' },
    { label: '   Phí giao dịch', value: d.feeTransaction || 0 },
    { label: '   Phí hoa hồng TikTok Shop', value: d.feeCommission || 0 },
    { label: '   Hoa hồng liên kết', value: -(d.totalAffAll || 0) },
    { label: '   Phí dịch vụ Voucher Xtra', value: d.feeVoucher || 0 },
    { label: '   Phí dịch vụ SFR', value: d.feeSFR || 0 },
    { label: '   Phí xử lý đơn hàng', value: d.feeProcessing || 0 },
    { label: '   Phí vận chuyển người bán', value: d.feeShipping || 0 },
    { label: '   Thuế sàn đóng (GTGT + TNCN)', value: -(d.totalTax || 0) },
    { label: '🔄 ĐIỀU CHỈNH KHÁC', value: d.adjustmentOther || 0, bold: true, bg: '#fef3c7' },
    { label: '💰 TIỀN QUYẾT TOÁN', value: settlementBase, bold: true, bg: '#dcfce7' },
    { label: '', value: null, sep: true },
    { label: '📦 TRỪ GIÁ VỐN HÀNG BÁN', value: cogs ? -cogs : 0, bold: true, bg: '#fee2e2' },
    { label: '📢 TRỪ CHI PHÍ QUẢNG CÁO', value: ads ? -ads : 0, bold: true, bg: '#fee2e2' },
    { label: '⚙️ TRỪ CHI PHÍ VẬN HÀNH', value: ops ? -ops : 0, bold: true, bg: '#fee2e2' },
    { label: '📎 TRỪ CHI PHÍ PHỤ', value: extra ? -extra : 0, bold: true, bg: '#fee2e2' },
    { label: '', value: null, sep: true },
    { label: '✅ LỢI NHUẬN TRƯỚC THUẾ', value: profitBefore, bold: true, bg: '#bbf7d0' },
    { label: '🏦 THUẾ ĐÓNG CUỐI NĂM (17%)', value: -Math.max(yearTax, 0), bold: true, bg: '#fecaca' },
    { label: '🎯 LỢI NHUẬN SAU THUẾ', value: netProfit, bold: true, bg: '#86efac' },
  ];
  window._rvSummaryData = summaryRows;
  let html = '';
  for (const r of summaryRows) {
    if (r.sep) { html += '<tr><td colspan="3" style="padding:4px;border:none;"></td></tr>'; continue; }
    const style = (r.bold ? 'font-weight:700;' : '') + (r.bg ? 'background:' + r.bg + ';' : '');
    const valColor = r.value > 0 ? '#16a34a' : r.value < 0 ? '#dc2626' : '';
    html += '<tr style="' + style + '"><td style="padding:10px 12px;">' + r.label + '</td>';
    html += '<td style="text-align:right;padding:10px 12px;color:' + valColor + ';">' + (r.value !== null ? fmt(r.value) + 'đ' : '') + '</td>';
    html += '<td style="text-align:right;padding:10px 12px;">' + (r.value !== null ? pct(r.value) : '') + '</td></tr>';
  }
  document.getElementById('rvSummaryBody').innerHTML = html;
}


// Revenue sub-tab switching
function exportRevenueReport() {
  if (!window._rvSummaryData) return alert('Chưa có dữ liệu báo cáo!');
  const d = revenueData;
  const rows = [
    ['BÁO CÁO KINH DOANH TIKTOK SHOP — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    ['Tổng đơn tiền về:', d.orderCount],
    [],
    ['HẠNG MỤC', 'SỐ TIỀN (VND)', 'TỶ LỆ / DOANH THU'],
  ];
  for (const r of window._rvSummaryData) {
    if (r.sep) { rows.push([]); continue; }
    const pctVal = d.revenue > 0 ? ((Math.abs(r.value || 0) / d.revenue) * 100).toFixed(2) + '%' : '0%';
    rows.push([r.label.replace(/^\s+/, '').replace(/^[^\w\sÀ-ỹ]+\s*/, ''), r.value || 0, r.value !== null ? pctVal : '']);
  }

  // Thêm chi tiết chi phí vận hành
  const opsInputs = document.querySelectorAll('#opsRows .ops-row');
  if (opsInputs.length > 0) {
    rows.push([]);
    rows.push(['CHI TIẾT CHI PHÍ VẬN HÀNH']);
    opsInputs.forEach(row => {
      const name = row.querySelector('.ops-name')?.value || '';
      const val = parseFloat(String(row.querySelector('.ops-amount')?.value || '0').replace(/[.\s]/g, '')) || 0;
      if (name && val > 0) rows.push(['   ' + name, val]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');
  XLSX.writeFile(wb, 'Bao_cao_kinh_doanh_TikTok_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function switchRvTab(id) {
  document.querySelectorAll('.rv-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.rv-page').forEach(p => p.classList.remove('active'));
  document.getElementById('rvTab-' + id).classList.add('active');
  document.getElementById('rvPage-' + id).classList.add('active');
}

// COGS (Giá vốn) - auto-populated from order file
let cogsProductsByName = [];
let cogsProductsByVariant = [];
let cogsActiveView = 'name';

function switchCogsView(view) {
  cogsActiveView = view;
  document.querySelectorAll('[id^="cogsViewTab-"]').forEach(t => t.classList.remove('active'));
  document.getElementById('cogsViewTab-' + view).classList.add('active');
  document.getElementById('cogsView-name').style.display = view === 'name' ? '' : 'none';
  document.getElementById('cogsView-variant').style.display = view === 'variant' ? '' : 'none';
}

function buildCOGSTable(orderRows, incomeRows) {
  // Lấy danh sách Order ID đã quyết toán từ file income
  const incomeOrderIds = new Set();
  if (incomeRows && incomeRows.length > 0) {
    const iKeys = Object.keys(incomeRows[0]);
    const kOid = iKeys.find(k => k && k.includes('ID đơn hàng')) || '';
    const kTxn = iKeys.find(k => k && k.includes('Loại giao dịch')) || '';
    for (const r of incomeRows) {
      if (String(r[kTxn] || '').trim() !== 'Đơn hàng') continue;
      const oid = String(r[kOid] || '').trim();
      if (oid) incomeOrderIds.add(oid);
    }
  }
  const hasIncome = incomeOrderIds.size > 0;

  // Tìm đơn hoàn tiền từ income: group by Order ID, tổng settlement < 0 = đơn hoàn toàn bộ
  const refundOrderIds = new Set();
  if (incomeRows && incomeRows.length > 0) {
    const iKeys = Object.keys(incomeRows[0]);
    const kOid2 = iKeys.find(k => k && k.includes('ID đơn hàng')) || '';
    const kTxn2 = iKeys.find(k => k && k.includes('Loại giao dịch')) || '';
    const kSettle = iKeys.find(k => k && k.includes('Tổng số tiền quyết toán')) || '';
    const orderSettleMap = {};
    for (const r of incomeRows) {
      if (String(r[kTxn2] || '').trim() !== 'Đơn hàng') continue;
      const oid = String(r[kOid2] || '').trim();
      if (!oid) continue;
      const settle = parseFloat(r[kSettle]) || 0;
      orderSettleMap[oid] = (orderSettleMap[oid] || 0) + settle;
    }
    var cogsZeroOrders = 0, cogsNegOrders = 0;
    for (const oid in orderSettleMap) {
      if (orderSettleMap[oid] === 0) { refundOrderIds.add(oid); cogsZeroOrders++; }
      else if (orderSettleMap[oid] < 0) { refundOrderIds.add(oid); cogsNegOrders++; }
    }
    window._cogsZeroOrders = cogsZeroOrders;
    window._cogsNegOrders = cogsNegOrders;
  }

  const byName = {};
  const byVariant = {};
  const cogsOrderSet = new Set();
  const refundExcludedOrders = new Set();
  let cogsTotalSKU = 0;
  let refundSKU = 0;

  for (const r of orderRows) {
    const oid = String(r['Order ID'] || '').trim();
    if (hasIncome) {
      if (!incomeOrderIds.has(oid)) continue;
    } else {
      const status = String(r['Order Status'] || '').trim();
      if (!status.includes('hoàn t') && !status.includes('hoàn th') && !status.includes('vận chuyển')) continue;
    }
    // Loại đơn hoàn tiền
    if (refundOrderIds.has(oid)) {
      refundExcludedOrders.add(oid);
      refundSKU++;
      continue;
    }
    const name = String(r['Product Name'] || '').trim();
    const variation = String(r['Variation'] || '').trim();
    const qty = parseInt(r['Quantity']) || 0;
    if (!name) continue;

    if (oid) cogsOrderSet.add(oid);
    cogsTotalSKU++;

    if (!byName[name]) byName[name] = { name, qty: 0, price: 0 };
    byName[name].qty += qty;

    const vKey = name + '|||' + variation;
    if (!byVariant[vKey]) byVariant[vKey] = { name, variation, qty: 0, price: 0 };
    byVariant[vKey].qty += qty;
  }

  setEl('cogsTotalOrders', fmt(cogsOrderSet.size));
  setEl('cogsTotalSKU', fmt(cogsTotalSKU));
  const zeroOrd = window._cogsZeroOrders || 0;
  const negOrd = window._cogsNegOrders || 0;
  let noteHtml = '* Chỉ tính đơn thành công — settlement &gt; 0 (đã trừ đơn huỷ, giao không thành công, hoàn tiền/trả hàng)';
  if (refundExcludedOrders.size > 0) {
    noteHtml += '<br>• Đã loại: ' + fmt(refundExcludedOrders.size) + ' đơn (' + fmt(refundSKU) + ' SKU)';
    noteHtml += '<br>• Settlement = 0: ' + fmt(zeroOrd) + ' đơn (huỷ — khách đặt xong huỷ)';
    noteHtml += '<br>• Settlement &lt; 0: ' + fmt(negOrd) + ' đơn (giao không thành công, hoàn tiền/trả hàng)';
  }
  const cogsNoteEl = document.getElementById('cogsNote');
  if (cogsNoteEl) cogsNoteEl.innerHTML = noteHtml;

  cogsProductsByName = Object.values(byName).sort((a, b) => b.qty - a.qty);
  cogsProductsByVariant = Object.values(byVariant).sort((a, b) => b.qty - a.qty);

  // Render "Theo tên SP" table
  if (cogsProductsByName.length > 0) {
    document.getElementById('cogsTableByName').innerHTML = cogsProductsByName.map((p, i) =>
      `<tr><td class="text-center">${i + 1}</td><td style="max-width:400px;white-space:normal;">${esc(p.name)}</td><td class="text-right">${fmt(p.qty)}</td><td class="text-right"><input type="text" inputmode="numeric" class="cogs-input-name" data-idx="${i}" value="0" style="width:120px;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:0.9em;text-align:right;" oninput="fmtMoneyInput(this);calcCOGS('name')"></td><td class="text-right" id="cogsNameTotal-${i}">0đ</td></tr>`
    ).join('');
  } else {
    document.getElementById('cogsTableByName').innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-muted);padding:30px;">Không tìm thấy sản phẩm đã quyết toán</td></tr>';
  }

  // Render "Theo phân loại" table
  if (cogsProductsByVariant.length > 0) {
    document.getElementById('cogsTableByVariant').innerHTML = cogsProductsByVariant.map((p, i) =>
      `<tr><td class="text-center">${i + 1}</td><td style="max-width:300px;white-space:normal;">${esc(p.name)}</td><td>${esc(p.variation || '--')}</td><td class="text-right">${fmt(p.qty)}</td><td class="text-right"><input type="text" inputmode="numeric" class="cogs-input-variant" data-idx="${i}" value="0" style="width:120px;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:0.9em;text-align:right;" oninput="fmtMoneyInput(this);calcCOGS('variant')"></td><td class="text-right" id="cogsVariantTotal-${i}">0đ</td></tr>`
    ).join('');
  } else {
    document.getElementById('cogsTableByVariant').innerHTML = '<tr><td colspan="6" class="text-center" style="color:var(--text-muted);padding:30px;">Không tìm thấy sản phẩm đã quyết toán</td></tr>';
  }
}

function calcCOGS(view) {
  const isName = view === 'name';
  const products = isName ? cogsProductsByName : cogsProductsByVariant;
  const inputClass = isName ? '.cogs-input-name' : '.cogs-input-variant';
  const totalPrefix = isName ? 'cogsNameTotal-' : 'cogsVariantTotal-';

  let grandTotal = 0;
  document.querySelectorAll(inputClass).forEach(input => {
    const idx = parseInt(input.dataset.idx);
    const price = parseFloat(String(input.value).replace(/[.\s]/g, '')) || 0;
    const qty = products[idx] ? products[idx].qty : 0;
    const rowTotal = price * qty;
    products[idx].price = price;
    document.getElementById(totalPrefix + idx).textContent = fmt(rowTotal) + 'đ';
    grandTotal += rowTotal;
  });

  document.getElementById('cogsGrandTotal').textContent = fmt(grandTotal) + 'đ';
  document.getElementById('rvInputCOGS').value = fmt(grandTotal);
  recalcRevenue();
}

function clearCOGSRows() { /* kept for compatibility */ }

// Chi phí vận hành - dynamic rows
function addOpsRow() {
  const row = document.createElement('div');
  row.className = 'ops-row';
  row.innerHTML = `<input type="text" class="ops-name" value="" placeholder="Tên chi phí"><input type="text" inputmode="numeric" class="ops-amount" value="0" placeholder="Số tiền" oninput="fmtMoneyInput(this);calcOps()"><button class="cost-row-remove" onclick="this.closest('.ops-row').remove();calcOps();">×</button>`;
  document.getElementById('opsRows').appendChild(row);
}

function calcOps() {
  let total = 0;
  document.querySelectorAll('#opsRows .ops-amount').forEach(input => {
    total += parseFloat(input.value.replace(/[.\s]/g, '')) || 0;
  });
  document.getElementById('opsGrandTotal').textContent = fmt(total) + 'đ';
  document.getElementById('rvInputOps').value = fmt(total);
  recalcRevenue();
}

function clearOpsRows() {
  document.querySelectorAll('#opsRows .ops-amount').forEach(input => { input.value = 0; });
  calcOps();
}

function clearRevenueReport() {
  revenueData = null;
  document.getElementById('revenueDashboard').style.display = 'none';
  document.getElementById('fileRevenueOrders').value = '';
  document.getElementById('fileIncome').value = '';
  document.getElementById('hintRevenueOrders').textContent = 'Chưa chọn file';
  document.getElementById('hintRevenueOrders').className = 'file-hint';
  document.getElementById('hintIncome').textContent = 'Chưa chọn file';
  document.getElementById('hintIncome').className = 'file-hint';
  document.getElementById('fileRevenueOrdersPrev').value = '';
  document.getElementById('hintRevenueOrdersPrev').textContent = 'Chưa chọn file';
  document.getElementById('hintRevenueOrdersPrev').className = 'file-hint';
}

// ========== FILE UPLOAD STATUS ==========
function onFileSelected(input, hintId) {
  const hint = document.getElementById(hintId);
  if (input.files && input.files.length > 0) {
    if (input.files.length === 1) {
      hint.textContent = '✅ ' + input.files[0].name;
    } else {
      hint.textContent = '✅ ' + input.files.length + ' files: ' + Array.from(input.files).map(f => f.name).join(', ');
    }
    hint.className = 'file-hint loaded';
  } else {
    hint.textContent = 'Chưa chọn file';
    hint.className = 'file-hint';
  }
}

function showLoading(text, sub) {
  document.getElementById('loadingText').textContent = text || '⏳ Đang xử lý dữ liệu...';
  document.getElementById('loadingSub').textContent = sub || 'Vui lòng chờ trong giây lát';
  document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

// ========== LIGHTBOX ==========
function openLightbox(el) {
  const img = el.querySelector('img');
  if (!img) return;
  document.getElementById('lightboxImg').src = img.src;
  document.getElementById('lightboxOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(e) {
  if (e.target.tagName === 'IMG') return;
  document.getElementById('lightboxOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(e); });

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async function() {
  initSupabaseStorage();
  await loadProducts();
  await loadCommissionData();
  initCategorySearch();
  initCostRows();
  toggleShopOpsSection();
  var _ht = null;
  try { _ht = localStorage.getItem(HT_KEY); } catch (e) {}
  setHinhThuc(_ht === 'cty' ? 'cty' : 'hkd');   // đã gọi recalc() bên trong
  renderTable();
});


function exportAffCommission() {
  var d = window._affData;
  if (!d) { alert('Chưa có dữ liệu! Hãy phân tích ADS GMV trước.'); return; }
  var rows = [
    ['CHI TIẾT CƠ SỞ HOA HỒNG — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['Loại', 'Cơ sở HH ước tính', 'Cơ sở HH thực tế', 'Thanh toán HH ước tính', 'Thanh toán HH thực tế'],
    ['Tự nhiên', d.organic.estBase, d.organic.actualBase, d.organic.estComm, d.organic.actualComm],
    ['Quảng cáo', d.ads.estBase, d.ads.actualBase, d.ads.estComm, d.ads.actualComm],
    ['Tổng cộng', d.totalEstBase, d.totalActualBase, d.totalEstComm, d.totalActualComm]
  ];
  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 22 }];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hoa hồng');
  XLSX.writeFile(wb, 'ADS_GMV_Hoa_hong_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function exportAffCreators() {
  var d = window._affData;
  if (!d || !d.topCreators) { alert('Chưa có dữ liệu! Hãy phân tích ADS GMV trước.'); return; }
  var rows = [
    ['TOP NHÀ SÁNG TẠO — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['STT', 'Creator', 'Số đơn', 'Doanh thu', 'Hoa hồng', 'Nguồn']
  ];
  d.topCreators.forEach(function(item, i) {
    var name = item[0], info = item[1];
    var src = info.adsCount > 0 && info.orgCount > 0 ? 'Cả hai' : (info.adsCount > 0 ? 'Ads' : 'Tự nhiên');
    rows.push([i + 1, name, info.count, info.revenue, info.commission, src]);
  });
  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Top Creators');
  XLSX.writeFile(wb, 'ADS_GMV_Top_Creators_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function exportAffInelProducts() {
  var d = window._affData;
  if (!d || !d.topInelProducts) { alert('Chưa có dữ liệu! Hãy phân tích ADS GMV trước.'); return; }
  var rows = [
    ['TOP SẢN PHẨM KHÔNG ĐỦ ĐIỀU KIỆN — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['STT', 'Tên sản phẩm', 'Số đơn', 'Doanh thu mất']
  ];
  d.topInelProducts.forEach(function(item, i) {
    rows.push([i + 1, item[0], item[1].count, item[1].revenue]);
  });
  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 10 }, { wch: 18 }];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SP KĐĐk');
  XLSX.writeFile(wb, 'ADS_GMV_SP_KhongDuDK_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function exportAffInelCreators() {
  var d = window._affData;
  if (!d || !d.topInelCreators) { alert('Chưa có dữ liệu! Hãy phân tích ADS GMV trước.'); return; }
  var rows = [
    ['TOP NHÀ SÁNG TẠO KHÔNG ĐỦ ĐIỀU KIỆN — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['STT', 'Nhà sáng tạo', 'Đơn KĐĐiều kiện', 'Tổng đơn', 'Tỉ lệ KĐĐk', 'Doanh thu mất']
  ];
  d.topInelCreators.forEach(function(item, i) {
    var name = item[0], info = item[1];
    var totalOrders = d.allCreatorTotals[name] || 0;
    var ratio = totalOrders > 0 ? ((info.count / totalOrders) * 100).toFixed(1) + '%' : '--';
    rows.push([i + 1, name, info.count, totalOrders, ratio, info.revenue]);
  });
  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Creator KĐĐk');
  XLSX.writeFile(wb, 'ADS_GMV_Creator_KhongDuDK_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function exportAffInelVideos() {
  var d = window._affData;
  if (!d || !d.allInelVideos) { alert('Chưa có dữ liệu! Hãy phân tích ADS GMV trước.'); return; }
  var rows = [
    ['TOP VIDEO HUỶ HOÀN — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['STT', 'ID nội dung', 'Nhà sáng tạo', 'Số đơn huỷ hoàn', 'Tổng đơn', 'Tỉ lệ huỷ hoàn', 'Doanh thu mất']
  ];
  d.allInelVideos.forEach(function(v, i) {
    rows.push([i + 1, v.vid, v.creator, v.count, v.totalOrders, (v.rate * 100).toFixed(1) + '%', v.revenue]);
  });
  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 25 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 18 }];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Video Huỷ hoàn');
  XLSX.writeFile(wb, 'ADS_GMV_Video_HuyHoan_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function exportAffAll() {
  var d = window._affData;
  if (!d) { alert('Chưa có dữ liệu! Hãy phân tích ADS GMV trước.'); return; }
  var wb = XLSX.utils.book_new();

  // Sheet 1: Tổng quan KPI
  var kpiRows = [
    ['TỔNG QUAN THỐNG KÊ ADS GMV — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['Chỉ số', 'Giá trị'],
    ['Tổng đơn hoa hồng', d.total],
    ['Tổng doanh thu', d.totalRev],
    ['Đơn tự nhiên', d.organic.count],
    ['Doanh thu tự nhiên', d.organic.revenue],
    ['Đơn quảng cáo', d.ads.count],
    ['Doanh thu quảng cáo', d.ads.revenue],
    ['Hoa hồng tự nhiên (thực tế)', d.organic.actualComm],
    ['Hoa hồng quảng cáo (thực tế)', d.ads.actualComm],
    ['Tổng hoa hồng thực tế', d.totalActualComm],
    [],
    ['--- CHI TIẾT CƠ SỞ HOA HỒNG ---'],
    ['Loại', 'Cơ sở HH ước tính', 'Cơ sở HH thực tế', 'Thanh toán HH ước tính', 'Thanh toán HH thực tế'],
    ['Tự nhiên', d.organic.estBase, d.organic.actualBase, d.organic.estComm, d.organic.actualComm],
    ['Quảng cáo', d.ads.estBase, d.ads.actualBase, d.ads.estComm, d.ads.actualComm],
    ['Tổng cộng', d.totalEstBase, d.totalActualBase, d.totalEstComm, d.totalActualComm],
    [],
    ['--- TRẠNG THÁI ĐƠN HÀNG ---'],
    ['Trạng thái', 'Số đơn']
  ];
  Object.entries(d.statuses).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(e) {
    kpiRows.push([e[0], e[1]]);
  });
  var ws1 = XLSX.utils.aoa_to_sheet(kpiRows);
  ws1['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

  // Sheet 2: Top Creators
  var crRows = [['STT', 'Creator', 'Số đơn', 'Doanh thu', 'Hoa hồng', 'Nguồn']];
  d.topCreators.forEach(function(item, i) {
    var name = item[0], info = item[1];
    var src = info.adsCount > 0 && info.orgCount > 0 ? 'Cả hai' : (info.adsCount > 0 ? 'Ads' : 'Tự nhiên');
    crRows.push([i + 1, name, info.count, info.revenue, info.commission, src]);
  });
  var ws2 = XLSX.utils.aoa_to_sheet(crRows);
  ws2['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Top Creators');

  // Sheet 3: SP KĐĐk
  var spRows = [['STT', 'Tên sản phẩm', 'Số đơn', 'Doanh thu mất']];
  d.topInelProducts.forEach(function(item, i) {
    spRows.push([i + 1, item[0], item[1].count, item[1].revenue]);
  });
  var ws3 = XLSX.utils.aoa_to_sheet(spRows);
  ws3['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 10 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'SP KĐĐk');

  // Sheet 4: Creator KĐĐk
  var ccRows = [['STT', 'Nhà sáng tạo', 'Đơn KĐĐk', 'Tổng đơn', 'Tỉ lệ KĐĐk', 'Doanh thu mất']];
  d.topInelCreators.forEach(function(item, i) {
    var name = item[0], info = item[1];
    var totalOrders = d.allCreatorTotals[name] || 0;
    var ratio = totalOrders > 0 ? ((info.count / totalOrders) * 100).toFixed(1) + '%' : '--';
    ccRows.push([i + 1, name, info.count, totalOrders, ratio, info.revenue]);
  });
  var ws4 = XLSX.utils.aoa_to_sheet(ccRows);
  ws4['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Creator KĐĐk');

  // Sheet 5: Video Huỷ hoàn
  var vdRows = [['STT', 'ID nội dung', 'Nhà sáng tạo', 'Số đơn huỷ hoàn', 'Tổng đơn', 'Tỉ lệ huỷ hoàn', 'Doanh thu mất']];
  d.allInelVideos.forEach(function(v, i) {
    vdRows.push([i + 1, v.vid, v.creator, v.count, v.totalOrders, (v.rate * 100).toFixed(1) + '%', v.revenue]);
  });
  var ws5 = XLSX.utils.aoa_to_sheet(vdRows);
  ws5['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 25 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'Video Huỷ hoàn');

  XLSX.writeFile(wb, 'ADS_GMV_TatCa_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

// ========== TÍNH ROI HOÀN HUỶ ==========
async function processRoiHuy() {
  var f = document.getElementById('fileRoiHuy').files[0];
  if (!f) { alert('Vui lòng chọn file đơn hàng!'); return; }
  var cpqcInput = parseFloat(document.getElementById('inputCPQC').value);
  if (!cpqcInput || cpqcInput <= 0 || cpqcInput > 100) { alert('Vui lòng nhập % CPQC hợp lệ (0.1 - 100)!'); return; }

  showLoading('📊 Đang phân tích ROI Hoàn Huỷ...', 'Đang đọc file ' + f.name);
  try {
    await new Promise(function(r) { setTimeout(r, 100); });
    var data = await parseXlsx(f);
    document.getElementById('hintRoiHuy').textContent = '✅ ' + f.name + ' — ' + data.rows.length + ' dòng';
    document.getElementById('hintRoiHuy').className = 'file-hint loaded';
    renderRoiHuy(data.rows, cpqcInput);
    hideLoading();
  } catch (err) {
    hideLoading();
    alert('Lỗi: ' + err.message);
    console.error(err);
  }
}

function renderRoiHuy(rows, cpqcPct) {
  var ordersMap = {};
  var cancelReasons = {};

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var oid = String(r['Order ID'] || '').trim();
    if (!oid || oid === 'Platform unique order ID.') continue;
    if (!ordersMap[oid]) {
      ordersMap[oid] = {
        status: (r['Order Status'] || '').trim(),
        amount: parseFloat(r['Order Amount']) || 0,
        refund: parseFloat(r['Order Refund Amount']) || 0,
        cancelReason: (r['Cancel Reason'] || '').trim(),
        cancelType: (r['Cancelation/Return Type'] || '').trim()
      };
    }
  }

  var totalOrders = 0, gmvTotal = 0;
  var cancelCount = 0, cancelGmv = 0;
  var deliveryFailCount = 0, deliveryFailGmv = 0;
  var returnDoneCount = 0, returnDoneGmv = 0;
  var returnProcessCount = 0, returnProcessGmv = 0;
  var shippingOrders = 0;
  var statusMap = {};

  var orderList = Object.values(ordersMap);
  for (var j = 0; j < orderList.length; j++) {
    var o = orderList[j];
    totalOrders++;
    gmvTotal += o.amount;

    var st = o.status || 'Không rõ';
    if (!statusMap[st]) statusMap[st] = { count: 0, gmv: 0 };
    statusMap[st].count++;
    statusMap[st].gmv += o.amount;

    if (st === 'Đã vận chuyển' || st === 'In Transit' || st === 'Shipped') {
      shippingOrders++;
    }

    if (o.cancelType === 'Return/Refund') {
      if (o.refund > 0) {
        returnDoneCount++; returnDoneGmv += o.amount;
      } else {
        returnProcessCount++; returnProcessGmv += o.amount;
      }
      var reason = o.cancelReason || 'Trả hàng';
      cancelReasons[reason] = (cancelReasons[reason] || 0) + 1;
    } else if (st === 'Đã hủy' || st === 'Cancelled') {
      var reason = o.cancelReason || 'Không rõ';
      cancelReasons[reason] = (cancelReasons[reason] || 0) + 1;
      if (reason.indexOf('Giao') >= 0 || reason.indexOf('giao') >= 0 || reason.indexOf('delivery') >= 0 || reason.indexOf('thất lạc') >= 0) {
        deliveryFailCount++; deliveryFailGmv += o.amount;
      } else {
        cancelCount++; cancelGmv += o.amount;
      }
    }
  }

  var totalHaoHutGmv = cancelGmv + deliveryFailGmv + returnDoneGmv + returnProcessGmv;
  var totalHaoHutCount = cancelCount + deliveryFailCount + returnDoneCount + returnProcessCount;
  var gmvReal = gmvTotal - totalHaoHutGmv;
  var haoHutPct = gmvTotal > 0 ? (totalHaoHutGmv / gmvTotal * 100) : 0;
  var gmvRealPct = gmvTotal > 0 ? (gmvReal / gmvTotal * 100) : 0;

  var cpqcDecimal = cpqcPct / 100;
  var roiKV = cpqcDecimal > 0 ? (1 / cpqcDecimal) : 0;
  var roiKVP = gmvRealPct > 0 ? (roiKV / (gmvRealPct / 100)) : 0;

  var pctOf = function(v) { return gmvTotal > 0 ? (v / gmvTotal * 100).toFixed(1) : '0.0'; };

  // GMV Tổng / Hao hụt / GMV Thực
  document.getElementById('roiGmvTotal').textContent = fmt(gmvTotal) + 'đ';
  document.getElementById('roiTotalOrdersLabel').textContent = fmt(totalOrders) + ' đơn';
  document.getElementById('roiHaoHutPct').textContent = haoHutPct.toFixed(1) + '%';
  document.getElementById('roiHaoHutGmv').textContent = '-' + fmt(totalHaoHutGmv) + 'đ';
  document.getElementById('roiGmvReal').textContent = fmt(gmvReal) + 'đ';
  document.getElementById('roiSuccessOrdersLabel').textContent = fmt(totalOrders - totalHaoHutCount) + ' đơn';

  // Progress bar
  document.getElementById('roiBarReal').style.width = gmvRealPct.toFixed(1) + '%';
  document.getElementById('roiBarReal').textContent = gmvRealPct.toFixed(1) + '%';
  document.getElementById('roiBarHaoHut').style.width = haoHutPct.toFixed(1) + '%';
  document.getElementById('roiBarHaoHut').textContent = haoHutPct.toFixed(1) + '%';

  // 4 loại hao hụt
  document.getElementById('roiCancelGmv').textContent = fmt(cancelGmv) + 'đ';
  document.getElementById('roiCancelInfo').textContent = fmt(cancelCount) + ' đơn · ' + pctOf(cancelGmv) + '% GMV tổng';
  document.getElementById('roiDeliveryFailGmv').textContent = fmt(deliveryFailGmv) + 'đ';
  document.getElementById('roiDeliveryFailInfo').textContent = fmt(deliveryFailCount) + ' đơn · ' + pctOf(deliveryFailGmv) + '% GMV tổng';
  document.getElementById('roiReturnDoneGmv').textContent = fmt(returnDoneGmv) + 'đ';
  document.getElementById('roiReturnDoneInfo').textContent = fmt(returnDoneCount) + ' đơn · ' + pctOf(returnDoneGmv) + '% GMV tổng';
  document.getElementById('roiReturnProcessGmv').textContent = fmt(returnProcessGmv) + 'đ';
  document.getElementById('roiReturnProcessInfo').textContent = fmt(returnProcessCount) + ' đơn · ' + pctOf(returnProcessGmv) + '% GMV tổng';

  // ROI KV
  document.getElementById('roiKV').textContent = roiKV.toFixed(2);
  document.getElementById('roiKVFormula').textContent = '= 100 ÷ ' + cpqcPct + '%';
  document.getElementById('roiKVPrime').textContent = roiKVP.toFixed(2);
  document.getElementById('roiKVPrimeFormula').textContent = '= ' + roiKV.toFixed(2) + ' ÷ ' + gmvRealPct.toFixed(1) + '% (tỷ lệ GMV thực)';

  // Conclusion
  var realCpqc = roiKVP > 0 ? (100 / roiKVP).toFixed(2) : '0';
  document.getElementById('roiConclusion').innerHTML =
    'Trong kỳ này <b>' + haoHutPct.toFixed(1) + '%</b> GMV bị mất do huỷ / giao hỏng / hoàn tiền.<br>' +
    'Muốn thực nhận ROI <b>' + roiKV.toFixed(2) + '</b> trên doanh thu thu thật, quảng cáo phải chạy ra ROI tối thiểu <b>' + roiKVP.toFixed(2) + '</b> trên GMV gộp.<br>' +
    'Nói cách khác: % chi phí quảng cáo thật đang là <b>' + realCpqc + '%</b> chứ không phải ' + cpqcPct + '%.<br>' +
    (returnProcessCount > 0 ? '<span style="color:#b45309;">Lưu ý: còn ' + fmt(returnProcessCount) + ' yêu cầu trả hàng đang xử lý (' + fmt(returnProcessGmv) + 'đ) phát sinh trong kỳ nhưng chưa hoàn tiền xong.</span>' : '');

  // Status table
  var stEntries = Object.entries(statusMap).sort(function(a, b) { return b[1].gmv - a[1].gmv; });
  document.getElementById('roiStatusBody').innerHTML = stEntries.map(function(e) {
    var pctOrder = totalOrders > 0 ? (e[1].count / totalOrders * 100).toFixed(1) + '%' : '0%';
    var pctGmv = gmvTotal > 0 ? (e[1].gmv / gmvTotal * 100).toFixed(1) + '%' : '0%';
    var color = (e[0] === 'Đã hủy' || e[0] === 'Cancelled') ? ' class="text-red"' : '';
    return '<tr><td' + color + '>' + esc(e[0]) + '</td><td class="text-right">' + fmt(e[1].count) + '</td><td class="text-right">' + pctOrder + '</td><td class="text-right">' + fmt(e[1].gmv) + 'đ</td><td class="text-right">' + pctGmv + '</td></tr>';
  }).join('') + '<tr style="font-weight:700;background:var(--blue-bg)"><td>Tổng</td><td class="text-right">' + fmt(totalOrders) + '</td><td class="text-right">100%</td><td class="text-right">' + fmt(gmvTotal) + 'đ</td><td class="text-right">100%</td></tr>';

  // Cancel reasons table
  var totalCancelAll = cancelCount + deliveryFailCount + returnDoneCount + returnProcessCount;
  var crEntries = Object.entries(cancelReasons).sort(function(a, b) { return b[1] - a[1]; });
  document.getElementById('roiCancelReasonsBody').innerHTML = crEntries.map(function(e) {
    var pct = totalCancelAll > 0 ? (e[1] / totalCancelAll * 100).toFixed(1) + '%' : '0%';
    return '<tr><td style="white-space:normal">' + esc(e[0]) + '</td><td class="text-right">' + fmt(e[1]) + '</td><td class="text-right">' + pct + '</td></tr>';
  }).join('') + '<tr style="font-weight:700;background:var(--blue-bg)"><td>Tổng</td><td class="text-right">' + fmt(totalCancelAll) + '</td><td class="text-right">100%</td></tr>';

  document.getElementById('roiHuyDashboard').style.display = '';

  window._roiHuyData = {
    totalOrders: totalOrders, gmvTotal: gmvTotal, gmvReal: gmvReal,
    cancelCount: cancelCount, cancelGmv: cancelGmv,
    deliveryFailCount: deliveryFailCount, deliveryFailGmv: deliveryFailGmv,
    returnDoneCount: returnDoneCount, returnDoneGmv: returnDoneGmv,
    returnProcessCount: returnProcessCount, returnProcessGmv: returnProcessGmv,
    haoHutPct: haoHutPct, shippingOrders: shippingOrders,
    cpqcPct: cpqcPct, roiKV: roiKV, roiKVP: roiKVP,
    statusMap: statusMap, cancelReasons: cancelReasons
  };
}

// ========== TÍNH ROI HOÀN HUỶ — SHOPEE ==========
// Cùng cách tính với bên TikTok, chỉ khác tên cột trong file Shopee.

async function processSpRoiHuy() {
  var inp = document.getElementById('spFileRoiHuy');
  var files = inp && inp.files ? Array.from(inp.files) : [];
  if (!files.length) { alert('Vui lòng chọn file "Tất cả đơn hàng" Shopee!'); return; }
  var cpqc = parseFloat(String(document.getElementById('spInputCPQC').value).replace(',', '.'));
  if (!cpqc || cpqc <= 0) { alert('Vui lòng nhập % chi phí quảng cáo hợp lệ!'); return; }

  showLoading('📉 Đang tính ROI Hoàn Huỷ Shopee...', 'Đang đọc ' + files.length + ' file');
  try {
    await new Promise(function (r) { setTimeout(r, 100); });
    var rows = [];
    for (var i = 0; i < files.length; i++) {
      var d = await parseXlsx(files[i]);
      rows = rows.concat(d.rows);
    }
    var hint = document.getElementById('spHintRoiHuy');
    hint.textContent = '✅ ' + files.length + ' file — ' + fmt(rows.length) + ' dòng';
    hint.className = 'file-hint loaded';
    renderSpRoiHuy(rows, cpqc);
    hideLoading();
  } catch (err) {
    hideLoading();
    alert('Lỗi: ' + err.message);
    console.error(err);
  }
}

function renderSpRoiHuy(rows, cpqcPct) {
  var keys = Object.keys(rows[0] || {});
  var fk = function (s) { return keys.find(function (k) { return k && k.indexOf(s) >= 0; }) || ''; };
  var C = {
    id: fk('Mã đơn hàng'),
    status: fk('Trạng Thái Đơn Hàng') || fk('Trạng thái đơn hàng'),
    amount: fk('Tổng giá trị đơn hàng'),
    reason: fk('Lý do hủy'),
    retStatus: fk('Trả hàng/Hoàn tiền') || fk('Trạng thái Trả hàng'),
    retQty: fk('Số lượng sản phẩm được hoàn trả')
  };

  // Gộp dòng SKU thành đơn. Trường mô tả có thể chỉ điền ở một dòng -> lấy dòng nào có giá trị.
  var om = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var oid = String(r[C.id] == null ? '' : r[C.id]).trim();
    if (!oid) continue;
    if (!om[oid]) om[oid] = { status: '', amount: 0, reason: '', retStatus: '', retQty: 0 };
    var o = om[oid];
    if (!o.status) o.status = String(r[C.status] || '').trim();
    if (!o.reason) o.reason = String(r[C.reason] || '').trim();
    if (!o.retStatus) o.retStatus = String(r[C.retStatus] || '').trim();
    var a = spNum(r[C.amount]);           // Shopee ghi "118897.00" -> dùng spNum
    if (a > o.amount) o.amount = a;       // giá trị lặp trên mọi dòng SKU, không cộng dồn
    o.retQty += spNum(r[C.retQty]);
  }
  var list = Object.keys(om).map(function (k) { return om[k]; });
  if (!list.length) { alert('Không đọc được đơn hàng nào trong file!'); return; }

  var totalOrders = 0, gmvTotal = 0;
  var cancelCount = 0, cancelGmv = 0;
  var deliveryFailCount = 0, deliveryFailGmv = 0;
  var returnDoneCount = 0, returnDoneGmv = 0;
  var returnProcessCount = 0, returnProcessGmv = 0;
  var shippingOrders = 0;
  var statusMap = {}, cancelReasons = {};

  for (var j = 0; j < list.length; j++) {
    var o = list[j];
    totalOrders++;
    gmvTotal += o.amount;

    var st = o.status || 'Không rõ';
    if (!statusMap[st]) statusMap[st] = { count: 0, gmv: 0 };
    statusMap[st].count++;
    statusMap[st].gmv += o.amount;
    if (/đang giao|vận chuyển|shipping/i.test(st)) shippingOrders++;

    var isCancel = /hủy|huỷ|cancel/i.test(st);
    var hasReturn = !!o.retStatus || o.retQty > 0;

    if (hasReturn && !isCancel) {
      // Đã chấp thuận / hoàn tất -> coi như đã hoàn tiền; còn lại là đang xử lý
      if (/chấp thuận|hoàn tất|hoàn thành|completed|approved|refunded/i.test(o.retStatus)) {
        returnDoneCount++; returnDoneGmv += o.amount;
      } else {
        returnProcessCount++; returnProcessGmv += o.amount;
      }
      var rr = o.retStatus ? ('Trả hàng — ' + o.retStatus) : 'Trả hàng / Hoàn tiền';
      cancelReasons[rr] = (cancelReasons[rr] || 0) + 1;
    } else if (isCancel) {
      var pr = spSplitCancel(o.reason);
      var why = spNormReason(pr.why);
      cancelReasons[why] = (cancelReasons[why] || 0) + 1;
      if (/giao hàng thất bại|giao thất bại|delivery fail|thất lạc/i.test(why)) {
        deliveryFailCount++; deliveryFailGmv += o.amount;
      } else {
        cancelCount++; cancelGmv += o.amount;
      }
    }
  }

  var totalHaoHutGmv = cancelGmv + deliveryFailGmv + returnDoneGmv + returnProcessGmv;
  var totalHaoHutCount = cancelCount + deliveryFailCount + returnDoneCount + returnProcessCount;
  var gmvReal = gmvTotal - totalHaoHutGmv;
  var haoHutPct = gmvTotal > 0 ? (totalHaoHutGmv / gmvTotal * 100) : 0;
  var gmvRealPct = gmvTotal > 0 ? (gmvReal / gmvTotal * 100) : 0;

  var roiKV = cpqcPct > 0 ? (100 / cpqcPct) : 0;
  var roiKVP = gmvRealPct > 0 ? (roiKV / (gmvRealPct / 100)) : 0;
  var pctOf = function (v) { return gmvTotal > 0 ? (v / gmvTotal * 100).toFixed(1) : '0.0'; };
  var S = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };

  S('spRoiGmvTotal', fmt(gmvTotal) + 'đ');
  S('spRoiTotalOrdersLabel', fmt(totalOrders) + ' đơn');
  S('spRoiHaoHutPct', haoHutPct.toFixed(1) + '%');
  S('spRoiHaoHutGmv', '-' + fmt(totalHaoHutGmv) + 'đ');
  S('spRoiGmvReal', fmt(gmvReal) + 'đ');
  S('spRoiSuccessOrdersLabel', fmt(totalOrders - totalHaoHutCount) + ' đơn');

  var br = document.getElementById('spRoiBarReal');
  if (br) { br.style.width = gmvRealPct.toFixed(1) + '%'; br.textContent = gmvRealPct.toFixed(1) + '%'; }
  var bh = document.getElementById('spRoiBarHaoHut');
  if (bh) { bh.style.width = haoHutPct.toFixed(1) + '%'; bh.textContent = haoHutPct.toFixed(1) + '%'; }

  S('spRoiCancelGmv', fmt(cancelGmv) + 'đ');
  S('spRoiCancelInfo', fmt(cancelCount) + ' đơn · ' + pctOf(cancelGmv) + '% GMV tổng');
  S('spRoiDeliveryFailGmv', fmt(deliveryFailGmv) + 'đ');
  S('spRoiDeliveryFailInfo', fmt(deliveryFailCount) + ' đơn · ' + pctOf(deliveryFailGmv) + '% GMV tổng');
  S('spRoiReturnDoneGmv', fmt(returnDoneGmv) + 'đ');
  S('spRoiReturnDoneInfo', fmt(returnDoneCount) + ' đơn · ' + pctOf(returnDoneGmv) + '% GMV tổng');
  S('spRoiReturnProcessGmv', fmt(returnProcessGmv) + 'đ');
  S('spRoiReturnProcessInfo', fmt(returnProcessCount) + ' đơn · ' + pctOf(returnProcessGmv) + '% GMV tổng');

  S('spRoiKV', roiKV.toFixed(2));
  S('spRoiKVFormula', '= 100 ÷ ' + cpqcPct + '%');
  S('spRoiKVPrime', roiKVP.toFixed(2));
  S('spRoiKVPrimeFormula', '= ' + roiKV.toFixed(2) + ' ÷ ' + gmvRealPct.toFixed(1) + '% (tỷ lệ GMV thực)');

  var realCpqc = roiKVP > 0 ? (100 / roiKVP).toFixed(2) : '0';
  var cc = document.getElementById('spRoiConclusion');
  if (cc) cc.innerHTML =
    'Trong kỳ này <b>' + haoHutPct.toFixed(1) + '%</b> GMV bị mất do huỷ / giao hỏng / hoàn tiền.<br>' +
    'Muốn thực nhận ROI <b>' + roiKV.toFixed(2) + '</b> trên doanh thu thu thật, quảng cáo phải chạy ra ROI tối thiểu <b>' + roiKVP.toFixed(2) + '</b> trên GMV gộp.<br>' +
    'Nói cách khác: % chi phí quảng cáo thật đang là <b>' + realCpqc + '%</b> chứ không phải ' + cpqcPct + '%.<br>' +
    (returnProcessCount > 0 ? '<span style="color:#b45309;">Lưu ý: còn ' + fmt(returnProcessCount) + ' yêu cầu trả hàng đang xử lý (' + fmt(returnProcessGmv) + 'đ) chưa hoàn tiền xong.</span>' : '');

  var stEntries = Object.keys(statusMap).map(function (k) { return [k, statusMap[k]]; })
    .sort(function (a, b) { return b[1].gmv - a[1].gmv; });
  var sb = document.getElementById('spRoiStatusBody');
  if (sb) sb.innerHTML = stEntries.map(function (e) {
    var po = totalOrders > 0 ? (e[1].count / totalOrders * 100).toFixed(1) + '%' : '0%';
    var pg = gmvTotal > 0 ? (e[1].gmv / gmvTotal * 100).toFixed(1) + '%' : '0%';
    var col = /hủy|huỷ|cancel/i.test(e[0]) ? ' class="text-red"' : '';
    return '<tr><td' + col + '>' + esc(e[0]) + '</td><td class="text-right">' + fmt(e[1].count) + '</td><td class="text-right">' + po + '</td><td class="text-right">' + fmt(e[1].gmv) + 'đ</td><td class="text-right">' + pg + '</td></tr>';
  }).join('') + '<tr style="font-weight:700;background:var(--blue-bg)"><td>Tổng</td><td class="text-right">' + fmt(totalOrders) + '</td><td class="text-right">100%</td><td class="text-right">' + fmt(gmvTotal) + 'đ</td><td class="text-right">100%</td></tr>';

  var crEntries = Object.keys(cancelReasons).map(function (k) { return [k, cancelReasons[k]]; })
    .sort(function (a, b) { return b[1] - a[1]; });
  var cb = document.getElementById('spRoiCancelReasonsBody');
  if (cb) cb.innerHTML = crEntries.map(function (e) {
    var pc = totalHaoHutCount > 0 ? (e[1] / totalHaoHutCount * 100).toFixed(1) + '%' : '0%';
    return '<tr><td style="white-space:normal">' + esc(e[0]) + '</td><td class="text-right">' + fmt(e[1]) + '</td><td class="text-right">' + pc + '</td></tr>';
  }).join('') + '<tr style="font-weight:700;background:var(--blue-bg)"><td>Tổng</td><td class="text-right">' + fmt(totalHaoHutCount) + '</td><td class="text-right">100%</td></tr>';

  document.getElementById('spRoiHuyDashboard').style.display = '';

  window._spRoiHuyData = {
    totalOrders: totalOrders, gmvTotal: gmvTotal, gmvReal: gmvReal,
    cancelCount: cancelCount, cancelGmv: cancelGmv,
    deliveryFailCount: deliveryFailCount, deliveryFailGmv: deliveryFailGmv,
    returnDoneCount: returnDoneCount, returnDoneGmv: returnDoneGmv,
    returnProcessCount: returnProcessCount, returnProcessGmv: returnProcessGmv,
    haoHutPct: haoHutPct, shippingOrders: shippingOrders,
    cpqcPct: cpqcPct, roiKV: roiKV, roiKVP: roiKVP,
    statusMap: statusMap, cancelReasons: cancelReasons
  };
}

function clearSpRoiHuy() {
  document.getElementById('spRoiHuyDashboard').style.display = 'none';
  document.getElementById('spFileRoiHuy').value = '';
  var h = document.getElementById('spHintRoiHuy');
  h.textContent = 'Chưa chọn file';
  h.className = 'file-hint';
  window._spRoiHuyData = null;
}

function exportSpRoiHuy() {
  var d = window._spRoiHuyData;
  if (!d) { alert('Chưa có dữ liệu! Hãy phân tích trước.'); return; }
  var wb = XLSX.utils.book_new();
  var haoHut = d.cancelCount + d.deliveryFailCount + d.returnDoneCount + d.returnProcessCount;

  var s1 = [
    ['TÍNH ROI HOÀN HUỶ — SHOPEE — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['Chỉ số', 'Giá trị'],
    ['Tổng đơn hàng', d.totalOrders],
    ['GMV Tổng', d.gmvTotal],
    ['Tỉ lệ hao hụt', d.haoHutPct.toFixed(1) + '%'],
    ['GMV Thực', d.gmvReal],
    [],
    ['Loại hao hụt', 'Số đơn', 'GMV', 'Tỉ lệ / hao hụt'],
    ['Đơn huỷ', d.cancelCount, d.cancelGmv, haoHut ? (d.cancelCount / haoHut * 100).toFixed(1) + '%' : '0%'],
    ['Giao hàng thất bại', d.deliveryFailCount, d.deliveryFailGmv, haoHut ? (d.deliveryFailCount / haoHut * 100).toFixed(1) + '%' : '0%'],
    ['Trả hàng đã hoàn tiền', d.returnDoneCount, d.returnDoneGmv, haoHut ? (d.returnDoneCount / haoHut * 100).toFixed(1) + '%' : '0%'],
    ['Trả hàng đang xử lý', d.returnProcessCount, d.returnProcessGmv, haoHut ? (d.returnProcessCount / haoHut * 100).toFixed(1) + '%' : '0%'],
    ['TỔNG HAO HỤT', haoHut, d.gmvTotal - d.gmvReal, '100%'],
    [],
    ['% Chi phí quảng cáo nhập', d.cpqcPct + '%'],
    ['ROI kỳ vọng (KV)', d.roiKV.toFixed(2)],
    ["ROI cần đạt trên GMV gộp (KV')", d.roiKVP.toFixed(2)],
  ];
  var ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

  var s2 = [['Trạng thái đơn', 'Số đơn', '% đơn', 'GMV', '% GMV']];
  Object.keys(d.statusMap).sort(function (a, b) { return d.statusMap[b].gmv - d.statusMap[a].gmv; }).forEach(function (k) {
    var v = d.statusMap[k];
    s2.push([k, v.count, (v.count / d.totalOrders * 100).toFixed(1) + '%', v.gmv, (v.gmv / d.gmvTotal * 100).toFixed(1) + '%']);
  });
  var ws2 = XLSX.utils.aoa_to_sheet(s2);
  ws2['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Trạng thái');

  var s3 = [['Lý do huỷ / hoàn', 'Số đơn', 'Tỉ lệ']];
  Object.keys(d.cancelReasons).sort(function (a, b) { return d.cancelReasons[b] - d.cancelReasons[a]; }).forEach(function (k) {
    s3.push([k, d.cancelReasons[k], haoHut ? (d.cancelReasons[k] / haoHut * 100).toFixed(1) + '%' : '0%']);
  });
  var ws3 = XLSX.utils.aoa_to_sheet(s3);
  ws3['!cols'] = [{ wch: 56 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Lý do huỷ');

  XLSX.writeFile(wb, 'ROI_Hoan_Huy_Shopee_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function clearRoiHuy() {
  document.getElementById('roiHuyDashboard').style.display = 'none';
  document.getElementById('fileRoiHuy').value = '';
  document.getElementById('hintRoiHuy').textContent = 'Chưa chọn file';
  document.getElementById('hintRoiHuy').className = 'file-hint';
}

function exportRoiHuy() {
  var d = window._roiHuyData;
  if (!d) { alert('Chưa có dữ liệu! Hãy phân tích trước.'); return; }
  var wb = XLSX.utils.book_new();
  var totalHaoHut = d.cancelCount + d.deliveryFailCount + d.returnDoneCount + d.returnProcessCount;

  var s1 = [
    ['TÍNH ROI HOÀN HUỶ — DUNG PHÁT'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['--- GMV THEO NHÓM ---'],
    ['GMV Tổng', d.gmvTotal],
    ['Hao hụt (%)', d.haoHutPct.toFixed(1) + '%'],
    ['GMV Thực', d.gmvReal],
    [],
    ['--- CHI TIẾT HAO HỤT ---'],
    ['Loại', 'Số đơn', 'GMV', '% GMV tổng'],
    ['Đơn huỷ', d.cancelCount, d.cancelGmv, (d.gmvTotal > 0 ? (d.cancelGmv / d.gmvTotal * 100).toFixed(1) : '0') + '%'],
    ['Giao không thành công', d.deliveryFailCount, d.deliveryFailGmv, (d.gmvTotal > 0 ? (d.deliveryFailGmv / d.gmvTotal * 100).toFixed(1) : '0') + '%'],
    ['Trả hàng hoàn tiền', d.returnDoneCount, d.returnDoneGmv, (d.gmvTotal > 0 ? (d.returnDoneGmv / d.gmvTotal * 100).toFixed(1) : '0') + '%'],
    ['Trả hàng đang xử lý', d.returnProcessCount, d.returnProcessGmv, (d.gmvTotal > 0 ? (d.returnProcessGmv / d.gmvTotal * 100).toFixed(1) : '0') + '%'],
    [],
    ['--- ROI KỲ VỌNG ---'],
    ['% CPQC', d.cpqcPct + '%'],
    ['ROI KV (chưa tính hoàn huỷ)', d.roiKV.toFixed(2)],
    ['ROI KV\' (đã tính hoàn huỷ)', d.roiKVP.toFixed(2)]
  ];
  var ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan ROI');

  var s2 = [['Trạng thái', 'Số đơn', 'Tỉ lệ đơn', 'GMV', 'Tỉ lệ GMV']];
  Object.entries(d.statusMap).sort(function(a, b) { return b[1].gmv - a[1].gmv; }).forEach(function(e) {
    s2.push([e[0], e[1].count, (e[1].count / d.totalOrders * 100).toFixed(1) + '%', e[1].gmv, (e[1].gmv / d.gmvTotal * 100).toFixed(1) + '%']);
  });
  var ws2 = XLSX.utils.aoa_to_sheet(s2);
  ws2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Trạng thái');

  var s3 = [['Lý do huỷ/hoàn', 'Số đơn', 'Tỉ lệ']];
  Object.entries(d.cancelReasons).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(e) {
    s3.push([e[0], e[1], (totalHaoHut > 0 ? (e[1] / totalHaoHut * 100).toFixed(1) : '0') + '%']);
  });
  var ws3 = XLSX.utils.aoa_to_sheet(s3);
  ws3['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Lý do huỷ');

  XLSX.writeFile(wb, 'ROI_Hoan_Huy_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

// ========== KHUNG GIỜ VÀNG ==========
async function processKhungGio() {
  var files = [];
  for (var fi = 1; fi <= 3; fi++) {
    var inp = document.getElementById('fileKG' + fi);
    if (inp && inp.files[0]) files.push(inp.files[0]);
  }
  if (files.length === 0) { alert('Vui lòng chọn ít nhất 1 file đơn hàng!'); return; }

  showLoading('🕐 Đang phân tích Khung Giờ Vàng...', 'Đang đọc ' + files.length + ' file');
  try {
    await new Promise(function(r) { setTimeout(r, 100); });
    var allMonths = [];
    for (var i = 0; i < files.length; i++) {
      var data = await parseXlsx(files[i]);
      var monthLabel = detectMonth(data.rows);
      allMonths.push({ label: monthLabel, rows: data.rows });
      document.getElementById('hintKG' + (i + 1)).textContent = '✅ ' + files[i].name + ' — ' + data.rows.length + ' dòng (' + monthLabel + ')';
      document.getElementById('hintKG' + (i + 1)).className = 'file-hint loaded';
    }
    renderKhungGio(allMonths);
    hideLoading();
  } catch (err) {
    hideLoading();
    alert('Lỗi: ' + err.message);
    console.error(err);
  }
}

function detectMonth(rows) {
  for (var i = 0; i < rows.length; i++) {
    var t = String(rows[i]['Created Time'] || '');
    var m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m && m[0] !== 'Created Time') {
      var monthNum = parseInt(m[2]);
      var year = m[3];
      if (monthNum >= 1 && monthNum <= 12) return 'Tháng ' + monthNum + '/' + year;
    }
  }
  return 'Không rõ';
}

function isSaleDay(day, month) {
  if (day === month - 1 || day === month || day === month + 1) return true;
  if (day >= 13 && day <= 15) return true;
  if (day === 24 || day === 25) return true;
  return false;
}

// Shopee chỉ có 3 ngày sale: ngày đôi (8/8) - giữa tháng 15 - cuối tháng 25.
// Khác TikTok (TikTok còn tính +-1 ngày quanh ngày đôi, cả cụm 13-14-15 và 24-25).
function isSaleDaySp(day, month) {
  return day === month || day === 15 || day === 25;
}

function kgHH(h) {
  var x = h % 24;
  return (x < 10 ? '0' : '') + x + ':00';
}

function kgBuildDataset(orders, monthNames) {
  var hourData = {}, ordersByHour = {};
  for (var h = 0; h < 24; h++) { hourData[h] = {}; ordersByHour[h] = 0; }
  var totalOrders = 0, totalGmv = 0, dayKeys = {}, datesByMonth = {};
  for (var i = 0; i < orders.length; i++) {
    var o = orders[i];
    if (!hourData[o.hour][o.month]) hourData[o.hour][o.month] = 0;
    hourData[o.hour][o.month] += o.amount;
    ordersByHour[o.hour]++;
    totalOrders++;
    totalGmv += o.amount;
    dayKeys[o.month + '|' + o.day] = true;
    if (!datesByMonth[o.month]) datesByMonth[o.month] = {};
    datesByMonth[o.month][o.day] = true;
  }
  var hourTotals = [];
  for (var h = 0; h < 24; h++) {
    var sum = 0;
    for (var mi = 0; mi < monthNames.length; mi++) sum += hourData[h][monthNames[mi]] || 0;
    hourTotals.push({ hour: h, total: sum, pct: totalGmv > 0 ? (sum / totalGmv * 100) : 0, orders: ordersByHour[h] });
  }
  return {
    monthNames: monthNames, hourData: hourData, hourTotals: hourTotals,
    totalGmv: totalGmv, totalOrders: totalOrders,
    dayCount: Object.keys(dayKeys).length, datesByMonth: datesByMonth
  };
}

// Tìm 3 khung giờ liền mạch, không chồng lấn, cộng lại >= 80% doanh thu, ít giờ nhất
function kgFindTop3(hourTotals, totalGmv) {
  var pG = [0], pO = [0];
  for (var h = 0; h < 24; h++) {
    pG.push(pG[h] + hourTotals[h].total);
    pO.push(pO[h] + hourTotals[h].orders);
  }
  var best = null, bestH = 999, bestG = 0;
  for (var s1 = 0; s1 < 22; s1++) {
    for (var e1 = s1 + 1; e1 <= Math.min(s1 + 10, 22); e1++) {
      var g1 = pG[e1] - pG[s1];
      for (var s2 = e1; s2 < 23; s2++) {
        for (var e2 = s2 + 1; e2 <= Math.min(s2 + 10, 23); e2++) {
          var g12 = g1 + pG[e2] - pG[s2];
          for (var s3 = e2; s3 < 24; s3++) {
            for (var e3 = s3 + 1; e3 <= Math.min(s3 + 10, 24); e3++) {
              var gT = g12 + pG[e3] - pG[s3];
              if (totalGmv <= 0 || (gT / totalGmv * 100) < 80) continue;
              var th = (e1 - s1) + (e2 - s2) + (e3 - s3);
              if (!best || th < bestH || (th === bestH && gT > bestG)) {
                best = [[s1, e1], [s2, e2], [s3, e3]]; bestH = th; bestG = gT;
              }
            }
          }
        }
      }
    }
  }
  var ranges = [];
  if (best) {
    for (var ci = 0; ci < 3; ci++) {
      var s = best[ci][0], e = best[ci][1];
      var g = pG[e] - pG[s];
      ranges.push({ start: s, end: e, len: e - s, gmv: g, orders: pO[e] - pO[s], pct: totalGmv > 0 ? (g / totalGmv * 100) : 0 });
    }
    ranges.sort(function(a, b) { return b.gmv - a.gmv; });
  }
  var sumGmv = 0, sumOrd = 0, sumLen = 0;
  for (var i = 0; i < ranges.length; i++) { sumGmv += ranges[i].gmv; sumOrd += ranges[i].orders; sumLen += ranges[i].len; }
  return {
    ranges: ranges, hours: sumLen, gmv: sumGmv, orders: sumOrd,
    pct: totalGmv > 0 ? (sumGmv / totalGmv * 100) : 0
  };
}

// Kỳ tới = tháng liền sau tháng mới nhất trong dữ liệu
function kgNextPeriod(monthNames, saleFn) {
  var sf = saleFn || isSaleDay;
  var mo = null, yr = null;
  for (var i = 0; i < monthNames.length; i++) {
    var m = String(monthNames[i]).match(/Tháng (\d+)\/(\d+)/);
    if (!m) continue;
    var mm = parseInt(m[1]), yy = parseInt(m[2]);
    if (yr === null || yy > yr || (yy === yr && mm > mo)) { mo = mm; yr = yy; }
  }
  if (mo === null) return null;
  mo++; if (mo > 12) { mo = 1; yr++; }
  var dim = new Date(yr, mo, 0).getDate();
  var sale = 0;
  for (var dd = 1; dd <= dim; dd++) if (sf(dd, mo)) sale++;
  return { month: mo, year: yr, label: 'tháng ' + mo + '/' + yr, daysInMonth: dim, saleDays: sale, normalDays: dim - sale };
}

function kgBudgetBlockHtml(d, t, cfg) {
  if (t.ranges.length !== 3) return '';
  var months = d.monthNames.length || 1;
  var np = kgNextPeriod(d.monthNames, cfg.saleFn);
  var isSale = !!cfg.isSale;   // key khac nhau giua 2 san (sale / spsale) nen dung co isSale cho chac
  var nextDays = np ? (isSale ? np.saleDays : np.normalDays) : d.dayCount;

  var rows = [];
  for (var i = 0; i < 3; i++) {
    var r = t.ranges[i];
    rows.push({
      label: '#' + (i + 1) + ' ' + kgHH(r.start).slice(0, 2) + 'h – ' + kgHH(r.end).slice(0, 2) + 'h',
      gold: true, gmvAvg: r.gmv / months, pct: r.pct
    });
  }
  rows.push({
    label: 'Còn lại (' + (24 - t.hours) + ' giờ)', gold: false,
    gmvAvg: (d.totalGmv - t.gmv) / months, pct: 100 - t.pct
  });

  if (!window._kgBudget) window._kgBudget = {};
  window._kgBudget[cfg.key] = {
    rows: rows, months: months, totalGmvAvg: d.totalGmv / months,
    nextDays: nextDays, nextLabel: np ? np.label : 'kỳ tới',
    kindLabel: isSale ? 'ngày sale' : 'ngày thường',
    curDays: d.dayCount, accent: cfg.headColor
  };

  var k = cfg.key;
  var inpS = 'padding:8px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:0.92em;font-weight:600;';
  var labS = 'display:block;font-size:0.74em;font-weight:700;color:#475569;margin-bottom:4px;';

  var h = '<div style="margin-top:18px;border:1.5px solid #e2e8f0;border-radius:10px;padding:16px 18px;background:#fcfcfd;">';
  h += '<div style="font-weight:800;font-size:0.95em;color:#1e293b;margin-bottom:14px;">🏅 Ngân sách theo khung giờ vàng</div>';
  h += '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px;">';
  h += '<div><label style="' + labS + '">GMV kỳ vọng ' + esc(np ? np.label : 'kỳ tới') + '</label><input type="text" inputmode="numeric" id="kgbGmv_' + k + '" style="' + inpS + 'width:170px;color:#b45309;" oninput="fmtMoneyInput(this);kgRecalcBudget(\'' + k + '\')"></div>';
  h += '<div><label style="' + labS + '">Chi phí ads cả kỳ <span style="color:#94a3b8;font-weight:500;">(số thật)</span></label><input type="text" inputmode="numeric" id="kgbAds_' + k + '" placeholder="Nhập số tiền" style="' + inpS + 'width:170px;color:#dc2626;" oninput="fmtMoneyInput(this);kgRecalcBudget(\'' + k + '\')"></div>';
  h += '<div><label style="' + labS + '">ROI cũ <span style="color:#94a3b8;font-weight:500;">(số thật)</span></label><input type="text" id="kgbRoiOld_' + k + '" readonly style="' + inpS + 'width:100px;background:#f1f5f9;color:#475569;text-align:center;"></div>';
  h += '<div><label style="' + labS + '">ROI mới <span style="color:#94a3b8;font-weight:500;">(mục tiêu)</span></label><input type="text" id="kgbRoiNew_' + k + '" style="' + inpS + 'width:100px;text-align:center;color:#dc2626;" oninput="kgRecalcBudget(\'' + k + '\',true)"></div>';
  h += '<button onclick="kgResetBudget(\'' + k + '\')" style="padding:9px 14px;border:1.5px solid #cbd5e1;background:#fff;border-radius:8px;font-size:0.82em;font-weight:600;color:#475569;cursor:pointer;">↺ Đặt lại theo số thật</button>';
  h += '</div>';
  h += '<div id="kgbTable_' + k + '"></div>';
  h += '<div id="kgbNote_' + k + '" style="margin-top:10px;font-size:0.78em;color:#64748b;line-height:1.85;"></div>';
  h += '</div>';
  return h;
}

// ROI là số nhỏ có phần thập phân: chấp nhận cả "9,79" (VN) lẫn "9.79"
function kgRoiVal(id) {
  var el = document.getElementById(id);
  if (!el) return 0;
  var s = String(el.value).trim();
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(s) || 0;
}

function kgRoiTxt(v) {
  return v.toFixed(2).replace('.', ',');
}

function kgRecalcBudget(k, roiTouched) {
  var c = window._kgBudget && window._kgBudget[k];
  if (!c) return;
  var elAds = document.getElementById('kgbAds_' + k);
  var elGmv = document.getElementById('kgbGmv_' + k);
  var elOld = document.getElementById('kgbRoiOld_' + k);
  var elNew = document.getElementById('kgbRoiNew_' + k);
  if (!elAds || !elGmv || !elOld || !elNew) return;

  if (roiTouched) elNew.setAttribute('data-touched', '1');
  if (!elGmv.value) elGmv.value = Math.round(c.totalGmvAvg).toLocaleString('vi-VN');

  var adsTotal = getMoneyVal('kgbAds_' + k);
  var adsAvg = adsTotal / c.months;
  var roiOld = adsAvg > 0 ? (c.totalGmvAvg / adsAvg) : 0;
  elOld.value = roiOld > 0 ? kgRoiTxt(roiOld) : '—';
  if (elNew.getAttribute('data-touched') !== '1') elNew.value = roiOld > 0 ? kgRoiTxt(roiOld) : '';

  var roiNew = kgRoiVal('kgbRoiNew_' + k);
  var gmvExp = getMoneyVal('kgbGmv_' + k);
  var budgetTotal = roiNew > 0 ? (gmvExp / roiNew) : 0;
  var dash = '<span style="color:#cbd5e1;">—</span>';

  var thS = 'background:#1e3a5f;color:#fff;font-weight:700;padding:8px 10px;font-size:0.8em;';
  var html = '<div class="table-wrapper"><table style="width:100%;border-collapse:collapse;font-size:0.82em;">';
  html += '<thead><tr>';
  html += '<th style="' + thS + 'text-align:left;">Khung giờ</th>';
  html += '<th style="' + thS + 'text-align:right;">GMV TB/tháng</th>';
  html += '<th style="' + thS + 'text-align:right;">Tỷ trọng GMV</th>';
  html += '<th style="' + thS + 'text-align:right;">Chi phí ads TB/tháng</th>';
  html += '<th style="' + thS + 'text-align:right;">Tỷ trọng ads</th>';
  html += '<th style="' + thS + 'text-align:right;">ROI ads</th>';
  html += '<th style="' + thS + 'text-align:right;">GMV kỳ vọng</th>';
  html += '<th style="' + thS + 'text-align:right;">Ngân sách</th>';
  html += '<th style="' + thS + 'text-align:right;">Chi phí ads/ngày<div style="font-weight:500;font-size:0.85em;opacity:0.8;">÷ ' + c.nextDays + ' ngày · ' + esc(c.nextLabel) + '</div></th>';
  html += '</tr></thead><tbody>';

  var sumAds = 0, sumGmvExp = 0, sumBudget = 0, sumPerDay = 0;
  for (var i = 0; i < c.rows.length; i++) {
    var r = c.rows[i];
    var rAds = adsAvg * r.pct / 100;
    var rGmvExp = gmvExp * r.pct / 100;
    var rBudget = budgetTotal * r.pct / 100;
    var rPerDay = c.nextDays > 0 ? rBudget / c.nextDays : 0;
    sumAds += rAds; sumGmvExp += rGmvExp; sumBudget += rBudget; sumPerDay += rPerDay;

    var tdS = 'padding:8px 10px;border-bottom:1px solid #f1f5f9;';
    html += '<tr style="background:' + (r.gold ? '#fffdf5' : '#fff') + ';">';
    html += '<td style="' + tdS + 'font-weight:700;color:#334155;' + (r.gold ? 'background:#fde68a;' : '') + '">' + esc(r.label) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;color:#334155;">' + fmt(r.gmvAvg) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;font-weight:700;color:#1d4ed8;">' + r.pct.toFixed(2) + '%</td>';
    html += '<td style="' + tdS + 'text-align:right;color:#334155;">' + (adsAvg > 0 ? fmt(rAds) : dash) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;color:#475569;">' + r.pct.toFixed(2) + '%</td>';
    html += '<td style="' + tdS + 'text-align:right;font-weight:700;color:#16a34a;">' + (roiOld > 0 ? kgRoiTxt(roiOld) : dash) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;color:#334155;">' + fmt(rGmvExp) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;font-weight:700;color:#dc2626;">' + (budgetTotal > 0 ? fmt(rBudget) : dash) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;font-weight:700;color:#dc2626;background:#fef2f2;">' + (budgetTotal > 0 ? fmt(rPerDay) : dash) + '</td>';
    html += '</tr>';
  }

  var tfS = 'background:#1e3a5f;color:#fff;font-weight:800;padding:8px 10px;';
  html += '<tr><td style="' + tfS + '">Tổng cộng</td>';
  html += '<td style="' + tfS + 'text-align:right;">' + fmt(c.totalGmvAvg) + '</td>';
  html += '<td style="' + tfS + 'text-align:right;">100%</td>';
  html += '<td style="' + tfS + 'text-align:right;">' + (adsAvg > 0 ? fmt(sumAds) : '—') + '</td>';
  html += '<td style="' + tfS + 'text-align:right;">100%</td>';
  html += '<td style="' + tfS + 'text-align:right;">' + (roiOld > 0 ? kgRoiTxt(roiOld) : '—') + '</td>';
  html += '<td style="' + tfS + 'text-align:right;">' + fmt(sumGmvExp) + '</td>';
  html += '<td style="' + tfS + 'text-align:right;">' + (budgetTotal > 0 ? fmt(sumBudget) : '—') + '</td>';
  html += '<td style="' + tfS + 'text-align:right;">' + (budgetTotal > 0 ? fmt(sumPerDay) : '—') + '</td>';
  html += '</tr></tbody></table></div>';
  document.getElementById('kgbTable_' + k).innerHTML = html;

  // Ghi chú
  var n = '';
  n += '<div>Chỉ tính trên <b>' + c.kindLabel + '</b> (' + c.curDays + ' ngày trong kỳ), lấy <b>trung bình 1 tháng</b> của ' + c.months + ' tháng đã chọn. Ngân sách chia theo <b>tỷ trọng GMV</b> của từng khung giờ.</div>';
  if (budgetTotal > 0) {
    n += '<div><b>Chi phí ads kỳ tới</b> = GMV kỳ vọng ÷ ROI mới = ' + fmt(gmvExp) + ' ÷ ' + kgRoiTxt(roiNew) + ' = <b style="color:#dc2626;">' + fmt(budgetTotal) + 'đ</b>.</div>';
    n += '<div><b>Chi phí ads/ngày</b> = ngân sách khung đó ÷ <b>' + c.nextDays + ' ' + c.kindLabel + '</b> của ' + esc(c.nextLabel) + '.</div>';
    if (adsAvg > 0) {
      var dG = c.totalGmvAvg > 0 ? ((gmvExp - c.totalGmvAvg) / c.totalGmvAvg * 100) : 0;
      var dA = adsAvg > 0 ? ((budgetTotal - adsAvg) / adsAvg * 100) : 0;
      var sg = function(v) { return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'; };
      var cg = function(v) { return v >= 0 ? '#16a34a' : '#dc2626'; };
      n += '<div>So với kỳ cũ: GMV <b style="color:' + cg(dG) + ';">' + sg(dG) + '</b>, ngân sách ads <b style="color:' + cg(dA) + ';">' + sg(dA) + '</b></div>';
    }
  } else {
    n += '<div style="color:#b45309;">⚠️ Nhập <b>Chi phí ads cả kỳ</b> để tool tính ROI cũ và ngân sách kỳ tới.</div>';
  }
  document.getElementById('kgbNote_' + k).innerHTML = n;
}

function kgResetBudget(k) {
  var c = window._kgBudget && window._kgBudget[k];
  if (!c) return;
  document.getElementById('kgbGmv_' + k).value = Math.round(c.totalGmvAvg).toLocaleString('vi-VN');
  var elNew = document.getElementById('kgbRoiNew_' + k);
  elNew.removeAttribute('data-touched');
  kgRecalcBudget(k);
}

function kgSectionHtml(d, cfg) {
  var t = kgFindTop3(d.hourTotals, d.totalGmv);
  var goldenSet = {};
  for (var i = 0; i < t.ranges.length; i++) {
    for (var gh = t.ranges[i].start; gh < t.ranges[i].end; gh++) goldenSet[gh] = true;
  }
  var tbPerDay = d.dayCount > 0 ? Math.round(d.totalGmv / d.dayCount) : 0;

  var html = '<div class="card" style="margin-top:18px;padding:0;overflow:hidden;border:1.5px solid ' + cfg.border + ';">';

  // Header
  html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:12px 20px;background:' + cfg.headBg + ';border-bottom:1.5px solid ' + cfg.border + ';">';
  html += '<div style="font-weight:800;font-size:0.98em;color:' + cfg.headColor + ';">' + cfg.icon + ' ' + esc(cfg.title) + (cfg.sub ? ' <span style="font-weight:500;font-size:0.85em;color:#64748b;">' + esc(cfg.sub) + '</span>' : '') + '</div>';
  html += '<div style="font-size:0.8em;font-weight:600;color:#475569;">' + d.dayCount + ' ngày &middot; ' + fmt(d.totalGmv) + 'đ &middot; TB ' + fmt(tbPerDay) + 'đ/ngày &middot; ' + fmt(d.totalOrders) + ' đơn</div>';
  html += '</div>';

  html += '<div style="padding:18px 20px;">';

  // Ghi chú
  if (cfg.note) {
    html += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.82em;color:#92400e;line-height:1.7;">' + cfg.note + '</div>';
  }

  if (t.ranges.length === 3) {
    var cardCfg = [
      { bd: '#f59e0b', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', c: '#b45309' },
      { bd: '#93c5fd', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', c: '#1d4ed8' },
      { bd: '#fdba74', bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', c: '#c2410c' }
    ];
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">';
    for (var i = 0; i < 3; i++) {
      var r = t.ranges[i], cc = cardCfg[i];
      html += '<div style="border:1.5px solid ' + cc.bd + ';border-radius:10px;padding:14px 16px;background:' + cc.bg + ';">';
      html += '<div style="font-size:0.68em;font-weight:800;letter-spacing:0.5px;color:' + cc.c + ';text-transform:uppercase;margin-bottom:6px;">🏆 KHUNG GIỜ #' + (i + 1) + '</div>';
      html += '<div style="font-size:1.15em;font-weight:800;color:#1e293b;">' + kgHH(r.start) + ' &ndash; ' + kgHH(r.end) + '</div>';
      html += '<div style="font-size:1.05em;font-weight:800;color:' + cc.c + ';margin:6px 0 4px;">' + fmt(r.gmv) + 'đ</div>';
      html += '<div style="font-size:0.76em;color:#64748b;font-weight:600;">' + r.pct.toFixed(2) + '% doanh thu &middot; ' + r.len + ' giờ &middot; ' + fmt(r.orders) + ' đơn</div>';
      html += '</div>';
    }
    html += '</div>';

    var restHours = 24 - t.hours, restPct = 100 - t.pct;
    html += '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:0.85em;color:#166534;line-height:1.8;">';
    html += '<div><b>3 khung giờ vàng cộng lại: ' + t.pct.toFixed(1) + '% doanh thu</b> &mdash; gói gọn trong <b>' + t.hours + '/24 giờ</b> mỗi ngày &middot; ' + fmt(t.gmv) + 'đ &middot; ' + fmt(t.orders) + ' đơn</div>';
    html += '<div style="color:#15803d;">' + restHours + ' giờ còn lại chỉ mang về <b>' + restPct.toFixed(1) + '%</b> doanh thu.</div>';
    html += '</div>';

    var rlist = t.ranges.map(function(rr) { return kgHH(rr.start).slice(0, 2) + 'h&ndash;' + kgHH(rr.end).slice(0, 2) + 'h'; }).join(' &middot; ');
    html += '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:0.8em;color:#854d0e;">';
    html += '<span style="display:inline-block;width:11px;height:11px;background:#fde68a;border:1px solid #eab308;border-radius:2px;vertical-align:-1px;margin-right:6px;"></span>';
    html += 'Giờ nằm trong 3 khung giờ vàng ở trên &ndash; <b>' + rlist + '</b> &ndash; tổng <b>' + t.hours + '/24 giờ</b>, gánh <b>' + t.pct.toFixed(1) + '%</b> doanh thu.';
    html += '</div>';
  } else {
    html += '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:0.85em;color:#991b1b;">Không đủ dữ liệu để tách 3 khung giờ vàng.</div>';
  }

  // Bảng chi tiết
  var maxPct = 0;
  for (var h1 = 0; h1 < 24; h1++) if (d.hourTotals[h1].pct > maxPct) maxPct = d.hourTotals[h1].pct;

  var thS = 'background:#1e3a5f;color:#fff;font-weight:700;padding:9px 12px;font-size:0.88em;border:none;';
  html += '<div class="table-wrapper"><table style="width:100%;border-collapse:collapse;font-size:0.85em;">';
  html += '<thead><tr>';
  html += '<th style="' + thS + 'text-align:left;">Giờ</th>';
  for (var m1 = 0; m1 < d.monthNames.length; m1++) html += '<th style="' + thS + 'text-align:right;">' + esc(d.monthNames[m1]) + '</th>';
  html += '<th style="' + thS + 'text-align:right;">Tổng cộng</th>';
  html += '<th style="' + thS + 'text-align:right;">Đơn</th>';
  html += '<th style="' + thS + 'text-align:right;">% Doanh thu</th>';
  html += '</tr></thead><tbody>';

  for (var h = 0; h < 24; h++) {
    var ht = d.hourTotals[h];
    var inten = maxPct > 0 ? (ht.pct / maxPct) : 0;
    var isGold = !!goldenSet[h];
    var tdS = 'padding:7px 12px;border-bottom:1px solid #f1f5f9;';
    var pctBg = inten > 0.75 ? '#bbf7d0' : (inten > 0.55 ? '#dcfce7' : (inten > 0.35 ? '#fef9c3' : (inten > 0.18 ? '#ffedd5' : '#fee2e2')));
    var pctFg = inten > 0.55 ? '#15803d' : (inten > 0.35 ? '#a16207' : (inten > 0.18 ? '#c2410c' : '#b91c1c'));

    html += '<tr style="background:' + (isGold ? '#fefce8' : '#fff') + ';">';
    html += '<td style="' + tdS + 'font-weight:700;color:#334155;' + (isGold ? 'background:#fde68a;' : '') + '">' + (h < 10 ? '0' : '') + h + '</td>';
    for (var m2 = 0; m2 < d.monthNames.length; m2++) {
      var v = d.hourData[h][d.monthNames[m2]] || 0;
      html += '<td style="' + tdS + 'text-align:right;color:#475569;">' + (v > 0 ? fmt(v) : '&mdash;') + '</td>';
    }
    html += '<td style="' + tdS + 'text-align:right;font-weight:700;color:#1e293b;">' + fmt(ht.total) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;color:#475569;">' + fmt(ht.orders) + '</td>';
    html += '<td style="' + tdS + 'text-align:right;font-weight:700;background:' + pctBg + ';color:' + pctFg + ';">' + ht.pct.toFixed(2) + '%</td>';
    html += '</tr>';
  }

  var tfS = 'background:#1e3a5f;color:#fff;font-weight:800;padding:9px 12px;';
  html += '<tr><td style="' + tfS + '">Tổng cộng</td>';
  for (var m3 = 0; m3 < d.monthNames.length; m3++) {
    var mT = 0;
    for (var h2 = 0; h2 < 24; h2++) mT += d.hourData[h2][d.monthNames[m3]] || 0;
    html += '<td style="' + tfS + 'text-align:right;">' + fmt(mT) + '</td>';
  }
  html += '<td style="' + tfS + 'text-align:right;">' + fmt(d.totalGmv) + '</td>';
  html += '<td style="' + tfS + 'text-align:right;">' + fmt(d.totalOrders) + '</td>';
  html += '<td style="' + tfS + 'text-align:right;">100%</td></tr>';
  html += '</tbody></table></div>';
  html += kgBudgetBlockHtml(d, t, cfg);
  html += '</div></div>';
  return html;
}

function renderKhungGio(allMonths) {
  var monthNames = [], allOrders = [];

  for (var mi = 0; mi < allMonths.length; mi++) {
    var mLabel = allMonths[mi].label;
    monthNames.push(mLabel);
    var rows = allMonths[mi].rows, seen = {};
    for (var ri = 0; ri < rows.length; ri++) {
      var r = rows[ri];
      var oid = String(r['Order ID'] || '').trim();
      if (!oid || oid === 'Platform unique order ID.' || seen[oid]) continue;
      seen[oid] = true;
      var time = String(r['Created Time'] || '');
      var hm = time.match(/(\d{1,2}):\d{2}:\d{2}/);
      var dm = time.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!hm || !dm) continue;
      var day = parseInt(dm[1]), mon = parseInt(dm[2]);
      allOrders.push({
        hour: parseInt(hm[1]), amount: parseFloat(r['Order Amount']) || 0,
        month: mLabel, day: day, monthNum: mon, isSale: isSaleDay(day, mon)
      });
    }
  }

  var saleOrders = [], normalOrders = [];
  for (var i = 0; i < allOrders.length; i++) {
    if (allOrders[i].isSale) saleOrders.push(allOrders[i]); else normalOrders.push(allOrders[i]);
  }

  var dSale = kgBuildDataset(saleOrders, monthNames);
  var dNormal = kgBuildDataset(normalOrders, monthNames);

  // Ghi chú ngày sale: liệt kê đúng các ngày sale có trong dữ liệu
  var noteParts = [];
  for (var mj = 0; mj < monthNames.length; mj++) {
    var dset = dSale.datesByMonth[monthNames[mj]];
    if (!dset) continue;
    var mm = monthNames[mj].match(/Tháng (\d+)/);
    var mPad = mm ? (parseInt(mm[1]) < 10 ? '0' + parseInt(mm[1]) : String(parseInt(mm[1]))) : '';
    var days = Object.keys(dset).map(Number).sort(function(a, b) { return a - b; });
    noteParts.push('<b>' + esc(monthNames[mj]) + ':</b> ' + days.map(function(x) { return (x < 10 ? '0' : '') + x + '/' + mPad; }).join(', '));
  }
  var saleNote = 'Ngày sale gồm 3 đợt: <b>ngày đôi</b> (ngày trùng số tháng, &plusmn;1 ngày) &bull; <b>ngày 13-14-15</b> (sale giữa tháng) &bull; <b>ngày 24-25</b> (sale lương về).'
    + (noteParts.length ? '<br>Kỳ này &mdash; ' + noteParts.join(' &nbsp;|&nbsp; ') : '');

  document.getElementById('kgSaleSection').innerHTML = kgSectionHtml(dSale, {
    key: 'sale', isSale: true, icon: '🔥', title: 'Ngày sale', sub: '',
    headBg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', headColor: '#c2410c', border: '#fdba74',
    note: saleNote
  });

  document.getElementById('kgNormalSection').innerHTML = kgSectionHtml(dNormal, {
    key: 'normal', isSale: false, icon: '📊', title: 'Ngày thường', sub: '(đã trừ ngày sale)',
    headBg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', headColor: '#1d4ed8', border: '#93c5fd',
    note: ''
  });

  window._khungGioData = { monthNames: monthNames, sale: dSale, normal: dNormal };
  document.getElementById('khungGioDashboard').style.display = '';
  kgRecalcBudget('sale');
  kgRecalcBudget('normal');
}

// ==================== PHÂN TÍCH CREATIVE GMV MAX ====================

function pgNum(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  var s = String(v).trim();
  if (!s || s === '-' || s === 'N/A') return 0;
  s = s.replace(/[^\d.,\-]/g, '');
  if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.indexOf(',') >= 0) s = s.replace(',', '.');
  return parseFloat(s) || 0;
}

function pgPct(x, d) { return (x * 100).toFixed(d == null ? 2 : d).replace('.', ',') + '%'; }

// % doanh thu của một dòng. Tô xanh khi phần doanh thu mang về LỚN HƠN phần
// ngân sách nó ăn (đáng đồng tiền), đỏ khi ngược lại — nhìn là biết dòng nào lỗ vốn.
function pgPctDT(rev, tongRev, tyLeChi) {
  if (!(tongRev > 0)) return '<span style="color:#cbd5e1;">—</span>';
  var t = rev / tongRev;
  var mau = t >= tyLeChi ? '#16a34a' : '#dc2626';
  return '<b style="color:' + mau + ';">' + pgPct(t, 1) + '</b>';
}
function pgRoi(x) { return (x == null || !isFinite(x)) ? '—' : x.toFixed(2).replace('.', ','); }

// Parser riêng: KHÔNG bỏ dòng đầu (dòng "Thẻ sản phẩm" có ID = N/A)
function parsePgmvXlsx(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(e.target.result, { type: 'array' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        if (!raw.length) { resolve([]); return; }
        var headers = (raw[0] || []).map(function (h) { return h != null ? String(h).trim() : ''; });
        var rows = [];
        for (var r = 1; r < raw.length; r++) {
          var rr = raw[r];
          if (!rr) continue;
          var o = {}, has = false;
          for (var c = 0; c < headers.length; c++) {
            o[headers[c]] = rr[c] != null ? rr[c] : null;
            if (rr[c] != null && String(rr[c]).trim() !== '') has = true;
          }
          if (has) rows.push(o);
        }
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = function () { reject(new Error('Không đọc được file')); };
    reader.readAsArrayBuffer(file);
  });
}

function onPgmvFileSelected(inp) {
  var hint = document.getElementById('hintPgmv');
  if (!inp.files[0]) { hint.textContent = 'Chưa chọn file'; hint.className = 'file-hint'; return; }
  var name = inp.files[0].name;
  hint.textContent = '✅ ' + name;
  hint.className = 'file-hint loaded';
  // Tự đọc kỳ báo cáo từ tên file: "2026-07-01 - 2026-07-31"
  var m = name.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/);
  if (m) {
    document.getElementById('pgmvFrom').value = m[1];
    document.getElementById('pgmvTo').value = m[2];
  }
}

async function processPgmv() {
  var inp = document.getElementById('filePgmv');
  if (!inp.files[0]) { alert('Vui lòng chọn file Creative data (.xlsx)!'); return; }
  var to = document.getElementById('pgmvTo').value;
  if (!to) { alert('Vui lòng nhập ngày kết thúc kỳ báo cáo!'); return; }

  showLoading('🎬 Đang phân tích creative GMV MAX...', 'Đang đọc ' + inp.files[0].name);
  try {
    await new Promise(function (r) { setTimeout(r, 100); });
    var rows = await parsePgmvXlsx(inp.files[0]);
    if (!rows.length) throw new Error('File không có dữ liệu');
    if (!('ID bài đăng' in rows[0])) throw new Error('Sai định dạng file — không tìm thấy cột "ID bài đăng". Hãy dùng file Creative data xuất từ TikTok Ads.');
    renderPgmv(rows);
    hideLoading();
  } catch (err) {
    hideLoading();
    alert('Lỗi: ' + err.message);
    console.error(err);
  }
}

function clearPgmv() {
  document.getElementById('pgmvDashboard').style.display = 'none';
  document.getElementById('pgmvDashboard').innerHTML = '';
  var inp = document.getElementById('filePgmv');
  if (inp) inp.value = '';
  var hint = document.getElementById('hintPgmv');
  if (hint) { hint.textContent = 'Chưa chọn file'; hint.className = 'file-hint'; }
  window._pgmvData = null;
}

// ---------- Bảng dùng chung ----------
function pgTable(cols, body, opts) {
  opts = opts || {};
  // scrollRows > 0 → bảng cuộn dọc, hiện sẵn bấy nhiêu dòng, tiêu đề dính trên cùng
  var scroll = opts.scrollRows > 0;
  var th = 'background:#1e3a5f;color:#fff;font-weight:700;padding:8px 10px;font-size:0.82em;white-space:nowrap;'
    + (scroll ? 'position:sticky;top:0;z-index:2;' : '');
  var h = '';
  if (scroll) {
    // 1 vùng cuộn duy nhất (cả dọc lẫn ngang) để tiêu đề sticky bám đúng
    // ~57px/dòng vì ô Trạng thái có 2 tầng chữ, +38px cho tiêu đề
    h += '<div style="max-height:' + (38 + opts.scrollRows * 57) + 'px;overflow:auto;border:1px solid #e2e8f0;border-radius:8px;">';
    h += '<table style="width:100%;border-collapse:collapse;font-size:0.84em;">';
  } else {
    h += '<div class="table-wrapper"><table style="width:100%;border-collapse:collapse;font-size:0.84em;">';
  }
  h += '<thead><tr>';
  for (var i = 0; i < cols.length; i++) {
    h += '<th style="' + th + 'text-align:' + (cols[i].a || 'right') + ';">' + cols[i].t + '</th>';
  }
  h += '</tr></thead><tbody>';
  for (var r = 0; r < body.length; r++) {
    var row = body[r], isFoot = row.foot;
    var cells = row.cells || row;
    var tdBase = isFoot
      ? 'background:#1e3a5f;color:#fff;font-weight:800;padding:8px 10px;'
      : 'padding:7px 10px;border-bottom:1px solid #f1f5f9;';
    h += '<tr style="background:' + (isFoot ? '' : (row.bg || '#fff')) + ';">';
    for (var c = 0; c < cells.length; c++) {
      h += '<td style="' + tdBase + 'text-align:' + (cols[c].a || 'right') + ';' + (isFoot ? '' : (cols[c].s || '')) + '">' + cells[c] + '</td>';
    }
    h += '</tr>';
  }
  h += '</tbody></table></div>';
  if (opts.more) h += '<div style="margin-top:6px;font-size:0.78em;color:#94a3b8;">' + opts.more + '</div>';
  return h;
}

function pgScrollNote(n, vis) {
  if (n <= vis) return '';
  return '↕ Đang hiển thị đủ <b>' + fmt(n) + '</b> dòng — cuộn trong bảng để xem tiếp (' + vis + ' dòng đầu hiện sẵn).';
}

// Nhãn trạng thái video (dùng "Trạng thái thứ cấp khám phá" — cái quyết định phân bổ tiền)
function pgStatusBadge(x) {
  var s = x.status2 || x.status || '';
  if (!s || s === '-') return '<span style="color:#cbd5e1;">—</span>';
  var c = { bg: '#f1f5f9', fg: '#475569' };
  if (/nổi bật/i.test(s)) c = { bg: '#fef3c7', fg: '#b45309' };
  else if (/có hiệu quả/i.test(s)) c = { bg: '#dcfce7', fg: '#15803d' };
  else if (/kém hiệu quả/i.test(s)) c = { bg: '#fee2e2', fg: '#b91c1c' };
  else if (/không khả dụng/i.test(s)) c = { bg: '#fef9c3', fg: '#a16207' };
  else if (/ủy quyền/i.test(s)) c = { bg: '#ede9fe', fg: '#6d28d9' };
  else if (/đang khám phá/i.test(s)) c = { bg: '#dbeafe', fg: '#1d4ed8' };
  var h = '<span style="display:inline-block;background:' + c.bg + ';color:' + c.fg + ';padding:2px 8px;border-radius:5px;font-size:0.86em;font-weight:700;white-space:nowrap;">' + esc(s) + '</span>';
  if (x.status && x.status !== s) h += '<div style="font-size:0.82em;color:#94a3b8;margin-top:2px;">' + esc(x.status) + '</div>';
  return h;
}

// Ngưỡng tốt để tô sáng
var PG_CTR_HI = 0.025;  // CTR ≥ 2,5%
var PG_CVR_HI = 0.05;   // CVR ≥ 5%

// CTR/CVR chỉ đo placement "quảng cáo sản phẩm" → impression = 0 thì không có số, đừng hiển thị 0,00%
function pgRate(v, denom, hi) {
  if (!denom) return '<span style="color:#cbd5e1;">—</span>';
  var s = pgPct(v, 2);
  if (hi && v >= hi) {
    return '<span style="display:inline-block;background:#dcfce7;border:1px solid #86efac;color:#15803d;font-weight:800;padding:1px 7px;border-radius:5px;">' + s + '</span>';
  }
  return s;
}

// Ô ID video: chữ to, dễ đọc + nút sao chép riêng từng dòng
// (không dùng <code> vì Chrome thu nhỏ font monospace mặc định)
function pgIdCell(id) {
  var s = String(id == null ? '' : id).trim();
  if (!s || s === 'N/A') return '<span style="color:#94a3b8;">N/A</span>';
  var e = esc(s);
  return '<span style="display:inline-flex;align-items:center;gap:7px;white-space:nowrap;">'
    + '<span style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:1.12em;font-weight:600;color:#1e293b;letter-spacing:0.2px;">' + e + '</span>'
    + '<button type="button" onclick="pgCopyOne(this,\'' + e + '\')" title="Sao chép ID này"'
    + ' style="flex:none;width:22px;height:22px;line-height:1;padding:0;border:1px solid #cbd5e1;background:#fff;border-radius:5px;font-size:0.85em;color:#64748b;cursor:pointer;">📋</button>'
    + '</span>';
}

function pgCopyOne(btn, id) {
  var ok = function () {
    var old = btn.innerHTML;
    btn.innerHTML = '✓';
    btn.style.color = '#16a34a';
    btn.style.borderColor = '#86efac';
    setTimeout(function () { btn.innerHTML = old; btn.style.color = '#64748b'; btn.style.borderColor = '#cbd5e1'; }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(id).then(ok, function () { window.prompt('Sao chép ID:', id); });
  } else {
    window.prompt('Sao chép ID:', id);
  }
}

// Ô tuổi video, tô màu theo vòng đời: 0–7 cửa sổ vàng · 8–13 cảnh báo · ≥14 tới hạn cắt
function pgAgeCell(x) {
  if (x.age == null) return '<span style="color:#cbd5e1;">—</span>';
  var c = x.age < 8 ? '#16a34a' : (x.age < 14 ? '#b45309' : '#475569');
  return '<span style="color:' + c + ';font-weight:700;white-space:nowrap;">' + fmt(x.age) + ' ngày</span>';
}

// ROI của dòng chi cực nhỏ là ảo — đơn organic được attribute vào, không dùng để xếp hạng
function pgRoiCell(x, color) {
  var h = '<b style="color:' + color + ';">' + pgRoi(x.roi) + '</b>';
  if (x.cost > 0 && x.cost < 1000) h += ' <span title="Chi quá nhỏ, đơn organic được attribute vào" style="background:#e2e8f0;color:#475569;padding:1px 5px;border-radius:4px;font-size:0.76em;font-weight:700;">ẢO</span>';
  return h;
}

function pgCard(title, inner, color) {
  return '<div class="card" style="margin-top:18px;border-left:4px solid ' + color + ';">'
    + '<div class="card-title" style="font-size:0.98em;">' + title + '</div>' + inner + '</div>';
}

// ---------- Nhóm hành động ----------
function pgActionGroup(g) {
  var h = '<div style="border:1.5px solid ' + g.border + ';border-radius:10px;padding:14px 16px;margin-bottom:14px;background:' + g.bg + ';">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:4px;">';
  h += '<div style="font-weight:800;font-size:0.92em;color:' + g.color + ';">' + g.title + '</div>';
  if (g.ids && g.ids.length) {
    h += '<button onclick="pgCopyIds(\'' + g.key + '\')" style="padding:5px 12px;border:1.5px solid ' + g.border + ';background:#fff;border-radius:7px;font-size:0.76em;font-weight:700;color:' + g.color + ';cursor:pointer;">📋 Copy ' + g.ids.length + ' ID</button>';
  }
  h += '</div>';
  h += '<div style="font-size:0.82em;color:#475569;margin-bottom:10px;">' + g.sub + '</div>';
  h += g.body;
  h += '</div>';
  return h;
}

function pgCopyIds(key) {
  var d = window._pgmvData;
  if (!d || !d.idGroups || !d.idGroups[key]) return;
  var txt = d.idGroups[key].join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(function () {
      alert('Đã copy ' + d.idGroups[key].length + ' ID vào clipboard.');
    }, function () { window.prompt('Copy danh sách ID:', txt); });
  } else {
    window.prompt('Copy danh sách ID:', txt);
  }
}

// ==================== RENDER ====================
function renderPgmv(raw) {
  var fromStr = document.getElementById('pgmvFrom').value;
  var toStr = document.getElementById('pgmvTo').value;
  var roiBE = kgRoiVal('pgmvRoiBE');
  var periodEnd = new Date(toStr + 'T23:59:59');
  var periodStart = fromStr ? new Date(fromStr + 'T00:00:00') : null;

  // ---- Chuẩn hoá ----
  var all = [];
  for (var i = 0; i < raw.length; i++) {
    var r = raw[i];
    var idRaw = r['ID bài đăng'];
    var id = idRaw == null ? '' : String(idRaw).trim();
    var postedRaw = r['Thời gian đăng'];
    var posted = null;
    if (postedRaw != null) {
      var ps = String(postedRaw).trim();
      var pm = ps.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
      if (pm) posted = new Date(+pm[1], +pm[2] - 1, +pm[3], +pm[4], +pm[5]);
      else {
        var pm2 = ps.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (pm2) posted = new Date(+pm2[1], +pm2[2] - 1, +pm2[3]);
      }
    }
    var cost = pgNum(r['Chi phí']);
    var rev = pgNum(r['Doanh thu gộp']);
    var ord = pgNum(r['Số lượng đơn hàng SKU']);
    all.push({
      id: id, caption: String(r['Mẫu quảng cáo'] || '').trim(),
      acc: String(r['Tài khoản TikTok'] || '').trim() || '(không rõ)',
      type: String(r['Loại nội dung sáng tạo'] || '').trim(),
      status: String(r['Trạng thái'] || '').trim(),
      status2: String(r['Trạng thái thứ cấp khám phá'] || '').trim(),
      posted: posted, cost: cost, rev: rev, orders: ord,
      roi: cost > 0 ? rev / cost : null,
      cpo: ord > 0 ? cost / ord : null,
      imp: pgNum(r['Số lượt hiển thị quảng cáo sản phẩm']),
      clicks: pgNum(r['Số lượt nhấp vào quảng cáo sản phẩm']),
      ctr: pgNum(r['Tỷ lệ nhấp vào quảng cáo sản phẩm']),
      cvr: pgNum(r['Tỷ lệ chuyển đổi quảng cáo']),
      v2: pgNum(r['Tỷ lệ xem video quảng cáo trong 2 giây']),
      v6: pgNum(r['Tỷ lệ xem video quảng cáo trong 6 giây']),
      v50: pgNum(r['Tỷ lệ xem 50% thời lượng video quảng cáo']),
      v75: pgNum(r['Tỷ lệ xem 75% thời lượng video quảng cáo']),
      v100: pgNum(r['Tỷ lệ xem 100% thời lượng video quảng cáo']),
      age: null, isVideo: String(r['Loại nội dung sáng tạo'] || '').trim() === 'Video'
    });
  }
  for (var i = 0; i < all.length; i++) {
    if (all[i].posted) all[i].age = Math.floor((periodEnd - all[i].posted) / 86400000);
  }

  var future = all.filter(function (x) { return x.posted && x.posted > periodEnd; });
  var valid = all.filter(function (x) { return !x.posted || x.posted <= periodEnd; });
  var cards = all.filter(function (x) { return !x.isVideo; });
  var vids = valid.filter(function (x) { return x.isVideo; });

  function agg(list) {
    var c = 0, rv = 0, o = 0, n = 0, spent = 0, withOrd = 0;
    for (var i = 0; i < list.length; i++) {
      c += list[i].cost; rv += list[i].rev; o += list[i].orders; n++;
      if (list[i].cost > 0) spent++;
      if (list[i].orders > 0) withOrd++;
    }
    return { n: n, cost: c, rev: rv, orders: o, spent: spent, withOrd: withOrd, roi: c > 0 ? rv / c : null, cpo: o > 0 ? c / o : null, aov: o > 0 ? rv / o : null };
  }

  var tAll = agg(all);
  var html = '';

  // ============ 1. TỔNG QUAN ============
  var lai = roiBE > 0 ? (tAll.roi >= roiBE) : null;
  // Lãi gộp = doanh thu × biên LN gộp (= 1/ROI hoà vốn), rồi trừ chi phí ads
  var profit = roiBE > 0 ? (tAll.rev / roiBE - tAll.cost) : 0;
  var kpi = function (lab, val, sub, col) {
    return '<div style="border:2px solid #e2e8f0;border-radius:12px;padding:12px 14px;text-align:center;">'
      + '<div style="font-size:0.7em;font-weight:700;color:#64748b;text-transform:uppercase;">' + lab + '</div>'
      + '<div style="font-size:1.25em;font-weight:800;color:' + (col || '#1e293b') + ';margin:4px 0 2px;">' + val + '</div>'
      + '<div style="font-size:0.7em;color:#94a3b8;">' + (sub || '') + '</div></div>';
  };
  var ov = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">';
  ov += kpi('Tổng chi phí', fmt(tAll.cost) + 'đ', tAll.spent + '/' + tAll.n + ' dòng có chi');
  ov += kpi('Doanh thu gộp', fmt(tAll.rev) + 'đ', 'AOV ' + fmt(tAll.aov) + 'đ');
  ov += kpi('ROI tổng', pgRoi(tAll.roi), roiBE > 0 ? ('hoà vốn ' + pgRoi(roiBE)) : 'chưa nhập hoà vốn', lai === null ? '#1e293b' : (lai ? '#16a34a' : '#dc2626'));
  ov += kpi('Đơn SKU', fmt(tAll.orders), 'CPO ' + fmt(tAll.cpo) + 'đ');
  ov += '</div>';

  if (roiBE > 0) {
    var bgv = lai ? '#f0fdf4' : '#fef2f2', bdv = lai ? '#86efac' : '#fecaca', cv = lai ? '#166534' : '#991b1b';
    ov += '<div style="background:' + bgv + ';border:1px solid ' + bdv + ';border-radius:8px;padding:11px 15px;font-size:0.86em;color:' + cv + ';line-height:1.75;">';
    ov += '<b>' + (lai ? '✅ ĐANG LÃI' : '🔴 ĐANG LỖ') + '</b> — ROI tổng <b>' + pgRoi(tAll.roi) + '</b> ' + (lai ? 'cao hơn' : 'thấp hơn') + ' điểm hoà vốn <b>' + pgRoi(roiBE) + '</b>. ';
    ov += 'Lãi gộp ước tính sau chi phí ads: <b>' + fmt(profit) + 'đ</b>.';
    ov += '</div>';
  } else {
    ov += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:11px 15px;font-size:0.84em;color:#92400e;">⚠️ Nhập <b>ROI hoà vốn</b> ở trên để tool chấm lãi/lỗ cho từng video (ROI hoà vốn = 1 ÷ biên lợi nhuận gộp).</div>';
  }
  html += pgCard('📊 Tổng quan kỳ ' + esc(fromStr || '?') + ' → ' + esc(toStr), ov, '#2563eb');

  // ============ 1b. THỐNG KÊ VIDEO THEO TRẠNG THÁI ============
  var allVids = all.filter(function (x) { return x.isVideo; });
  var nonVids = all.filter(function (x) { return !x.isVideo; });

  var stMap = {};
  for (var i = 0; i < allVids.length; i++) {
    var v = allVids[i];
    var key = v.status2 || v.status || '(không rõ)';
    if (!stMap[key]) stMap[key] = { name: key, n: 0, cost: 0, rev: 0, orders: 0, spent: 0, withOrd: 0 };
    var g = stMap[key];
    g.n++; g.cost += v.cost; g.rev += v.rev; g.orders += v.orders;
    if (v.cost > 0) g.spent++;
    if (v.orders > 0) g.withOrd++;
  }
  var stList = Object.keys(stMap).map(function (k) { return stMap[k]; })
    .sort(function (a, b) { return b.rev - a.rev || b.n - a.n; });

  // KPI đếm video
  var vSpent = allVids.filter(function (x) { return x.cost > 0; }).length;
  var vOrd = allVids.filter(function (x) { return x.orders > 0; }).length;
  var vFuture = future.filter(function (x) { return x.isVideo; }).length;
  var vs = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px;">';
  vs += kpi('Tổng video trong camp', fmt(allVids.length), 'toàn bộ file');
  vs += kpi('Video được chi tiền', fmt(vSpent), allVids.length ? pgPct(vSpent / allVids.length, 1) + ' tổng video' : '', '#b45309');
  vs += kpi('Video có ra đơn', fmt(vOrd), allVids.length ? pgPct(vOrd / allVids.length, 1) + ' tổng video' : '', '#16a34a');
  vs += kpi('Đăng sau kỳ báo cáo', fmt(vFuture), 'không có số liệu trong kỳ', vFuture ? '#dc2626' : '#1e293b');
  vs += '</div>';

  // Bảng theo trạng thái
  var stBody = [];
  var barCell = function (pct, color) {
    var w = Math.max(0, Math.min(100, pct));
    return '<div style="font-weight:700;color:' + color + ';">' + pct.toFixed(2).replace('.', ',') + '%</div>'
      + '<div style="height:4px;background:#e2e8f0;border-radius:3px;margin-top:3px;overflow:hidden;"><div style="height:100%;width:' + w + '%;background:' + color + ';"></div></div>';
  };
  for (var i = 0; i < stList.length; i++) {
    var g = stList[i];
    var pRev = tAll.rev > 0 ? (g.rev / tAll.rev * 100) : 0;
    var groi = g.cost > 0 ? g.rev / g.cost : null;
    stBody.push({
      cells: [pgStatusBadge({ status2: g.name, status: '' }),
        fmt(g.n), pgPct(allVids.length ? g.n / allVids.length : 0, 1),
        fmt(g.cost), pgPct(tAll.cost > 0 ? g.cost / tAll.cost : 0, 1),
        fmt(g.rev), barCell(pRev, pRev >= 20 ? '#16a34a' : (pRev >= 5 ? '#a16207' : '#94a3b8')),
        fmt(g.orders), groi != null ? '<b style="color:#16a34a;">' + pgRoi(groi) + '</b>' : '—']
    });
  }
  if (nonVids.length) {
    var nvC = 0, nvR = 0, nvO = 0;
    for (var i = 0; i < nonVids.length; i++) { nvC += nonVids[i].cost; nvR += nonVids[i].rev; nvO += nonVids[i].orders; }
    var pRev2 = tAll.rev > 0 ? (nvR / tAll.rev * 100) : 0;
    stBody.push({
      bg: '#f8fafc',
      cells: ['<span style="font-weight:700;color:#475569;">Không phải video</span><div style="font-size:0.85em;color:#94a3b8;">' + esc(nonVids[0].type || 'Thẻ sản phẩm') + ' &times; ' + nonVids.length + '</div>',
        '—', '—', fmt(nvC), pgPct(tAll.cost > 0 ? nvC / tAll.cost : 0, 1),
        fmt(nvR), barCell(pRev2, pRev2 >= 20 ? '#16a34a' : (pRev2 >= 5 ? '#a16207' : '#94a3b8')),
        fmt(nvO), nvC > 0 ? '<b style="color:#16a34a;">' + pgRoi(nvR / nvC) + '</b>' : '—']
    });
  }
  stBody.push({
    foot: true,
    cells: ['Tổng cộng', fmt(allVids.length), '100%', fmt(tAll.cost), '100%', fmt(tAll.rev), '100%', fmt(tAll.orders), pgRoi(tAll.roi)]
  });

  var stH = vs + pgTable(
    [{ t: 'Trạng thái video', a: 'left' }, { t: 'Số video', a: 'right' }, { t: '% video', a: 'right' },
     { t: 'Chi phí', a: 'right' }, { t: '% chi phí', a: 'right' },
     { t: 'Doanh thu', a: 'right' }, { t: '% doanh thu', a: 'right' },
     { t: 'Đơn', a: 'right' }, { t: 'ROI', a: 'right' }],
    stBody);

  // Nhận xét tự động
  var topRev = stList[0];
  var manyLowSt = stList.filter(function (g) { return tAll.cost > 0 && (g.cost / tAll.cost) < 0.05; });
  var manyLowN = manyLowSt.reduce(function (s, g) { return s + g.n; }, 0);
  var manyLowC = manyLowSt.reduce(function (s, g) { return s + g.cost; }, 0);
  if (topRev) {
    stH += '<div style="margin-top:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:11px 15px;font-size:0.84em;color:#334155;line-height:1.9;">';
    stH += '<div>• Trạng thái mang nhiều doanh thu nhất: <b>' + esc(topRev.name) + '</b> — ' + fmt(topRev.n) + ' video, '
      + '<b style="color:#16a34a;">' + pgPct(tAll.rev > 0 ? topRev.rev / tAll.rev : 0, 1) + '</b> doanh thu tổng.</div>';
    if (manyLowN) {
      stH += '<div>• <b>' + fmt(manyLowN) + ' video</b> (' + pgPct(allVids.length ? manyLowN / allVids.length : 0, 1) + ' số video) nằm ở các trạng thái chỉ nhận <b style="color:#dc2626;">'
        + pgPct(tAll.cost > 0 ? manyLowC / tAll.cost : 0, 1) + '</b> ngân sách — kho creative lớn nhưng hệ thống gần như không thử.</div>';
    }
    stH += '<div style="color:#64748b;">• Cột % chi phí và % doanh thu tính trên tổng toàn camp (gồm cả dòng không phải video) nên cộng lại đúng 100%.</div>';
    stH += '</div>';
  }
  html += pgCard('📹 Thống kê video theo trạng thái', stH, '#0891b2');

  // ============ 2. CẢNH BÁO DỮ LIỆU ============
  var warns = [];
  if (future.length) warns.push('<b>' + fmt(future.length) + '/' + fmt(all.length) + ' dòng (' + pgPct(future.length / all.length, 1) + ')</b> là video đăng <b>sau ' + esc(toStr) + '</b> → không thể có số liệu trong kỳ. Tool đã loại, mẫu thật còn <b>' + fmt(valid.length) + ' dòng</b>.');
  var cardAgg = agg(cards);
  if (cards.length && cardAgg.cost > 0) warns.push('<b>' + cards.length + ' dòng "' + esc(cards[0].type || 'Thẻ sản phẩm') + '"</b> không phải video nhưng chiếm <b>' + pgPct(cardAgg.cost / tAll.cost, 1) + '</b> chi phí (' + fmt(cardAgg.cost) + 'đ) — không mổ được creative cho phần này.');
  var impZero = vids.filter(function (x) { return x.imp === 0 && x.orders > 0; }).length;
  if (impZero) warns.push('<b>' + impZero + ' video có đơn nhưng impression = 0</b> — cột impression/CTR chỉ đo placement "quảng cáo sản phẩm", không phải toàn bộ lượt xem.');
  warns.push('Cột <b>Trạng thái</b> là ảnh chụp lúc xuất file, còn số liệu là của kỳ báo cáo → trạng thái không phải lúc nào cũng giải thích được số.');
  var wh = '<ul style="margin:0;padding-left:20px;font-size:0.85em;color:#92400e;line-height:1.9;">';
  for (var i = 0; i < warns.length; i++) wh += '<li>' + warns[i] + '</li>';
  wh += '</ul>';
  html += pgCard('⚠️ Cảnh báo dữ liệu — đọc trước', wh, '#f59e0b');

  // ============ 3. NGÂN SÁCH TẬP TRUNG Ở ĐÂU ============
  var byCost = all.slice().filter(function (x) { return x.cost > 0; }).sort(function (a, b) { return b.cost - a.cost; });
  var topN = Math.min(5, byCost.length);
  var bodyC = [], accCost = 0, accOrd = 0;
  for (var i = 0; i < topN; i++) {
    var x = byCost[i];
    accCost += x.cost; accOrd += x.orders;
    var nm = x.isVideo ? ('<span style="font-size:0.9em;color:#64748b;">Video</span> ' + pgIdCell(x.id)) : ('Dòng "' + esc(x.type) + '"');
    var bad = roiBE > 0 && x.roi != null && x.roi < roiBE;
    bodyC.push({
      bg: bad ? '#fef2f2' : '#fff',
      cells: [nm + '<div style="font-size:0.88em;color:#94a3b8;">' + esc(x.acc) + '</div>',
        pgStatusBadge(x),
        // pgAgeCell tự trả về gạch ngang khi dòng đó không phải video (không có tuổi)
        pgAgeCell(x),
        fmt(x.cost), pgPct(x.cost / tAll.cost, 1),
        pgPctDT(x.rev, tAll.rev, x.cost / tAll.cost),
        fmt(x.orders),
        x.cpo != null ? fmt(x.cpo) : '—',
        pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI),
        '<b style="color:' + (bad ? '#dc2626' : '#16a34a') + ';">' + pgRoi(x.roi) + '</b>']
    });
  }
  var restCost = tAll.cost - accCost, restN = byCost.length - topN;
  if (restN > 0) {
    var restRev = 0, restOrd = tAll.orders - accOrd, restImp = 0, restClk = 0;
    for (var i = topN; i < byCost.length; i++) { restRev += byCost[i].rev; restImp += byCost[i].imp; restClk += byCost[i].clicks; }
    bodyC.push({
      bg: '#f8fafc',
      cells: [fmt(restN) + ' dòng còn lại', '<span style="color:#cbd5e1;">—</span>',
        '<span style="color:#cbd5e1;">—</span>',
        fmt(restCost), pgPct(restCost / tAll.cost, 1),
        pgPctDT(restRev, tAll.rev, restCost / tAll.cost),
        fmt(restOrd),
        restOrd > 0 ? fmt(restCost / restOrd) : '—',
        pgRate(restImp > 0 ? restClk / restImp : 0, restImp, PG_CTR_HI),
        pgRate(restClk > 0 ? restOrd / restClk : 0, restClk, PG_CVR_HI),
        pgRoi(restCost > 0 ? restRev / restCost : null)]
    });
  }
  // Bảng chỉ liệt kê dòng CÓ chi tiền ads, nên cột "% doanh thu" cộng lại
  // thường không đủ 100%. Phần thiếu là doanh thu từ dòng không tốn ads —
  // nói rõ ra để khỏi tưởng tool tính sai.
  var revCoChi = 0;
  for (var i = 0; i < byCost.length; i++) revCoChi += byCost[i].rev;
  var revMienPhi = tAll.rev - revCoChi;
  var ghiChuMienPhi = (tAll.rev > 0 && revMienPhi > tAll.rev * 0.001)
    ? '<b style="color:#16a34a;">' + pgPct(revMienPhi / tAll.rev, 1) + '</b> doanh thu còn lại ('
      + fmt(revMienPhi) + 'đ) đến từ các dòng <b>không tốn đồng quảng cáo nào</b> — không nằm trong bảng này. '
    : '';

  var cc = pgTable(
    [{ t: 'Hạng mục', a: 'left' },
     { t: 'Trạng thái', a: 'left' },
     { t: 'Tuổi video', a: 'right', s: 'white-space:nowrap;' },
     { t: 'Chi phí', a: 'right', s: 'white-space:nowrap;' },
     { t: '% ngân sách', a: 'right', s: 'white-space:nowrap;' },
     { t: '% doanh thu', a: 'right', s: 'white-space:nowrap;' },
     { t: 'Đơn', a: 'right', s: 'white-space:nowrap;' },
     { t: 'CPO', a: 'right', s: 'white-space:nowrap;' },
     { t: 'CTR', a: 'right', s: 'white-space:nowrap;' },
     { t: 'CVR', a: 'right', s: 'white-space:nowrap;' },
     { t: 'ROI', a: 'right', s: 'white-space:nowrap;' }],
    bodyC, { more: '<b>% doanh thu</b> tính trên tổng doanh thu cả kỳ — xanh = mang về nhiều hơn phần ngân sách nó ăn, đỏ = ngược lại. '
      + ghiChuMienPhi
      + '<b>Tuổi video</b> tính tới ngày cuối kỳ báo cáo — dòng "Thẻ sản phẩm" và dòng gộp không phải video nên để “—”. '
      + '<span style="color:#16a34a;">0–7 ngày</span> là cửa sổ vàng, <span style="color:#b45309;">8–13 ngày</span> cảnh báo, ≥14 ngày tới hạn cắt. '
      + 'CTR/CVR chỉ đo ở placement "quảng cáo sản phẩm" — dòng nào impression = 0 thì hiện “—”, không phải bằng 0. Trạng thái là ảnh chụp lúc xuất file.' });
  cc = '<div style="font-size:0.85em;color:#475569;margin-bottom:10px;">Top ' + topN + ' dòng ăn <b style="color:#dc2626;">' + pgPct(accCost / tAll.cost, 1) + '</b> ngân sách.</div>' + cc;
  html += pgCard('💸 Ngân sách đang đổ vào đâu', cc, '#dc2626');

  // ============ 4. DANH SÁCH HÀNH ĐỘNG ============
  var idGroups = {};
  var CUT_DAY = 14, EARLY_DAY = 8, CUT_COST = 5000, WATCH_COST = 2000, SCALE_ROI = 25;
  var GOLDEN_WINDOW = EARLY_DAY; // 0–7 ngày: cửa sổ vàng, cố ý không can thiệp

  var VISIBLE_ROWS = 10;
  var HL_NOTE = '<span style="background:#dcfce7;border:1px solid #86efac;color:#15803d;font-weight:700;padding:0 5px;border-radius:4px;">ô xanh</span> = CTR ≥ ' + pgPct(PG_CTR_HI, 1) + ' hoặc CVR ≥ ' + pgPct(PG_CVR_HI, 0) + '.'
    + ' &nbsp;·&nbsp; Tuổi video: <b style="color:#16a34a;">0–7 ngày</b> cửa sổ vàng · <b style="color:#b45309;">8–13 ngày</b> cảnh báo · <b style="color:#475569;">≥ 14 ngày</b> tới hạn cắt.';
  // Bộ cột dùng chung cho VÙNG XÁM và GIỚI HẠN TRẦN. Đặt nowrap cho mọi cột số
  // để bảng thà cuộn ngang chứ không bóp chữ xuống dòng, đè lên nhau.
  var NW = 'white-space:nowrap;';
  var COLS_NHOM = [
    { t: 'Hạng mục', a: 'left' }, { t: 'Trạng thái', a: 'left' },
    { t: 'Ngày đăng', a: 'right', s: NW }, { t: 'Tuổi video', a: 'right', s: NW },
    { t: 'Chi phí', a: 'right', s: NW }, { t: '% NS', a: 'right', s: NW },
    { t: '% DT', a: 'right', s: NW }, { t: 'Đơn', a: 'right', s: NW },
    { t: 'CPO', a: 'right', s: NW }, { t: 'CTR', a: 'right', s: NW },
    { t: 'CVR', a: 'right', s: NW }, { t: 'ROI', a: 'right', s: NW }
  ];
  var NOTE_DT = '<b>% DT</b> = phần doanh thu dòng đó mang về, tính trên tổng doanh thu cả kỳ — '
    + '<b style="color:#16a34a;">xanh</b> khi lớn hơn % ngân sách nó ăn, <b style="color:#dc2626;">đỏ</b> khi nhỏ hơn.';

  function listTable(list, cols, mapper, themNote) {
    var body = [];
    for (var i = 0; i < list.length; i++) body.push(mapper(list[i]));
    var note = pgScrollNote(list.length, VISIBLE_ROWS);
    return pgTable(cols, body, {
      scrollRows: list.length > VISIBLE_ROWS ? VISIBLE_ROWS : 0,
      more: (note ? note + '<br>' : '') + (themNote ? themNote + '<br>' : '') + HL_NOTE
    });
  }

  var groupsHtml = '';

  // 🔴 TẮT NGAY
  var kill = vids.filter(function (x) { return x.cost >= CUT_COST && x.orders === 0 && x.age != null && x.age >= CUT_DAY; })
    .sort(function (a, b) { return b.cost - a.cost; });
  idGroups.kill = kill.map(function (x) { return x.id; });
  var killCost = kill.reduce(function (s, x) { return s + x.cost; }, 0);
  var vidCost = vids.reduce(function (s, x) { return s + x.cost; }, 0);
  groupsHtml += pgActionGroup({
    key: 'kill', title: '🔴 TẮT NGAY — ' + kill.length + ' video, đang đốt ' + fmt(killCost) + 'đ',
    sub: 'Tiêu chí: chi ≥ ' + fmt(CUT_COST) + 'đ · 0 đơn · tuổi ≥ ' + CUT_DAY + ' ngày. Bằng <b>' + (vidCost > 0 ? pgPct(killCost / vidCost, 1) : '0%') + '</b> ngân sách video.',
    color: '#b91c1c', border: '#fecaca', bg: '#fef2f2', ids: idGroups.kill,
    body: kill.length ? listTable(kill,
      [{ t: 'ID bài đăng', a: 'left' }, { t: 'Tài khoản', a: 'left' }, { t: 'Trạng thái', a: 'left' }, { t: 'Ngày đăng', a: 'right' }, { t: 'Tuổi video', a: 'right' }, { t: 'Chi phí', a: 'right' }, { t: 'Impression', a: 'right' }, { t: 'CTR', a: 'right' }, { t: 'CVR', a: 'right' }],
      function (x) {
        return {
          cells: [pgIdCell(x.id), esc(x.acc), pgStatusBadge(x), pgD(x.posted), pgAgeCell(x),
            '<b style="color:#dc2626;">' + fmt(x.cost) + '</b>', fmt(x.imp),
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI)]
        };
      })
      : '<div style="font-size:0.85em;color:#16a34a;">✅ Không có video nào rơi vào nhóm này.</div>'
  });

  // 🟣 CẢNH BÁO SỚM — bịt khoảng trống giữa TẮT NGAY (tuổi ≥14) và THEO DÕI (chi <5.000đ):
  // video còn trẻ nhưng đã đốt mạnh mà chưa ra đơn, đúng luật ngày 8–14.
  var early = vids.filter(function (x) {
    return x.cost >= CUT_COST && x.orders === 0 && x.age != null && x.age >= EARLY_DAY && x.age < CUT_DAY;
  }).sort(function (a, b) { return b.cost - a.cost; });
  idGroups.early = early.map(function (x) { return x.id; });
  var earlyCost = early.reduce(function (s, x) { return s + x.cost; }, 0);
  groupsHtml += pgActionGroup({
    key: 'early', title: '🟣 CẢNH BÁO SỚM — ' + early.length + ' video, đang đốt ' + fmt(earlyCost) + 'đ',
    sub: 'Tiêu chí: chi ≥ ' + fmt(CUT_COST) + 'đ · 0 đơn · tuổi ' + EARLY_DAY + '–' + (CUT_DAY - 1) + ' ngày. Chưa tới hạn cắt nhưng đã tiêu mạnh mà chưa ra đơn — <b>theo dõi từng ngày, chạm ngày ' + (CUT_DAY + 1) + ' mà vẫn 0 đơn thì cắt</b>.',
    color: '#6d28d9', border: '#ddd6fe', bg: '#f5f3ff', ids: idGroups.early,
    body: early.length ? listTable(early,
      [{ t: 'ID bài đăng', a: 'left' }, { t: 'Tài khoản', a: 'left' }, { t: 'Trạng thái', a: 'left' }, { t: 'Ngày đăng', a: 'right' }, { t: 'Tuổi video', a: 'right' }, { t: 'Chi phí', a: 'right' }, { t: 'Impression', a: 'right' }, { t: 'CTR', a: 'right' }, { t: 'CVR', a: 'right' }],
      function (x) {
        return {
          cells: [pgIdCell(x.id), esc(x.acc), pgStatusBadge(x), pgD(x.posted), pgAgeCell(x),
            '<b style="color:#dc2626;">' + fmt(x.cost) + '</b>', fmt(x.imp),
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI)]
        };
      })
      : '<div style="font-size:0.85em;color:#16a34a;">✅ Không có video nào rơi vào nhóm này.</div>'
  });

  // 🟠 THEO DÕI SÁT
  var watch = vids.filter(function (x) { return x.cost >= WATCH_COST && x.cost < CUT_COST && x.orders === 0; })
    .sort(function (a, b) { return b.cost - a.cost; });
  idGroups.watch = watch.map(function (x) { return x.id; });
  var watchCost = watch.reduce(function (s, x) { return s + x.cost; }, 0);
  groupsHtml += pgActionGroup({
    key: 'watch', title: '🟠 THEO DÕI SÁT — ' + watch.length + ' video, ' + fmt(watchCost) + 'đ',
    sub: 'Chi ' + fmt(WATCH_COST) + '–' + fmt(CUT_COST) + 'đ, 0 đơn. Cho thêm 7 ngày rồi cắt theo luật ngày-15.',
    color: '#c2410c', border: '#fed7aa', bg: '#fff7ed', ids: idGroups.watch,
    body: watch.length ? listTable(watch,
      [{ t: 'ID bài đăng', a: 'left' }, { t: 'Tài khoản', a: 'left' }, { t: 'Trạng thái', a: 'left' }, { t: 'Ngày đăng', a: 'right' }, { t: 'Tuổi video', a: 'right' }, { t: 'Chi phí', a: 'right' }, { t: 'Impression', a: 'right' }, { t: 'CTR', a: 'right' }, { t: 'CVR', a: 'right' }],
      function (x) {
        return {
          cells: [pgIdCell(x.id), esc(x.acc), pgStatusBadge(x), pgD(x.posted), pgAgeCell(x),
            fmt(x.cost), fmt(x.imp),
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI)]
        };
      })
      : '<div style="font-size:0.85em;color:#64748b;">Không có video nào.</div>'
  });

  // 🟡 GỠ CHẶN
  var blocked = vids.filter(function (x) { return /không khả dụng/i.test(x.status2) && x.orders > 0; })
    .sort(function (a, b) { return b.rev - a.rev; });
  idGroups.blocked = blocked.map(function (x) { return x.id; });
  var blRev = blocked.reduce(function (s, x) { return s + x.rev; }, 0), blOrd = blocked.reduce(function (s, x) { return s + x.orders; }, 0);
  groupsHtml += pgActionGroup({
    key: 'blocked', title: '🟡 GỠ CHẶN — ' + blocked.length + ' video đã ra ' + fmt(blOrd) + ' đơn / ' + fmt(blRev) + 'đ mà đang "Không khả dụng"',
    sub: 'Video bán được hàng thật nhưng bị gắn nhãn không khả dụng → GMV Max không đẩy tiền vào được. Gỡ là ăn ngay.',
    color: '#a16207', border: '#fde68a', bg: '#fefce8', ids: idGroups.blocked,
    body: blocked.length ? listTable(blocked,
      [{ t: 'ID bài đăng', a: 'left' }, { t: 'Tài khoản', a: 'left' }, { t: 'Trạng thái', a: 'left' }, { t: 'Ngày đăng', a: 'right' }, { t: 'Tuổi video', a: 'right' }, { t: 'Chi phí', a: 'right' }, { t: 'Đơn', a: 'right' }, { t: 'CPO', a: 'right' }, { t: 'CTR', a: 'right' }, { t: 'CVR', a: 'right' }, { t: 'ROI', a: 'right' }],
      function (x) {
        return {
          cells: [pgIdCell(x.id), esc(x.acc), pgStatusBadge(x), pgD(x.posted), pgAgeCell(x), 
            fmt(x.cost), fmt(x.orders), x.cpo != null ? fmt(x.cpo) : '—',
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI), pgRoiCell(x, '#16a34a')]
        };
      })
      : '<div style="font-size:0.85em;color:#64748b;">Không có video nào.</div>'
  });

  // 🟢 XIN ỦY QUYỀN
  var auth = vids.filter(function (x) { return /ủy quyền/i.test(x.status2) && x.orders > 0; })
    .sort(function (a, b) { return b.rev - a.rev; });
  idGroups.auth = auth.map(function (x) { return x.id; });
  var auRev = auth.reduce(function (s, x) { return s + x.rev; }, 0), auOrd = auth.reduce(function (s, x) { return s + x.orders; }, 0), auCost = auth.reduce(function (s, x) { return s + x.cost; }, 0);
  groupsHtml += pgActionGroup({
    key: 'auth', title: '🟢 XIN ỦY QUYỀN — ' + auth.length + ' video, ' + fmt(auOrd) + ' đơn / ' + fmt(auRev) + 'đ với chi phí ' + fmt(auCost) + 'đ',
    sub: 'Video KOC đã bán được hàng thật nhưng chưa cấp quyền quảng cáo → GMV Max chưa đẩy tiền vào được. <b>Quick win rẻ nhất.</b>',
    color: '#15803d', border: '#bbf7d0', bg: '#f0fdf4', ids: idGroups.auth,
    body: auth.length ? listTable(auth,
      [{ t: 'ID bài đăng', a: 'left' }, { t: 'Tài khoản', a: 'left' }, { t: 'Trạng thái', a: 'left' }, { t: 'Ngày đăng', a: 'right' }, { t: 'Tuổi video', a: 'right' }, { t: 'Doanh thu', a: 'right' }, { t: 'Đơn', a: 'right' }, { t: 'CTR', a: 'right' }, { t: 'CVR', a: 'right' }],
      function (x) {
        return {
          cells: [pgIdCell(x.id), esc(x.acc), pgStatusBadge(x), pgD(x.posted), pgAgeCell(x),
            '<b>' + fmt(x.rev) + '</b>', fmt(x.orders),
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI)]
        };
      })
      : '<div style="font-size:0.85em;color:#64748b;">Không có video nào.</div>'
  });

  // 🔵 SCALE — KHÔNG đặt trần chi phí: video càng scale thành công thì chi càng cao,
  // đặt trần sẽ tự đá chính những con đang thắng ra khỏi danh sách "nên scale".
  var scale = vids.filter(function (x) { return x.roi != null && x.roi >= SCALE_ROI && x.cost > 0 && x.orders > 0; })
    .sort(function (a, b) { return b.roi - a.roi; });
  idGroups.scale = scale.map(function (x) { return x.id; });
  var scCost = scale.reduce(function (s, x) { return s + x.cost; }, 0), scRev = scale.reduce(function (s, x) { return s + x.rev; }, 0), scOrd = scale.reduce(function (s, x) { return s + x.orders; }, 0);

  // ⛔ GIỚI HẠN TRẦN — tính sớm để nhóm VÙNG XÁM biết mà loại trừ (render bên dưới)
  var refRoi = tAll.roi || 0;
  var capList = all.filter(function (x) { return x.cost >= tAll.cost * 0.05 && x.orders > 0 && x.roi != null && x.roi < refRoi; })
    .sort(function (a, b) { return b.cost - a.cost; });

  // ⚪ VÙNG XÁM — có đơn nhưng ROI chưa đủ để scale, cũng chưa đủ tệ / chưa đủ to để chặn trần.
  // Đây là phần ngân sách trước đây không nhóm nào chạm tới.
  var taken = [];
  [kill, early, watch, blocked, auth, scale, capList].forEach(function (g) {
    g.forEach(function (x) { if (taken.indexOf(x) < 0) taken.push(x); });
  });
  var gray = all.filter(function (x) { return x.cost > 0 && x.orders > 0 && taken.indexOf(x) < 0; })
    .sort(function (a, b) { return b.cost - a.cost; });
  idGroups.gray = gray.filter(function (x) { return x.isVideo; }).map(function (x) { return x.id; });
  var grCost = gray.reduce(function (s, x) { return s + x.cost; }, 0);
  var grRev = gray.reduce(function (s, x) { return s + x.rev; }, 0);
  var grOrd = gray.reduce(function (s, x) { return s + x.orders; }, 0);
  groupsHtml += pgActionGroup({
    key: 'gray', title: '⚪ VÙNG XÁM — ' + gray.length + ' dòng, ' + fmt(grCost) + 'đ (' + (tAll.cost > 0 ? pgPct(grCost / tAll.cost, 1) : '0%') + ' ngân sách)',
    sub: 'Có đơn nhưng <b>ROI dưới ' + SCALE_ROI + '</b> — chưa đủ tốt để bơm tiền, chưa đủ to để chặn trần. Cả nhóm: chi <b>' + fmt(grCost) + 'đ</b> → <b>' + fmt(grRev) + 'đ</b>, ' + fmt(grOrd) + ' đơn, <b>ROI ' + pgRoi(grCost > 0 ? grRev / grCost : null) + '</b>. Soi CTR/CVR để biết sửa video hay sửa trang sản phẩm.',
    color: '#475569', border: '#cbd5e1', bg: '#f8fafc', ids: idGroups.gray,
    body: gray.length ? listTable(gray, COLS_NHOM,
      function (x) {
        var duoiHV = roiBE > 0 && x.roi < roiBE;
        return {
          cells: [(x.isVideo ? pgIdCell(x.id) : 'Dòng "' + esc(x.type) + '"') + '<div style="font-size:0.88em;color:#94a3b8;">' + esc(x.acc) + '</div>',
            pgStatusBadge(x), pgD(x.posted), pgAgeCell(x), fmt(x.cost), pgPct(x.cost / tAll.cost, 1),
            pgPctDT(x.rev, tAll.rev, x.cost / tAll.cost),
            fmt(x.orders), x.cpo != null ? fmt(x.cpo) : '—',
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI),
            pgRoiCell(x, '#a16207') + (duoiHV ? ' <span style="background:#dc2626;color:#fff;padding:1px 5px;border-radius:4px;font-size:0.78em;">DƯỚI HOÀ VỐN</span>' : '')]
        };
      }, NOTE_DT)
      : '<div style="font-size:0.85em;color:#16a34a;">✅ Không còn dòng nào ở vùng xám.</div>'
  });

  groupsHtml += pgActionGroup({
    key: 'scale', title: '🔵 SCALE — ' + scale.length + ' video ROI ≥ ' + SCALE_ROI,
    sub: 'Cả nhóm: chi <b>' + fmt(scCost) + 'đ</b> → doanh thu <b>' + fmt(scRev) + 'đ</b>, ' + fmt(scOrd) + ' đơn, <b>ROI ' + pgRoi(scCost > 0 ? scRev / scCost : null) + '</b>. Đây là nhóm đáng bơm thêm tiền — <b>tăng dần từng bậc rồi đo lại</b>, đừng nhảy một phát vì ROI cao ở mức chi nhỏ không giữ nguyên khi scale.',
    color: '#1d4ed8', border: '#bfdbfe', bg: '#eff6ff', ids: idGroups.scale,
    body: scale.length ? listTable(scale,
      [{ t: 'ID bài đăng', a: 'left' }, { t: 'Tài khoản', a: 'left' }, { t: 'Trạng thái', a: 'left' }, { t: 'Ngày đăng', a: 'right' }, { t: 'Tuổi video', a: 'right' }, { t: 'Chi phí', a: 'right' }, { t: 'Đơn', a: 'right' }, { t: 'CPO', a: 'right' }, { t: 'CTR', a: 'right' }, { t: 'CVR', a: 'right' }, { t: 'ROI', a: 'right' }],
      function (x) {
        return {
          cells: [pgIdCell(x.id), esc(x.acc), pgStatusBadge(x), pgD(x.posted), pgAgeCell(x), 
            fmt(x.cost), fmt(x.orders), x.cpo != null ? fmt(x.cpo) : '—',
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI), pgRoiCell(x, '#16a34a')]
        };
      })
      : '<div style="font-size:0.85em;color:#64748b;">Không có video nào.</div>'
  });

  // ⛔ GIỚI HẠN TRẦN — kém TƯƠNG ĐỐI: ăn nhiều tiền mà ROI thấp hơn mặt bằng chung của chính kỳ này
  idGroups.cap = capList.filter(function (x) { return x.isVideo; }).map(function (x) { return x.id; });
  var capCost = capList.reduce(function (s, x) { return s + x.cost; }, 0);
  groupsHtml += pgActionGroup({
    key: 'cap', title: '⛔ GIỚI HẠN TRẦN — ' + capList.length + ' dòng ăn ' + (tAll.cost > 0 ? pgPct(capCost / tAll.cost, 1) : '0%') + ' ngân sách mà ROI dưới trung bình (' + pgRoi(refRoi) + ')',
    sub: '<b>Không tắt</b> (đang mang đơn) nhưng phải tách ad group riêng có trần ngân sách, hoặc nâng ROI mục tiêu để hệ thống tự giảm phân bổ. Tiền giải phóng đem nuôi nhóm 🔵 SCALE.',
    color: '#7c2d12', border: '#fdba74', bg: '#fff7ed', ids: idGroups.cap,
    body: capList.length ? listTable(capList, COLS_NHOM,
      function (x) {
        var duoiHV = roiBE > 0 && x.roi < roiBE;
        return {
          cells: [(x.isVideo ? pgIdCell(x.id) : 'Dòng "' + esc(x.type) + '"') + '<div style="font-size:0.88em;color:#94a3b8;">' + esc(x.acc) + '</div>',
            pgStatusBadge(x), pgD(x.posted), pgAgeCell(x), fmt(x.cost), pgPct(x.cost / tAll.cost, 1),
            pgPctDT(x.rev, tAll.rev, x.cost / tAll.cost),
            fmt(x.orders), x.cpo != null ? fmt(x.cpo) : '—',
            pgRate(x.ctr, x.imp, PG_CTR_HI), pgRate(x.cvr, x.clicks, PG_CVR_HI),
            '<b style="color:#dc2626;">' + pgRoi(x.roi) + '</b>' + (duoiHV ? ' <span style="background:#dc2626;color:#fff;padding:1px 5px;border-radius:4px;font-size:0.78em;">DƯỚI HOÀ VỐN</span>' : '')]
        };
      }, NOTE_DT)
      : '<div style="font-size:0.85em;color:#16a34a;">✅ Không có dòng nào ăn nhiều tiền mà ROI kém.</div>'
  });

  // ---- ĐỘ PHỦ: bao nhiêu % ngân sách đã được xếp nhóm? ----
  var taken2 = taken.slice();
  gray.forEach(function (x) { if (taken2.indexOf(x) < 0) taken2.push(x); });
  var spentRows = all.filter(function (x) { return x.cost > 0; });
  var covRows = spentRows.filter(function (x) { return taken2.indexOf(x) >= 0; });
  var unRows = spentRows.filter(function (x) { return taken2.indexOf(x) < 0; });
  var covCost = covRows.reduce(function (s, x) { return s + x.cost; }, 0);
  var uGold = unRows.filter(function (x) { return x.orders === 0 && x.age != null && x.age < GOLDEN_WINDOW; });
  var uGoldCost = uGold.reduce(function (s, x) { return s + x.cost; }, 0);
  var uDust = unRows.filter(function (x) { return uGold.indexOf(x) < 0 && x.orders === 0 && x.cost < WATCH_COST; });
  var uDustCost = uDust.reduce(function (s, x) { return s + x.cost; }, 0);
  var uOther = unRows.filter(function (x) { return uGold.indexOf(x) < 0 && uDust.indexOf(x) < 0; });
  var uOtherCost = uOther.reduce(function (s, x) { return s + x.cost; }, 0);
  var covPct = tAll.cost > 0 ? (covCost / tAll.cost * 100) : 0;

  var seg = function (v, color, label) {
    var p = tAll.cost > 0 ? (v / tAll.cost * 100) : 0;
    if (p <= 0) return '';
    return '<div title="' + label + ': ' + fmt(v) + 'đ" style="width:' + p + '%;background:' + color + ';"></div>';
  };
  var covH = '<div style="border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:16px;background:#fff;">';
  covH += '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
  covH += '<div style="font-weight:800;font-size:0.9em;color:#1e293b;">🧭 Độ phủ ngân sách</div>';
  covH += '<div style="font-size:0.85em;color:#475569;">8 nhóm dưới đây đang bao phủ <b style="color:' + (covPct >= 95 ? '#16a34a' : '#b45309') + ';font-size:1.1em;">' + covPct.toFixed(1).replace('.', ',') + '%</b> ngân sách (' + fmt(covCost) + ' / ' + fmt(tAll.cost) + 'đ)</div>';
  covH += '</div>';
  covH += '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;background:#f1f5f9;">'
    + seg(covCost, '#2563eb', 'Đã xếp nhóm') + seg(uGoldCost, '#f59e0b', 'Cửa sổ vàng 0–7 ngày')
    + seg(uDustCost, '#cbd5e1', 'Bụi') + seg(uOtherCost, '#dc2626', 'Chưa phân loại') + '</div>';
  covH += '<div style="margin-top:9px;font-size:0.8em;color:#64748b;line-height:1.9;">';
  covH += '<span style="display:inline-block;width:9px;height:9px;background:#2563eb;border-radius:2px;"></span> Đã xếp nhóm: <b>' + fmt(covCost) + 'đ</b> · ' + covRows.length + ' dòng<br>';
  if (uGold.length) covH += '<span style="display:inline-block;width:9px;height:9px;background:#f59e0b;border-radius:2px;"></span> Cửa sổ vàng 0–' + (GOLDEN_WINDOW - 1) + ' ngày: <b>' + fmt(uGoldCost) + 'đ</b> · ' + uGold.length + ' video — <i>cố ý chưa can thiệp, để hệ thống test</i><br>';
  if (uDust.length) covH += '<span style="display:inline-block;width:9px;height:9px;background:#cbd5e1;border-radius:2px;"></span> Bụi (0 đơn, chi &lt; ' + fmt(WATCH_COST) + 'đ): <b>' + fmt(uDustCost) + 'đ</b> · ' + uDust.length + ' video — quá nhỏ để xử lý từng con<br>';
  if (uOther.length) covH += '<span style="display:inline-block;width:9px;height:9px;background:#dc2626;border-radius:2px;"></span> <b style="color:#dc2626;">Chưa phân loại: ' + fmt(uOtherCost) + 'đ · ' + uOther.length + ' dòng</b> — cần bổ sung tiêu chí<br>';
  covH += '</div></div>';

  html += pgCard('🎯 Danh sách hành động theo ID — làm theo thứ tự này', covH + groupsHtml, '#7c3aed');

  // ============ 5. VÒNG ĐỜI VIDEO ============
  var buckets = [[0, 7], [8, 14], [15, 30], [31, 60], [61, 120], [121, 99999]];
  var bLabels = ['0–7 ngày', '8–14 ngày', '15–30 ngày', '31–60 ngày', '61–120 ngày', '> 120 ngày'];
  var bBody = [], vidTotCost = vidCost;
  for (var b = 0; b < buckets.length; b++) {
    var lo = buckets[b][0], hi = buckets[b][1];
    var grp = vids.filter(function (x) { return x.age != null && x.age >= lo && x.age <= hi; });
    if (!grp.length) continue;
    var sp = grp.filter(function (x) { return x.cost > 0; });
    var gc = sp.reduce(function (s, x) { return s + x.cost; }, 0);
    var go = sp.reduce(function (s, x) { return s + x.orders; }, 0);
    var hitN = sp.filter(function (x) { return x.orders > 0; }).length;
    var hit = sp.length ? hitN / sp.length : null;   // null = không có video nào được chi → không tính được
    var warn = (lo === 15);
    var dim = '<span style="color:#cbd5e1;">—</span>';
    bBody.push({
      bg: warn ? '#fef2f2' : '#fff',
      cells: [(warn ? '<b>' : '') + bLabels[b] + (warn ? '</b>' : ''),
        fmt(grp.length),
        '<b>' + fmt(sp.length) + '</b>',
        pgPct(grp.length ? sp.length / grp.length : 0, 1),
        fmt(gc),
        vidTotCost > 0 ? pgPct(gc / vidTotCost, 1) : dim,
        '<b>' + fmt(hitN) + '</b>',
        hit == null ? dim : '<b style="color:' + (hit >= 0.5 ? '#16a34a' : (hit < 0.2 ? '#dc2626' : '#a16207')) + ';">' + pgPct(hit, 1) + '</b>',
        fmt(go),
        go > 0 ? fmt(gc / go) : dim]
    });
  }
  var sub = function (s) { return '<div style="font-weight:500;font-size:0.84em;opacity:0.75;">' + s + '</div>'; };
  var lifeH = pgTable(
    [{ t: 'Tuổi video' + sub('tính đến ' + esc(toStr)), a: 'left' },
     { t: 'Video' + sub('tổng trong nhóm'), a: 'right' },
     { t: 'Được chi' + sub('TikTok có bơm tiền'), a: 'right' },
     { t: '% được chi' + sub('được chi ÷ video'), a: 'right' },
     { t: 'Chi phí' + sub('tiền đã tiêu'), a: 'right' },
     { t: '% NS video' + sub('÷ ' + fmt(vidTotCost) + 'đ'), a: 'right' },
     { t: 'Có đơn' + sub('video ra ≥ 1 đơn'), a: 'right' },
     { t: '% ra đơn' + sub('có đơn ÷ được chi'), a: 'right' },
     { t: 'Đơn' + sub('tổng số đơn'), a: 'right' },
     { t: 'CPO' + sub('chi phí ÷ đơn'), a: 'right' }],
    bBody);
  lifeH += '<div style="margin-top:10px;font-size:0.78em;color:#64748b;line-height:1.85;">'
    + '<b>Cách đọc:</b> không phải video nào đăng lên cũng được GMV Max rót tiền — <b>Được chi</b> là số con hệ thống chịu thử. '
    + '<b>% ra đơn</b> chia trên số con <b>được chi</b> (không chia trên tổng video), vì con chưa được thử thì chưa có cơ hội, tính vào là oan. '
    + '<b>CPO</b> = mua 1 đơn hàng tốn bao nhiêu tiền ads — <b>càng thấp càng tốt</b>. '
    + '<b>% NS video</b> lấy mẫu số là tổng tiền chi cho video (' + fmt(vidTotCost) + 'đ), đã trừ phần chi cho dòng không phải video.'
    + '</div>';
  lifeH += '<div style="margin-top:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:11px 15px;font-size:0.84em;color:#92400e;line-height:1.9;">'
    + '<b>Luật rút ra:</b><br>• Ngày 0–7: cửa sổ vàng, để hệ thống test thoải mái<br>'
    + '• Ngày 8–14: chi > ' + fmt(CUT_COST) + 'đ mà 0 đơn → cảnh báo<br>'
    + '• <b>Ngày 15: chưa ra đơn thì cắt, không ngoại lệ</b><br>'
    + '• Video đã thắng tuần 1 thì giữ chạy lâu, vẫn ăn tốt ở tháng 2–3<br>'
    + '<span style="color:#b45309;">⚠️ Nhóm &gt; 30 ngày có <b>thiên lệch sống sót</b> — chỉ số ít video còn được chi tiền và đó là những con đã thắng từ trước. Đừng đọc là "video càng già càng tốt".</span></div>';
  html += pgCard('⏳ Vòng đời video — cửa sổ quyết định là 7 ngày', lifeH, '#0891b2');

  // ============ 6. TÀI KHOẢN KOC ============
  var accMap = {};
  for (var i = 0; i < vids.length; i++) {
    var x = vids[i];
    if (!accMap[x.acc]) accMap[x.acc] = { acc: x.acc, n: 0, cost: 0, rev: 0, orders: 0, hit: 0 };
    var a = accMap[x.acc];
    a.n++; a.cost += x.cost; a.rev += x.rev; a.orders += x.orders;
    if (x.orders > 0) a.hit++;
  }
  var accs = Object.keys(accMap).map(function (k) {
    var a = accMap[k];
    a.roi = a.cost > 0 ? a.rev / a.cost : null;
    a.cpo = a.orders > 0 ? a.cost / a.orders : null;
    a.hitRate = a.n > 0 ? a.hit / a.n : 0;
    return a;
  });
  var noRev = accs.filter(function (a) { return a.rev === 0; }).length;
  // Chặn "ROI ảo": tài khoản chi vài trăm đồng mà ra đơn là do đơn organic được attribute
  var MIN_ACC_COST = 5000;
  var good = accs.filter(function (a) { return a.roi != null && a.roi >= SCALE_ROI && a.orders > 0 && a.cost >= MIN_ACC_COST; }).sort(function (x, y) { return y.roi - x.roi; }).slice(0, 8);
  var bad = accs.filter(function (a) { return a.cost > 0; }).sort(function (x, y) { return y.cost - x.cost; })
    .filter(function (a) { return a.roi == null || a.roi < (tAll.roi || 0); }).slice(0, 6);

  var accCols = [{ t: 'Tài khoản', a: 'left' }, { t: 'Video', a: 'right' }, { t: 'Chi phí', a: 'right' }, { t: 'Doanh thu', a: 'right' }, { t: 'ROI', a: 'right' }, { t: 'CPO', a: 'right' }, { t: 'Hit rate', a: 'right' }];
  var accRow = function (col) {
    return function (a) {
      return { cells: [esc(a.acc), fmt(a.n), fmt(a.cost), fmt(a.rev), '<b style="color:' + col + ';">' + pgRoi(a.roi) + '</b>', a.cpo != null ? fmt(a.cpo) : '—', pgPct(a.hitRate, 1)] };
    };
  };
  var kocH = '<div style="font-size:0.85em;color:#475569;margin-bottom:10px;"><b>' + accs.length + ' tài khoản</b> · chỉ <b style="color:#16a34a;">' + (accs.length - noRev) + '</b> có doanh thu · <b style="color:#dc2626;">' + noRev + ' tài khoản (' + pgPct(accs.length ? noRev / accs.length : 0, 0) + ')</b> không ra đơn nào.</div>';
  kocH += '<div style="font-weight:700;font-size:0.85em;color:#15803d;margin:12px 0 6px;">🚀 Nên tăng sản lượng gấp <span style="font-weight:500;color:#94a3b8;">(ROI ≥ ' + SCALE_ROI + ', đã lọc bỏ tài khoản chi &lt; ' + fmt(MIN_ACC_COST) + 'đ vì ROI ảo)</span></div>';
  kocH += good.length ? pgTable(accCols, good.map(accRow('#16a34a'))) : '<div style="font-size:0.85em;color:#64748b;">Không có tài khoản nào đạt ROI ≥ ' + SCALE_ROI + '.</div>';
  kocH += '<div style="font-weight:700;font-size:0.85em;color:#b91c1c;margin:16px 0 6px;">🐌 Đang chiếm sản lượng nhưng kém hiệu quả</div>';
  kocH += bad.length ? pgTable(accCols, bad.map(accRow('#dc2626'))) : '<div style="font-size:0.85em;color:#64748b;">Không có tài khoản nào.</div>';
  html += pgCard('👤 Tài khoản KOC — ai đáng đẩy, ai nên giảm', kocH, '#db2777');

  // ============ 7. CHỈ SỐ NÀO THẬT SỰ DỰ BÁO RA ĐƠN ============
  var pool = vids.filter(function (x) { return x.imp >= 100; });
  var metH = '';
  if (pool.length >= 20) {
    var metrics = [
      { k: 'clicks', t: 'Số click tuyệt đối' }, { k: 'imp', t: 'Impression' },
      { k: 'ctr', t: 'CTR (tỷ lệ nhấp)' }, { k: 'v100', t: 'Xem hết 100%' },
      { k: 'v50', t: 'Xem 50%' }, { k: 'v75', t: 'Xem 75%' },
      { k: 'v2', t: 'Tỷ lệ xem 2 giây' }, { k: 'v6', t: 'Tỷ lệ xem 6 giây' }
    ];
    var base = pool.filter(function (x) { return x.orders > 0; }).length / pool.length;
    var mBody = [];
    for (var m = 0; m < metrics.length; m++) {
      var key = metrics[m].k;
      var srt = pool.slice().sort(function (a, b) { return a[key] - b[key]; });
      var q = Math.floor(srt.length / 4);
      if (q < 3) continue;
      var q1 = srt.slice(0, q), q4 = srt.slice(srt.length - q);
      var r1 = q1.filter(function (x) { return x.orders > 0; }).length / q1.length;
      var r4 = q4.filter(function (x) { return x.orders > 0; }).length / q4.length;
      var diff = (r4 - r1) * 100;
      var verdict = diff >= 10 ? '<b style="color:#16a34a;">✅ có tín hiệu</b>' : (Math.abs(diff) < 5 ? '<b style="color:#dc2626;">❌ vô dụng</b>' : '<span style="color:#a16207;">➖ nhiễu</span>');
      mBody.push({
        bg: diff >= 10 ? '#f0fdf4' : (Math.abs(diff) < 5 ? '#fef2f2' : '#fff'),
        cells: [metrics[m].t, pgPct(r1, 1), pgPct(r4, 1),
          '<b style="color:' + (diff >= 10 ? '#16a34a' : (Math.abs(diff) < 5 ? '#dc2626' : '#a16207')) + ';">' + (diff >= 0 ? '+' : '') + diff.toFixed(1).replace('.', ',') + ' đ%</b>', verdict]
      });
    }
    metH += '<div style="font-size:0.85em;color:#475569;margin-bottom:10px;">Xét <b>' + pool.length + ' video có ≥ 100 impression</b>. Tỷ lệ ra đơn nền = <b>' + pgPct(base, 1) + '</b>. Chia 4 nhóm theo từng chỉ số, so nhóm thấp nhất với nhóm cao nhất.</div>';
    metH += pgTable([{ t: 'Chỉ số', a: 'left' }, { t: 'Nhóm thấp ra đơn', a: 'right' }, { t: 'Nhóm cao ra đơn', a: 'right' }, { t: 'Chênh lệch', a: 'right' }, { t: 'Kết luận', a: 'right' }], mBody);
    metH += '<div style="margin-top:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:11px 15px;font-size:0.84em;color:#1e40af;line-height:1.9;">'
      + '<b>Cách đọc:</b> chỉ số nào <b style="color:#dc2626;">❌ vô dụng</b> nghĩa là video kém nhất và tốt nhất ở chỉ số đó có xác suất ra đơn <b>y hệt nhau</b> → đang chấm KOC theo chỉ số đó là đang chấm một biến ngẫu nhiên, <b>bỏ khỏi brief</b>.<br>'
      + 'Quyết định thường là <b>khối lượng (click, impression)</b> chứ không phải tỷ lệ. Tỷ lệ đẹp trên mẫu nhỏ là ảo giác.</div>';
  } else {
    metH = '<div style="font-size:0.85em;color:#64748b;">Chưa đủ video có ≥100 impression (' + pool.length + ') để kiểm định chỉ số.</div>';
  }
  html += pgCard('🔬 Chỉ số nào thật sự dự báo ra đơn', metH, '#0d9488');

  // ============ 8. THỨ TỰ THỰC THI ============
  var steps = [];
  if (kill.length) steps.push('<b>Tắt ' + kill.length + ' video</b> nhóm 🔴 → thu về <b>' + fmt(killCost) + 'đ</b>');
  if (blocked.length) steps.push('<b>Gỡ chặn ' + blocked.length + ' video</b> đang "Không khả dụng" mà đã ra ' + fmt(blOrd) + ' đơn');
  if (early.length) steps.push('<b>Đặt lịch soi ' + early.length + ' video nhóm 🟣</b> (đang đốt ' + fmt(earlyCost) + 'đ, tuổi ' + EARLY_DAY + '–' + (CUT_DAY - 1) + ' ngày) — chạm ngày ' + (CUT_DAY + 1) + ' còn 0 đơn thì cắt');
  if (auth.length) steps.push('<b>Xin ủy quyền ' + auth.length + ' video</b> đã có đơn organic (' + fmt(auRev) + 'đ)');
  if (capList.length) steps.push('<b>Tách trần ngân sách</b> cho ' + capList.length + ' dòng ăn nhiều tiền mà ROI kém');
  if (scale.length) steps.push('<b>Bơm thêm tiền cho ' + scale.length + ' video nhóm 🔵 SCALE</b> (đang ROI ' + pgRoi(scCost > 0 ? scRev / scCost : null) + ') — tăng dần từng bậc, đo lại sau mỗi bậc');
  if (gray.length) steps.push('<b>Mổ ' + gray.length + ' dòng ⚪ VÙNG XÁM</b> (' + fmt(grCost) + 'đ): CTR yếu → sửa video; CTR ổn mà CVR yếu → sửa giá/trang sản phẩm');
  if (good.length) steps.push('<b>Phân bổ lại sản lượng KOC</b> — tăng ' + good.slice(0, 3).map(function (a) { return esc(a.acc); }).join(', ') + '; giảm ' + (bad.length ? esc(bad[0].acc) : 'nhóm kém'));
  steps.push('<b>Áp luật cắt ngày-15</b> làm quy trình cố định');
  steps.push('<b>Dừng đăng lô hàng loạt</b> — giãn đều 5–8 video/ngày');
  var stH = '<ol style="margin:0;padding-left:22px;font-size:0.88em;color:#334155;line-height:2.1;">';
  for (var i = 0; i < steps.length; i++) stH += '<li>' + steps[i] + '</li>';
  stH += '</ol>';
  html += pgCard('✅ Thứ tự thực thi', stH, '#16a34a');

  html += '<div style="margin-top:14px;font-size:0.76em;color:#94a3b8;line-height:1.8;">Giới hạn: dữ liệu là 1 ảnh chụp của kỳ, không có số liệu theo ngày → phần vòng đời suy ra từ so sánh chéo. ROI của nhóm chi rất nhỏ (&lt;1.000đ) là ảo vì đơn organic được attribute — không dùng để xếp hạng. Nên hiệu chỉnh lại ngưỡng sau 1–2 kỳ có thêm dữ liệu.</div>';

  window._pgmvData = { idGroups: idGroups, all: all, vids: vids, tAll: tAll };
  var dash = document.getElementById('pgmvDashboard');
  dash.innerHTML = html;
  dash.style.display = '';
}

function pgD(d) {
  if (!d) return '—';
  var dd = d.getDate(), mm = d.getMonth() + 1;
  return (dd < 10 ? '0' : '') + dd + '/' + (mm < 10 ? '0' : '') + mm + '/' + String(d.getFullYear()).slice(2);
}

function clearKhungGio() {
  document.getElementById('khungGioDashboard').style.display = 'none';
  document.getElementById('kgSaleSection').innerHTML = '';
  document.getElementById('kgNormalSection').innerHTML = '';
  window._khungGioData = null;
  for (var i = 1; i <= 3; i++) {
    var inp = document.getElementById('fileKG' + i);
    if (inp) inp.value = '';
    var hint = document.getElementById('hintKG' + i);
    if (hint) { hint.textContent = 'Chưa chọn file'; hint.className = 'file-hint'; }
  }
}

// ========== KHUNG GIỜ VÀNG — SHOPEE ==========
// Dùng chung toàn bộ bộ não của tab TikTok (isSaleDay / kgBuildDataset / kgFindTop3
// / kgSectionHtml / kgBudgetBlockHtml). Chỉ khác ở khâu đọc file: Shopee dùng cột
// "Ngày đặt hàng" (2026-05-01 00:00) và "Tổng giá trị đơn hàng (VND)".

// Shopee ghi giờ dạng YYYY-MM-DD HH:MM. Có file XLSX trả về kiểu Date -> nhận cả hai.
function spKgTime(v) {
  if (v == null) return null;
  if (v instanceof Date && !isNaN(v)) return { y: v.getFullYear(), mo: v.getMonth() + 1, d: v.getDate(), h: v.getHours() };
  var s = String(v).trim();
  if (!s || s === '-') return null;
  var m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/);
  if (m) return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4] };
  m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\D+(\d{1,2}):(\d{2})/);   // dự phòng DD/MM/YYYY
  if (m) return { y: +m[3], mo: +m[2], d: +m[1], h: +m[4] };
  return null;
}

// Nhãn tháng của riêng 1 lô file (hiện ở dòng gợi ý dưới ô chọn file)
function spKgSlotMonths(rows) {
  var keys = Object.keys(rows[0] || {});
  var kt = keys.find(function (k) { return k && k.indexOf('Ngày đặt hàng') >= 0; }) || '';
  if (!kt) return '';
  var set = {};
  for (var i = 0; i < rows.length; i++) {
    var t = spKgTime(rows[i][kt]);
    if (t) set['Tháng ' + t.mo + '/' + t.y] = t.y * 100 + t.mo;
  }
  var names = Object.keys(set).sort(function (a, b) { return set[a] - set[b]; });
  return names.join(', ');
}

async function processSpKhungGio() {
  var slots = [];
  for (var fi = 1; fi <= 3; fi++) {
    var inp = document.getElementById('spFileKG' + fi);
    if (inp && inp.files && inp.files.length) slots.push({ idx: fi, files: Array.prototype.slice.call(inp.files) });
  }
  if (!slots.length) { alert('Vui lòng chọn ít nhất 1 file đơn hàng Shopee!'); return; }

  var nFile = 0;
  for (var si = 0; si < slots.length; si++) nFile += slots[si].files.length;
  showLoading('🕐 Đang phân tích Khung Giờ Vàng Shopee...', 'Đang đọc ' + nFile + ' file');
  try {
    await new Promise(function (r) { setTimeout(r, 100); });
    var allRows = [];
    for (var s = 0; s < slots.length; s++) {
      var slotRows = [];
      for (var f = 0; f < slots[s].files.length; f++) {
        var d = await parseXlsx(slots[s].files[f]);
        slotRows = slotRows.concat(d.rows);
      }
      allRows = allRows.concat(slotRows);
      var hint = document.getElementById('spHintKG' + slots[s].idx);
      if (hint) {
        var mm = spKgSlotMonths(slotRows);
        hint.textContent = '✅ ' + slots[s].files.length + ' file — ' + fmt(slotRows.length) + ' dòng' + (mm ? ' (' + mm + ')' : '');
        hint.className = 'file-hint loaded';
      }
    }
    renderSpKhungGio(allRows);
    hideLoading();
  } catch (err) {
    hideLoading();
    alert('Lỗi: ' + err.message);
    console.error(err);
  }
}

function renderSpKhungGio(rows) {
  if (!rows.length) { alert('File không có dòng dữ liệu nào!'); return; }
  var keys = Object.keys(rows[0] || {});
  var fk = function (s) { return keys.find(function (k) { return k && k.indexOf(s) >= 0; }) || ''; };
  var C = {
    id: fk('Mã đơn hàng'),
    time: fk('Ngày đặt hàng'),
    amount: fk('Tổng giá trị đơn hàng')
  };
  if (!C.id || !C.time || !C.amount) {
    alert('File thiếu cột bắt buộc. Cần có: Mã đơn hàng · Ngày đặt hàng · Tổng giá trị đơn hàng (VND).');
    return;
  }

  // 1 đơn = nhiều dòng SKU, giá trị đơn lặp lại y hệt trên mọi dòng -> lấy max, không cộng dồn.
  var om = {}, order = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var oid = String(r[C.id] == null ? '' : r[C.id]).trim();
    if (!oid) continue;
    var o = om[oid];
    if (!o) { o = om[oid] = { amount: 0, t: null }; order.push(oid); }
    var a = spNum(r[C.amount]);
    if (a > o.amount) o.amount = a;
    if (!o.t) o.t = spKgTime(r[C.time]);
  }

  var allOrders = [], monthSet = {};
  for (var k = 0; k < order.length; k++) {
    var od = om[order[k]];
    if (!od.t) continue;
    var label = 'Tháng ' + od.t.mo + '/' + od.t.y;
    monthSet[label] = od.t.y * 100 + od.t.mo;
    allOrders.push({
      hour: od.t.h, amount: od.amount, month: label,
      day: od.t.d, monthNum: od.t.mo, isSale: isSaleDaySp(od.t.d, od.t.mo)
    });
  }
  if (!allOrders.length) { alert('Không đọc được ngày giờ đặt hàng nào trong file!'); return; }

  // Tháng lấy từ chính ngày của đơn, không lấy theo ô upload -> file bị cắt part 1/part 2 vẫn gộp đúng
  var monthNames = Object.keys(monthSet).sort(function (a, b) { return monthSet[a] - monthSet[b]; });

  var saleOrders = [], normalOrders = [];
  for (var j = 0; j < allOrders.length; j++) {
    if (allOrders[j].isSale) saleOrders.push(allOrders[j]); else normalOrders.push(allOrders[j]);
  }
  var dSale = kgBuildDataset(saleOrders, monthNames);
  var dNormal = kgBuildDataset(normalOrders, monthNames);

  var noteParts = [];
  for (var mj = 0; mj < monthNames.length; mj++) {
    var dset = dSale.datesByMonth[monthNames[mj]];
    if (!dset) continue;
    var mm = monthNames[mj].match(/Tháng (\d+)/);
    var mPad = mm ? (parseInt(mm[1]) < 10 ? '0' + parseInt(mm[1]) : String(parseInt(mm[1]))) : '';
    var days = Object.keys(dset).map(Number).sort(function (a, b) { return a - b; });
    noteParts.push('<b>' + esc(monthNames[mj]) + ':</b> ' + days.map(function (x) { return (x < 10 ? '0' : '') + x + '/' + mPad; }).join(', '));
  }
  var saleNote = 'Shopee tính đúng <b>3 ngày sale</b> mỗi tháng: <b>ngày đôi</b> (ngày trùng số tháng, vd 8/8) &bull; <b>ngày 15</b> (sale giữa tháng) &bull; <b>ngày 25</b> (sale cuối tháng). Toàn bộ ngày còn lại là ngày thường.'
    + (noteParts.length ? '<br>Kỳ này &mdash; ' + noteParts.join(' &nbsp;|&nbsp; ') : '');

  document.getElementById('spKgSaleSection').innerHTML = kgSectionHtml(dSale, {
    key: 'spsale', isSale: true, saleFn: isSaleDaySp, icon: '🔥', title: 'Ngày sale', sub: '',
    headBg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', headColor: '#c2410c', border: '#fdba74',
    note: saleNote
  });
  document.getElementById('spKgNormalSection').innerHTML = kgSectionHtml(dNormal, {
    key: 'spnormal', isSale: false, saleFn: isSaleDaySp, icon: '📊', title: 'Ngày thường', sub: '(đã trừ 3 ngày sale)',
    headBg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', headColor: '#1d4ed8', border: '#93c5fd',
    note: ''
  });

  window._spKhungGioData = { monthNames: monthNames, sale: dSale, normal: dNormal };
  document.getElementById('spKhungGioDashboard').style.display = '';
  kgRecalcBudget('spsale');
  kgRecalcBudget('spnormal');
}

function clearSpKhungGio() {
  document.getElementById('spKhungGioDashboard').style.display = 'none';
  document.getElementById('spKgSaleSection').innerHTML = '';
  document.getElementById('spKgNormalSection').innerHTML = '';
  window._spKhungGioData = null;
  for (var i = 1; i <= 3; i++) {
    var inp = document.getElementById('spFileKG' + i);
    if (inp) inp.value = '';
    var hint = document.getElementById('spHintKG' + i);
    if (hint) { hint.textContent = 'Chưa chọn file'; hint.className = 'file-hint'; }
  }
}

function exportSpKhungGio() {
  var d = window._spKhungGioData;
  if (!d || !d.sale) { alert('Chưa có dữ liệu! Hãy phân tích trước.'); return; }
  kgExportWorkbook(d, 'SHOPEE', 'Khung_Gio_Vang_Shopee_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function exportKhungGio() {
  var d = window._khungGioData;
  if (!d || !d.sale) { alert('Chưa có dữ liệu! Hãy phân tích trước.'); return; }
  kgExportWorkbook(d, 'TIKTOK SHOP', 'Khung_Gio_Vang_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

// Xuất Excel dùng chung cho cả TikTok lẫn Shopee
function kgExportWorkbook(d, plat, fileName) {
  var wb = XLSX.utils.book_new();

  function sheetFor(ds, title) {
    var header = ['Giờ'];
    for (var mi = 0; mi < ds.monthNames.length; mi++) header.push(ds.monthNames[mi]);
    header.push('Tổng cộng', 'Đơn', '% Doanh thu');

    var t = kgFindTop3(ds.hourTotals, ds.totalGmv);
    var rows = [
      ['KHUNG GIỜ VÀNG — ' + plat + ' — ' + title + ' — DUNG PHÁT'],
      ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
      ['Số ngày:', ds.dayCount, 'Tổng GMV:', ds.totalGmv, 'TB/ngày:', ds.dayCount > 0 ? Math.round(ds.totalGmv / ds.dayCount) : 0],
      []
    ];
    for (var i = 0; i < t.ranges.length; i++) {
      var r = t.ranges[i];
      rows.push(['Khung giờ #' + (i + 1), kgHH(r.start) + ' - ' + kgHH(r.end), r.gmv, r.pct.toFixed(2) + '%', r.len + ' giờ', r.orders + ' đơn']);
    }
    if (t.ranges.length) rows.push(['3 khung cộng lại', t.hours + '/24 giờ', t.gmv, t.pct.toFixed(1) + '%', '', t.orders + ' đơn']);
    rows.push([]);
    rows.push(header);

    for (var h = 0; h < 24; h++) {
      var row = [(h < 10 ? '0' : '') + h];
      for (var mi2 = 0; mi2 < ds.monthNames.length; mi2++) row.push(ds.hourData[h][ds.monthNames[mi2]] || 0);
      row.push(ds.hourTotals[h].total, ds.hourTotals[h].orders, ds.hourTotals[h].pct.toFixed(2) + '%');
      rows.push(row);
    }

    var totalRow = ['Tổng cộng'];
    for (var mi3 = 0; mi3 < ds.monthNames.length; mi3++) {
      var mTotal = 0;
      for (var h2 = 0; h2 < 24; h2++) mTotal += ds.hourData[h2][ds.monthNames[mi3]] || 0;
      totalRow.push(mTotal);
    }
    totalRow.push(ds.totalGmv, ds.totalOrders, '100%');
    rows.push(totalRow);

    var ws = XLSX.utils.aoa_to_sheet(rows);
    var cols = [{ wch: 10 }];
    for (var mi4 = 0; mi4 < ds.monthNames.length; mi4++) cols.push({ wch: 18 });
    cols.push({ wch: 18 }, { wch: 10 }, { wch: 13 });
    ws['!cols'] = cols;
    return ws;
  }

  XLSX.utils.book_append_sheet(wb, sheetFor(d.sale, 'NGÀY SALE'), 'Ngày Sale');
  XLSX.utils.book_append_sheet(wb, sheetFor(d.normal, 'NGÀY THƯỜNG'), 'Ngày Thường');
  XLSX.writeFile(wb, fileName);
}
