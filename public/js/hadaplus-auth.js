
// ===== HADAPLUS AUTH & VIP INITIALIZATION =====
(function() {
  const SUPABASE_URL = 'https://qotrwydgsnpqzvausldc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdHJ3eWRnc25wcXp2YXVzbGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjkyOTgsImV4cCI6MjA4ODg0NTI5OH0.Fl3zryvbRjfwuDWg_s1d-4UDTp3Hmn4RcuxY-YBCYXk';
  try {
    if (window.supabase) {
      window.__sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch(e) {
    console.warn('Supabase init warning:', e);
  }

  function initVipUser() {
    var overlay = document.getElementById('auth-guard-overlay');
    if (overlay) overlay.style.display = 'none';
    var userBar = document.getElementById('user-bar');
    if (userBar) userBar.style.display = 'block';

    window._currentUserId = 'phat_kddp_vip';
    window.__ubDangXuat = function () {
      if (confirm('Bạn có muốn xóa dữ liệu đã lưu trên trình duyệt và tải lại trang không?')) {
        localStorage.clear();
        window.location.reload();
      }
    };

    if (typeof ubKhoiTao === 'function') {
      ubKhoiTao('phat.kddp@gmail.com', null, 'admin', 'email');
    }
    setTimeout(function() {
      try {
        if (typeof moLaiTabCu === 'function') moLaiTabCu();
      } catch (e) {}
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVipUser);
  } else {
    initVipUser();
  }
})();


// ===== Thanh tài khoản góc dưới trái =====
var _ubInfo = null;

// Thanh tài khoản nổi đè lên menu. Đo chiều cao thật của nó rồi chừa đúng
// chừng ấy ở đáy menu, để mục cuối cùng không bị che. Đo thay vì gõ cứng số
// vì email dài sẽ làm thanh cao lên.
function ubCanhMenu() {
  var bar = document.getElementById('user-bar');
  var nav = document.querySelector('.app-navbar');
  if (!bar || !nav) return;
  var h = bar.offsetHeight || 69;
  nav.style.paddingBottom = (h + 10) + 'px';
}
window.addEventListener('resize', function () { setTimeout(ubCanhMenu, 60); });

function ubNgayCon(exp) {
  return exp ? Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000) : null;
}

function ubKhoiTao(email, hetHan, vaiTro, cachDangNhap) {
  _ubInfo = { email: email || '', exp: hetHan || null, role: vaiTro || 'member',
              provider: cachDangNhap || 'email' };
  document.getElementById('ub-avatar').textContent = (_ubInfo.email || '?').charAt(0);
  document.getElementById('ub-email').textContent = _ubInfo.email;
  ubCanhMenu();

  var el = document.getElementById('ub-expiry');
  if (!_ubInfo.exp) { el.textContent = '♾️ Vĩnh viễn'; el.className = ''; return; }
  var con = ubNgayCon(_ubInfo.exp);
  el.textContent = con > 0 ? 'Còn ' + con + ' ngày' : 'Đã hết hạn';
  el.className = con <= 3 ? 'danger' : (con <= 7 ? 'warn' : '');
}

function ubMo(ev) {
  if (ev) ev.stopPropagation();
  var m = document.getElementById('ub-menu');
  if (m.classList.contains('show')) { ubDong(); return; }
  ubVe();
  m.classList.add('show');
  document.getElementById('ub-trigger').classList.add('open');
  setTimeout(function () {
    document.addEventListener('click', ubNgoai);
    document.addEventListener('keydown', ubPhim);
  }, 0);
}

function ubDong() {
  document.getElementById('ub-menu').classList.remove('show');
  document.getElementById('ub-trigger').classList.remove('open');
  document.removeEventListener('click', ubNgoai);
  document.removeEventListener('keydown', ubPhim);
}

function ubNgoai(e) {
  var m = document.getElementById('ub-menu'), t = document.getElementById('ub-trigger');
  if (!m.contains(e.target) && !t.contains(e.target)) ubDong();
}
function ubPhim(e) { if (e.key === 'Escape') ubDong(); }

function ubVe() {
  var i = _ubInfo || { email: '', exp: null, role: 'member' };
  var con = ubNgayCon(i.exp);
  var vinhVien = !i.exp;
  var esc = (typeof ghEsc === 'function') ? ghEsc
          : function (x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  var h = '<div class="ub-head">'
    + '<span class="ub-avatar">' + esc((i.email || '?').charAt(0)) + '</span>'
    + '<div style="min-width:0"><div class="ub-head-email">' + esc(i.email) + '</div>'
    + (i.role === 'admin' ? '<span class="ub-role ad">⚙️ Quản trị viên</span>' : '')
    + (vinhVien ? '<span class="ub-role vv">♾️ Vĩnh viễn</span>' : '')
    + '</div></div>';

  if (!vinhVien) {
    var mau = con <= 3 ? '#dc2626' : (con <= 7 ? '#d97706' : '#16a34a');
    // Thanh chỉ mang tính trực quan: đầy khi còn từ 30 ngày trở lên
    var pct = Math.max(0, Math.min(100, (con / 30) * 100));
    h += '<div class="ub-han">'
      + '<div class="ub-han-top"><span class="ub-han-lbl">Hạn sử dụng</span>'
      + '<span class="ub-han-con" style="color:' + mau + '">'
      + (con > 0 ? 'còn ' + con + ' ngày' : 'đã hết hạn') + '</span></div>'
      + '<div class="ub-han-ngay">' + new Date(i.exp).toLocaleDateString('vi-VN') + '</div>'
      + '<div class="ub-thanh"><i style="width:' + pct.toFixed(0) + '%;background:' + mau + '"></i></div>'
      + '</div>';
  }

  if (!vinhVien) {
    h += '<button class="ub-item pri" type="button" onclick="ubDong();ghOpen()">'
      + '<span class="ic">💳</span> Gia hạn tài khoản</button>';
  }
  h += '<button class="ub-item" type="button" onclick="ubDong();mkMo()">'
    + '<span class="ic">🔑</span> ' + (i.provider === 'google' ? 'Đặt mật khẩu' : 'Đổi mật khẩu') + '</button>';
  h += '<button class="ub-item" type="button" onclick="ubDong();switchTab(\'huong-dan\')">'
    + '<span class="ic">📖</span> Hướng dẫn sử dụng</button>';
  h += '<div class="ub-vach"></div>';
  h += '<button class="ub-item dan" type="button" onclick="ubDong();window.__ubDangXuat&&window.__ubDangXuat()">'
    + '<span class="ic">🚪</span> Đăng xuất</button>';

  document.getElementById('ub-menu').innerHTML = h;
}

// ---- Thông tin nhận tiền. Đổi ở đây nếu thay tài khoản ngân hàng. ----
var GH_BANK = 'ACB';
var GH_ACC  = '48870427';
var GH_NAME = 'HO KINH DOANH TRUONG HAI DANG';
var GH_ZALO = '0393060017';

var _ghPoll = null, _ghPlans = null, _ghExp = null, _ghNapXong = null;

// Mỗi lần hỏi Supabase mất ~300-400ms. Trước đây hỏi 3 lần NỐI TIẾP nhau nên
// khách bấm phải chờ ~1 giây. Giờ gộp lại chạy SONG SONG và nạp sẵn ngay khi
// vào tool, nên lúc khách bấm thì dữ liệu đã nằm sẵn trong máy.
function ghNap(lamMoi) {
  if (_ghNapXong && !lamMoi) return _ghNapXong;
  _ghNapXong = (async function () {
    var sb = window.__sb;
    if (!sb) {
      _ghPlans = [
        { months: 1, amount: 199000, label: '1 Tháng', note: 'Dành cho cá nhân trải nghiệm', sort: 1 },
        { months: 3, amount: 499000, label: '3 Tháng', note: 'Tiết kiệm 20% chi phí', sort: 2 },
        { months: 6, amount: 899000, label: '6 Tháng', note: 'Phổ biến nhất (Khuyên dùng)', sort: 3 },
        { months: 12, amount: 1499000, label: '12 Tháng', note: 'Tiết kiệm tối đa cho Doanh nghiệp & Shop lớn', sort: 4 }
      ];
      _ghExp = null;
      _ghBuyer = { buyer_email: (_ubInfo && _ubInfo.email) || 'phat.kddp@gmail.com', buyer_type: 'ca_nhan' };
      _ghType = 'ca_nhan';
      return;
    }
    var ses = (await sb.auth.getSession()).data.session;   // đọc trong máy, không gọi mạng
    var u = ses && ses.user;
    var kq = await Promise.all([
      sb.from('plans').select('months,amount,label,note,sort').eq('active', true).order('sort'),
      u ? sb.from('profiles').select('expires_at').eq('id', u.id).single() : Promise.resolve({ data: null }),
      sb.from('payment_requests')
        .select('buyer_type,buyer_name,buyer_company,buyer_tax_id,buyer_phone,buyer_address,buyer_id_no,buyer_email')
        .not('buyer_phone', 'is', null).order('created_at', { ascending: false }).limit(1)
    ]);
    if (kq[0].error) throw kq[0].error;
    _ghPlans = kq[0].data || [];
    _ghExp = (kq[1] && kq[1].data) ? kq[1].data.expires_at : null;
    _ghBuyer = (kq[2] && kq[2].data && kq[2].data[0]) ? kq[2].data[0] : {};
    if (!_ghBuyer.buyer_email && u) _ghBuyer.buyer_email = u.email;
    _ghType = (_ghBuyer.buyer_type === 'doanh_nghiep') ? 'doanh_nghiep' : 'ca_nhan';
  })();
  _ghNapXong.catch(function () { _ghNapXong = null; });   // lỗi thì lần sau nạp lại
  return _ghNapXong;
}

function ghMoney(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
function ghEsc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function ghClose() {
  document.getElementById('gh-overlay').classList.remove('show');
  if (_ghPoll) { clearInterval(_ghPoll); _ghPoll = null; }
}

async function ghOpen() {
  var ov = document.getElementById('gh-overlay');
  var body = document.getElementById('gh-body');
  ov.classList.add('show');

  if (_ghPlans) { ghVeBangGia(); return; }     // đã nạp sẵn -> hiện ngay, khỏi chờ
  body.innerHTML = '<div style="text-align:center;padding:30px 0;color:#64748b;font-size:13px;">Đang tải bảng giá...</div>';

  try {
    await ghNap();
  } catch (e) {
    body.innerHTML = '<div style="color:#dc2626;font-size:13px;line-height:1.7;">Không tải được bảng giá: ' + ghEsc(e.message || e)
      + '<br><br>Vui lòng tải lại trang, hoặc liên hệ Zalo <b>' + ghEsc(GH_ZALO) + '</b>.</div>';
    return;
  }

  ghVeBangGia();
}

function ghVeBangGia() {
  var body = document.getElementById('gh-body');
  var sub = document.getElementById('gh-sub');
  if (_ghExp) {
    var d = new Date(_ghExp), con = Math.ceil((d - Date.now()) / 86400000);
    sub.innerHTML = con > 0
      ? 'Hạn hiện tại: <b>' + d.toLocaleDateString('vi-VN') + '</b> (còn ' + con + ' ngày). Gia hạn sớm <b>không mất ngày nào</b> — thời gian còn lại được cộng thêm.'
      : 'Tài khoản đã hết hạn ngày <b>' + d.toLocaleDateString('vi-VN') + '</b>. Chọn gói để mở lại ngay.';
  }

  var h = '<div class="gh-plans">';
  for (var i = 0; i < _ghPlans.length; i++) {
    var pl = _ghPlans[i];
    var best = pl.months === 12;
    h += '<button class="gh-plan' + (best ? ' best' : '') + '" onclick="ghPick(' + pl.months + ')">';
    if (pl.note) h += '<span class="tag">' + ghEsc(pl.note) + '</span>';
    h += '<div class="m">' + ghEsc(pl.label) + '</div>';
    h += '<div class="p">' + ghMoney(pl.amount) + '</div>';
    h += '<div class="pm">' + ghMoney(Math.round(pl.amount / pl.months)) + '/tháng</div>';
    h += '</button>';
  }
  h += '</div>';
  h += '<div class="gh-note">Thanh toán bằng chuyển khoản ngân hàng. Sau khi chuyển, tài khoản được gia hạn <b>tự động trong khoảng 30 giây</b>.</div>';
  body.innerHTML = h;
}

// Bấm chọn gói -> thông tin xuất hoá đơn -> QR.
// Lần đầu thì điền form; những lần sau chỉ cần xác nhận lại thông tin đã lưu.
var _ghBuyer = null;      // thông tin lần trước
var _ghType = 'ca_nhan';  // ca_nhan | doanh_nghiep

function ghPick(months) {
  // Dữ liệu đã nạp sẵn từ ghNap() nên bước này hiện ra ngay, không phải chờ mạng
  var cu = _ghBuyer || {};
  if (ghDuThongTin(cu)) ghConfirmHtml(months);
  else ghFormHtml(months);
}

// Đã có đủ thông tin để xuất hoá đơn hay chưa
function ghDuThongTin(cu) {
  if (!cu || !cu.buyer_phone || !cu.buyer_address || !cu.buyer_email) return false;
  return (cu.buyer_type === 'doanh_nghiep')
    ? !!(cu.buyer_company && cu.buyer_tax_id && cu.buyer_name)
    : !!(cu.buyer_name && cu.buyer_id_no);
}

function ghGoiBox(months) {
  var pl = null;
  for (var i = 0; _ghPlans && i < _ghPlans.length; i++) if (_ghPlans[i].months === months) pl = _ghPlans[i];
  return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:11px 14px;margin-bottom:16px;font-size:13px;color:#334155;">'
    + 'Gói đã chọn: <b>' + ghEsc(pl ? pl.label : months + ' tháng') + '</b> — <b style="color:#dc2626">'
    + ghMoney(pl ? pl.amount : 0) + '</b></div>';
}

// ---- Màn hình XÁC NHẬN (từ lần gia hạn thứ 2 trở đi) ----
function ghConfirmHtml(months) {
  var cu = _ghBuyer, dn = cu.buyer_type === 'doanh_nghiep';
  var dong = function (k, v) {
    if (!v) return '';
    return '<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #f1f5f9;">'
      + '<span style="font-size:12px;color:#64748b;min-width:104px;flex-shrink:0;">' + k + '</span>'
      + '<span style="font-size:13px;color:#1e293b;font-weight:600;word-break:break-word;">' + ghEsc(v) + '</span></div>';
  };

  var h = ghGoiBox(months);
  h += '<div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:10px;">🧾 Thông tin xuất hoá đơn</div>';
  h += '<div style="border:1.5px solid #e2e8f0;border-radius:11px;padding:4px 15px 10px;margin-bottom:14px;background:#fcfcfd;">';
  h += '<div style="margin:11px 0 4px;"><span style="display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;'
    + (dn ? 'background:#ede9fe;color:#6d28d9;">🏢 Doanh nghiệp' : 'background:#e0f2fe;color:#0369a1;">👤 Cá nhân') + '</span></div>';
  if (dn) {
    h += dong('Tên đơn vị', cu.buyer_company);
    h += dong('Mã số thuế', cu.buyer_tax_id);
    h += dong('Người liên hệ', cu.buyer_name);
  } else {
    h += dong('Họ tên', cu.buyer_name);
    h += dong('Số CCCD', cu.buyer_id_no);
  }
  h += dong('Địa chỉ', cu.buyer_address);
  h += dong('Điện thoại', cu.buyer_phone);
  h += dong('Email', cu.buyer_email);
  h += '</div>';

  h += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:10px 13px;margin-bottom:14px;font-size:12.5px;color:#1d4ed8;line-height:1.65;">'
    + '📧 Hoá đơn sẽ được gửi qua email <b>' + ghEsc(cu.buyer_email) + '</b></div>';

  h += '<button class="gh-btn" onclick="ghConfirmSubmit(' + months + ')">✓ Xác nhận &amp; Thanh toán</button>';
  h += '<div style="display:flex;gap:14px;justify-content:center;margin-top:12px;">'
    + '<button class="gh-back" style="margin-top:0" onclick="ghFormHtml(' + months + ')">✏️ Sửa thông tin</button>'
    + '<button class="gh-back" style="margin-top:0" onclick="ghOpen()">← Chọn gói khác</button></div>';
  document.getElementById('gh-body').innerHTML = h;
}

async function ghConfirmSubmit(months) {
  var cu = _ghBuyer;
  await ghGuiDon(months, {
    type: cu.buyer_type === 'doanh_nghiep' ? 'doanh_nghiep' : 'ca_nhan',
    name: cu.buyer_name || '', company: cu.buyer_company || '', tax_id: cu.buyer_tax_id || '',
    phone: cu.buyer_phone || '', address: cu.buyer_address || '',
    id_no: cu.buyer_id_no || '', email: cu.buyer_email || ''
  });
}

// ---- Màn hình ĐIỀN FORM ----
function ghSetType(months, t) {
  if (_ghType === t) return;
  // Giữ lại những gì khách vừa gõ khi đổi qua lại giữa 2 loại
  var g = function (id) { var e = document.getElementById(id); return e ? e.value : undefined; };
  var keep = {
    buyer_name: g('ghf_name'), buyer_company: g('ghf_company'), buyer_tax_id: g('ghf_tax'),
    buyer_phone: g('ghf_phone'), buyer_address: g('ghf_addr'),
    buyer_id_no: g('ghf_idno'), buyer_email: g('ghf_email')
  };
  for (var k in keep) if (keep[k] !== undefined) _ghBuyer[k] = keep[k];
  _ghType = t;

  // Chỉ thay đúng mấy ô khác nhau giữa 2 loại. Dựng lại cả form thì
  // ô đang gõ bị mất con trỏ và màn hình giật một nhịp.
  var dyn = document.getElementById('ghf_dyn');
  if (dyn) {
    dyn.innerHTML = ghOKhac();
    ghToNutLoai();
  } else {
    ghFormHtml(months);
  }
}

// Tô lại 2 nút chọn loại cho đúng cái đang chọn
function ghToNutLoai() {
  ['ca_nhan', 'doanh_nghiep'].forEach(function (t) {
    var b = document.getElementById('ghf_tab_' + t);
    if (!b) return;
    var on = (_ghType === t);
    b.style.borderColor = on ? '#2563eb' : '#e2e8f0';
    b.style.background = on ? '#eff6ff' : '#fff';
    b.style.color = on ? '#1d4ed8' : '#475569';
    var s = b.querySelector('div');
    if (s) s.style.color = on ? '#60a5fa' : '#94a3b8';
  });
}

function ghFormHtml(months) {
  var cu = _ghBuyer || {};
  var dn = _ghType === 'doanh_nghiep';

  var lbl = 'display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:5px;';
  var inp = 'width:100%;padding:10px 12px;border:1.5px solid #d1d5db;border-radius:9px;'
          + 'font-size:14px;font-family:inherit;box-sizing:border-box;';
  function o(id, ten, ph, val, req, extra, ghichu) {
    return '<div style="margin-bottom:12px;">'
      + '<label style="' + lbl + '">' + ten
      + (req ? ' <span style="color:#dc2626">*</span>' : ' <span style="color:#94a3b8;font-weight:500">(không bắt buộc)</span>')
      + '</label><input id="' + id + '" ' + (extra || '') + ' placeholder="' + ghEsc(ph) + '" value="'
      + ghEsc(val == null ? '' : val) + '" style="' + inp + '">'
      + (ghichu ? '<div style="font-size:11.5px;color:#2563eb;margin-top:5px;line-height:1.5;">' + ghichu + '</div>' : '')
      + '</div>';
  }
  function tab(t, ic, ten, mo) {
    var on = (_ghType === t);
    return '<button type="button" id="ghf_tab_' + t + '" onclick="ghSetType(' + months + ',\'' + t + '\')" style="'
      + 'flex:1;padding:11px 8px;border:2px solid ' + (on ? '#2563eb' : '#e2e8f0') + ';border-radius:10px;'
      + 'background:' + (on ? '#eff6ff' : '#fff') + ';color:' + (on ? '#1d4ed8' : '#475569') + ';'
      + 'font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:center;">'
      + ic + ' ' + ten + '<div style="font-weight:500;font-size:10.5px;color:'
      + (on ? '#60a5fa' : '#94a3b8') + ';margin-top:2px;">' + mo + '</div></button>';
  }

  var h = ghGoiBox(months);
  h += '<div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:10px;">🧾 Thông tin xuất hoá đơn</div>';
  h += '<div style="display:flex;gap:10px;margin-bottom:16px;">'
    + tab('ca_nhan', '👤', 'Cá nhân', 'xuất theo tên riêng')
    + tab('doanh_nghiep', '🏢', 'Doanh nghiệp', 'có mã số thuế')
    + '</div>';

  h += '<div id="ghf_dyn">' + ghOKhac() + '</div>';
  h += o('ghf_phone', 'Số điện thoại', '09xxxxxxxx', cu.buyer_phone, true, 'inputmode="tel"');
  h += o('ghf_email', 'Email nhận hoá đơn', 'email@example.com', cu.buyer_email, true, 'inputmode="email"',
         '📧 Hoá đơn sẽ được gửi qua email này. Nhập đúng email Anh/Chị đang dùng.');

  h += '<div id="ghf_err" style="display:none;margin-bottom:12px;padding:10px 13px;border-radius:9px;'
    + 'background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:12.5px;line-height:1.6;"></div>';
  h += '<button class="gh-btn" onclick="ghSubmit(' + months + ')">Tiếp tục → Thanh toán</button>';
  h += '<button class="gh-back" onclick="ghOpen()">← Chọn gói khác</button>';
  h += '<div class="gh-note">'
    + (dn ? 'Hoá đơn sẽ xuất theo <b>tên đơn vị và mã số thuế</b> để đơn vị kê khai được.'
          : 'Hoá đơn sẽ xuất theo <b>tên cá nhân</b>. Nếu cần kê khai thuế cho công ty, hãy chọn <b>Doanh nghiệp</b>.')
    + '<br>Thông tin này được <b>lưu lại</b>, lần gia hạn sau chỉ cần bấm xác nhận.</div>';
  document.getElementById('gh-body').innerHTML = h;
}

// Mấy ô khác nhau giữa Cá nhân và Doanh nghiệp — tách riêng để khi đổi loại
// chỉ thay đúng phần này, không phải dựng lại cả form.
function ghOKhac() {
  var cu = _ghBuyer || {};
  var lbl = 'display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:5px;';
  var inp = 'width:100%;padding:10px 12px;border:1.5px solid #d1d5db;border-radius:9px;'
          + 'font-size:14px;font-family:inherit;box-sizing:border-box;';
  function o(id, ten, ph, val, extra) {
    return '<div style="margin-bottom:12px;">'
      + '<label style="' + lbl + '">' + ten + ' <span style="color:#dc2626">*</span></label>'
      + '<input id="' + id + '" ' + (extra || '') + ' placeholder="' + ghEsc(ph) + '" value="'
      + ghEsc(val == null ? '' : val) + '" style="' + inp + '"></div>';
  }
  if (_ghType === 'doanh_nghiep') {
    return o('ghf_company', 'Tên đơn vị', 'Công ty TNHH ABC / Hộ kinh doanh ABC', cu.buyer_company)
      + o('ghf_tax', 'Mã số thuế', '0123456789', cu.buyer_tax_id, 'inputmode="numeric"')
      + o('ghf_addr', 'Địa chỉ đăng ký kinh doanh', 'Số nhà, đường, phường/xã, tỉnh/thành', cu.buyer_address)
      + o('ghf_name', 'Người liên hệ', 'Nguyễn Văn A', cu.buyer_name);
  }
  return o('ghf_name', 'Họ tên đầy đủ (có dấu)', 'Nguyễn Văn A', cu.buyer_name)
    + o('ghf_addr', 'Địa chỉ', 'Số nhà, đường, phường/xã, tỉnh/thành', cu.buyer_address)
    + o('ghf_idno', 'Số CCCD', '12 số', cu.buyer_id_no, 'inputmode="numeric"');
}

function ghVal(id) {
  var e = document.getElementById(id);
  return e ? String(e.value).trim() : '';
}

async function ghSubmit(months) {
  var dn = _ghType === 'doanh_nghiep';
  var name = ghVal('ghf_name'), company = ghVal('ghf_company'), tax = ghVal('ghf_tax');
  var phone = ghVal('ghf_phone'), addr = ghVal('ghf_addr');
  var idno = ghVal('ghf_idno').replace(/\D/g, ''), email = ghVal('ghf_email');
  var err = document.getElementById('ghf_err');
  var loi = [];

  if (dn) {
    if (company.length < 3) loi.push('Nhập <b>tên đơn vị</b>.');
    // Mã số thuế Việt Nam: 10 số, hoặc 13 số nếu là đơn vị trực thuộc
    var mst = tax.replace(/\D/g, '');
    if (!/^\d{10}$|^\d{13}$/.test(mst)) loi.push('<b>Mã số thuế</b> phải là 10 số (hoặc 13 số với đơn vị trực thuộc).');
    tax = mst;
    if (name.length < 3) loi.push('Nhập <b>tên người liên hệ</b>.');
  } else {
    if (name.length < 3) loi.push('Nhập <b>họ tên đầy đủ</b>.');
    if (!idno) loi.push('Nhập <b>số CCCD</b>.');
    else if (!/^\d{9}$|^\d{12}$/.test(idno)) loi.push('<b>Số CCCD</b> phải là 12 số (hoặc 9 số nếu là CMND cũ).');
  }
  // Số điện thoại Việt Nam: 10 số bắt đầu bằng 0, chấp nhận cả dạng +84
  var sdt = phone.replace(/[\s.\-()]/g, '').replace(/^\+?84/, '0');
  if (!/^0\d{9}$/.test(sdt)) loi.push('<b>Số điện thoại</b> phải là 10 số, bắt đầu bằng 0.');
  if (addr.length < 8) loi.push('Nhập <b>địa chỉ</b> đầy đủ hơn.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) loi.push('<b>Email</b> chưa đúng định dạng.');

  if (loi.length) {
    err.innerHTML = loi.join('<br>');
    err.style.display = '';
    err.scrollIntoView({ block: 'nearest' });
    return;
  }
  err.style.display = 'none';

  await ghGuiDon(months, {
    type: _ghType, name: name, company: company, tax_id: tax,
    phone: sdt, address: addr, id_no: idno, email: email
  });
}

// Gửi lên server tạo mã, dùng chung cho cả hai đường: điền form và bấm xác nhận
async function ghGuiDon(months, buyer) {
  var body = document.getElementById('gh-body');
  body.innerHTML = '<div style="text-align:center;padding:30px 0;color:#64748b;font-size:13px;">Đang tạo mã thanh toán...</div>';

  var r = await window.__sb.rpc('create_payment_request', { p_months: months, p_buyer: buyer });
  if (r.error) {
    body.innerHTML = '<div style="color:#dc2626;font-size:13px;line-height:1.7;">Không tạo được mã: ' + ghEsc(r.error.message)
      + '<br><br>Vui lòng liên hệ Zalo <b>' + ghEsc(GH_ZALO) + '</b> để được hỗ trợ.</div>'
      + '<button class="gh-back" onclick="ghOpen()">← Chọn gói khác</button>';
    return;
  }
  // Nhớ lại thông tin vừa gửi để lần sau khỏi phải hỏi Supabase
  _ghBuyer = {
    buyer_type: buyer.type, buyer_name: buyer.name, buyer_company: buyer.company,
    buyer_tax_id: buyer.tax_id, buyer_phone: buyer.phone, buyer_address: buyer.address,
    buyer_id_no: buyer.id_no, buyer_email: buyer.email
  };
  var req = Array.isArray(r.data) ? r.data[0] : r.data;
  ghShowQr(req);
}

function ghShowQr(req) {
  var body = document.getElementById('gh-body');
  var qr = 'https://qr.sepay.vn/img?acc=' + encodeURIComponent(GH_ACC)
         + '&bank=' + encodeURIComponent(GH_BANK)
         + '&amount=' + encodeURIComponent(req.amount)
         + '&des=' + encodeURIComponent(req.code);

  var h = '<div id="gh-qrwrap">';
  h += '<img id="gh-qrimg" src="' + qr + '" alt="Mã QR chuyển khoản">';
  h += '<div class="gh-row"><span class="k">Số tiền</span><span class="v" style="color:#dc2626;">' + ghMoney(req.amount) + '</span>'
     + '<button class="gh-copy" onclick="ghCopy(this,\'' + req.amount + '\')">Sao chép</button></div>';
  h += '<div class="gh-row"><span class="k">Nội dung CK</span><span class="v" style="color:#b45309;">' + ghEsc(req.code) + '</span>'
     + '<button class="gh-copy" onclick="ghCopy(this,\'' + ghEsc(req.code) + '\')">Sao chép</button></div>';
  h += '<div class="gh-row"><span class="k">Số tài khoản</span><span class="v">' + ghEsc(GH_ACC) + ' · ' + ghEsc(GH_BANK) + '</span>'
     + '<button class="gh-copy" onclick="ghCopy(this,\'' + ghEsc(GH_ACC) + '\')">Sao chép</button></div>';
  h += '<div class="gh-row"><span class="k">Chủ tài khoản</span><span class="v" style="font-size:12px;">' + ghEsc(GH_NAME) + '</span></div>';
  h += '<div id="gh-status"><span class="dot"></span><span>Đang chờ chuyển khoản... Màn hình sẽ tự cập nhật khi nhận được tiền.</span></div>';
  h += '<div class="gh-note">Mở app ngân hàng, <b>quét mã QR</b> — số tiền và nội dung đã điền sẵn, chỉ cần bấm xác nhận.'
     + '<br>Nếu tự nhập tay, phải giữ <b>đúng nội dung ' + ghEsc(req.code) + '</b> thì hệ thống mới nhận ra.'
     + '<br>Mã có hiệu lực trong 24 giờ. Cần hỗ trợ: Zalo <b>' + ghEsc(GH_ZALO) + '</b>.</div>';
  h += '<button class="gh-back" onclick="ghOpen()">← Chọn gói khác</button>';
  h += '</div>';
  body.innerHTML = h;

  if (_ghPoll) clearInterval(_ghPoll);
  _ghPoll = setInterval(function () { ghCheck(req.code); }, 5000);
}

async function ghCheck(code) {
  var r = await window.__sb.from('payment_requests')
    .select('status,months,paid_amount,amount').eq('code', code).single();
  if (r.error || !r.data) return;

  if (r.data.status === 'paid') {
    clearInterval(_ghPoll); _ghPoll = null;
    document.getElementById('gh-body').innerHTML =
      '<div id="gh-done"><div class="ic">🎉</div><h4>Gia hạn thành công!</h4>'
      + '<p>Tài khoản đã được cộng thêm <b>' + r.data.months + ' tháng</b>.<br>Cảm ơn Anh/Chị đã tin dùng Dung Phát Tool.</p>'
      + (window.__ghGiuaChung
          ? '<button class="gh-btn" onclick="window.__ghTiepTuc()">Tiếp tục sử dụng</button>'
            + '<div style="font-size:11.5px;color:#64748b;margin-top:10px;">Việc đang làm dở vẫn còn nguyên.</div>'
          : '<button class="gh-btn" onclick="window.location.reload()">Bắt đầu sử dụng</button>')
      + '</div>';
  } else if (r.data.status === 'manual') {
    clearInterval(_ghPoll); _ghPoll = null;
    var thieu = Number(r.data.amount || 0) - Number(r.data.paid_amount || 0);
    document.getElementById('gh-status').outerHTML =
      '<div style="margin-top:14px;padding:13px 16px;border-radius:10px;font-size:13px;text-align:left;'
      + 'background:#fffbeb;border:1px solid #fde68a;color:#92400e;line-height:1.75;">'
      + '⚠️ Đã nhận <b>' + ghMoney(r.data.paid_amount) + '</b>, còn thiếu <b>' + ghMoney(thieu) + '</b>.<br>'
      + 'Vui lòng chuyển bổ sung phần thiếu, hoặc liên hệ Zalo <b>' + ghEsc(GH_ZALO) + '</b> để được xử lý.</div>';
  }
}

function ghCopy(btn, txt) {
  var done = function () { var o = btn.textContent; btn.textContent = '✓ Đã chép'; setTimeout(function () { btn.textContent = o; }, 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done, function () {});
  } else {
    var t = document.createElement('textarea');
    t.value = txt; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(t);
  }
}



function mkDong() { document.getElementById('mk-overlay').classList.remove('show'); }

function mkMo() {
  var i = _ubInfo || { email: '', provider: 'email' };
  // Tài khoản đăng nhập bằng Google chưa có mật khẩu -> cho ĐẶT mới, không hỏi mật khẩu cũ
  var google = (i.provider === 'google');
  document.getElementById('mk-sub').textContent = i.email;
  document.getElementById('mk-head').querySelector('h3').textContent = google ? '🔑 Đặt mật khẩu' : '🔑 Đổi mật khẩu';

  var h = '';
  if (google) {
    h += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:11px 13px;margin-bottom:15px;font-size:12.5px;color:#1d4ed8;line-height:1.65;">'
      + 'Tài khoản này đang đăng nhập bằng <b>Google</b>. Đặt thêm mật khẩu để có thể đăng nhập bằng email khi cần.</div>';
  } else {
    h += '<div class="mk-o"><label>Mật khẩu hiện tại</label>'
      + '<input type="password" id="mk-cu" autocomplete="current-password" placeholder="Nhập mật khẩu đang dùng"></div>';
  }
  h += '<div class="mk-o"><label>Mật khẩu mới</label>'
    + '<input type="password" id="mk-moi" autocomplete="new-password" placeholder="Ít nhất 6 ký tự"></div>';
  h += '<div class="mk-o"><label>Nhập lại mật khẩu mới</label>'
    + '<input type="password" id="mk-moi2" autocomplete="new-password" placeholder="Gõ lại cho khớp"></div>';
  h += '<label class="mk-hien"><input type="checkbox" onchange="mkHien(this.checked)"> Hiện mật khẩu</label>';
  h += '<div id="mk-loi"></div>';
  h += '<button class="mk-btn" id="mk-luu" type="button" onclick="mkLuu()">' + (google ? 'Đặt mật khẩu' : 'Đổi mật khẩu') + '</button>';
  h += '<div class="mk-note">Sau khi đổi, Anh/Chị vẫn đăng nhập bình thường trên máy này. '
    + 'Các thiết bị khác sẽ cần đăng nhập lại bằng mật khẩu mới.</div>';

  document.getElementById('mk-body').innerHTML = h;
  document.getElementById('mk-overlay').classList.add('show');
  var o = document.getElementById(google ? 'mk-moi' : 'mk-cu');
  if (o) o.focus();
}

function mkHien(bat) {
  ['mk-cu', 'mk-moi', 'mk-moi2'].forEach(function (id) {
    var e = document.getElementById(id);
    if (e) e.type = bat ? 'text' : 'password';
  });
}

async function mkLuu() {
  var i = _ubInfo || {};
  var google = (i.provider === 'google');
  var cu = google ? '' : (document.getElementById('mk-cu').value || '');
  var moi = document.getElementById('mk-moi').value || '';
  var moi2 = document.getElementById('mk-moi2').value || '';
  var loi = document.getElementById('mk-loi');
  var ds = [];

  if (!google && !cu) ds.push('Nhập <b>mật khẩu hiện tại</b>.');
  if (moi.length < 6) ds.push('<b>Mật khẩu mới</b> phải từ 6 ký tự trở lên.');
  if (moi !== moi2) ds.push('Hai ô <b>mật khẩu mới</b> chưa khớp nhau.');
  if (!google && cu && moi && cu === moi) ds.push('Mật khẩu mới phải <b>khác</b> mật khẩu cũ.');

  if (ds.length) { loi.innerHTML = ds.join('<br>'); loi.style.display = ''; return; }
  loi.style.display = 'none';

  var nut = document.getElementById('mk-luu');
  nut.disabled = true; nut.textContent = 'Đang xử lý...';

  try {
    var sb = window.__sb;
    // Xác minh mật khẩu cũ trước. Không có bước này thì ai ngồi vào máy đang
    // đăng nhập sẵn cũng đổi được mật khẩu và chiếm luôn tài khoản.
    if (!google) {
      var kt = await sb.auth.signInWithPassword({ email: i.email, password: cu });
      if (kt.error) {
        loi.innerHTML = '<b>Mật khẩu hiện tại không đúng.</b>';
        loi.style.display = '';
        nut.disabled = false; nut.textContent = 'Đổi mật khẩu';
        return;
      }
    }
    var r = await sb.auth.updateUser({ password: moi });
    if (r.error) throw r.error;

    // Đá mọi thiết bị KHÁC ra, giữ lại máy này. Đổi mật khẩu mà máy khác vẫn
    // vào được thì đổi cũng bằng thừa. Còn máy này thì giữ, để khách không
    // mất việc đang làm dở.
    var daDaMayKhac = false;
    try { var so = await sb.auth.signOut({ scope: 'others' }); daDaMayKhac = !so.error; } catch (e) {}

    document.getElementById('mk-body').innerHTML =
      '<div id="mk-xong"><div class="ic">✅</div><h4>' + (google ? 'Đã đặt mật khẩu!' : 'Đã đổi mật khẩu!') + '</h4>'
      + '<p>Lần sau Anh/Chị đăng nhập bằng mật khẩu mới.<br>'
      + (daDaMayKhac ? 'Các thiết bị khác đã được thoát ra. ' : '')
      + 'Trên máy này vẫn dùng tiếp bình thường.</p>'
      + '<button class="mk-btn" type="button" onclick="mkDong()">Đóng</button></div>';
  } catch (e) {
    loi.innerHTML = 'Không đổi được mật khẩu: ' + ((e && e.message) ? String(e.message) : 'lỗi không rõ')
      + '<br>Cần hỗ trợ, liên hệ Zalo <b>' + (typeof GH_ZALO !== 'undefined' ? GH_ZALO : '0393060017') + '</b>.';
    loi.style.display = '';
    nut.disabled = false; nut.textContent = google ? 'Đặt mật khẩu' : 'Đổi mật khẩu';
  }
}
