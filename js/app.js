(function () {
'use strict';
/* ════════════════════════════════════════════════════════════
   LUMINA LEARN — JavaScript.html
   BAGIAN 1 — INTI: util, state, API, router, chrome, modal, event
   Prinsip instant-UX: semua view sudah ter-mount, navigasi = show/hide (0 ms),
   data dibaca dari state/localStorage lebih dulu lalu direvalidasi di latar belakang.
   ════════════════════════════════════════════════════════════ */

/* ── Util DOM & penyimpanan ── */
var CFG = window.LL_CONFIG || {};
var API_URL = String(CFG.API_URL || '').trim();
/** Alamat halaman ini sendiri (untuk tautan verifikasi sertifikat/QR) */
function selfUrl() { return String(CFG.SITE_URL || (location.origin + location.pathname.replace(/index\.html$/, ''))); }
/** Deep link dari URL (?reset=… dari email, ?verify=… dari QR) lalu dibersihkan agar token tidak tertinggal di address bar */
var DEEP = (function () {
  var o = { reset: '', verify: '' };
  try {
    var q = new URLSearchParams(location.search);
    o.reset = String(q.get('reset') || '').slice(0, 200); o.verify = String(q.get('verify') || '').slice(0, 60);
    if (o.reset || o.verify) history.replaceState(null, '', location.pathname);
  } catch (e) { /* abaikan */ }
  return o;
})();
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var LS = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } }
};
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ic(n, c) { return '<svg class="i' + (c ? ' ' + c : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function plural(n, w, pl) { return n + ' ' + (n === 1 ? w : (pl || w + 's')); }
function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

/* ── Format ── */
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(t) { if (!t) return '—'; var d = new Date(Number(t)); return MON[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
function fmtDT(t) { if (!t) return '—'; var d = new Date(Number(t)); return fmtDate(t) + ' · ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function fmtDur(min) { min = Math.round(min || 0); if (min < 60) return min + ' min'; var h = Math.floor(min / 60), m = min % 60; return h + 'h' + (m ? ' ' + m + 'm' : ''); }
function fmtSize(b) { b = Number(b) || 0; if (b < 1024) return b + ' B'; if (b < 1048576) return Math.round(b / 1024) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
function fmtClock(sec) { sec = Math.max(0, Math.floor(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' : '') + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2); }
function ago(t) {
  if (!t) return '—'; var s = (Date.now() - Number(t)) / 1000;
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago'; if (s < 86400 * 30) return Math.floor(s / 86400) + ' d ago';
  return fmtDate(t);
}
function initials(n) { var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
function hashStr(s) { var h = 0; String(s || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return h; }
function avatar(name, cls) { return '<span class="avatar c' + (hashStr(name) % 4 + 1) + (cls ? ' ' + cls : '') + '">' + esc(initials(name)) + '</span>'; }
function badge(txt, cls, icon) { return '<span class="badge ' + (cls || 'b-slate') + '">' + (icon ? ic(icon, 'i-sm') : '') + esc(txt) + '</span>'; }
function stars(r, size) {
  var out = '<span class="stars" aria-label="' + (r || 0) + ' out of 5">';
  for (var i = 1; i <= 5; i++) out += ic('star', (i <= Math.round(r || 0) ? '' : 'off') + (size ? ' ' + size : ''));
  return out + '</span>';
}
function empty(icon, title, text, btn) {
  return '<div class="empty"><div class="art">' + ic(icon) + '</div><h4>' + esc(title) + '</h4>' + (text ? '<p class="small" style="max-width:360px">' + esc(text) + '</p>' : '') + (btn || '') + '</div>';
}
function skel(n, h) { var o = ''; for (var i = 0; i < (n || 3); i++) o += '<div class="sk" style="height:' + (h || 84) + 'px;margin-bottom:14px"></div>'; return o; }
function pageSkel() { return '<div class="container" style="padding-top:36px"><div class="sk" style="height:38px;width:42%;margin-bottom:22px"></div>' + skel(3, 110) + '</div>'; }
function copyText(t) {
  var done = function () { toast('Copied to clipboard.', 'ok'); };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, function () { fallbackCopy(t); done(); }); } else { fallbackCopy(t); done(); }
}
function fallbackCopy(t) { var a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;left:-999px'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) { /* abaikan */ } a.remove(); }
function downloadBlob(name, blob) { var u = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
function downloadCSV(name, rows) {
  var csv = rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
  downloadBlob(name, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
}
function btnBusy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (label ? ' ' + esc(label) : ''); }
  else { btn.disabled = false; if (btn.dataset.html != null) btn.innerHTML = btn.dataset.html; }
}
function setPath(o, path, val) { var p = path.split('.'); for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = val; }
function getPath(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }

/* ── Warna & sampul kursus (generatif, tanpa gambar) ── */
var CAT_COLORS = ['#6C3CE9', '#2F6BFF', '#E34BA9', '#D97706', '#0EA472', '#F97316'];
var CAT_ICONS = ['book', 'layers', 'target', 'zap', 'cap', 'globe'];
function catIdx(cat) { return hashStr(cat) % CAT_COLORS.length; }
function cover(c, o) {
  o = o || {}; var i = catIdx(c.category), col = CAT_COLORS[i];
  var img = c.thumbnail ? '<img src="' + esc(c.thumbnail) + '" alt="" loading="lazy" style="position:absolute;inset:0" onerror="this.remove()">' : '';
  return '<div class="cover"><div class="gen" style="background:linear-gradient(135deg,' + col + ',' + shade(col, -.35) + ')">' + ic(CAT_ICONS[i]) + '<b>' + esc(c.title) + '</b></div>' + img +
    '<div class="shade"></div>' + (o.badge === false ? '' : '<span class="tl cat-badge" style="background:' + col + '">' + esc(c.category || 'General') + '</span>') +
    (o.meta === false ? '' : '<span class="br">' + ic('clock', 'i-sm') + esc(fmtDur(c.total_minutes)) + '</span>') + '</div>';
}
function hex2rgb(h) { h = String(h || '#6C3CE9').replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
function rgb2hex(r) { return '#' + r.map(function (v) { return ('0' + clamp(Math.round(v), 0, 255).toString(16)).slice(-2); }).join(''); }
function shade(hex, t) { var r = hex2rgb(hex), to = t < 0 ? 0 : 255, a = Math.abs(t); return rgb2hex(r.map(function (v) { return v + (to - v) * a; })); }

/* ── State global ── */
var S = {
  pub: LS.get('ll_pub', null) || { settings: {}, courses: [], paths: [], stats: {} },
  pubReady: !!LS.get('ll_pub', null),
  deep: DEEP,
  token: LS.get('ll_token', ''),
  me: LS.get('ll_me', null),
  member: LS.get('ll_member', null),
  admin: LS.get('ll_admin', null),
  route: { name: '', p: {} },
  cleanup: null, after: null, adminLoading: null, certAssets: {}, libs: {},
  ui: { cat: 'All', q: '', level: 'All', sort: 'popular', tab: 'overview', adminQ: '', enrollStatus: 'requested', memberTab: 'enrollments' }
};
if (S.token && !S.member) { S.token = ''; S.me = null; }
if (S.member && S.member.profile) S.me = S.member.profile;
function cfg() { return S.pub.settings || {}; }
function isAdminUser() { return !!(S.me && (S.me.role === 'admin' || S.me.role === 'superadmin')); }
function isSuper() { return !!(S.me && S.me.role === 'superadmin'); }
function getCourse(id) { return (S.pub.courses || []).filter(function (c) { return c.id === id; })[0] || null; }

/* ── Brand dinamis (warna, nama, logo) ── */
function applyBrand() {
  var c = cfg().primary_color || '#6C3CE9'; if (!/^#[0-9a-f]{6}$/i.test(c)) c = '#6C3CE9';
  var rgb = hex2rgb(c), st = document.documentElement.style;
  st.setProperty('--p', c); st.setProperty('--p-rgb', rgb.join(', '));
  st.setProperty('--p-dark', shade(c, -.28)); st.setProperty('--p-light', shade(c, .5));
  document.title = cfg().brand_name || 'Lumina Learn';
}
function brandName() { return cfg().brand_name || 'Lumina Learn'; }
function brandMark(logo) {
  logo = logo === undefined ? cfg().logo_data : logo;
  return '<span class="brand-mark' + (logo ? ' has-img' : '') + '">' + (logo ? '<img src="' + esc(logo) + '" alt="">' : ic('cap', 'i-lg')) + '</span>';
}

/* ── Komunikasi server (fetch → Google Apps Script REST API) ──
   POST memakai text/plain agar TIDAK memicu CORS preflight (GAS tidak menjawab OPTIONS). */
var RETRY_SAFE = { getPublicData: 1, getMemberData: 1, getAdminData: 1, getCertificateData: 1, verifyCertificate: 1, getMaterialFile: 1 };
function apiConfigured() { return /^https?:\/\/[^\s]+/.test(API_URL) && API_URL.indexOf('XXXX') < 0; }
function rawFetch(fn, args, signal) {
  if (fn === 'getPublicData') return fetch(API_URL + '?fn=getPublicData', { signal: signal });
  return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn: fn, args: args }), signal: signal });
}
function call(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  function attempt(n) {
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, fn === 'uploadFile' ? 180000 : 60000) : null;
    return rawFetch(fn, args, ctl && ctl.signal)
      .then(function (r) { if (timer) clearTimeout(timer); if (!r.ok) throw new Error('Server error (' + r.status + ').'); return r.json(); })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        if (n < 1 && RETRY_SAFE[fn]) return attempt(n + 1);                     // 1x ulang untuk pembacaan (cold start GAS)
        throw new Error(err && err.name === 'AbortError' ? 'The server took too long to respond. Please try again.' : 'Network error. Please check your connection and try again.');
      });
  }
  if (!apiConfigured()) return Promise.reject(new Error('The app is not connected to its server yet (API_URL in js/config.js).'));
  return attempt(0).then(function (x) {
    if (x && x.success) return x.data;
    var e = new Error((x && x.message) || 'Something went wrong.'); e.code = x && x.code;
    if (e.code === 'AUTH') authLost();
    throw e;
  });
}
/** Jalankan di latar belakang; bila gagal, jalankan rollback + toast */
function bg(promise, rollback, msg) {
  return promise.catch(function (e) { if (rollback) { try { rollback(e); } catch (x) { /* abaikan */ } } if (e.code !== 'AUTH') toast(msg ? msg + ' ' + e.message : e.message, 'err'); });
}

/* ── Toast, modal, drawer ── */
function toast(msg, type, title) {
  type = type || 'ok';
  var root = $('#toastRoot'); while (root.children.length > 3) root.removeChild(root.firstChild);
  var el = document.createElement('div'); el.className = 'toast ' + type; el.setAttribute('role', type === 'err' ? 'alert' : 'status');
  el.innerHTML = ic({ ok: 'check-circle', err: 'x-circle', warn: 'alert', info: 'info' }[type] || 'info', 'i-lg') + '<div>' + (title ? '<b>' + esc(title) + '</b>' : '') + esc(msg) + '</div>';
  root.appendChild(el);
  setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 220); }, type === 'err' ? 5600 : 3300);
}
var modalStack = [];
function lockScroll() { document.body.style.overflow = (modalStack.length || $('#drawerRoot').children.length) ? 'hidden' : ''; }
function openModal(o) {
  var back = document.createElement('div'); back.className = 'modal-back';
  back.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true">' +
    (o.title ? '<div class="modal-head">' + (o.icon ? '<span class="tile-icon sq ' + (o.tone || '') + '">' + ic(o.icon, 'i-lg') + '</span>' : '') +
      '<div class="grow"><h3>' + esc(o.title) + '</h3>' + (o.sub ? '<p class="small muted mt-4">' + esc(o.sub) + '</p>' : '') + '</div>' +
      '<button class="icon-btn" data-act="closeModal" aria-label="Close">' + ic('x') + '</button></div>' : '') +
    '<div class="modal-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') + '</div>';
  var api = { el: back, close: function () { closeModal(api); } };
  back.addEventListener('mousedown', function (e) { if (e.target === back && !o.sticky) closeModal(api); });
  $('#modalRoot').appendChild(back); modalStack.push(api); lockScroll();
  if (o.onMount) o.onMount(back, api);
  var f = $('input:not([type=hidden]),textarea,select', back); if (f && o.focus !== false) setTimeout(function () { f.focus(); }, 30);
  return api;
}
function closeModal(api) {
  api = api || modalStack[modalStack.length - 1]; if (!api) return;
  if (api.onClose) api.onClose();
  api.el.remove(); modalStack = modalStack.filter(function (m) { return m !== api; }); lockScroll();
}
function confirmBox(o) {
  return new Promise(function (resolve) {
    var m = openModal({
      title: o.title, icon: o.icon || (o.danger ? 'alert' : 'info'), tone: o.danger ? 'err' : '', size: 'sm', body: '<p style="color:var(--muted)">' + o.text + '</p>',
      foot: '<button class="btn btn-outline" data-x="no">' + esc(o.no || 'Cancel') + '</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-x="yes">' + esc(o.yes || 'Confirm') + '</button>',
      onMount: function (el) {
        $('[data-x=no]', el).onclick = function () { resolve(false); closeModal(m); };
        $('[data-x=yes]', el).onclick = function () { resolve(true); closeModal(m); }; /* resolve dulu: closeModal memanggil onClose → resolve(false) */
      }
    });
    m.onClose = function () { resolve(false); };
  });
}
function openDrawer(o) {
  closeDrawer();
  var root = $('#drawerRoot');
  root.innerHTML = '<div class="drawer-back" data-act="closeDrawer"></div><aside class="drawer" role="dialog" aria-modal="true"><div class="drawer-head"><div class="grow"><h3>' + esc(o.title) +
    '</h3>' + (o.sub ? '<p class="small muted">' + esc(o.sub) + '</p>' : '') + '</div><button class="icon-btn" data-act="closeDrawer" aria-label="Close">' + ic('x') + '</button></div><div class="drawer-body">' + o.body + '</div>' +
    (o.foot ? '<div class="drawer-foot">' + o.foot + '</div>' : '') + '</aside>';
  lockScroll();
}
function closeDrawer() { var r = $('#drawerRoot'); if (r.innerHTML) { r.innerHTML = ''; lockScroll(); } S.drawer = null; }

/* ── Event delegation (satu listener untuk seluruh aplikasi) ── */
var ACT = {}, INP = {}, CHG = {}, FORM = {};
document.addEventListener('click', function (e) {
  if (!e.target.closest('.dropdown')) $$('.dropdown.open').forEach(function (d) { d.classList.remove('open'); });
  var t = e.target.closest('[data-act]'); if (!t) return;
  var a = t.getAttribute('data-act');
  if (ACT[a]) { if (t.tagName === 'A') e.preventDefault(); ACT[a](t, e); }
});
document.addEventListener('input', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-in'); if (k && INP[k]) INP[k](e.target, e); });
document.addEventListener('change', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-ch'); if (k && CHG[k]) CHG[k](e.target, e); });
document.addEventListener('submit', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-form'); if (k && FORM[k]) { e.preventDefault(); FORM[k](e.target, e); } });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { if (modalStack.length) closeModal(); else if ($('#drawerRoot').children.length) closeDrawer(); else closeMenus(); }
});
ACT.closeModal = function () { closeModal(); };
ACT.closeDrawer = function () { closeDrawer(); };
ACT.go = function (el) { var p = {}; for (var k in el.dataset) { if (k !== 'act' && k !== 'to') p[k] = el.dataset[k]; } go(el.dataset.to, p); };
ACT.back = function () { goBack(); };
ACT.dd = function (el, e) { e.stopPropagation(); var d = el.closest('.dropdown'), open = d.classList.contains('open'); $$('.dropdown.open').forEach(function (x) { x.classList.remove('open'); }); if (!open) d.classList.add('open'); };
ACT.copy = function (el) { copyText(el.dataset.v); };
ACT.theme = function () {
  var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('ll_theme', t); } catch (e) { /* abaikan */ }
  renderChrome();
};
ACT.logout = function () { logout(); };
ACT.openMenu = function () { var m = $('#mobMenu'); if (m) m.classList.add('open'); $('#scrim').classList.add('show'); };
ACT.openSide = function () { $('#adminSidebar').classList.add('open'); $('#scrim').classList.add('show'); };
ACT.closeNav = function () { closeMenus(); };
function closeMenus() { var m = $('#mobMenu'); if (m) m.classList.remove('open'); $('#adminSidebar').classList.remove('open'); $('#scrim').classList.remove('show'); }
function themeIcon() { return ic(document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon'); }

/* ── Router SPA (tanpa reload, tanpa ?page=) ── */
var ROUTES = {};
function route(name, layout, auth, render) { ROUTES[name] = { layout: layout, auth: auth, render: render }; }
function go(name, p, o) {
  p = p || {}; o = o || {};
  var R = ROUTES[name]; if (!R) { name = 'home'; R = ROUTES.home; }
  if (R.auth === 'member' && !S.token) { S.after = { name: name, p: p }; toast('Please log in to continue.', 'info'); return go('login', {}, { replace: true }); }
  if (R.auth === 'admin' && !isAdminUser()) { toast('This area is for administrators only.', 'warn'); return go(S.token ? 'dashboard' : 'login', {}, { replace: true }); }
  if (S.cleanup) { try { S.cleanup(); } catch (e) { /* abaikan */ } S.cleanup = null; }
  closeMenus(); closeDrawer();
  var prev = S.route.name;
  S.route = { name: name, p: p };
  document.body.className = 'layout-' + R.layout;
  $$('.view.active').forEach(function (v) { v.classList.remove('active'); });
  var sec = $('#v-' + name); sec.classList.add('active');
  renderChrome();
  R.render(sec, p);
  if (!o.keepScroll) window.scrollTo(0, 0);
  if (!o.pop) {
    try { if (o.replace || !prev) history.replaceState({ r: name, p: p }, ''); else history.pushState({ r: name, p: p }, ''); } catch (e) { /* iframe terbatas — abaikan */ }
  }
  S.lastP = p;
}
function goBack() { try { if (history.state && history.length > 1) { history.back(); return; } } catch (e) { /* abaikan */ } go(S.token ? 'dashboard' : 'home'); }
window.addEventListener('popstate', function (e) { var s = e.state; if (s && s.r) go(s.r, s.p || {}, { pop: true }); else go('home', {}, { pop: true }); });
function rerender() {
  var R = ROUTES[S.route.name]; if (!R) return;
  var y = window.scrollY; R.render($('#v-' + S.route.name), S.route.p); renderChrome(); window.scrollTo(0, y);
}

/* ── Sesi & sinkronisasi ── */
function setSession(token, member) {
  S.token = token; S.member = member; S.me = member.profile; S.admin = null;
  LS.set('ll_token', token); LS.set('ll_me', S.me); LS.set('ll_member', member); LS.del('ll_admin');
}
function clearSession() { S.token = ''; S.me = null; S.member = null; S.admin = null; ['ll_token', 'll_me', 'll_member', 'll_admin'].forEach(LS.del); }
function logout() { clearSession(); toast('You have been logged out.', 'info'); go('home'); }
function authLost() { if (!S.token) return; clearSession(); toast('Your session has expired. Please log in again.', 'warn'); go('login', {}, { replace: true }); }
function afterLogin() {
  var a = S.after; S.after = null;
  if (a && ROUTES[a.name] && !(ROUTES[a.name].auth === 'admin' && !isAdminUser())) return go(a.name, a.p);
  go(isAdminUser() ? 'admin-dashboard' : 'dashboard');
}
var MEMBER_VIEWS = ['dashboard', 'room', 'certificate', 'course', 'catalog', 'paths', 'home'];
function syncMember(silent) {
  if (!S.token) return Promise.resolve();
  return call('getMemberData', S.token).then(function (m) {
    S.member = m; S.me = m.profile; LS.set('ll_member', m); LS.set('ll_me', S.me);
    if (MEMBER_VIEWS.indexOf(S.route.name) > -1 && !modalStack.length) rerender(); else renderChrome();
  }).catch(function (e) { if (!silent && e.code !== 'AUTH') toast(e.message, 'err'); });
}
function loadPublic() {
  return call('getPublicData').then(function (d) { S.pub = d; S.pubReady = true; LS.set('ll_pub', d); applyBrand(); });
}
function refreshPublic() {
  return loadPublic().catch(function () { /* diam: tampilan memakai cache lokal */ });
}
var FORM_ROUTES = ['admin-course-form', 'admin-quiz', 'quiz'];
function ensureAdmin(force) {
  if (S.adminLoading) return S.adminLoading;
  S.adminLoading = call('getAdminData', S.token).then(function (d) { S.admin = d; LS.set('ll_admin', d); return d; })
    .then(function (d) { S.adminLoading = null; return d; }, function (e) { S.adminLoading = null; throw e; });
  return S.adminLoading;
}
/** Render view admin: instan dari cache lokal, lalu revalidasi diam-diam */
function adminView(sec, fn) {
  if (S.admin) {
    fn(sec);
    if (!S.admin.synced || Date.now() - S.admin.synced > 45000) {
      ensureAdmin().then(function () { if (!modalStack.length && FORM_ROUTES.indexOf(S.route.name) < 0 && sec.classList.contains('active')) rerender(); }).catch(function () { /* diam */ });
    }
    return;
  }
  sec.innerHTML = pageSkel();
  ensureAdmin().then(function () { if (sec.classList.contains('active')) fn(sec); }).catch(function (e) {
    if (e.code === 'AUTH') return;
    sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('alert', 'Could not load admin data', e.message, '<button class="btn btn-primary mt-8" data-act="retryAdmin">' + ic('refresh') + 'Try again</button>') + '</div>';
  });
}
ACT.retryAdmin = function () { rerender(); };

/* ── Helper data member (dipakai halaman publik & member) ── */
function enrollStatus(courseId) {
  if (!S.token || !S.member) return 'none';
  if (isAdminUser()) return 'active';
  var e = (S.member.enrollments || []).filter(function (x) { return x.course_id === courseId; })[0];
  return e ? e.status : 'none';
}
function courseProgress(c) {
  var done = {}; ((S.member && S.member.progress) || []).forEach(function (id) { done[id] = 1; });
  var att = (S.member && S.member.attempts) || {};
  var total = 0, d = 0, next = null, scores = [], all = true;
  var mods = c.modules.map(function (m) {
    var ld = 0; m.lessons.forEach(function (l) { if (done[l.id]) ld++; });
    var q = m.quiz, a = q ? att[q.id] : null, qs = !!(a && a.status === 'submitted');
    var unlocked = ld === m.lessons.length;
    total += m.lessons.length + (q ? 1 : 0); d += ld + (qs ? 1 : 0);
    if (qs) scores.push(a.score);
    var complete = unlocked && (!q || qs); if (!complete) all = false;
    if (!next) {
      var nl = m.lessons.filter(function (l) { return !done[l.id]; })[0];
      if (nl) next = { type: 'lesson', id: nl.id, module: m }; else if (q && !qs) next = { type: 'quiz', id: q.id, module: m };
    }
    return { m: m, lDone: ld, lTotal: m.lessons.length, quiz: q, att: a, submitted: qs, unlocked: unlocked, complete: complete };
  });
  var avg = scores.length ? Math.round(sum(scores) / scores.length * 10) / 10 : null;
  var cert = ((S.member && S.member.certificates) || []).filter(function (x) { return x.course_id === c.id; })[0] || null;
  return { total: total, done: d, pct: total ? Math.round(d * 100 / total) : 0, mods: mods, next: next, avg: avg, doneMap: done, cert: cert,
    complete: all && c.modules.length > 0, passed: all && c.modules.length > 0 && (avg === null || avg >= c.passing_score) };
}
function myCourses() {
  return (S.pub.courses || []).filter(function (c) { return enrollStatus(c.id) === 'active'; });
}

/* ── Chrome: navbar, footer, sidebar ── */
function renderChrome() {
  var layout = document.body.className.replace('layout-', '');
  if (layout === 'public') { renderSiteNav(); renderFooter(); }
  else if (layout === 'admin') renderAdminChrome();
  else if (layout === 'focus') $('#focusFooter').innerHTML = '<span>' + ic('shield', 'i-sm') + ' Your answers are saved automatically. Do not close this tab during the quiz.</span><span>© ' + new Date().getFullYear() + ' ' + esc(brandName()) + '</span>';
}
var NAV_MAP = { course: 'catalog', room: 'dashboard', certificate: 'dashboard', quiz: 'dashboard' };
function renderSiteNav() {
  var n = NAV_MAP[S.route.name] || S.route.name, me = S.me;
  var links = [['home', 'Home'], ['catalog', 'Courses']];
  if (me) links.push(['dashboard', 'My Learning']);
  links.push(['paths', 'Learning Paths'], ['verify', 'Verify Certificate']);
  var lk = links.map(function (l) { return '<button class="nav-link' + (n === l[0] ? ' active' : '') + '" data-act="go" data-to="' + l[0] + '">' + l[1] + '</button>'; }).join('');
  var right;
  if (me) {
    right = '<div class="dropdown"><button class="user-chip" data-act="dd" aria-label="Account menu">' + avatar(me.name) + '<span class="meta hide-m"><b>' + esc(me.name.split(' ')[0]) + '</b><span>' + (isAdminUser() ? 'Admin' : 'Member') + '</span></span>' + ic('chev-down', 'i-sm hide-m') + '</button>' +
      '<div class="dropdown-menu"><div style="padding:10px 12px"><b style="font-family:var(--font-h)">' + esc(me.name) + '</b><div class="small muted">' + esc(me.email) + '</div></div><div class="dropdown-sep"></div>' +
      '<button class="dropdown-item" data-act="go" data-to="dashboard">' + ic('grid') + 'My Learning</button>' +
      (isAdminUser() ? '<button class="dropdown-item" data-act="go" data-to="admin-dashboard">' + ic('sliders') + 'Admin Panel</button>' : '') +
      '<div class="dropdown-sep"></div><button class="dropdown-item" data-act="logout" style="color:var(--err)">' + ic('logout') + 'Log out</button></div></div>';
  } else {
    right = '<button class="btn btn-ghost btn-sm hide-m" data-act="go" data-to="login">Log in</button><button class="btn btn-primary btn-sm" data-act="go" data-to="signup">Sign up</button>';
  }
  var mob = '<div class="mobile-menu" id="mobMenu"><div class="row between mb-16"><span class="brand">' + brandMark() + esc(brandName()) + '</span><button class="icon-btn" data-act="closeNav" aria-label="Close menu">' + ic('x') + '</button></div>' +
    links.map(function (l) { return '<button class="dropdown-item" data-act="go" data-to="' + l[0] + '">' + l[1] + '</button>'; }).join('') +
    (me ? '' : '<div class="dropdown-sep"></div><button class="dropdown-item" data-act="go" data-to="login">' + ic('user') + 'Log in</button>') +
    (me ? '<div class="dropdown-sep"></div><button class="dropdown-item" data-act="logout" style="color:var(--err)">' + ic('logout') + 'Log out</button>' : '') + '</div>';
  $('#siteNav').innerHTML = '<div class="container"><button class="brand" data-act="go" data-to="home" style="background:none;border:0;cursor:pointer">' + brandMark() + '<span>' + esc(brandName()) + '</span></button>' +
    '<nav class="nav-links" aria-label="Main">' + lk + '</nav><div class="nav-right"><button class="icon-btn" data-act="theme" aria-label="Toggle dark mode">' + themeIcon() + '</button>' + right +
    '<button class="icon-btn nav-burger" data-act="openMenu" aria-label="Open menu">' + ic('menu') + '</button></div></div>';
  $('#mobRoot').innerHTML = mob; /* di luar #siteNav: backdrop-filter membuat fixed relatif ke nav */
}
function renderFooter() {
  var s = cfg(), me = S.me;
  $('#siteFooter').innerHTML = '<div class="container"><div class="grid g-4" style="gap:32px"><div style="grid-column:span 2"><span class="brand" style="margin-bottom:12px">' + brandMark() + esc(brandName()) + '</span>' +
    '<p style="max-width:340px;font-size:14px">' + esc(s.footer_text || '') + '</p></div>' +
    '<div><h4>Explore</h4><button class="lnk" data-act="go" data-to="catalog">Courses</button><button class="lnk" data-act="go" data-to="paths">Learning Paths</button><button class="lnk" data-act="go" data-to="verify">Verify Certificate</button></div>' +
    '<div><h4>Account</h4>' + (me ? '<button class="lnk" data-act="go" data-to="dashboard">My Learning</button>' : '<button class="lnk" data-act="go" data-to="login">Log in</button><button class="lnk" data-act="go" data-to="signup">Create account</button>') +
    (s.admin_email ? '<a href="mailto:' + esc(s.admin_email) + '" target="_top">Contact support</a>' : '') + '</div></div>' +
    '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(brandName()) + '. All rights reserved.</span><span>Skill certificates are verifiable online.</span></div></div>';
}


/* ════════════════════════════════════════════════════════════
   BAGIAN 2 — HALAMAN PUBLIK: beranda, katalog, detail kursus, jalur, verifikasi
   ════════════════════════════════════════════════════════════ */

function courseCard(c) {
  var st = enrollStatus(c.id), btn;
  if (st === 'active') btn = '<button class="btn btn-soft btn-sm" data-act="resume" data-id="' + c.id + '">' + ic('play', 'i-sm') + 'Continue</button>';
  else if (st === 'requested') btn = badge('Request pending', 'b-warn', 'clock');
  else btn = '<button class="btn btn-primary btn-sm" data-act="go" data-to="course" data-id="' + c.id + '">Request Access</button>';
  return '<article class="card course-card" data-act="go" data-to="course" data-id="' + c.id + '" tabindex="0">' + cover(c) +
    '<div class="course-body"><div class="row between"><span class="track">' + esc(c.level || 'Beginner') + '</span>' +
    (c.rating ? '<span class="rating">' + ic('star') + c.rating + '</span>' : '<span class="tiny muted">New</span>') + '</div>' +
    '<h4 class="clamp-2">' + esc(c.title) + '</h4><p class="desc clamp-2">' + esc(c.short_desc) + '</p>' +
    '<div class="row row-wrap gap-16 tiny muted"><span>' + ic('layers', 'i-sm') + ' ' + plural(c.modules.length, 'module') + '</span><span>' + ic('play', 'i-sm') + ' ' + plural(c.lessons_count, 'lesson') + '</span></div>' +
    '<div class="instructor">' + avatar(c.instructor || 'T') + '<div class="grow"><b>' + esc(c.instructor || 'Instructor') + '</b><span>' + esc(c.instructor_title || '') + '</span></div>' + btn + '</div></div></article>';
}
ACT.resume = function (el) { var c = getCourse(el.dataset.id); if (!c) return; var pr = courseProgress(c); go('room', { courseId: c.id, lessonId: pr.next && pr.next.type === 'lesson' ? pr.next.id : '' }); };
ACT.needLogin = function (el) { S.after = { name: 'course', p: { id: el.dataset.id } }; go('login'); };
function openMailto(c) {
  var to = cfg().admin_email; if (!to || !S.me) return;
  var subj = 'Enrollment request: ' + c.title;
  var body = 'Hello,\n\nPlease activate my access to the course "' + c.title + '".\n\nName: ' + S.me.name + '\nEmail: ' + S.me.email + '\n\nThank you.';
  try { var a = document.createElement('a'); a.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body); a.target = '_top'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { /* abaikan */ }
}

/* ── Beranda ── */
route('home', 'public', null, function (sec) {
  var s = cfg(), st = S.pub.stats || {}, cs = S.pub.courses || [];
  var featured = cs.slice().sort(function (a, b) { return (b.students || 0) - (a.students || 0); }).slice(0, 3);
  var cats = {}; cs.forEach(function (c) { cats[c.category] = (cats[c.category] || 0) + 1; });
  var catKeys = Object.keys(cats).slice(0, 3);
  var first = cs[0];
  var tiles = catKeys.map(function (k) { return '<div class="cat-tile" style="--c:' + CAT_COLORS[catIdx(k)] + '"><b>' + esc(k) + '</b><span>' + plural(cats[k], 'course') + '</span></div>'; }).join('');
  var feats = [['play', 'Modular video lessons', 'Short, focused, self-paced', ''], ['quiz', 'Single-attempt quizzes', 'Honest, graded checkpoints', 'blue'], ['award', 'Verifiable certificates', 'Share with a unique ID', 'pink'], ['route', 'Learning paths', 'Guided course sequences', 'amber']]
    .map(function (f) { return '<div class="hero-feat"><span class="tile-icon sq ' + f[3] + '">' + ic(f[0]) + '</span><b>' + f[1] + '</b><span>' + f[2] + '</span></div>'; }).join('');
  var stats = [['users', st.learners || 0, 'Learners', ''], ['book', st.courses || 0, 'Courses', 'blue'], ['play', st.lessons || 0, 'Video lessons', 'pink'], ['award', st.certificates || 0, 'Certificates issued', 'amber']]
    .map(function (x) { return '<div class="s"><span class="tile-icon ' + x[3] + '">' + ic(x[0]) + '</span><div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></div>'; }).join('');
  var steps = [['Create your account', 'Sign up in under a minute — it is free.'], ['Request a course', 'Pick a course and send an access request.'], ['Learn at your pace', 'Watch lessons, download resources, take quizzes.'], ['Earn your certificate', 'Pass every module and get a verifiable certificate.']]
    .map(function (x, i) { return '<div class="step"><div class="n">' + (i + 1) + '</div><b>' + x[0] + '</b><p>' + x[1] + '</p></div>'; }).join('');
  sec.innerHTML = '<section class="hero"><div class="container"><div class="hero-grid"><div>' +
    '<span class="pill"><span class="dot"></span>' + esc(s.hero_badge || 'Online Learning Platform') + '</span>' +
    '<h1>' + esc(s.hero_headline || 'Learn something') + ' <span class="hl">' + esc(s.hero_highlight || 'remarkable') + '</span></h1>' +
    '<p class="hero-sub">' + esc(s.hero_subheadline || '') + '</p>' +
    '<div class="row row-wrap gap-16 mt-24 hero-cta"><button class="btn btn-primary btn-lg" data-act="go" data-to="catalog">Explore Courses ' + ic('arrow-right') + '</button>' +
    (S.me ? '<button class="btn btn-outline btn-lg" data-act="go" data-to="dashboard">Continue Learning</button>' : '<button class="btn btn-outline btn-lg" data-act="go" data-to="login">Log in</button>') + '</div>' +
    '<div class="hero-feats">' + feats + '</div></div>' +
    '<div class="player-mock"><div class="chrome"><i></i><i></i><i></i><span>' + esc(brandName()) + ' · Learning room</span></div>' +
    '<div class="player-screen">' + (first ? cover(first, { badge: false, meta: false }).replace('class="cover"', 'class="cover" style="aspect-ratio:auto;height:100%"') : '<div class="sk" style="height:100%"></div>') +
    '<button class="play-btn" data-act="go" data-to="catalog" aria-label="Browse courses">' + ic('play') + '</button>' +
    '</div>' +
    (tiles ? '<div class="cat-tiles">' + tiles + '</div>' : '') +
    '<div class="mock-chips"><span class="badge b-p">' + ic('quiz', 'i-sm') + 'Module quiz</span><span class="badge b-ok">' + ic('award', 'i-sm') + 'Certificate</span><span class="badge b-blue">' + ic('clock', 'i-sm') + 'Self-paced</span></div></div>' +
    '</div><div class="stat-strip">' + stats + '</div></div></section>' +
    '<section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">Popular right now</div><h2>Featured courses</h2></div><button class="btn btn-ghost" data-act="go" data-to="catalog">View all ' + ic('arrow-right', 'i-sm') + '</button></div>' +
    (featured.length ? '<div class="grid g-3">' + featured.map(courseCard).join('') + '</div>' : empty('book', 'No courses yet', 'Courses will appear here once they are published.')) + '</div></section>' +
    '<section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">Simple by design</div><h2>How it works</h2></div></div><div class="steps">' + steps + '</div></div></section>' +
    '<section class="section"><div class="container"><div class="cta-gradient"><div class="grid g-2" style="align-items:center;gap:32px"><div><span class="pill">Try it</span><h2 class="mt-12">Knowledge checks that actually count</h2>' +
    '<p class="mt-8">Every module ends with a single-attempt quiz graded on our server. Pass them all to earn a certificate anyone can verify.</p>' +
    '<div class="row row-wrap gap-8 mt-16"><button class="btn btn-white" data-act="go" data-to="signup">Create free account</button><button class="btn btn-ghost" style="color:#fff" data-act="go" data-to="verify">Verify a certificate</button></div></div>' +
    '<div class="glass"><div class="small" style="opacity:.85">Sample question</div><div class="q-text" style="color:#fff;font-size:17px;margin:6px 0 12px">What makes a learning goal effective?</div>' +
    ['It is specific and measurable', 'It is as broad as possible', 'It has no deadline'].map(function (t, i) { return '<button class="demo-opt mt-8" data-act="demo" data-r="' + (i === 0 ? 1 : 0) + '" style="color:var(--text)"><span class="radio"></span>' + t + '</button>'; }).join('') +
    '</div></div></div></div></section>';
});
ACT.demo = function (el) {
  $$('.demo-opt', el.parentNode).forEach(function (b) { b.classList.remove('sel', 'right', 'wrong'); });
  el.classList.add(el.dataset.r === '1' ? 'right' : 'wrong');
  if (el.dataset.r !== '1') { var ok = $$('.demo-opt', el.parentNode).filter(function (b) { return b.dataset.r === '1'; })[0]; if (ok) ok.classList.add('right'); }
};

/* ── Katalog ── */
function catalogList() {
  var u = S.ui, q = (u.q || '').toLowerCase().trim();
  var list = (S.pub.courses || []).filter(function (c) {
    return (u.cat === 'All' || c.category === u.cat) && (u.level === 'All' || c.level === u.level) &&
      (!q || (c.title + ' ' + c.short_desc + ' ' + c.category + ' ' + c.instructor).toLowerCase().indexOf(q) > -1);
  });
  list.sort(function (a, b) {
    if (u.sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (u.sort === 'title') return a.title.localeCompare(b.title);
    return (b.students || 0) - (a.students || 0);
  });
  return list;
}
function renderCatGrid() {
  var el = $('#catGrid'); if (!el) return; var list = catalogList();
  $('#catCount').textContent = plural(list.length, 'course') + ' found';
  el.innerHTML = list.length ? list.map(courseCard).join('') : '<div style="grid-column:1/-1">' + empty('search', 'No courses match your search', 'Try a different keyword or clear the filters.', '<button class="btn btn-soft mt-8" data-act="clearFilters">Clear filters</button>') + '</div>';
}
route('catalog', 'public', null, function (sec) {
  var cs = S.pub.courses || [], cats = {}; cs.forEach(function (c) { cats[c.category] = (cats[c.category] || 0) + 1; });
  var chips = '<button class="chip' + (S.ui.cat === 'All' ? ' active' : '') + '" data-act="cat" data-v="All">All <span class="count">' + cs.length + '</span></button>' +
    Object.keys(cats).map(function (k) { return '<button class="chip' + (S.ui.cat === k ? ' active' : '') + '" data-act="cat" data-v="' + esc(k) + '">' + esc(k) + ' <span class="count">' + cats[k] + '</span></button>'; }).join('');
  sec.innerHTML = '<div class="container" style="padding-top:36px"><div class="eyebrow">Learn</div><h1 style="font-size:clamp(28px,3.4vw,40px)">Course catalog</h1>' +
    '<p class="muted mt-8">Request access to a course and start learning as soon as it is activated.</p>' +
    '<div class="row row-wrap gap-12 mt-24"><div class="input-wrap grow" style="min-width:240px">' + ic('search', 'i-left') + '<input class="input input-lg" id="catQ" data-in="catQ" placeholder="Search courses, topics or instructors" value="' + esc(S.ui.q) + '" autocomplete="off"></div>' +
    '<select class="select" style="width:auto;height:52px;border-radius:99px" data-ch="catLevel" aria-label="Level"><option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>' +
    '<select class="select" style="width:auto;height:52px;border-radius:99px" data-ch="catSort" aria-label="Sort"><option value="popular">Most popular</option><option value="rating">Top rated</option><option value="title">Title A–Z</option></select></div>' +
    '<div class="row row-wrap gap-8 mt-16" style="overflow-x:auto">' + chips + '</div>' +
    '<div class="small muted mt-16 mb-16" id="catCount"></div><div class="grid g-3" id="catGrid"></div></div>';
  $('[data-ch=catLevel]', sec).value = S.ui.level; $('[data-ch=catSort]', sec).value = S.ui.sort;
  renderCatGrid();
});
INP.catQ = debounce(function (el) { S.ui.q = el.value; renderCatGrid(); }, 90);
CHG.catLevel = function (el) { S.ui.level = el.value; renderCatGrid(); };
CHG.catSort = function (el) { S.ui.sort = el.value; renderCatGrid(); };
ACT.cat = function (el) { S.ui.cat = el.dataset.v; $$('.chip', $('#v-catalog')).forEach(function (c) { c.classList.toggle('active', c === el); }); renderCatGrid(); };
ACT.clearFilters = function () { S.ui.q = ''; S.ui.cat = 'All'; S.ui.level = 'All'; rerender(); };

/* ── Detail kursus ── */
function enrollCta(c) {
  var st = enrollStatus(c.id), pr = S.token ? courseProgress(c) : null, h = '';
  if (!S.token) {
    h = '<button class="btn btn-primary btn-lg btn-block" data-act="needLogin" data-id="' + c.id + '">' + ic('lock') + 'Log in to request access</button><p class="small muted mt-12" style="text-align:center">New here? <a href="#" data-act="go" data-to="signup">Create a free account</a></p>';
  } else if (st === 'active') {
    h = (pr.done ? '<div class="row between small mb-8"><b>Your progress</b><span>' + pr.pct + '%</span></div><div class="progress lg mb-16"><span style="width:' + pr.pct + '%"></span></div>' : '') +
      (pr.cert ? '<button class="btn btn-primary btn-lg btn-block" data-act="go" data-to="certificate" data-num="' + esc(pr.cert.cert_number) + '">' + ic('award') + 'View certificate</button>'
        : '<button class="btn btn-primary btn-lg btn-block" data-act="resume" data-id="' + c.id + '">' + ic('play') + (pr.done ? 'Continue learning' : 'Start course') + '</button>');
  } else if (st === 'requested') {
    h = '<button class="btn btn-soft btn-lg btn-block" disabled>' + ic('clock') + 'Request pending</button><p class="small muted mt-12" style="text-align:center">An administrator will activate your access. You will see it here automatically.</p>' +
      '<button class="btn btn-ghost btn-sm btn-block mt-8" data-act="reqEnroll" data-id="' + c.id + '" data-resend="1">' + ic('mail', 'i-sm') + 'Send reminder email</button>';
  } else {
    h = (st === 'rejected' || st === 'revoked' ? '<div class="callout callout-warn mb-16 small">' + ic('alert') + '<div>Your previous request was ' + (st === 'rejected' ? 'declined' : 'revoked') + '. You can submit a new request.</div></div>' : '') +
      '<button class="btn btn-primary btn-lg btn-block" data-act="reqEnroll" data-id="' + c.id + '">' + ic('send') + 'Request Enrollment</button><p class="small muted mt-12" style="text-align:center">Access is activated manually by an administrator.</p>';
  }
  return h;
}
ACT.reqEnroll = function (el) {
  var c = getCourse(el.dataset.id); if (!c || !S.token) return;
  var resend = el.dataset.resend === '1', prev = clone(S.member.enrollments);
  var e = S.member.enrollments.filter(function (x) { return x.course_id === c.id; })[0];
  if (!e) { e = { course_id: c.id }; S.member.enrollments.push(e); }
  e.status = 'requested'; e.requested_at = Date.now(); LS.set('ll_member', S.member);
  rerender(); openMailto(c);
  toast(resend ? 'Reminder sent to the administrator.' : 'Request sent. We will activate your access soon.', 'ok');
  bg(call('requestEnrollment', S.token, c.id), function () { S.member.enrollments = prev; LS.set('ll_member', S.member); rerender(); }, 'Could not send your request.');
};
ACT.acc = function (el) { el.closest('.acc').classList.toggle('open'); };
ACT.tab = function (el) {
  var wrap = el.closest('[data-tabs]'); S.ui.tab = el.dataset.v;
  $$('.tab', wrap).forEach(function (t) { t.classList.toggle('active', t === el); });
  $$('[data-pane]', wrap.parentNode).forEach(function (p) { p.classList.toggle('hidden', p.dataset.pane !== el.dataset.v); });
};
ACT.trailer = function (el) {
  var id = el.dataset.id; if (!id) return;
  openModal({ title: 'Course trailer', size: 'lg', body: '<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) + '?rel=0&autoplay=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>' });
};
function reviewCard(r) {
  return '<div class="review"><div class="row between"><div class="row gap-12">' + avatar(r.name) + '<div><b style="font-family:var(--font-h)">' + esc(r.name) + '</b><div class="tiny muted">' + fmtDate(r.created_at) + '</div></div></div>' + stars(r.rating) + '</div>' +
    (r.comment ? '<p class="mt-12 small" style="color:var(--text)">' + esc(r.comment) + '</p>' : '') + '</div>';
}
route('course', 'public', null, function (sec, p) {
  var c = getCourse(p.id);
  if (!c) { sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('book', 'Course not found', 'This course may have been unpublished.', '<button class="btn btn-primary mt-8" data-act="go" data-to="catalog">Back to courses</button>') + '</div>'; return; }
  var st = enrollStatus(c.id), pr = S.token ? courseProgress(c) : null, quizzes = c.modules.filter(function (m) { return m.quiz; }).length;
  var tab = S.ui.tab || 'overview';
  var mods = c.modules.map(function (m, i) {
    var mp = pr && pr.mods[i];
    return '<div class="acc' + (i === 0 ? ' open' : '') + '"><button class="acc-head" data-act="acc"><span class="num">' + (i + 1) + '</span><div class="grow"><b>' + esc(m.title) + '</b><span class="small muted">' + plural(m.lessons.length, 'lesson') + (m.quiz ? ' · 1 quiz' : '') + '</span></div>' +
      (mp && mp.complete ? badge('Completed', 'b-ok', 'check') : '') + ic('chev-down', 'chev') + '</button><div class="acc-body">' +
      m.lessons.map(function (l) { var d = pr && pr.doneMap[l.id]; return '<div class="lesson-line">' + ic(d ? 'check-circle' : 'play', d ? 'text-ok' : '') + '<span class="grow">' + esc(l.title) + '</span><span class="tiny muted">' + fmtDur(l.duration) + '</span></div>'; }).join('') +
      (m.quiz ? '<div class="lesson-line quiz">' + ic('quiz', 'text-p') + '<span class="grow"><b>' + esc(m.quiz.title) + '</b> <span class="small muted">· ' + plural(m.quiz.questions, 'question') + (m.quiz.time_limit ? ' · ' + m.quiz.time_limit + ' min' : '') + ' · single attempt</span></span></div>' : '') +
      '</div></div>';
  }).join('');
  var dist = c.rating_dist || [0, 0, 0, 0, 0], total = sum(dist);
  var distRows = [5, 4, 3, 2, 1].map(function (n) { var v = dist[n - 1]; return '<div class="dist-row"><span>' + n + ' star' + (n > 1 ? 's' : '') + '</span><div class="progress"><span style="width:' + (total ? Math.round(v * 100 / total) : 0) + '%"></span></div><span>' + v + '</span></div>'; }).join('');
  var mine = S.member && S.member.reviews && S.member.reviews[c.id];
  S.reviewDraft = { rating: mine ? mine.rating : 0 };
  var reviewForm = st === 'active' ? '<div class="panel-soft mt-16"><b style="font-family:var(--font-h)">' + (mine ? 'Update your review' : 'Rate this course') + '</b><div class="star-input mt-8" id="starIn">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" class="' + (mine && n <= mine.rating ? 'on' : '') + '" data-act="star" data-v="' + n + '" aria-label="' + n + ' stars">' + ic('star') + '</button>'; }).join('') + '</div>' +
    '<form data-form="review" data-id="' + c.id + '"><textarea class="textarea mt-8" name="comment" placeholder="Share what you learned (optional)" maxlength="600">' + esc(mine ? mine.comment : '') + '</textarea><button class="btn btn-primary btn-sm mt-8" type="submit">Submit review</button></form></div>' : '';
  var trailer = c.trailer_youtube ? '<button class="play-btn solid" data-act="trailer" data-id="' + esc(c.trailer_youtube) + '" aria-label="Play trailer">' + ic('play') + '</button>' : '';
  sec.innerHTML = '<div class="container"><div class="course-hero"><div class="crumbs"><button data-act="go" data-to="catalog">Courses</button>' + ic('chev-right', 'i-sm') + '<span>' + esc(c.category) + '</span></div>' +
    '<div class="row gap-8 mt-16"><span class="badge b-p">' + esc(c.category) + '</span><span class="badge b-blue">' + esc(c.level) + '</span></div><h1 class="mt-12" style="font-size:clamp(28px,3.6vw,40px)">' + esc(c.title) + '</h1>' +
    '<p class="mt-12 muted" style="font-size:17px;max-width:720px">' + esc(c.short_desc) + '</p>' +
    '<div class="meta-row mt-16">' + (c.rating ? '<span class="rating">' + ic('star') + c.rating + '</span><span>' + plural(c.reviews_count, 'review') + '</span>' : '<span>No reviews yet</span>') + '<span>' + ic('users', 'i-sm') + plural(c.students, 'learner') + '</span><span>' + ic('clock', 'i-sm') + fmtDur(c.total_minutes) + '</span><span>' + ic('play', 'i-sm') + plural(c.lessons_count, 'lesson') + '</span></div>' +
    '<div class="row gap-12 mt-16">' + avatar(c.instructor || 'T') + '<div><b style="font-family:var(--font-h)">' + esc(c.instructor || 'Instructor') + '</b><div class="small muted">' + esc(c.instructor_title || '') + '</div></div></div></div>' +
    '<div class="split mt-24"><div><div class="tabs" data-tabs>' +
    [['overview', 'Overview'], ['curriculum', 'Curriculum'], ['instructor', 'Instructor'], ['reviews', 'Reviews (' + c.reviews_count + ')']].map(function (t) { return '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
    '<div class="mt-24' + (tab === 'overview' ? '' : ' hidden') + '" data-pane="overview"><h3>About this course</h3><p class="mt-8 muted" style="white-space:pre-line">' + esc(c.description || c.short_desc) + '</p>' +
    (c.outcomes.length ? '<h3 class="mt-24 mb-16">What you will learn</h3><div class="outcomes">' + c.outcomes.map(function (o) { return '<div class="outcome">' + ic('check-circle') + '<span>' + esc(o) + '</span></div>'; }).join('') + '</div>' : '') + '</div>' +
    '<div class="mt-24' + (tab === 'curriculum' ? '' : ' hidden') + '" data-pane="curriculum"><div class="row between mb-16"><h3>Curriculum</h3><span class="small muted">' + plural(c.modules.length, 'module') + ' · ' + plural(c.lessons_count, 'lesson') + ' · ' + fmtDur(c.total_minutes) + '</span></div>' + (mods || empty('layers', 'Curriculum coming soon', '')) + '</div>' +
    '<div class="mt-24' + (tab === 'instructor' ? '' : ' hidden') + '" data-pane="instructor"><div class="panel-flat row gap-24" style="align-items:flex-start">' + avatar(c.instructor || 'T', 'xl') + '<div><h3>' + esc(c.instructor || 'Instructor') + '</h3><div class="small text-p" style="font-weight:700">' + esc(c.instructor_title || '') + '</div><p class="mt-12 muted">' + esc(c.instructor_bio || 'Instructor details will be added soon.') + '</p></div></div></div>' +
    '<div class="mt-24' + (tab === 'reviews' ? '' : ' hidden') + '" data-pane="reviews"><div class="panel-flat"><div class="grid g-2" style="align-items:center"><div class="row gap-16"><div class="rating-big">' + (c.rating || '–') + '</div><div>' + stars(c.rating, 'i-lg') + '<div class="small muted mt-4">' + plural(c.reviews_count, 'review') + '</div></div></div><div class="stack gap-8">' + distRows + '</div></div></div>' +
    reviewForm + '<div class="stack mt-16">' + (c.reviews.length ? c.reviews.map(reviewCard).join('') : '<p class="muted small">Be the first to review this course once you have started learning.</p>') + '</div></div></div>' +
    '<aside class="sticky"><div class="card enroll-card"><div style="position:relative">' + cover(c, { badge: false, meta: false }) + trailer + '</div><div class="mt-16">' + enrollCta(c) + '</div>' +
    '<div class="dropdown-sep" style="margin:18px 0"></div><b style="font-family:var(--font-h)" class="small">This course includes</b><ul class="includes mt-12"><li>' + ic('play') + plural(c.lessons_count, 'on-demand video lesson') + '</li><li>' + ic('clock') + fmtDur(c.total_minutes) + ' of content</li><li>' + ic('quiz') + plural(quizzes, 'single-attempt quiz', 'single-attempt quizzes') + '</li><li>' + ic('file') + 'Downloadable resources</li><li>' + ic('award') + 'Verifiable certificate (pass mark ' + c.passing_score + '%)</li></ul></div></aside></div></div>';
});
ACT.star = function (el) {
  var v = Number(el.dataset.v); S.reviewDraft.rating = v;
  $$('#starIn button').forEach(function (b, i) { b.classList.toggle('on', i < v); });
};
FORM.review = function (f) {
  var id = f.dataset.id, rating = S.reviewDraft.rating, comment = f.comment.value.trim();
  if (!rating) return toast('Please choose a star rating first.', 'warn');
  var prev = S.member.reviews[id]; S.member.reviews[id] = { rating: rating, comment: comment }; LS.set('ll_member', S.member);
  toast('Thanks for your review!', 'ok');
  bg(call('submitReview', S.token, id, rating, comment).then(refreshPublic).then(function () { if (S.route.name === 'course') rerender(); }), function () { if (prev) S.member.reviews[id] = prev; else delete S.member.reviews[id]; LS.set('ll_member', S.member); });
};

/* ── Jalur belajar ── */
route('paths', 'public', null, function (sec) {
  var ps = S.pub.paths || [];
  var cards = ps.map(function (p) {
    var cs = p.course_ids.map(getCourse).filter(Boolean), doneN = 0;
    var rows = cs.map(function (c, i) {
      var st = enrollStatus(c.id), pr = S.token ? courseProgress(c) : null, done = pr && pr.complete && pr.cert; if (done) doneN++;
      var state = done ? badge('Completed', 'b-ok', 'check') : st === 'active' ? badge(pr.pct + '%', 'b-p') : st === 'requested' ? badge('Pending', 'b-warn') : '';
      return '<button class="lesson-line" style="width:100%;text-align:left;cursor:pointer" data-act="go" data-to="course" data-id="' + c.id + '"><span class="avatar" style="width:30px;height:30px">' + (i + 1) + '</span><span class="grow"><b style="font-family:var(--font-h)">' + esc(c.title) + '</b><br><span class="tiny muted">' + esc(c.category) + ' · ' + plural(c.lessons_count, 'lesson') + ' · ' + fmtDur(c.total_minutes) + '</span></span>' + state + ic('chev-right', 'i-sm') + '</button>';
    }).join('');
    return '<div class="panel"><div class="panel-head"><div><span class="eyebrow">Learning path</span><h3 class="mt-8">' + esc(p.title) + '</h3><p class="muted small mt-8" style="max-width:640px">' + esc(p.description) + '</p></div>' +
      '<div style="text-align:right"><div class="small muted">' + plural(cs.length, 'course') + '</div>' + (S.token ? '<div class="small"><b>' + doneN + '/' + cs.length + '</b> completed</div>' : '') + '</div></div>' + (S.token && cs.length ? '<div class="progress mb-16"><span style="width:' + Math.round(doneN * 100 / cs.length) + '%"></span></div>' : '') + '<div class="stack gap-8">' + rows + '</div></div>';
  }).join('');
  sec.innerHTML = '<div class="container" style="padding-top:36px"><div class="eyebrow">Guided journeys</div><h1 style="font-size:clamp(28px,3.4vw,40px)">Learning paths</h1><p class="muted mt-8">Follow a curated sequence of courses to build skills step by step.</p><div class="stack gap-24 mt-24">' +
    (cards || empty('route', 'No learning paths yet', 'Paths will appear here once the administrator publishes them.')) + '</div></div>';
});

/* ── Verifikasi sertifikat (publik) ── */
route('verify', 'public', null, function (sec, p) {
  sec.innerHTML = '<div class="container" style="padding-top:48px;max-width:860px"><div style="text-align:center"><span class="tile-icon" style="width:64px;height:64px;margin:0 auto 16px">' + ic('shield', 'i-xl') + '</span><h1 style="font-size:clamp(28px,3.4vw,38px)">Verify a certificate</h1>' +
    '<p class="muted mt-8">Enter the certificate number to confirm it is genuine.</p></div>' +
    '<form class="row gap-12 mt-24" data-form="verify" style="flex-wrap:wrap"><div class="input-wrap grow" style="min-width:240px">' + ic('award', 'i-left') + '<input class="input input-lg" name="num" placeholder="e.g. CERT-FMT-2026-AB12C" value="' + esc(p.num || '') + '" autocomplete="off" required></div><button class="btn btn-primary btn-lg" type="submit">Verify</button></form>' +
    '<div id="verifyOut" class="mt-24"></div></div>';
  if (p.num) runVerify(p.num);
});
FORM.verify = function (f) { runVerify(f.num.value.trim(), $('button[type=submit]', f)); };
function runVerify(num, btn) {
  var out = $('#verifyOut'); if (!out || !num) return;
  out.innerHTML = '<div class="sk" style="height:200px"></div>'; btnBusy(btn, true);
  call('verifyCertificate', num).then(function (r) {
    btnBusy(btn, false);
    if (!r.found) {
      out.innerHTML = '<div class="panel" style="text-align:center"><div class="state-icon" style="background:var(--err-bg);color:var(--err-tx)">' + ic('x-circle') + '</div><h3>No certificate found</h3><p class="muted mt-8">We could not find a valid certificate for <b class="mono">' + esc(r.query) + '</b>.</p><p class="small muted mt-8">Check for typos — the number looks like CERT-ABC-2026-XXXXX. If the problem continues, contact the issuer.</p></div>';
      return;
    }
    var d = r.data, c = d.cert;
    out.innerHTML = '<div class="panel"><div class="row gap-16"><div class="state-icon" style="background:var(--ok-bg);color:var(--ok-tx);margin:0">' + ic('check-circle') + '</div><div><span class="badge b-ok">' + ic('check', 'i-sm') + 'Valid certificate</span><h3 class="mt-8">' + esc(c.learner_name) + '</h3><p class="muted small">completed ' + esc(c.course_title) + '</p></div></div>' +
      '<div class="grid g-3 mt-16" style="gap:12px">' + [['Certificate number', c.cert_number], ['Issued on', fmtDate(c.issued_at)], ['Final score', c.final_score + '%'], ['Issued by', d.brand_name], ['Signed by', d.signer_name || '—'], ['Status', 'Valid']]
        .map(function (x) { return '<div class="panel-soft"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:700">' + x[0] + '</div><b style="font-family:var(--font-h)" class="' + (x[0] === 'Certificate number' ? 'mono' : '') + '">' + esc(x[1]) + '</b></div>'; }).join('') + '</div></div>' +
      '<div class="mt-24" id="verCert">' + certHtml(d) + '</div>';
    certQr($('#verCert'), c.cert_number);
  }).catch(function (e) { btnBusy(btn, false); out.innerHTML = '<div class="callout callout-err">' + ic('alert') + '<div>' + esc(e.message) + '</div></div>'; });
}

/* ── Autentikasi: login, daftar, lupa & reset sandi ── */
function authShell(inner) { return '<div class="auth-wrap"><div class="auth-card"><button class="brand" data-act="go" data-to="home" style="background:none;border:0;cursor:pointer;margin:0 auto 18px;display:flex">' + brandMark() + '<span>' + esc(brandName()) + '</span></button>' + inner + '</div></div>'; }
function pwField(name, label, ph, extra) {
  return '<div class="field"><label for="f_' + name + '">' + label + '</label><div class="input-wrap">' + ic('lock', 'i-left') + '<input class="input" id="f_' + name + '" name="' + name + '" type="password" placeholder="' + ph + '" autocomplete="' + (name === 'password' && extra === 'login' ? 'current-password' : 'new-password') + '" required' + (extra === 'new' ? ' data-in="pwStrength" minlength="8"' : '') + '><button type="button" class="icon-btn trail" data-act="togglePw" aria-label="Show password">' + ic('eye') + '</button></div></div>';
}
ACT.togglePw = function (el) { var i = $('input', el.parentNode); i.type = i.type === 'password' ? 'text' : 'password'; };
INP.pwStrength = function (el) {
  var v = el.value, sc = 0; if (v.length >= 8) sc++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) sc++; if (/\d/.test(v)) sc++; if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) sc++;
  var bar = $('.strength', el.closest('form')); if (!bar) return;
  var col = ['var(--err)', 'var(--warn)', 'var(--blue)', 'var(--ok)'][Math.max(0, sc - 1)];
  $$('span', bar).forEach(function (s, i) { s.style.background = i < sc ? col : ''; });
  var lb = $('.strength-lbl', el.closest('form')); if (lb) lb.textContent = v ? ['Too weak', 'Weak', 'Good', 'Strong', 'Very strong'][sc] : '';
};
function formErr(f, msg) {
  var e = $('.form-error', f); if (!e) { e = document.createElement('div'); e.className = 'callout callout-err form-error mb-16 small'; f.insertBefore(e, f.firstChild); }
  e.innerHTML = ic('alert') + '<div>' + esc(msg) + '</div>';
}
function clearErr(f) { var e = $('.form-error', f); if (e) e.remove(); }

route('login', 'public', null, function (sec) {
  sec.innerHTML = authShell('<h2>Welcome back</h2><p class="sub">Log in to continue your learning.</p><form class="stack gap-16 mt-24" data-form="login" novalidate>' +
    '<div class="field"><label for="f_email">Email address</label><div class="input-wrap">' + ic('mail', 'i-left') + '<input class="input" id="f_email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required></div></div>' +
    pwField('password', 'Password', 'Your password', 'login') +
    '<div class="row between"><label class="check small"><input type="checkbox" name="remember" checked> Keep me signed in</label><a href="#" class="small" data-act="go" data-to="forgot" style="font-weight:700">Forgot password?</a></div>' +
    '<button class="btn btn-primary btn-lg btn-block" type="submit">Log in</button></form><div class="auth-foot">New to ' + esc(brandName()) + '? <button data-act="go" data-to="signup">Create an account</button></div>');
});
FORM.login = function (f) {
  clearErr(f); var email = f.email.value.trim(), pw = f.password.value, btn = $('button[type=submit]', f);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return formErr(f, 'Please enter a valid email address.');
  if (!pw) return formErr(f, 'Please enter your password.');
  btnBusy(btn, true, 'Logging in…');
  call('login', email, pw).then(function (r) {
    setSession(r.token, r.member); toast('Welcome back, ' + r.member.profile.name.split(' ')[0] + '!', 'ok'); afterLogin();
  }).catch(function (e) { btnBusy(btn, false); formErr(f, e.message); });
};
route('signup', 'public', null, function (sec) {
  sec.innerHTML = authShell('<h2>Create your account</h2><p class="sub">Start learning in under a minute.</p><form class="stack gap-16 mt-24" data-form="signup" novalidate>' +
    '<div class="field"><label for="f_name">Full name</label><div class="input-wrap">' + ic('user', 'i-left') + '<input class="input" id="f_name" name="name" placeholder="Your full name" autocomplete="name" required></div><span class="help">This name appears on your certificate.</span></div>' +
    '<div class="field"><label for="f_email">Email address</label><div class="input-wrap">' + ic('mail', 'i-left') + '<input class="input" id="f_email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required></div></div>' +
    pwField('password', 'Password', 'At least 8 characters', 'new').replace('</div></div>', '</div><div class="strength"><span></span><span></span><span></span><span></span></div><span class="help strength-lbl"></span></div>') +
    '<button class="btn btn-primary btn-lg btn-block" type="submit">Create account</button></form><div class="auth-foot">Already have an account? <button data-act="go" data-to="login">Log in</button></div>');
});
FORM.signup = function (f) {
  clearErr(f); var name = f.name.value.trim(), email = f.email.value.trim(), pw = f.password.value, btn = $('button[type=submit]', f);
  if (name.length < 2) return formErr(f, 'Please enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return formErr(f, 'Please enter a valid email address.');
  if (pw.length < 8) return formErr(f, 'Password must be at least 8 characters.');
  btnBusy(btn, true, 'Creating account…');
  call('signup', name, email, pw).then(function (r) {
    setSession(r.token, r.member); toast('Account created. Welcome aboard!', 'ok'); afterLogin();
  }).catch(function (e) { btnBusy(btn, false); formErr(f, e.message); });
};
route('forgot', 'public', null, function (sec) {
  sec.innerHTML = authShell('<div id="forgotBody"><h2>Forgot your password?</h2><p class="sub">Enter your email and we will send you a link to reset it.</p><form class="stack gap-16 mt-24" data-form="forgot" novalidate>' +
    '<div class="field"><label for="f_email">Email address</label><div class="input-wrap">' + ic('mail', 'i-left') + '<input class="input" id="f_email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required></div></div>' +
    '<button class="btn btn-primary btn-lg btn-block" type="submit">Send reset link</button></form><div class="auth-foot"><button data-act="go" data-to="login">' + ic('arrow-left', 'i-sm') + ' Back to log in</button></div></div>');
});
FORM.forgot = function (f) {
  clearErr(f); var email = f.email.value.trim(), btn = $('button[type=submit]', f);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return formErr(f, 'Please enter a valid email address.');
  btnBusy(btn, true, 'Sending…');
  call('requestPasswordReset', email).then(function () {
    $('#forgotBody').innerHTML = '<div style="text-align:center"><div class="state-icon" style="background:var(--ok-bg);color:var(--ok-tx)">' + ic('mail') + '</div><h2>Check your inbox</h2><p class="sub">If an account exists for <b>' + esc(email) + '</b>, a reset link is on its way. It is valid for 60 minutes.</p><button class="btn btn-soft btn-block mt-24" data-act="go" data-to="login">Back to log in</button></div>';
  }).catch(function (e) { btnBusy(btn, false); formErr(f, e.message); });
};
route('reset', 'public', null, function (sec, p) {
  if (!p.token) { sec.innerHTML = authShell('<div style="text-align:center"><div class="state-icon" style="background:var(--err-bg);color:var(--err-tx)">' + ic('x-circle') + '</div><h2>Invalid link</h2><p class="sub">This reset link is missing or incomplete.</p><button class="btn btn-primary btn-block mt-24" data-act="go" data-to="forgot">Request a new link</button></div>'); return; }
  sec.innerHTML = authShell('<div id="resetBody"><h2>Set a new password</h2><p class="sub">Choose a strong password you have not used before.</p><form class="stack gap-16 mt-24" data-form="reset" data-token="' + esc(p.token) + '" novalidate>' +
    pwField('password', 'New password', 'At least 8 characters', 'new').replace('</div></div>', '</div><div class="strength"><span></span><span></span><span></span><span></span></div><span class="help strength-lbl"></span></div>') +
    pwField('confirm', 'Confirm new password', 'Repeat the password', 'confirm') + '<button class="btn btn-primary btn-lg btn-block" type="submit">Update password</button></form></div>');
});
FORM.reset = function (f) {
  clearErr(f); var pw = f.password.value, btn = $('button[type=submit]', f);
  if (pw.length < 8) return formErr(f, 'Password must be at least 8 characters.');
  if (pw !== f.confirm.value) return formErr(f, 'The two passwords do not match.');
  btnBusy(btn, true, 'Updating…');
  call('resetPassword', f.dataset.token, pw).then(function () {
    $('#resetBody').innerHTML = '<div style="text-align:center"><div class="state-icon" style="background:var(--ok-bg);color:var(--ok-tx)">' + ic('check-circle') + '</div><h2>Password updated</h2><p class="sub">You can now log in with your new password.</p><button class="btn btn-primary btn-block mt-24" data-act="go" data-to="login">Log in</button></div>';
  }).catch(function (e) {
    btnBusy(btn, false);
    if (e.code === 'INVALID_LINK') $('#resetBody').innerHTML = '<div style="text-align:center"><div class="state-icon" style="background:var(--err-bg);color:var(--err-tx)">' + ic('x-circle') + '</div><h2>Link expired</h2><p class="sub">' + esc(e.message) + '</p><button class="btn btn-primary btn-block mt-24" data-act="go" data-to="forgot">Request a new link</button></div>';
    else formErr(f, e.message);
  });
};


/* ════════════════════════════════════════════════════════════
   BAGIAN 3 — AREA MEMBER: dashboard, ruang belajar, kuis, sertifikat
   ════════════════════════════════════════════════════════════ */

function ringSvg(pct, size, stroke, color) {
  var r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(pct, 0, 100) / 100);
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--p-soft-2)" stroke-width="' + stroke + '"/>' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (color || 'var(--p)') + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" style="transition:stroke-dashoffset .6s var(--ease)"/></svg>';
}
function findQuiz(quizId) {
  var cs = S.pub.courses || [];
  for (var i = 0; i < cs.length; i++) for (var j = 0; j < cs[i].modules.length; j++) { var m = cs[i].modules[j]; if (m.quiz && m.quiz.id === quizId) return { c: cs[i], m: m, mi: j, q: m.quiz }; }
  return null;
}

/* ── Dashboard member ── */
route('dashboard', 'public', 'member', function (sec) {
  var me = S.me, mine = myCourses(), cs = S.pub.courses || [];
  var lessonsDone = (S.member.progress || []).length;
  var scores = []; Object.keys(S.member.attempts || {}).forEach(function (k) { var a = S.member.attempts[k]; if (a.status === 'submitted') scores.push(a.score); });
  var avg = scores.length ? Math.round(sum(scores) / scores.length) : null;
  var certs = S.member.certificates || [];
  var pend = (S.member.enrollments || []).filter(function (e) { return e.status === 'requested'; }).map(function (e) { return getCourse(e.course_id); }).filter(Boolean);
  var rows = mine.map(function (c) { return { c: c, pr: courseProgress(c) }; });
  var cont = rows.filter(function (r) { return !r.pr.cert && r.pr.next; }).sort(function (a, b) { return b.pr.pct - a.pr.pct; })[0];
  var hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  var contHtml = '';
  if (cont) {
    var nx = cont.pr.next, nxTitle = nx.type === 'lesson' ? (cont.c.modules.reduce(function (a, m) { return a.concat(m.lessons); }, []).filter(function (l) { return l.id === nx.id; })[0] || {}).title : nx.module.quiz.title;
    contHtml = '<div class="card continue-card mt-24">' + cover(cont.c, { meta: false }) + '<div><span class="eyebrow">' + (cont.pr.done ? 'Continue where you left off' : 'Ready to start') + '</span><h3 class="mt-8">' + esc(cont.c.title) + '</h3>' +
      '<p class="muted small mt-8">' + (nx.type === 'quiz' ? 'Next up: ' + ic('quiz', 'i-sm') + ' ' : 'Next lesson: ') + esc(nxTitle || '') + '</p><div class="row gap-16 mt-16"><div class="progress lg grow"><span style="width:' + cont.pr.pct + '%"></span></div><b>' + cont.pr.pct + '%</b></div>' +
      '<div class="row row-wrap gap-8 mt-16"><button class="btn btn-primary" data-act="resume" data-id="' + cont.c.id + '">' + ic('play', 'i-sm') + (cont.pr.done ? 'Resume learning' : 'Start learning') + '</button><button class="btn btn-outline" data-act="go" data-to="course" data-id="' + cont.c.id + '">Course details</button></div></div></div>';
  }
  var kpi = [['Active courses', mine.length, '', 'book', ''], ['Lessons completed', lessonsDone, '', 'check-circle', 'blue'], ['Average quiz score', avg === null ? '–' : avg, avg === null ? '' : '%', 'target', 'pink'], ['Certificates', certs.length, '', 'award', 'amber']]
    .map(function (k) { return '<div class="card kpi"><span class="corner tile-icon sm ' + k[4] + '">' + ic(k[3]) + '</span><span class="lbl">' + k[0] + '</span><div class="val">' + k[1] + (k[2] ? '<small>' + k[2] + '</small>' : '') + '</div></div>'; }).join('');
  var courseCards = rows.map(function (r) {
    var c = r.c, pr = r.pr;
    return '<article class="card course-card" data-act="resume" data-id="' + c.id + '">' + cover(c) + '<div class="course-body"><h4 class="clamp-2">' + esc(c.title) + '</h4>' +
      '<div class="row between small muted"><span>' + pr.done + ' / ' + pr.total + ' steps</span><b style="color:var(--text)">' + pr.pct + '%</b></div><div class="progress' + (pr.cert ? ' ok' : '') + '"><span style="width:' + pr.pct + '%"></span></div>' +
      '<div class="row between mt-8">' + (pr.cert ? badge('Certified', 'b-ok', 'award') : pr.complete ? badge('Under review', 'b-warn') : badge('In progress', 'b-p')) +
      (pr.cert ? '<button class="btn btn-soft btn-xs" data-act="go" data-to="certificate" data-num="' + esc(pr.cert.cert_number) + '">Certificate</button>' : '<span class="small text-p" style="font-weight:700">Continue ' + ic('arrow-right', 'i-sm') + '</span>') + '</div></div></article>';
  }).join('');
  var certList = certs.map(function (c) {
    return '<div class="card row gap-16" style="padding:16px;flex-wrap:wrap"><span class="tile-icon amber">' + ic('award') + '</span><div class="grow"><b style="font-family:var(--font-h)">' + esc(c.course_title) + '</b><div class="small muted">Issued ' + fmtDate(c.issued_at) + ' · Score ' + c.final_score + '% · <span class="mono">' + esc(c.cert_number) + '</span></div></div>' +
      '<button class="btn btn-soft btn-sm" data-act="go" data-to="certificate" data-num="' + esc(c.cert_number) + '">View</button></div>';
  }).join('');
  sec.innerHTML = '<div class="container" style="padding-top:36px"><div class="row between row-wrap"><div><div class="eyebrow">My learning</div><h1 style="font-size:clamp(26px,3.2vw,36px)">' + greet + ', ' + esc(me.name.split(' ')[0]) + '</h1><p class="muted mt-8">' +
    (mine.length ? 'Pick up where you left off or explore something new.' : 'Request access to a course to get started.') + '</p></div><button class="btn btn-outline" data-act="go" data-to="catalog">' + ic('search', 'i-sm') + 'Browse courses</button></div>' +
    contHtml + '<div class="grid g-4 mt-24">' + kpi + '</div>' +
    (pend.length ? '<div class="callout callout-warn mt-24">' + ic('clock') + '<div><b>' + plural(pend.length, 'request') + ' awaiting activation</b><br>' + pend.map(function (c) { return esc(c.title); }).join(' · ') + '. We will unlock the course as soon as an administrator approves it.</div></div>' : '') +
    '<div class="section-head mt-32"><h2>My courses</h2></div>' +
    (courseCards ? '<div class="grid g-3">' + courseCards + '</div>' : '<div class="panel-flat">' + empty('book', 'No active courses yet', 'Browse the catalog and request access. You will see your courses here once they are activated.', '<button class="btn btn-primary mt-8" data-act="go" data-to="catalog">Explore courses</button>') + '</div>') +
    (certs.length ? '<div class="section-head mt-32"><h2>My certificates</h2></div><div class="stack">' + certList + '</div>' : '') + '</div>';
});

/* ── Ruang belajar ── */
function flatLessons(c) { var o = []; c.modules.forEach(function (m) { m.lessons.forEach(function (l) { o.push({ l: l, m: m }); }); }); return o; }
function nextTarget(c, lessonId) {
  var done = courseProgress(c).doneMap, mi, li;
  for (mi = 0; mi < c.modules.length; mi++) {
    var m = c.modules[mi];
    for (li = 0; li < m.lessons.length; li++) if (m.lessons[li].id === lessonId) {
      if (li < m.lessons.length - 1) return { type: 'lesson', id: m.lessons[li + 1].id };
      var all = m.lessons.every(function (l) { return done[l.id] || l.id === lessonId; });
      var att = m.quiz && S.member.attempts[m.quiz.id];
      if (m.quiz && all && !(att && att.status === 'submitted')) return { type: 'quiz', id: m.quiz.id };
      var nm = c.modules[mi + 1]; return nm && nm.lessons.length ? { type: 'lesson', id: nm.lessons[0].id } : null;
    }
  }
  return null;
}
route('room', 'public', 'member', function (sec, p) {
  var c = getCourse(p.courseId);
  if (!c) { sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('book', 'Course not found', '', '<button class="btn btn-primary mt-8" data-act="go" data-to="dashboard">My learning</button>') + '</div>'; return; }
  if (enrollStatus(c.id) !== 'active') {
    sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('lock', 'Access not activated yet', 'An administrator needs to activate your access to "' + c.title + '" before you can start.', '<button class="btn btn-primary mt-8" data-act="go" data-to="course" data-id="' + c.id + '">View course</button>') + '</div>'; return;
  }
  var pr = courseProgress(c), flat = flatLessons(c);
  if (!flat.length) { sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('video', 'No lessons yet', 'This course has no lessons yet. Please check back soon.', '<button class="btn btn-primary mt-8" data-act="go" data-to="dashboard">Back</button>') + '</div>'; return; }
  var cur = flat.filter(function (x) { return x.l.id === p.lessonId; })[0] || (pr.next && pr.next.type === 'lesson' ? flat.filter(function (x) { return x.l.id === pr.next.id; })[0] : null) || flat[0];
  var idx = flat.indexOf(cur), l = cur.l, done = !!pr.doneMap[l.id];
  var content = (S.member.content || {})[l.id] || { materials: [] };
  var prev = flat[idx - 1], nt = nextTarget(c, l.id);
  var video = content.youtube_id ? '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(content.youtube_id) + '?rel=0&modestbranding=1" title="' + esc(l.title) + '" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>'
    : '<div class="ph"><div>' + ic('video', 'i-xl') + '<p class="mt-8">No video has been added to this lesson yet.</p></div></div>';
  var mats = (content.materials || []).map(function (m) {
    var icn = { document: 'file', link: 'link', youtube: 'video', zip: 'archive' }[m.type] || 'file';
    var sub = m.has_file ? esc((m.file_name || 'File') + (m.size ? ' · ' + fmtSize(m.size) : '')) : esc(String(m.url || '').replace(/^https?:\/\//, '').slice(0, 48));
    return '<div class="material"><span class="tile-icon sq sm">' + ic(icn) + '</span><div class="grow"><b>' + esc(m.title) + '</b><span class="small muted">' + sub + '</span></div>' +
      '<button class="btn btn-soft btn-sm" data-act="openMat" data-id="' + m.id + '" data-lesson="' + l.id + '">' + ic(m.has_file ? 'download' : 'external', 'i-sm') + (m.has_file ? 'Open' : 'Visit') + '</button></div>';
  }).join('');
  var curr = c.modules.map(function (m, mi) {
    var mp = pr.mods[mi];
    var rows = m.lessons.map(function (x) {
      var d = pr.doneMap[x.id], isCur = x.id === l.id;
      return '<button class="curr-row' + (d ? ' done' : '') + (isCur ? ' current' : '') + '" data-act="go" data-to="room" data-course-id="' + c.id + '" data-lesson-id="' + x.id + '"><span class="ic">' + ic(d ? 'check' : 'play', 'i-sm') + '</span><div class="grow"><b class="clamp-1">' + esc(x.title) + '</b><span class="sub">' + fmtDur(x.duration) + '</span></div>' + (isCur ? '<span class="state">Now playing</span>' : d ? '<span class="state">Done</span>' : '') + '</button>';
    }).join('');
    if (m.quiz) {
      var a = mp.att, sub = mp.submitted;
      rows += '<button class="curr-row' + (sub ? ' done' : '') + (mp.unlocked ? '' : ' locked') + '" data-act="openQuiz" data-id="' + m.quiz.id + '"><span class="ic">' + ic(sub ? 'check' : mp.unlocked ? 'quiz' : 'lock', 'i-sm') + '</span><div class="grow"><b class="clamp-1">' + esc(m.quiz.title) + '</b><span class="sub">' + plural(m.quiz.questions, 'question') + (m.quiz.time_limit ? ' · ' + m.quiz.time_limit + ' min' : '') + '</span></div><span class="state">' + (sub ? 'Score ' + a.score + '%' : mp.unlocked ? 'Start' : 'Locked') + '</span></button>';
    }
    return '<div class="curr-mod"><div class="curr-mod-head"><b>' + (mi + 1) + '. ' + esc(m.title) + '</b><span class="tiny muted">' + mp.lDone + '/' + mp.lTotal + '</span></div>' + rows + '</div>';
  }).join('');
  var finish = pr.cert ? '<div class="callout callout-ok mt-24">' + ic('award') + '<div><b>Congratulations — you are certified!</b><br>Your certificate has been issued.<br><button class="btn btn-primary btn-sm mt-8" data-act="go" data-to="certificate" data-num="' + esc(pr.cert.cert_number) + '">View certificate</button></div></div>'
    : pr.complete && !pr.passed ? '<div class="callout callout-warn mt-24">' + ic('alert') + '<div><b>Almost there.</b> Your quiz average is ' + pr.avg + '%, below the ' + c.passing_score + '% pass mark. Please contact your administrator about a quiz reset.</div></div>' : '';
  var nextBtn = nt ? (nt.type === 'quiz' ? '<button class="btn btn-primary" data-act="markDone" data-id="' + l.id + '" data-course="' + c.id + '">' + ic('quiz', 'i-sm') + (done ? 'Go to module quiz' : 'Complete & take quiz') + '</button>'
    : '<button class="btn btn-primary" data-act="markDone" data-id="' + l.id + '" data-course="' + c.id + '">' + (done ? 'Next lesson' : 'Complete & continue') + ic('arrow-right', 'i-sm') + '</button>')
    : '<button class="btn btn-primary" data-act="markDone" data-id="' + l.id + '" data-course="' + c.id + '">' + (done ? 'Back to dashboard' : 'Complete course') + ic('check', 'i-sm') + '</button>';
  sec.innerHTML = '<div class="container"><div class="card room-top"><button class="btn btn-ghost btn-sm" data-act="go" data-to="dashboard">' + ic('arrow-left', 'i-sm') + 'My learning</button><div class="grow" style="min-width:0"><div class="tiny muted">' + esc(c.title) + '</div><b class="clamp-1" style="font-family:var(--font-h)">' + esc(cur.m.title) + '</b></div>' +
    '<div style="width:min(220px,30vw)" class="hide-s"><div class="row between tiny muted mb-8"><span>Progress</span><b style="color:var(--text)">' + pr.pct + '%</b></div><div class="progress"><span style="width:' + pr.pct + '%"></span></div></div></div>' +
    '<div class="room-grid"><div><div class="player">' + video + '</div><div class="panel lesson-card"><div class="row between row-wrap gap-8"><div><span class="eyebrow">Lesson ' + (idx + 1) + ' of ' + flat.length + '</span><h2 class="mt-8" style="font-size:24px">' + esc(l.title) + '</h2></div>' + (done ? badge('Completed', 'b-ok', 'check') : badge(fmtDur(l.duration), 'b-slate', 'clock')) + '</div>' +
    '<div class="mt-16"><div class="tabs" data-tabs><button class="tab active" data-act="tab" data-v="overview">Overview</button><button class="tab" data-act="tab" data-v="resources">Resources' + (content.materials && content.materials.length ? ' (' + content.materials.length + ')' : '') + '</button></div>' +
    '<div class="mt-16" data-pane="overview"><p class="muted" style="white-space:pre-line">' + esc(content.description || l.description || 'No description for this lesson.') + '</p></div>' +
    '<div class="mt-16 hidden" data-pane="resources"><div class="stack gap-8">' + (mats || '<p class="muted small">No downloadable resources for this lesson.</p>') + '</div></div></div>' +
    '<div class="action-bar">' + (prev ? '<button class="btn btn-outline" data-act="go" data-to="room" data-course-id="' + c.id + '" data-lesson-id="' + prev.l.id + '">' + ic('arrow-left', 'i-sm') + 'Previous</button>' : '') + '<span class="grow"></span>' + nextBtn + '</div></div>' + finish + '</div>' +
    '<aside class="card curr sticky"><div class="row between"><h3 style="font-size:17px">Course content</h3><span class="small muted">' + pr.done + '/' + pr.total + '</span></div><div class="progress mt-8"><span style="width:' + pr.pct + '%"></span></div>' + curr + '</aside></div></div>';
});
ACT.openQuiz = function (el) {
  var f = findQuiz(el.dataset.id); if (!f) return;
  var pr = courseProgress(f.c), mp = pr.mods[f.mi];
  if (!mp.unlocked && !isAdminUser()) return toast('Complete all lessons in this module to unlock the quiz.', 'info', 'Quiz locked');
  go('quiz', { quizId: f.q.id });
};
ACT.markDone = function (el) {
  var lessonId = el.dataset.id, c = getCourse(el.dataset.course); if (!c) return;
  var wasDone = courseProgress(c).doneMap[lessonId], nt = nextTarget(c, lessonId);
  var jump = function () {
    if (!nt) return go('room', { courseId: c.id, lessonId: lessonId }, { replace: false });
    if (nt.type === 'quiz') return go('quiz', { quizId: nt.id });
    go('room', { courseId: c.id, lessonId: nt.id });
  };
  if (wasDone) { if (!nt) return go('dashboard'); return jump(); }
  S.member.progress.push(lessonId); LS.set('ll_member', S.member);   // optimistik: UI langsung berubah
  toast('Lesson completed', 'ok'); 
  if (!nt) { var pr0 = courseProgress(c); if (pr0.complete) toast('You finished every lesson. Great work!', 'ok'); rerender(); } else jump();
  bg(call('markLessonComplete', S.token, lessonId).then(function (r) {
    if (r.certificate && !S.member.certificates.some(function (x) { return x.cert_number === r.certificate.cert_number; })) {
      S.member.certificates.push(r.certificate); LS.set('ll_member', S.member); refreshPublic();
      toast('Your certificate for "' + c.title + '" has been issued.', 'ok', 'Congratulations!');
      if (S.route.name === 'room') rerender();
    }
  }), function () {
    S.member.progress = S.member.progress.filter(function (id) { return id !== lessonId; }); LS.set('ll_member', S.member);
    if (MEMBER_VIEWS.indexOf(S.route.name) > -1) rerender();
  }, 'Could not save your progress.');
};
ACT.openMat = function (el) {
  var lesson = (S.member.content || {})[el.dataset.lesson], m = lesson && lesson.materials.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!m) return;
  if (!m.has_file) { var a = document.createElement('a'); a.href = m.url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); return; }
  btnBusy(el, true);
  call('getMaterialFile', S.token, m.id).then(function (f) {
    btnBusy(el, false);
    var bin = atob(f.data), n = bin.length, u8 = new Uint8Array(n); for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    var blob = new Blob([u8], { type: f.mime || 'application/octet-stream' }), url = URL.createObjectURL(blob);
    var isImg = /^image\//.test(f.mime), isPdf = /pdf$/.test(f.mime);
    if (!isImg && !isPdf) { downloadBlob(f.name, blob); return; }
    var mod = openModal({ title: f.name, icon: 'file', size: 'lg', body: isImg ? '<img src="' + url + '" alt="" style="max-height:70vh;margin:auto;border-radius:12px">' : '<iframe src="' + url + '" style="width:100%;height:70vh;border:0;border-radius:12px"></iframe>',
      foot: '<button class="btn btn-outline" data-act="closeModal">Close</button><button class="btn btn-primary" id="matDl">' + ic('download', 'i-sm') + 'Download</button>', focus: false,
      onMount: function (e) { $('#matDl', e).onclick = function () { downloadBlob(f.name, blob); }; } });
    mod.onClose = function () { URL.revokeObjectURL(url); };
  }).catch(function (e) { btnBusy(el, false); toast(e.message, 'err'); });
};

/* ── Kuis (mode fokus, satu percobaan) ── */
var Q = null;
function quizFocusNav(f, extra) {
  $('#focusNav').innerHTML = '<div class="container"><button class="brand" data-act="quitQuiz" style="background:none;border:0;cursor:pointer">' + brandMark() + '<span class="hide-s">' + esc(brandName()) + '</span></button><span class="vsep hide-s"></span>' +
    '<div class="grow" style="min-width:0"><div class="tiny muted clamp-1">' + esc(f.c.title) + '</div><b class="clamp-1" style="font-family:var(--font-h)">Module ' + (f.mi + 1) + ' · ' + esc(f.q.title) + '</b></div>' + (extra || '') +
    '<button class="btn btn-outline btn-sm" data-act="quitQuiz">' + ic('x', 'i-sm') + '<span class="hide-s">Exit</span></button></div>';
}
ACT.quitQuiz = function () {
  if (Q && Q.phase === 'run') return confirmBox({ title: 'Leave the quiz?', text: 'Your answers are saved and the timer keeps running. You can come back and continue before time runs out.', yes: 'Leave quiz', no: 'Stay' }).then(function (ok) { if (ok) leaveQuiz(); });
  leaveQuiz();
};
function leaveQuiz() { var f = Q && Q.f; if (f) go('room', { courseId: f.c.id }); else go('dashboard'); }
route('quiz', 'focus', 'member', function (sec, p) {
  var f = findQuiz(p.quizId);
  if (!f) { sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('quiz', 'Quiz not found', '', '<button class="btn btn-primary mt-8" data-act="go" data-to="dashboard">Back</button>') + '</div>'; return; }
  if (enrollStatus(f.c.id) !== 'active') { sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('lock', 'Access not activated yet', '', '<button class="btn btn-primary mt-8" data-act="go" data-to="dashboard">Back</button>') + '</div>'; return; }
  var a = S.member.attempts[f.q.id];
  Q = { f: f, id: f.q.id, phase: a && a.status === 'submitted' ? 'result' : 'intro', attempt: a, idx: 0, answers: {}, flags: {}, questions: [], timerId: null, offset: 0, deadline: 0 };
  S.cleanup = function () { if (Q) { clearInterval(Q.timerId); } document.removeEventListener('keydown', quizKeys); };
  document.addEventListener('keydown', quizKeys);
  paintQuiz();
});
function paintQuiz() {
  var sec = $('#v-quiz'), f = Q.f;
  if (Q.phase === 'intro') {
    quizFocusNav(f);
    var pr = courseProgress(f.c), mp = pr.mods[f.mi], locked = !mp.unlocked && !isAdminUser();
    sec.innerHTML = '<div class="container"><div class="quiz-card" style="text-align:center"><span class="tile-icon" style="width:72px;height:72px;margin:0 auto 18px">' + ic('quiz', 'i-xl') + '</span><span class="eyebrow">Module ' + (f.mi + 1) + ' quiz</span><h1 class="mt-8" style="font-size:clamp(26px,3.4vw,36px)">' + esc(f.q.title) + '</h1><p class="muted mt-8">' + esc(f.c.title) + ' · ' + esc(f.m.title) + '</p>' +
      '<div class="quiz-info" style="text-align:left">' + [['list', plural(f.q.questions, 'question'), 'Total questions'], ['timer', f.q.time_limit ? f.q.time_limit + ' min' : 'No limit', 'Time limit'], ['flag', '1 attempt', 'Single attempt only'], ['target', f.c.passing_score + '%', 'Course pass mark (average)']]
        .map(function (x) { return '<div><span class="tile-icon sm sq">' + ic(x[0]) + '</span><div class="lbl">' + x[2] + '</div><b>' + x[1] + '</b></div>'; }).join('') + '</div>' +
      (locked ? '<div class="callout callout-warn" style="text-align:left">' + ic('lock') + '<div><b>Quiz locked.</b> Finish all lessons in this module first (' + mp.lDone + ' of ' + mp.lTotal + ' done).</div></div>'
        : '<div class="callout callout-warn" style="text-align:left">' + ic('alert') + '<div><b>You only get one attempt.</b> Once you submit, your score is final unless an administrator resets it. ' + (f.q.time_limit ? 'The timer starts as soon as you begin and keeps running if you leave.' : '') + '</div></div>') +
      '<div class="row row-wrap gap-12 mt-24" style="justify-content:center"><button class="btn btn-outline btn-lg" data-act="quitQuiz">Back to course</button>' + (locked ? '' : '<button class="btn btn-primary btn-lg" data-act="startQuiz">Start quiz ' + ic('arrow-right', 'i-sm') + '</button>') + '</div></div></div>';
  } else if (Q.phase === 'loading') {
    quizFocusNav(f); sec.innerHTML = '<div class="container"><div class="quiz-card">' + skel(1, 40) + skel(3, 70) + '</div></div>';
  } else if (Q.phase === 'run') paintRun();
  else if (Q.phase === 'submitting') { sec.innerHTML = '<div class="container"><div class="quiz-card" style="text-align:center"><div class="state-icon" style="background:var(--p-soft);color:var(--p-text)"><span class="spin" style="width:28px;height:28px;border-width:3px;display:block"></span></div><h2>Grading your answers…</h2><p class="muted mt-8">This only takes a moment.</p></div></div>'; }
  else paintResult();
}
ACT.startQuiz = function () {
  Q.phase = 'loading'; paintQuiz();
  call('startQuiz', S.token, Q.id).then(function (r) {
    if (r.status === 'submitted') return finishQuiz(r.attempt, r.certificate, r.autoSubmitted);
    var local = LS.get('ll_qa_' + Q.id, {}) || {};
    Q.questions = r.questions; Q.answers = Object.assign({}, r.answers || {}, local);
    Q.offset = r.server_now - Date.now(); Q.deadline = r.deadline || 0; Q.limit = r.time_limit; Q.idx = 0; Q.phase = 'run'; Q.saved = true;
    var seen = {}; Q.questions.forEach(function (x) { seen[x.id] = 1; }); Object.keys(Q.answers).forEach(function (k) { if (!seen[k]) delete Q.answers[k]; });
    paintQuiz(); startTimer();
  }).catch(function (e) { Q.phase = 'intro'; paintQuiz(); toast(e.message, 'err'); });
};
function remaining() { return Q.deadline ? Q.deadline - (Date.now() + Q.offset) : Infinity; }
function startTimer() {
  clearInterval(Q.timerId);
  var tick = function () {
    if (!Q || Q.phase !== 'run') return;
    var r = remaining(), t = $('#qTimer');
    if (r !== Infinity && t) { t.textContent = fmtClock(r / 1000); t.parentNode.classList.toggle('low', r < 60000); }
    if (r !== Infinity && r <= 0) { clearInterval(Q.timerId); toast('Time is up — submitting your answers.', 'warn'); doSubmit(); }
  };
  Q.timerId = setInterval(tick, 500); tick();
}
function paintRun() {
  var f = Q.f, qs = Q.questions, i = Q.idx, q = qs[i], total = qs.length, answered = Object.keys(Q.answers).length;
  quizFocusNav(f);
  var dots = qs.map(function (x, n) { return '<button class="q-dot' + (Q.answers[x.id] ? ' answered' : '') + (n === i ? ' current' : '') + (Q.flags[x.id] ? ' flag' : '') + '" data-act="qgo" data-i="' + n + '" aria-label="Question ' + (n + 1) + '">' + (n + 1) + '</button>'; }).join('');
  var opts = q.options.map(function (o) {
    return '<button class="q-opt' + (Q.answers[q.id] === o.key ? ' selected' : '') + '" data-act="pick" data-k="' + o.key + '"><span class="radio"></span><span><span class="k">Option ' + o.key.toUpperCase() + '</span>' + esc(o.text) + '</span></button>';
  }).join('');
  var timer = Q.deadline ? '<span class="timer-chip' + (remaining() < 60000 ? ' low' : '') + '">' + ic('timer', 'i-sm') + '<span id="qTimer">' + fmtClock(remaining() / 1000) + '</span></span>' : '';
  $('#v-quiz').innerHTML = '<div class="container"><div class="card q-head"><div class="grow" style="min-width:200px"><div class="row between small"><b>Question ' + (i + 1) + ' of ' + total + '</b><span class="muted">' + answered + ' answered</span></div><div class="progress mt-8"><span style="width:' + Math.round(answered * 100 / total) + '%"></span></div></div>' + timer +
    '<span class="save-chip" id="saveChip"><span class="dot"></span>' + (Q.saved ? 'Saved' : 'Saving…') + '</span></div>' +
    '<div class="card q-body"><div class="row between"><span class="eyebrow">Question ' + (i + 1) + '</span><button class="btn btn-ghost btn-xs" data-act="flagQ">' + ic('flag', 'i-sm') + (Q.flags[q.id] ? 'Unflag' : 'Flag for review') + '</button></div><div class="q-text">' + esc(q.question) + '</div>' + opts + '</div>' +
    '<div class="card q-nav"><button class="btn btn-outline" data-act="qprev"' + (i === 0 ? ' disabled' : '') + '>' + ic('arrow-left', 'i-sm') + 'Previous</button><div class="q-dots">' + dots + '</div>' +
    (i < total - 1 ? '<button class="btn btn-primary" data-act="qnext">Next' + ic('arrow-right', 'i-sm') + '</button>' : '<button class="btn btn-primary" data-act="submitQuiz">' + ic('check', 'i-sm') + 'Submit quiz</button>') + '</div></div>';
}
function quizKeys(e) {
  if (!Q || Q.phase !== 'run' || modalStack.length || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName)) return;
  var k = e.key.toLowerCase();
  if (['a', 'b', 'c', 'd', '1', '2', '3', '4'].indexOf(k) > -1) { var key = 'abcd'['1234'.indexOf(k) > -1 ? '1234'.indexOf(k) : 'abcd'.indexOf(k)]; if (Q.questions[Q.idx].options.some(function (o) { return o.key === key; })) pickAnswer(key); }
  else if (e.key === 'ArrowRight' && Q.idx < Q.questions.length - 1) { Q.idx++; paintRun(); }
  else if (e.key === 'ArrowLeft' && Q.idx > 0) { Q.idx--; paintRun(); }
}
function pickAnswer(k) {
  var q = Q.questions[Q.idx]; Q.answers[q.id] = k; Q.saved = false;
  LS.set('ll_qa_' + Q.id, Q.answers); paintRun(); scheduleSave();
}
var scheduleSave = debounce(function () {
  if (!Q || Q.phase !== 'run') return;
  var chip = $('#saveChip'); if (chip) { chip.classList.add('saving'); chip.lastChild.nodeValue = 'Saving…'; }
  call('saveQuizAnswers', S.token, Q.id, Q.answers).then(function (r) {
    if (!Q) return; Q.saved = true; var c2 = $('#saveChip'); if (c2) { c2.classList.remove('saving'); c2.lastChild.nodeValue = 'Saved'; }
    if (r && r.expired) { toast('Time is up — submitting your answers.', 'warn'); doSubmit(); }
  }).catch(function () { var c3 = $('#saveChip'); if (c3) { c3.classList.remove('saving'); c3.lastChild.nodeValue = 'Offline — will retry'; } scheduleSave(); });
}, 1100);
ACT.pick = function (el) { pickAnswer(el.dataset.k); };
ACT.qgo = function (el) { Q.idx = Number(el.dataset.i); paintRun(); };
ACT.qnext = function () { if (Q.idx < Q.questions.length - 1) { Q.idx++; paintRun(); } };
ACT.qprev = function () { if (Q.idx > 0) { Q.idx--; paintRun(); } };
ACT.flagQ = function () { var id = Q.questions[Q.idx].id; Q.flags[id] = !Q.flags[id]; paintRun(); };
ACT.submitQuiz = function () {
  var un = Q.questions.filter(function (x) { return !Q.answers[x.id]; }).length, fl = Object.keys(Q.flags).filter(function (k) { return Q.flags[k]; }).length;
  confirmBox({ title: 'Submit your quiz?', icon: 'quiz', text: (un ? '<b>' + plural(un, 'question') + ' unanswered.</b> ' : 'You answered every question. ') + (fl ? plural(fl, 'question') + ' flagged for review. ' : '') + 'You cannot retake this quiz after submitting.', yes: 'Submit now', no: 'Keep reviewing' })
    .then(function (ok) { if (ok) doSubmit(); });
};
function doSubmit() {
  if (!Q || Q.phase === 'submitting') return;
  clearInterval(Q.timerId); Q.phase = 'submitting'; paintQuiz();
  call('submitQuiz', S.token, Q.id, Q.answers).then(function (r) { finishQuiz(r.attempt, r.certificate); })
    .catch(function (e) { Q.phase = 'run'; paintQuiz(); startTimer(); toast(e.message, 'err', 'Could not submit'); });
}
function finishQuiz(attempt, cert, auto) {
  S.member.attempts[Q.id] = attempt; Q.attempt = attempt; Q.cert = cert || null; Q.phase = 'result'; LS.del('ll_qa_' + Q.id);
  if (cert && !S.member.certificates.some(function (x) { return x.cert_number === cert.cert_number; })) { S.member.certificates.push(cert); refreshPublic(); }
  LS.set('ll_member', S.member); if (auto) toast('Your time ran out, so the quiz was submitted automatically.', 'warn');
  paintQuiz(); window.scrollTo(0, 0);
}
function paintResult() {
  var f = Q.f, a = Q.attempt, pr = courseProgress(f.c), pass = f.c.passing_score;
  quizFocusNav(f);
  var good = a.score >= pass, nextMod = pr.next, cert = pr.cert;
  var grid = (a.result || []).map(function (ok, n) { return '<span class="' + (ok ? 'ok' : 'no') + '">' + (ok ? ic('check', 'i-sm') : ic('x', 'i-sm')) + 'Q' + (n + 1) + '</span>'; }).join('');
  var action = cert ? '<button class="btn btn-primary btn-lg" data-act="go" data-to="certificate" data-num="' + esc(cert.cert_number) + '">' + ic('award', 'i-sm') + 'View certificate</button>'
    : nextMod ? '<button class="btn btn-primary btn-lg" data-act="resume" data-id="' + f.c.id + '">Continue course ' + ic('arrow-right', 'i-sm') + '</button>' : '<button class="btn btn-primary btn-lg" data-act="go" data-to="dashboard">My learning</button>';
  $('#v-quiz').innerHTML = '<div class="container"><div class="quiz-card" style="text-align:center"><div class="ring" style="margin:0 auto">' + ringSvg(a.score, 150, 12, good ? 'var(--ok)' : 'var(--warn)') + '<div class="ring-label"><b style="font:800 34px var(--font-h)">' + a.score + '%</b><div class="tiny muted">Your score</div></div></div>' +
    '<h1 class="mt-16" style="font-size:clamp(24px,3vw,32px)">' + (good ? 'Well done!' : 'Quiz submitted') + '</h1><p class="muted mt-8">' + esc(f.q.title) + ' · ' + esc(f.m.title) + '</p>' +
    '<div class="result-tiles"><div><div class="lbl">Correct answers</div><b>' + a.correct_count + ' / ' + a.total + '</b></div><div><div class="lbl">Course average</div><b>' + (pr.avg === null ? '–' : pr.avg + '%') + '</b></div><div><div class="lbl">Pass mark</div><b>' + pass + '%</b></div></div>' +
    (Q.cert || cert ? '<div class="callout callout-ok mt-24" style="text-align:left">' + ic('award') + '<div><b>Congratulations!</b> You completed every module — your certificate has been issued.</div></div>'
      : pr.complete && !pr.passed ? '<div class="callout callout-warn mt-24" style="text-align:left">' + ic('alert') + '<div>You finished every module, but your average (' + pr.avg + '%) is below the ' + pass + '% pass mark. Contact your administrator about a quiz reset.</div></div>' : '') +
    '<div class="mt-24" style="text-align:left"><div class="small muted mb-8" style="font-weight:700">Answer summary</div><div class="q-grid">' + grid + '</div></div>' +
    '<div class="row row-wrap gap-12 mt-24" style="justify-content:center"><button class="btn btn-outline btn-lg" data-act="quitQuiz">Back to course</button>' + action + '</div></div></div>';
}

/* ── Sertifikat ── */
function verifyUrl(num) { var b = cfg().public_url || selfUrl(); return b + (b.indexOf('?') > -1 ? '&' : '?') + 'verify=' + encodeURIComponent(num); }
function certHtml(d) {
  var c = d.cert, col = d.primary_color || cfg().primary_color || '#6C3CE9', rgb = hex2rgb(col).join(', ');
  var parts = String(c.learner_name || '').trim().split(/\s+/), last = parts.length > 1 ? parts.pop() : '', first = parts.join(' ');
  var sig = d.signature_data ? '<img src="' + esc(d.signature_data) + '" alt="Signature">' : '<div class="script">' + esc(d.signer_name || d.brand_name || '') + '</div>';
  return '<div class="cert" style="--p:' + col + ';--p-rgb:' + rgb + '"><svg class="wm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".6"><use href="#i-cap"/></svg>' +
    '<span class="corner" style="left:12px;top:12px"></span><span class="corner" style="right:12px;top:12px"></span><span class="corner" style="left:12px;bottom:12px"></span><span class="corner" style="right:12px;bottom:12px"></span>' +
    '<div class="cert-inner"><div class="c-brand">' + brandMark(d.logo_data) + '<span>' + esc(d.brand_name || brandName()) + '</span></div><div class="c-kicker">Certificate of Completion</div><div class="c-small">This certifies that</div>' +
    '<div class="c-name">' + esc(first) + (last ? ' <span class="last">' + esc(last) + '</span>' : '') + '</div><div class="c-text">has successfully completed all modules and passed the assessments of</div><div class="c-course">' + esc(c.course_title) + '</div>' +
    '<div class="c-meta"><span>Issued ' + fmtDate(c.issued_at) + '</span><span>·</span><span>Final score ' + c.final_score + '%</span><span>·</span><span class="mono" style="font-size:inherit">' + esc(c.cert_number) + '</span></div>' +
    '<div class="c-foot"><div class="sig">' + sig + '<div class="line"><b>' + esc(d.signer_name || 'Authorised signatory') + '</b>' + esc(d.signer_title || '') + '</div></div>' +
    '<div class="seal"><div class="ring-s">' + ic('award') + '</div>Certificate ID<b>' + esc(c.cert_number) + '</b></div>' +
    '<div class="qr"><span>Scan to verify<br>authenticity</span><div data-qr data-num="' + esc(c.cert_number) + '"></div></div></div></div></div>';
}
var LIBS = { qr: ['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'], pdf: ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'] };
function loadLib(name) {
  if (S.libs[name]) return S.libs[name];
  S.libs[name] = Promise.all(LIBS[name].map(function (src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = function () { rej(new Error('Could not load ' + name + ' library')); }; document.head.appendChild(s); });
  })).catch(function (e) { delete S.libs[name]; throw e; });
  return S.libs[name];
}
function certQr(root) {
  if (!root) return Promise.resolve();
  var nodes = $$('[data-qr]', root); if (!nodes.length) return Promise.resolve();
  return loadLib('qr').then(function () {
    nodes.forEach(function (n) { var q = qrcode(0, 'M'); q.addData(verifyUrl(n.dataset.num)); q.make(); n.innerHTML = q.createImgTag(3, 0); });
  }).catch(function () { nodes.forEach(function (n) { n.innerHTML = '<span class="mono">' + esc(n.dataset.num) + '</span>'; }); });
}
function certData(num) {
  var c = (S.member.certificates || []).filter(function (x) { return x.cert_number === num; })[0]; if (!c) return null;
  var a = S.certAssets[num], s = cfg();
  return a || { cert: c, signer_name: s.signer_name, signer_title: s.signer_title, signature_data: '', logo_data: s.logo_data, brand_name: s.brand_name, primary_color: s.primary_color };
}
route('certificate', 'public', 'member', function (sec, p) {
  var d = certData(p.num);
  if (!d) { sec.innerHTML = '<div class="container" style="padding-top:48px">' + empty('award', 'Certificate not found', 'We could not find this certificate in your account.', '<button class="btn btn-primary mt-8" data-act="go" data-to="dashboard">My learning</button>') + '</div>'; return; }
  var c = d.cert, course = getCourse(c.course_id), pass = course ? course.passing_score : 70;
  var rows = (c.module_scores || []).map(function (m) { return '<tr><td class="td-strong">' + esc(m.title) + '</td><td>' + m.score + '%</td><td>' + badge(m.score >= pass ? 'Pass' : 'Below', m.score >= pass ? 'b-ok' : 'b-warn') + '</td></tr>'; }).join('');
  sec.innerHTML = '<div class="container" style="padding-top:28px"><button class="btn btn-ghost btn-sm" data-act="go" data-to="dashboard">' + ic('arrow-left', 'i-sm') + 'My learning</button>' +
    '<div class="row between row-wrap mt-16"><div><span class="badge b-ok">' + ic('check', 'i-sm') + 'Valid certificate</span><h1 class="mt-8" style="font-size:clamp(26px,3.2vw,34px)">' + esc(c.course_title) + '</h1></div><div class="row row-wrap gap-8">' +
    '<button class="btn btn-outline" data-act="printCert">' + ic('printer', 'i-sm') + 'Print</button><button class="btn btn-primary" data-act="pdfCert" data-num="' + esc(c.cert_number) + '">' + ic('download', 'i-sm') + 'Download PDF</button></div></div>' +
    '<div class="split mt-24"><div id="certPrev" class="print-area">' + certHtml(d) + '</div><aside class="stack gap-16">' +
    '<div class="panel"><div class="panel-head" style="margin-bottom:8px"><h3 class="bar-title" style="font-size:17px">Gradebook</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Module</th><th>Score</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="3" class="muted">No quiz scores recorded.</td></tr>') + '</tbody></table></div>' +
    '<div class="row between mt-16"><b style="font-family:var(--font-h)">Final score</b><span class="badge b-solid">' + c.final_score + '%</span></div><div class="tiny muted mt-8">Pass mark: ' + pass + '% average across module quizzes.</div></div>' +
    '<div class="panel"><div class="panel-head" style="margin-bottom:8px"><h3 class="bar-title" style="font-size:17px">Verification &amp; proof</h3></div>' +
    '<div class="tiny muted" style="text-transform:uppercase;font-weight:700;letter-spacing:.06em">Certificate number</div><div class="row gap-8 mt-4"><b class="mono grow">' + esc(c.cert_number) + '</b><button class="icon-btn" data-act="copy" data-v="' + esc(c.cert_number) + '" aria-label="Copy number">' + ic('copy', 'i-sm') + '</button></div>' +
    '<div class="tiny muted mt-12" style="text-transform:uppercase;font-weight:700;letter-spacing:.06em">Public verification link</div><div class="row gap-8 mt-4"><span class="small grow" style="word-break:break-all">' + esc(verifyUrl(c.cert_number)) + '</span><button class="icon-btn" data-act="copy" data-v="' + esc(verifyUrl(c.cert_number)) + '" aria-label="Copy link">' + ic('copy', 'i-sm') + '</button></div>' +
    '<button class="btn btn-soft btn-block mt-16" data-act="go" data-to="verify" data-num="' + esc(c.cert_number) + '">' + ic('shield', 'i-sm') + 'Open public verification</button></div></aside></div></div>';
  certQr($('#certPrev'));
  if (!S.certAssets[c.cert_number]) call('getCertificateData', S.token, c.cert_number).then(function (a) {
    S.certAssets[c.cert_number] = a;
    if (S.route.name === 'certificate' && S.route.p.num === c.cert_number) { $('#certPrev').innerHTML = certHtml(a); certQr($('#certPrev')); }
  }).catch(function () { /* tetap tampil dengan data lokal */ });
});
ACT.printCert = function () { try { window.print(); } catch (e) { toast('Printing is not available here.', 'warn'); } };
ACT.pdfCert = function (el) {
  var d = certData(el.dataset.num), stage = $('#certStage'); if (!d) return;
  btnBusy(el, true, 'Preparing PDF…');
  stage.innerHTML = certHtml(d);
  Promise.all([loadLib('pdf'), certQr(stage)]).then(function () { return new Promise(function (r) { setTimeout(r, 120); }); })
    .then(function () { return html2canvas(stage.firstChild, { scale: 2, backgroundColor: '#ffffff', useCORS: true }); })
    .then(function (cv) {
      var pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 841.89, 595.28);
      pdf.save('Certificate-' + d.cert.cert_number + '.pdf'); btnBusy(el, false); stage.innerHTML = ''; toast('Certificate downloaded.', 'ok');
    }).catch(function () { btnBusy(el, false); stage.innerHTML = ''; toast('Could not create the PDF here. Use Print and choose "Save as PDF" instead.', 'warn'); });
};


/* ════════════════════════════════════════════════════════════
   BAGIAN 4A — PANEL ADMIN: chrome, dashboard, kursus, form kursus, manajer kuis
   Navigasi admin instan: seluruh data dimuat dalam SATU panggilan (getAdminData),
   perubahan diterapkan lebih dulu di lokal (optimistik) lalu disinkronkan di latar belakang.
   ════════════════════════════════════════════════════════════ */

var persistAdmin = debounce(function () { if (S.admin) LS.set('ll_admin', S.admin); }, 600);
function amap() {
  var A = S.admin, m = { users: {}, courses: {}, modules: {}, lessons: {}, quizzes: {} };
  A.users.forEach(function (u) { m.users[u.id] = u; }); A.courses.forEach(function (c) { m.courses[c.id] = c; });
  A.modules.forEach(function (x) { m.modules[x.id] = x; }); A.lessons.forEach(function (x) { m.lessons[x.id] = x; }); A.quizzes.forEach(function (x) { m.quizzes[x.id] = x; });
  return m;
}
function pendingCount() { return S.admin ? S.admin.enrollments.filter(function (e) { return e.status === 'requested'; }).length : 0; }
function pageHead(crumb, title, sub, actions) {
  return '<div class="page-head"><div><div class="crumb-line">' + crumb + '</div><h1>' + title + '</h1>' + (sub ? '<p class="muted mt-8">' + sub + '</p>' : '') + '</div><div class="row row-wrap gap-8">' + (actions || '') + '</div></div>';
}
function statusBadge(st) {
  var m = { published: ['Published', 'b-ok'], draft: ['Draft', 'b-slate'], archived: ['Archived', 'b-amber'], active: ['Active', 'b-ok'], requested: ['Requested', 'b-warn'], rejected: ['Rejected', 'b-err'], revoked: ['Revoked', 'b-err'] }[st] || [st, 'b-slate'];
  return badge(m[0], m[1]);
}

/* ── Sidebar & topbar admin ── */
function renderAdminChrome() {
  var n = S.route.name, act = { 'admin-course-form': 'admin-courses', 'admin-quiz': 'admin-courses' }[n] || n, pend = pendingCount();
  var items = [['admin-dashboard', 'Dashboard', 'Overview', 'grid'], ['admin-courses', 'Courses', 'Content', 'book'], ['admin-members', 'Members', 'Enrollments', 'users'], ['admin-results', 'Quiz Results', 'Assessments', 'quiz'], ['admin-certs', 'Certificates', 'Issued', 'award'], ['admin-paths', 'Learning Paths', 'Curation', 'route']];
  if (isSuper()) items.push(['admin-settings', 'Settings', 'Brand & access', 'sliders']);
  $('#adminSidebar').innerHTML = '<button class="brand" data-act="go" data-to="admin-dashboard" style="background:none;border:0;cursor:pointer;text-align:left">' + brandMark() + '<span>' + esc(brandName()) + '<small>Admin console</small></span></button>' +
    '<nav aria-label="Admin">' + items.map(function (i) {
      return '<button class="side-link' + (act === i[0] ? ' active' : '') + '" data-act="go" data-to="' + i[0] + '">' + ic(i[3]) + '<span class="lbl">' + i[1] + '</span>' + (i[0] === 'admin-members' && pend ? '<span class="cnt">' + pend + '</span>' : '') + '</button>';
    }).join('') + '</nav><div class="side-bottom"><button class="side-link" data-act="go" data-to="home">' + ic('globe') + '<span class="lbl">View site</span></button><button class="side-link" data-act="go" data-to="dashboard">' + ic('cap') + '<span class="lbl">Learner view</span></button><button class="side-link" data-act="logout">' + ic('logout') + '<span class="lbl">Log out</span></button></div>';
  var me = S.me;
  $('#adminTopbar').innerHTML = '<button class="icon-btn only-m" data-act="openSide" aria-label="Open menu">' + ic('menu') + '</button>' +
    '<form class="search grow input-wrap hide-s" data-form="adminSearch">' + ic('search', 'i-left') + '<input class="input" name="q" placeholder="Search members by name or email…" autocomplete="off"></form><span class="grow only-m"></span>' +
    '<button class="icon-btn" data-act="adminRefresh" aria-label="Refresh data" title="Refresh data">' + ic('refresh') + '</button><button class="icon-btn" data-act="theme" aria-label="Toggle dark mode">' + themeIcon() + '</button>' +
    '<div class="user-chip" style="cursor:default">' + avatar(me.name) + '<span class="meta hide-m"><b>' + esc(me.name.split(' ')[0]) + '</b><span>' + (isSuper() ? 'Super admin' : 'Admin') + '</span></span></div>';
}
FORM.adminSearch = function (f) { S.ui.adminQ = f.q.value.trim(); S.ui.memberTab = 'members'; go('admin-members'); };
ACT.adminRefresh = function (el) {
  toast('Refreshing data…', 'info');
  ensureAdmin().then(function () { if (FORM_ROUTES.indexOf(S.route.name) < 0) rerender(); toast('Data is up to date.', 'ok'); }).catch(function (e) { toast(e.message, 'err'); });
};

/* ── Dashboard ── */
function niceMax(v) { if (v <= 4) return 4; var p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p) * p; }
function lineChart(pts) {
  var W = 640, H = 250, pl = 34, pr = 14, pt = 18, pb = 30, n = pts.length, max = niceMax(Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([1])));
  var x = function (i) { return pl + (n > 1 ? i * (W - pl - pr) / (n - 1) : 0); }, y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
  var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join(' ');
  var sm = pts.map(function (p, i) { if (!i) return 'M' + x(i) + ' ' + y(p.v); var cx = (x(i - 1) + x(i)) / 2; return 'C' + cx + ' ' + y(pts[i - 1].v) + ' ' + cx + ' ' + y(p.v) + ' ' + x(i) + ' ' + y(p.v); }).join(' ');
  var grid = [0, 1, 2, 3, 4].map(function (g) { var v = max * g / 4; return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--border)" stroke-dasharray="3 4"/><text x="' + (pl - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + Math.round(v) + '</text>'; }).join('');
  var labels = pts.map(function (p, i) { return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + esc(p.l) + '</text>'; }).join('');
  var dots = pts.map(function (p, i) { return '<circle cx="' + x(i) + '" cy="' + y(p.v) + '" r="4.5" fill="var(--surface)" stroke="var(--p)" stroke-width="2.5"><title>' + esc(p.l) + ': ' + p.v + '</title></circle>'; }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="Weekly enrollment requests"><defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--p)" stop-opacity=".28"/><stop offset="1" stop-color="var(--p)" stop-opacity="0"/></linearGradient></defs>' +
    grid + '<path d="' + sm + ' L' + x(n - 1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z" fill="url(#lg1)"/><path d="' + sm + '" fill="none" stroke="var(--p)" stroke-width="3" stroke-linecap="round"/>' + dots + labels + '</svg>';
}
function adminStats() {
  var A = S.admin, m = amap(), members = A.users.filter(function (u) { return u.role === 'member'; });
  var active = A.enrollments.filter(function (e) { return e.status === 'active'; }), pend = A.enrollments.filter(function (e) { return e.status === 'requested'; });
  var subm = A.attempts.filter(function (a) { return a.status === 'submitted'; });
  var avgScore = subm.length ? Math.round(sum(subm.map(function (a) { return a.score; })) / subm.length) : null;
  var wk = [], now = Date.now(), WK = 7 * 864e5;
  for (var i = 7; i >= 0; i--) {
    var from = now - (i + 1) * WK, to = now - i * WK, dd = new Date(to);
    wk.push({ l: MON[dd.getMonth()] + ' ' + dd.getDate(), v: A.enrollments.filter(function (e) { return e.requested_at > from && e.requested_at <= to; }).length });
  }
  var prog = {}; A.progress.forEach(function (p) { var k = p[0] + '|' + p[1]; prog[k] = (prog[k] || 0) + 1; });
  var lc = {}; A.lessons.forEach(function (l) { lc[l.course_id] = (lc[l.course_id] || 0) + 1; });
  var courseRows = A.courses.map(function (c) {
    var learners = active.filter(function (e) { return e.course_id === c.id; }), tot = lc[c.id] || 0;
    var avgP = learners.length && tot ? Math.round(sum(learners.map(function (e) { return Math.min(100, (prog[e.user_id + '|' + c.id] || 0) * 100 / tot); })) / learners.length) : 0;
    var certs = A.certificates.filter(function (x) { return x.course_id === c.id && x.status !== 'revoked'; }).length;
    return { c: c, learners: learners.length, avgP: avgP, certs: certs };
  });
  return { m: m, members: members, active: active, pend: pend, subm: subm, avgScore: avgScore, wk: wk, courseRows: courseRows, certs: A.certificates.filter(function (c) { return c.status !== 'revoked'; }) };
}
function insights(st) {
  var out = [], A = S.admin;
  if (st.pend.length) { var old = Math.min.apply(null, st.pend.map(function (e) { return e.requested_at || Date.now(); })); out.push('<b>' + plural(st.pend.length, 'enrollment request') + '</b> waiting for review — the oldest arrived ' + ago(old) + '.'); }
  var low = st.courseRows.filter(function (r) { return r.learners > 0; }).sort(function (a, b) { return a.avgP - b.avgP; })[0];
  if (low && low.avgP < 60) out.push('“' + esc(low.c.title) + '” has the lowest average progress (<b>' + low.avgP + '%</b>). A reminder or shorter lessons might help.');
  var byQuiz = {}; st.subm.forEach(function (a) { (byQuiz[a.quiz_id] = byQuiz[a.quiz_id] || []).push(a.score); });
  var worst = Object.keys(byQuiz).map(function (k) { return { id: k, avg: sum(byQuiz[k]) / byQuiz[k].length, n: byQuiz[k].length }; }).sort(function (a, b) { return a.avg - b.avg; })[0];
  if (worst && worst.avg < 70) { var q = st.m.quizzes[worst.id]; out.push('“' + esc(q ? q.title : 'A quiz') + '” averages only <b>' + Math.round(worst.avg) + '%</b> across ' + plural(worst.n, 'attempt') + ' — consider reviewing its questions.'); }
  var fin = st.certs.length; if (fin) out.push('<b>' + plural(fin, 'certificate') + '</b> issued so far across ' + plural(new Set(st.certs.map(function (c) { return c.course_id; })).size, 'course') + '.');
  if (!st.members.length) out.push('No learners have registered yet. Share your site link to get started.');
  if (!out.length) out.push('Everything looks on track. New activity will be summarised here.');
  return out;
}
route('admin-dashboard', 'admin', 'admin', function (sec) {
  adminView(sec, function () {
    var st = adminStats(), A = S.admin;
    var kpi = [['Total members', st.members.length, 'users', ''], ['Active enrollments', st.active.length, 'check-circle', 'blue'], ['Pending requests', st.pend.length, 'clock', 'amber'], ['Quiz average', st.avgScore === null ? '–' : st.avgScore + '%', 'target', 'pink'], ['Certificates', st.certs.length, 'award', 'ok']]
      .map(function (k) { return '<div class="card kpi"><span class="corner tile-icon sm ' + k[3] + '">' + ic(k[2]) + '</span><span class="lbl">' + k[0] + '</span><div class="val">' + k[1] + '</div></div>'; }).join('');
    var bars = st.courseRows.map(function (r) {
      return '<div class="hbar"><div class="top"><span class="clamp-1">' + esc(r.c.title) + '</span><span>' + r.avgP + '%</span></div><div class="track"><span style="width:' + r.avgP + '%"></span></div><div class="bot"><span>' + plural(r.learners, 'active learner') + '</span><span>' + plural(r.certs, 'certified', 'certified') + '</span></div></div>';
    }).join('') || empty('book', 'No courses yet', 'Create your first course to see completion data.');
    var reqs = st.pend.slice().sort(function (a, b) { return b.requested_at - a.requested_at; }).slice(0, 6).map(function (e) {
      var u = st.m.users[e.user_id] || { name: 'Unknown', email: '' }, c = st.m.courses[e.course_id] || { title: 'Deleted course' };
      return '<tr><td data-l="Learner"><div class="person">' + avatar(u.name) + '<div><b>' + esc(u.name) + '</b><span>' + esc(u.email) + '</span></div></div></td><td data-l="Course" class="td-strong">' + esc(c.title) + '</td><td data-l="Requested" class="muted">' + ago(e.requested_at) + '</td>' +
        '<td class="t-actions"><button class="btn btn-primary btn-xs" data-act="enr" data-u="' + e.user_id + '" data-c="' + e.course_id + '" data-s="active">' + ic('check', 'i-sm') + 'Activate</button><button class="btn btn-danger-soft btn-xs" data-act="enr" data-u="' + e.user_id + '" data-c="' + e.course_id + '" data-s="rejected">Reject</button></td></tr>';
    }).join('');
    var recent = A.audit.slice(0, 5).map(function (a) { return '<div class="row gap-12" style="align-items:flex-start"><span class="tile-icon sm">' + ic('shield', 'i-sm') + '</span><div class="grow small"><b>' + esc(a.actor_name) + '</b> · ' + esc(String(a.action).replace(/_/g, ' ')) + (a.reason ? ' — <span class="muted">' + esc(a.reason) + '</span>' : '') + '<div class="tiny muted">' + ago(a.at) + '</div></div></div>'; }).join('');
    sec.innerHTML = '<div class="container" style="max-width:none;padding:0">' + pageHead('Overview', 'Admin dashboard', 'A live view of enrollments, learning progress and assessments.', '<button class="btn btn-primary" data-act="go" data-to="admin-course-form" data-id="">' + ic('plus', 'i-sm') + 'New course</button>') +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">' + kpi + '</div>' +
      '<div class="grid mt-24" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start" id="dashGrid"><div class="panel"><div class="panel-head"><div><h3 class="bar-title">Weekly intake trajectory</h3><p class="small muted mt-8">Enrollment requests per week, last 8 weeks</p></div></div>' +
      (sum(st.wk.map(function (w) { return w.v; })) ? '<div class="chart-box" style="height:auto">' + lineChart(st.wk) + '</div>' : empty('chart', 'No requests in the last 8 weeks', 'The chart fills in as members request enrollment.')) + '</div>' +
      '<div class="insight"><h4>' + ic('sparkles') + 'Insights</h4><ul>' + insights(st).map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="grid mt-24" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);align-items:start" id="dashGrid2"><div class="panel"><div class="panel-head"><h3 class="bar-title">Curriculum completion</h3></div>' + bars + '</div>' +
      '<div class="panel"><div class="panel-head"><h3 class="bar-title">Enrollment requests</h3><button class="btn btn-ghost btn-sm" data-act="go" data-to="admin-members">View all ' + ic('arrow-right', 'i-sm') + '</button></div>' +
      (reqs ? '<div class="table-wrap cards-m"><table class="table"><thead><tr><th>Learner</th><th>Course</th><th>Requested</th><th></th></tr></thead><tbody>' + reqs + '</tbody></table></div>' : empty('check-circle', 'All caught up', 'There are no pending enrollment requests.')) + '</div></div>' +
      (recent ? '<div class="panel mt-24"><div class="panel-head"><h3 class="bar-title">Recent admin activity</h3></div><div class="stack">' + recent + '</div></div>' : '') + '</div>';
    if (window.innerWidth < 1100) { $('#dashGrid').style.gridTemplateColumns = '1fr'; $('#dashGrid2').style.gridTemplateColumns = '1fr'; }
  });
});

/* ── Aksi enrollment (dipakai dashboard, tabel member, drawer) — optimistik ── */
function setEnrollLocal(pairs, status) {
  var A = S.admin, me = S.me, snap = clone(A.enrollments);
  pairs.forEach(function (p) {
    var e = A.enrollments.filter(function (x) { return x.user_id === p.user_id && x.course_id === p.course_id; })[0];
    if (!e) { e = { id: uid(), user_id: p.user_id, course_id: p.course_id, requested_at: Date.now() }; A.enrollments.push(e); }
    e.status = status; e.decided_at = Date.now(); e.approved_by = me.name;
  });
  persistAdmin(); return snap;
}
function applyEnroll(pairs, status) {
  if (!pairs.length) return;
  var snap = setEnrollLocal(pairs, status);
  var verb = { active: 'activated', rejected: 'rejected', revoked: 'revoked' }[status];
  toast(plural(pairs.length, 'enrollment') + ' ' + verb + '.', status === 'active' ? 'ok' : 'info');
  refreshAdminViews();
  bg(call('setEnrollmentStatus', S.token, pairs, status).then(refreshPublic), function () { S.admin.enrollments = snap; persistAdmin(); refreshAdminViews(); }, 'Could not update enrollment.');
}
function refreshAdminViews() { if (FORM_ROUTES.indexOf(S.route.name) < 0 && S.route.name.indexOf('admin') === 0) rerender(); if (S.drawer) S.drawer(); }
ACT.enr = function (el) { applyEnroll([{ user_id: el.dataset.u, course_id: el.dataset.c }], el.dataset.s); };

/* ── Daftar kursus ── */
function miniCover(c) {
  var i = catIdx(c.category), col = CAT_COLORS[i];
  return '<div style="width:64px;height:42px;border-radius:10px;flex:none;position:relative;overflow:hidden;background:linear-gradient(135deg,' + col + ',' + shade(col, -.35) + ');display:grid;place-items:center;color:#fff">' + ic(CAT_ICONS[i]) +
    (c.thumbnail ? '<img src="' + esc(c.thumbnail) + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.remove()">' : '') + '</div>';
}
function adminCourseRows() {
  var A = S.admin, q = (S.ui.admCq || '').toLowerCase(), st = S.ui.admCs || 'all';
  var act = {}; A.enrollments.forEach(function (e) { if (e.status === 'active') act[e.course_id] = (act[e.course_id] || 0) + 1; });
  var mc = {}, lc = {}; A.modules.forEach(function (m) { mc[m.course_id] = (mc[m.course_id] || 0) + 1; }); A.lessons.forEach(function (l) { lc[l.course_id] = (lc[l.course_id] || 0) + 1; });
  var rs = {}; A.reviews.forEach(function (r) { (rs[r.course_id] = rs[r.course_id] || []).push(Number(r.rating)); });
  var list = A.courses.filter(function (c) { return (st === 'all' || c.status === st) && (!q || (c.title + ' ' + c.category + ' ' + c.instructor).toLowerCase().indexOf(q) > -1); });
  if (!list.length) return '<tr><td colspan="6">' + empty('book', A.courses.length ? 'No courses match your filters' : 'No courses yet', A.courses.length ? '' : 'Create your first course to get started.') + '</td></tr>';
  return list.map(function (c) {
    var r = rs[c.id], avg = r ? (sum(r) / r.length).toFixed(1) : null;
    return '<tr><td data-l="Course"><div class="person">' + miniCover(c) + '<div><b>' + esc(c.title) + '</b><span>' + esc(c.category) + ' · ' + esc(c.level) + '</span></div></div></td>' +
      '<td data-l="Content">' + plural(mc[c.id] || 0, 'module') + '<div class="tiny muted">' + plural(lc[c.id] || 0, 'lesson') + '</div></td><td data-l="Learners">' + (act[c.id] || 0) + '</td>' +
      '<td data-l="Rating">' + (avg ? '<span class="rating">' + ic('star') + avg + '</span>' : '<span class="muted">—</span>') + '</td><td data-l="Status">' + statusBadge(c.status) + '</td>' +
      '<td class="t-actions"><button class="btn btn-soft btn-xs" data-act="go" data-to="admin-course-form" data-id="' + c.id + '">' + ic('edit', 'i-sm') + 'Edit</button><button class="btn btn-outline btn-xs" data-act="courseQuizzes" data-id="' + c.id + '">' + ic('quiz', 'i-sm') + 'Quizzes</button>' +
      '<div class="dropdown"><button class="icon-btn" style="width:30px;height:30px" data-act="dd" aria-label="More">' + ic('chev-down', 'i-sm') + '</button><div class="dropdown-menu" style="min-width:180px">' +
      '<button class="dropdown-item" data-act="toggleStatus" data-id="' + c.id + '">' + ic(c.status === 'published' ? 'eye' : 'check') + (c.status === 'published' ? 'Unpublish (draft)' : 'Publish') + '</button>' +
      (c.status === 'published' ? '<button class="dropdown-item" data-act="go" data-to="course" data-id="' + c.id + '">' + ic('external') + 'View on site</button>' : '') +
      (c.status !== 'archived' ? '<button class="dropdown-item" data-act="archiveCourse" data-id="' + c.id + '">' + ic('archive') + 'Archive</button>' : '') +
      '<div class="dropdown-sep"></div><button class="dropdown-item" style="color:var(--err)" data-act="delCourse" data-id="' + c.id + '">' + ic('trash') + 'Delete…</button></div></div></td></tr>';
  }).join('');
}
function paintCourseRows() { var b = $('#admCourseBody'); if (b) b.innerHTML = adminCourseRows(); }
route('admin-courses', 'admin', 'admin', function (sec) {
  adminView(sec, function () {
    sec.innerHTML = pageHead('Content', 'Courses', 'Create, publish and organise your course catalog.', '<button class="btn btn-primary" data-act="go" data-to="admin-course-form" data-id="">' + ic('plus', 'i-sm') + 'New course</button>') +
      '<div class="panel-flat" style="padding:0;overflow:visible"><div class="filter-bar"><div class="input-wrap">' + ic('search', 'i-left') + '<input class="input" data-in="admCq" placeholder="Search courses…" value="' + esc(S.ui.admCq || '') + '"></div>' +
      '<select class="select" data-ch="admCs"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>' +
      '<div class="table-wrap cards-m" style="overflow:visible"><table class="table"><thead><tr><th>Course</th><th>Content</th><th>Learners</th><th>Rating</th><th>Status</th><th></th></tr></thead><tbody id="admCourseBody"></tbody></table></div></div>';
    $('[data-ch=admCs]', sec).value = S.ui.admCs || 'all'; paintCourseRows();
  });
});
INP.admCq = debounce(function (el) { S.ui.admCq = el.value; paintCourseRows(); }, 80);
CHG.admCs = function (el) { S.ui.admCs = el.value; paintCourseRows(); };
function setCourseStatusLocal(id, status) {
  var c = S.admin.courses.filter(function (x) { return x.id === id; })[0]; if (!c) return;
  var prev = c.status; c.status = status; persistAdmin(); paintCourseRows();
  toast('Course ' + (status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'moved to draft') + '.', 'ok');
  bg(call('setCourseStatus', S.token, id, status).then(refreshPublic), function () { c.status = prev; persistAdmin(); paintCourseRows(); }, 'Could not change status.');
}
ACT.toggleStatus = function (el) { var c = S.admin.courses.filter(function (x) { return x.id === el.dataset.id; })[0]; setCourseStatusLocal(el.dataset.id, c.status === 'published' ? 'draft' : 'published'); };
ACT.archiveCourse = function (el) { setCourseStatusLocal(el.dataset.id, 'archived'); };
ACT.delCourse = function (el) {
  var A = S.admin, id = el.dataset.id, c = A.courses.filter(function (x) { return x.id === id; })[0]; if (!c) return;
  var enr = A.enrollments.filter(function (e) { return e.course_id === id && e.status === 'active'; }).length;
  confirmBox({ title: 'Delete this course?', danger: true, icon: 'trash', yes: 'Delete course', text: 'This permanently removes <b>' + esc(c.title) + '</b>, its modules, lessons, materials and quizzes.' + (enr ? ' <b>' + plural(enr, 'active learner') + '</b> will lose access.' : '') + ' This cannot be undone.' }).then(function (ok) {
    if (!ok) return; var snap = clone(A);
    var qids = A.quizzes.filter(function (q) { return q.course_id === id; }).map(function (q) { return q.id; });
    A.courses = A.courses.filter(function (x) { return x.id !== id; }); ['modules', 'lessons', 'materials', 'quizzes'].forEach(function (k) { A[k] = A[k].filter(function (x) { return x.course_id !== id; }); });
    A.questions = A.questions.filter(function (q) { return qids.indexOf(q.quiz_id) < 0; }); persistAdmin(); paintCourseRows(); toast('Course deleted.', 'info');
    bg(call('deleteCourse', S.token, id).then(refreshPublic), function () { S.admin = snap; persistAdmin(); paintCourseRows(); }, 'Could not delete the course.');
  });
};
ACT.courseQuizzes = function (el) {
  var A = S.admin, c = A.courses.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!c) return;
  var mods = A.modules.filter(function (m) { return m.course_id === c.id; }).sort(function (a, b) { return a.order - b.order; });
  var rows = mods.map(function (m, i) {
    var q = A.quizzes.filter(function (x) { return x.module_id === m.id; })[0], n = q ? A.questions.filter(function (x) { return x.quiz_id === q.id; }).length : 0;
    return '<div class="row gap-12 panel-soft"><span class="avatar" style="width:30px;height:30px">' + (i + 1) + '</span><div class="grow"><b style="font-family:var(--font-h)">' + esc(m.title) + '</b><div class="small muted">' + (q ? plural(n, 'question') + (q.time_limit ? ' · ' + q.time_limit + ' min' : '') : 'No quiz yet') + '</div></div>' +
      '<button class="btn ' + (q ? 'btn-soft' : 'btn-primary') + ' btn-sm" data-act="manageQuiz" data-m="' + m.id + '">' + ic(q ? 'edit' : 'plus', 'i-sm') + (q ? 'Edit quiz' : 'Add quiz') + '</button></div>';
  }).join('');
  openModal({ title: 'Quizzes — ' + c.title, icon: 'quiz', body: mods.length ? '<div class="stack gap-8">' + rows + '</div>' : empty('layers', 'No modules yet', 'Add modules to this course first, then attach a quiz to each.'), foot: '<button class="btn btn-outline" data-act="closeModal">Close</button>' });
};
ACT.manageQuiz = function (el) { closeModal(); go('admin-quiz', { moduleId: el.dataset.m }); };

/* ── Form kursus + pembangun kurikulum ── */
var F = null;
function blankLesson() { return { id: uid(), title: '', youtube_id: '', duration: 10, description: '', materials: [], open: true }; }
function blankModule() { return { id: uid(), title: '', description: '', lessons: [blankLesson()] }; }
function buildForm(id) {
  var A = S.admin;
  if (!id) return { id: uid(), isNew: true, title: '', short_desc: '', description: '', category: '', level: 'Beginner', instructor: '', instructor_title: '', instructor_bio: '', thumbnail: '', trailer_youtube: '', outcomes: '', passing_score: 70, status: 'draft', modules: [blankModule()] };
  var c = A.courses.filter(function (x) { return x.id === id; })[0]; if (!c) return null;
  var f = clone(c); f.passing_score = Number(f.passing_score) || 70;
  f.modules = A.modules.filter(function (m) { return m.course_id === id; }).sort(function (a, b) { return a.order - b.order; }).map(function (m) {
    return { id: m.id, title: m.title, description: m.description || '', lessons: A.lessons.filter(function (l) { return l.module_id === m.id; }).sort(function (a, b) { return a.order - b.order; }).map(function (l) {
      return { id: l.id, title: l.title, youtube_id: l.youtube_id || '', duration: Number(l.duration) || 0, description: l.description || '', open: false,
        materials: A.materials.filter(function (x) { return x.lesson_id === l.id; }).map(function (x) { return clone(x); }) };
    }) };
  });
  return f;
}
route('admin-course-form', 'admin', 'admin', function (sec, p) {
  adminView(sec, function () {
    if (p.draft && S.formDraft) { F = S.formDraft; S.formDraft = null; } else F = buildForm(p.id);
    if (!F) { sec.innerHTML = empty('book', 'Course not found', '', '<button class="btn btn-primary mt-8" data-act="go" data-to="admin-courses">Back to courses</button>'); return; }
    F._dirty = !!p.draft; F._saved = !F.isNew;
    var cats = {}; S.admin.courses.forEach(function (c) { if (c.category) cats[c.category] = 1; });
    var fld = function (label, path, o) {
      o = o || {};
      return '<div class="field' + (o.full ? ' full' : '') + '"><label>' + label + (o.req ? ' <span class="req">*</span>' : '') + '</label>' +
        (o.area ? '<textarea class="textarea" style="min-height:' + (o.h || 90) + 'px" data-in="fb" data-p="' + path + '" placeholder="' + esc(o.ph || '') + '">' + esc(getPath(F, path)) + '</textarea>' : '<input class="input" ' + (o.list ? 'list="catList"' : '') + ' type="' + (o.type || 'text') + '" data-in="fb" data-p="' + path + '" placeholder="' + esc(o.ph || '') + '" value="' + esc(getPath(F, path)) + '">') + (o.help ? '<span class="help">' + o.help + '</span>' : '') + '</div>';
    };
    sec.innerHTML = pageHead('<a href="#" data-act="go" data-to="admin-courses">Courses</a> / ' + (F.isNew ? 'New' : 'Edit'), F.isNew ? 'New course' : 'Edit course', 'Everything saves in one step — details, modules, lessons and resources.', '') +
      '<div class="split" style="grid-template-columns:minmax(0,1fr) 340px"><div class="stack gap-24">' +
      '<div class="panel"><div class="panel-head"><h3 class="bar-title">Course details</h3></div><div class="form-grid">' + fld('Title', 'title', { req: 1, full: 1, ph: 'e.g. Fun Mathematics Teaching' }) + fld('Short description', 'short_desc', { full: 1, area: 1, h: 64, ph: 'One or two sentences shown on course cards' }) +
      fld('Full description', 'description', { full: 1, area: 1, h: 120, ph: 'What the course covers and who it is for' }) + fld('Category', 'category', { list: 1, ph: 'e.g. Mathematics' }) +
      '<div class="field"><label>Level</label><select class="select" data-ch="fbc" data-p="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>' +
      fld('Learning outcomes', 'outcomes', { full: 1, area: 1, h: 120, ph: 'One outcome per line', help: 'Each line becomes a checklist item on the course page.' }) + '</div><datalist id="catList">' + Object.keys(cats).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist></div>' +
      '<div class="panel"><div class="panel-head"><h3 class="bar-title">Instructor</h3></div><div class="form-grid">' + fld('Name', 'instructor') + fld('Title / role', 'instructor_title') + fld('Short bio', 'instructor_bio', { full: 1, area: 1, h: 80 }) + '</div></div>' +
      '<div class="panel"><div class="panel-head"><div><h3 class="bar-title">Curriculum</h3><p class="small muted mt-8">Each module can end with a single-attempt quiz (managed after saving).</p></div></div><div id="curr"></div><button class="add-dashed" data-act="fbAddMod">' + ic('plus', 'i-sm') + 'Add module</button></div></div>' +
      '<aside class="stack gap-16 sticky"><div class="panel"><h3 class="bar-title" style="font-size:17px">Publishing</h3><div class="field mt-16"><label>Status</label><select class="select" data-ch="fbc" data-p="status"><option value="draft">Draft (hidden)</option><option value="published">Published</option><option value="archived">Archived</option></select></div>' +
      '<div class="field mt-16"><label>Passing score (%)</label><input class="input" type="number" min="1" max="100" data-in="fb" data-p="passing_score" value="' + F.passing_score + '"><span class="help">Average of module quiz scores needed for the certificate.</span></div></div>' +
      '<div class="panel"><h3 class="bar-title" style="font-size:17px">Cover & trailer</h3><div class="mt-16" id="thumbBox"></div><div class="field mt-16"><label>Image URL (optional)</label><input class="input" data-in="fb" data-p="thumbnail" placeholder="https://…" value="' + esc(F.thumbnail) + '"></div>' +
      '<div class="field mt-16"><label>Trailer (YouTube link or ID)</label><input class="input" data-in="fb" data-p="trailer_youtube" placeholder="https://youtu.be/…" value="' + esc(F.trailer_youtube) + '"></div></div></aside></div>' +
      '<div class="sticky-bar"><span class="small muted grow" id="fbState">' + (F._dirty ? 'Unsaved changes' : 'All changes saved') + '</span><button class="btn btn-outline" data-act="fbCancel">Cancel</button><button class="btn btn-soft" data-act="fbSave" data-s="draft">Save as draft</button><button class="btn btn-primary" data-act="fbSave" data-s="published">' + ic('check', 'i-sm') + 'Save &amp; publish</button></div>';
    $$('select[data-p]', sec).forEach(function (s) { s.value = F[s.dataset.p]; });
    paintCurriculum(); paintThumb();
  });
});
function dirty() { if (F) { F._dirty = true; var s = $('#fbState'); if (s) s.textContent = 'Unsaved changes'; } }
function paintThumb() {
  var b = $('#thumbBox'); if (!b) return;
  b.innerHTML = F.thumbnail ? '<div class="cover" style="border-radius:14px"><img src="' + esc(F.thumbnail) + '" alt="" onerror="this.remove()"></div><button class="btn btn-ghost btn-sm mt-8" data-act="fbThumbDel">' + ic('trash', 'i-sm') + 'Remove image</button>'
    : '<label class="dropzone">' + ic('image', 'i-lg') + '<span><b>Upload cover image</b><br>PNG or JPG, 16:9 works best (max 5 MB)</span><input type="file" accept="image/*" data-ch="fbThumb"></label>';
}
INP.fb = function (el) {
  var path = el.dataset.p, v = el.value; if (/passing_score|\.duration$/.test(path)) v = v === '' ? '' : Number(v);
  setPath(F, path, v); dirty();
  if (path === 'thumbnail') paintThumb();
};
CHG.fbc = function (el) { setPath(F, el.dataset.p, el.value); dirty(); };
CHG.fbThumb = function (el) {
  var file = el.files[0]; if (!file) return;
  if (file.size > 5 * 1048576) return toast('Please choose an image under 5 MB.', 'warn');
  var b = $('#thumbBox'); b.innerHTML = '<div class="sk" style="height:120px"></div><p class="small muted mt-8">Uploading…</p>';
  readB64(file).then(function (b64) { return call('uploadFile', S.token, b64, file.name, file.type, 'thumbnail'); })
    .then(function (r) { F.thumbnail = r.url; dirty(); paintThumb(); $('input[data-p=thumbnail]').value = r.url; toast('Cover uploaded.', 'ok'); })
    .catch(function (e) { paintThumb(); toast(e.message, 'err'); });
};
ACT.fbThumbDel = function () { F.thumbnail = ''; dirty(); paintThumb(); $('input[data-p=thumbnail]').value = ''; };
function readB64(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = function () { rej(new Error('Could not read the file.')); }; r.readAsDataURL(file); }); }

function paintCurriculum() {
  var box = $('#curr'); if (!box) return;
  var A = S.admin, savedMods = {}; A.modules.forEach(function (m) { savedMods[m.id] = 1; });
  box.innerHTML = F.modules.map(function (m, mi) {
    var hasQuiz = A.quizzes.some(function (q) { return q.module_id === m.id; });
    var lessons = m.lessons.map(function (l, li) {
      var mats = l.materials.map(function (t, ti) {
        var file = t.type === 'document' || t.type === 'zip', P = 'modules.' + mi + '.lessons.' + li + '.materials.' + ti;
        return '<div class="mat-row"><select class="select" style="height:38px" data-ch="fbc" data-p="' + P + '.type" data-re="1">' + ['document', 'link', 'youtube', 'zip'].map(function (x) { return '<option value="' + x + '"' + (t.type === x ? ' selected' : '') + '>' + { document: 'Document', link: 'Link', youtube: 'YouTube', zip: 'ZIP archive' }[x] + '</option>'; }).join('') + '</select>' +
          '<input class="input" style="height:38px" placeholder="Title" data-in="fb" data-p="' + P + '.title" value="' + esc(t.title) + '">' +
          (file ? (t._up ? '<span class="small muted">Uploading…</span>' : t.drive_id ? '<span class="badge b-ok clamp-1" style="justify-self:start">' + ic('check', 'i-sm') + esc(t.file_name || 'File uploaded') + '</span>' : '<label class="btn btn-soft btn-sm" style="cursor:pointer">' + ic('upload', 'i-sm') + 'Choose file<input type="file" hidden data-ch="fbMat" data-m="' + mi + '" data-l="' + li + '" data-t="' + ti + '"></label>')
            : '<input class="input" style="height:38px" placeholder="https://…" data-in="fb" data-p="' + P + '.url" value="' + esc(t.url) + '">') +
          '<button class="icon-btn" style="width:34px;height:34px" data-act="fbDelMat" data-m="' + mi + '" data-l="' + li + '" data-t="' + ti + '" aria-label="Remove resource">' + ic('x', 'i-sm') + '</button></div>';
      }).join('');
      var LP = 'modules.' + mi + '.lessons.' + li;
      return '<div class="les-block"><div class="row gap-8"><span class="badge b-slate">' + (mi + 1) + '.' + (li + 1) + '</span><input class="input grow" style="height:40px" placeholder="Lesson title" data-in="fb" data-p="' + LP + '.title" value="' + esc(l.title) + '">' +
        '<button class="icon-btn" style="width:34px;height:34px" data-act="fbMoveLes" data-m="' + mi + '" data-l="' + li + '" data-d="-1" aria-label="Move up"' + (li === 0 ? ' disabled' : '') + '>' + ic('chev-up', 'i-sm') + '</button>' +
        '<button class="icon-btn" style="width:34px;height:34px" data-act="fbMoveLes" data-m="' + mi + '" data-l="' + li + '" data-d="1" aria-label="Move down"' + (li === m.lessons.length - 1 ? ' disabled' : '') + '>' + ic('chev-down', 'i-sm') + '</button>' +
        '<button class="icon-btn" style="width:34px;height:34px" data-act="fbToggleLes" data-m="' + mi + '" data-l="' + li + '" aria-label="Details">' + ic(l.open ? 'chev-up' : 'edit', 'i-sm') + '</button>' +
        '<button class="icon-btn" style="width:34px;height:34px;color:var(--err)" data-act="fbDelLes" data-m="' + mi + '" data-l="' + li + '" aria-label="Delete lesson">' + ic('trash', 'i-sm') + '</button></div>' +
        (l.open ? '<div class="form-grid mt-12"><div class="field"><label>YouTube link or video ID</label><input class="input" data-in="fb" data-p="' + LP + '.youtube_id" placeholder="https://youtu.be/…" value="' + esc(l.youtube_id) + '"></div>' +
          '<div class="field"><label>Duration (minutes)</label><input class="input" type="number" min="0" data-in="fb" data-p="' + LP + '.duration" value="' + esc(l.duration) + '"></div>' +
          '<div class="field full"><label>Lesson description</label><textarea class="textarea" style="min-height:70px" data-in="fb" data-p="' + LP + '.description">' + esc(l.description) + '</textarea></div>' +
          '<div class="full"><div class="label mb-8">Resources</div>' + mats + '<button class="btn btn-ghost btn-sm mt-8" data-act="fbAddMat" data-m="' + mi + '" data-l="' + li + '">' + ic('plus', 'i-sm') + 'Add resource</button></div></div>' : '') + '</div>';
    }).join('');
    return '<div class="mod-block"><div class="mb-head"><span class="badge b-p">Module ' + (mi + 1) + '</span><input class="input grow" placeholder="Module title" data-in="fb" data-p="modules.' + mi + '.title" value="' + esc(m.title) + '">' +
      '<button class="icon-btn" data-act="fbMoveMod" data-m="' + mi + '" data-d="-1" aria-label="Move up"' + (mi === 0 ? ' disabled' : '') + '>' + ic('chev-up') + '</button><button class="icon-btn" data-act="fbMoveMod" data-m="' + mi + '" data-d="1" aria-label="Move down"' + (mi === F.modules.length - 1 ? ' disabled' : '') + '>' + ic('chev-down') + '</button>' +
      '<button class="icon-btn" style="color:var(--err)" data-act="fbDelMod" data-m="' + mi + '" aria-label="Delete module">' + ic('trash') + '</button></div>' +
      '<div class="row row-wrap gap-8 mt-12">' + (savedMods[m.id] ? '<button class="btn ' + (hasQuiz ? 'btn-soft' : 'btn-outline') + ' btn-sm" data-act="fbQuiz" data-id="' + m.id + '">' + ic('quiz', 'i-sm') + (hasQuiz ? 'Edit module quiz' : 'Add module quiz') + '</button>' : '<span class="small muted">' + ic('info', 'i-sm') + ' Save the course to add a quiz to this module.</span>') + '</div>' +
      '<div class="mt-12">' + lessons + '</div><button class="add-dashed" style="height:38px;margin-top:10px" data-act="fbAddLes" data-m="' + mi + '">' + ic('plus', 'i-sm') + 'Add lesson</button></div>';
  }).join('') || '<p class="muted small">No modules yet — add your first one below.</p>';
}
(function () { var orig = CHG.fbc; CHG.fbc = function (el) { orig(el); if (el.dataset.re) paintCurriculum(); }; })();
function swap(a, i, d) { var j = i + d; if (j < 0 || j >= a.length) return; var t = a[i]; a[i] = a[j]; a[j] = t; }
ACT.fbAddMod = function () { F.modules.push(blankModule()); dirty(); paintCurriculum(); };
ACT.fbDelMod = function (el) { var m = F.modules[el.dataset.m]; confirmBox({ title: 'Delete this module?', danger: true, yes: 'Delete', text: 'The module, its lessons, resources and quiz will be removed when you save.' }).then(function (ok) { if (ok) { F.modules.splice(el.dataset.m, 1); dirty(); paintCurriculum(); } }); };
ACT.fbMoveMod = function (el) { swap(F.modules, Number(el.dataset.m), Number(el.dataset.d)); dirty(); paintCurriculum(); };
ACT.fbAddLes = function (el) { F.modules[el.dataset.m].lessons.push(blankLesson()); dirty(); paintCurriculum(); };
ACT.fbDelLes = function (el) { F.modules[el.dataset.m].lessons.splice(el.dataset.l, 1); dirty(); paintCurriculum(); };
ACT.fbMoveLes = function (el) { swap(F.modules[el.dataset.m].lessons, Number(el.dataset.l), Number(el.dataset.d)); dirty(); paintCurriculum(); };
ACT.fbToggleLes = function (el) { var l = F.modules[el.dataset.m].lessons[el.dataset.l]; l.open = !l.open; paintCurriculum(); };
ACT.fbAddMat = function (el) { var l = F.modules[el.dataset.m].lessons[el.dataset.l]; l.materials.push({ id: uid(), type: 'link', title: '', url: '', drive_id: '', file_name: '', mime: '', size: 0 }); dirty(); paintCurriculum(); };
ACT.fbDelMat = function (el) { F.modules[el.dataset.m].lessons[el.dataset.l].materials.splice(el.dataset.t, 1); dirty(); paintCurriculum(); };
CHG.fbMat = function (el) {
  var file = el.files[0]; if (!file) return; var t = F.modules[el.dataset.m].lessons[el.dataset.l].materials[el.dataset.t];
  if (file.size > 25 * 1048576) return toast('Maximum file size is 25 MB.', 'warn');
  t._up = true; paintCurriculum();
  readB64(file).then(function (b64) { return call('uploadFile', S.token, b64, file.name, file.type, 'material'); })
    .then(function (r) { t._up = false; t.drive_id = r.drive_id; t.file_name = r.file_name; t.mime = r.mime; t.size = r.size; if (!t.title) t.title = r.file_name; dirty(); paintCurriculum(); toast('File uploaded.', 'ok'); })
    .catch(function (e) { t._up = false; paintCurriculum(); toast(e.message, 'err'); });
};
ACT.fbQuiz = function (el) {
  if (F._dirty) return toast('Save your changes first, then manage the quiz.', 'info');
  go('admin-quiz', { moduleId: el.dataset.id });
};
ACT.fbCancel = function () {
  if (!F || !F._dirty) return go('admin-courses');
  confirmBox({ title: 'Discard changes?', text: 'You have unsaved changes that will be lost.', yes: 'Discard', no: 'Keep editing', danger: true }).then(function (ok) { if (ok) go('admin-courses'); });
};
function courseFormPayload(status) {
  return {
    id: F.id, title: F.title.trim(), short_desc: F.short_desc, description: F.description, category: F.category, level: F.level, instructor: F.instructor, instructor_title: F.instructor_title,
    instructor_bio: F.instructor_bio, thumbnail: F.thumbnail, trailer_youtube: F.trailer_youtube, outcomes: F.outcomes, passing_score: F.passing_score, status: status,
    modules: F.modules.map(function (m) {
      return { id: m.id, title: m.title.trim(), description: m.description, lessons: m.lessons.map(function (l) {
        return { id: l.id, title: l.title.trim(), youtube_id: l.youtube_id, duration: Number(l.duration) || 0, description: l.description,
          materials: l.materials.filter(function (t) { return (t.url || '').trim() || t.drive_id; }).map(function (t) { return { id: t.id, type: t.type, title: t.title, url: t.url, drive_id: t.drive_id, file_name: t.file_name, mime: t.mime, size: t.size }; }) };
      }) };
    })
  };
}
function applyCourseLocal(pl) {
  var A = S.admin, id = pl.id, old = A.courses.filter(function (x) { return x.id === id; })[0];
  var rec = { id: id, title: pl.title, short_desc: pl.short_desc, description: pl.description, category: pl.category || 'General', level: pl.level, instructor: pl.instructor, instructor_title: pl.instructor_title,
    instructor_bio: pl.instructor_bio, thumbnail: pl.thumbnail, trailer_youtube: parseYt(pl.trailer_youtube), outcomes: pl.outcomes, passing_score: pl.passing_score, status: pl.status, order: old ? old.order : A.courses.length + 1, created_at: old ? old.created_at : Date.now(), updated_at: Date.now() };
  A.courses = A.courses.filter(function (x) { return x.id !== id; }).concat([rec]).sort(function (a, b) { return a.order - b.order; });
  ['modules', 'lessons', 'materials'].forEach(function (k) { A[k] = A[k].filter(function (x) { return x.course_id !== id; }); });
  var modIds = {};
  pl.modules.forEach(function (m, mi) {
    modIds[m.id] = 1; A.modules.push({ id: m.id, course_id: id, order: mi + 1, title: m.title, description: m.description });
    m.lessons.forEach(function (l, li) {
      A.lessons.push({ id: l.id, module_id: m.id, course_id: id, order: li + 1, title: l.title, youtube_id: parseYt(l.youtube_id), duration: l.duration, description: l.description });
      l.materials.forEach(function (t) { A.materials.push({ id: t.id, lesson_id: l.id, module_id: m.id, course_id: id, type: t.type, title: t.title || t.file_name || 'Resource', url: t.url, drive_id: t.drive_id, file_name: t.file_name, mime: t.mime, size: t.size }); });
    });
  });
  var orphan = A.quizzes.filter(function (q) { return q.course_id === id && !modIds[q.module_id]; }).map(function (q) { return q.id; });
  A.quizzes = A.quizzes.filter(function (q) { return orphan.indexOf(q.id) < 0; }); A.questions = A.questions.filter(function (q) { return orphan.indexOf(q.quiz_id) < 0; });
  persistAdmin();
}
function parseYt(v) { v = String(v || '').trim(); var m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(v) ? v : ''); }
ACT.fbSave = function (el) {
  var status = el.dataset.s, pl = courseFormPayload(status), err = null;
  if (!pl.title) err = 'Please enter a course title.';
  pl.modules.forEach(function (m, mi) { if (!err && !m.title) err = 'Module ' + (mi + 1) + ' needs a title.'; m.lessons.forEach(function (l, li) { if (!err && !l.title) err = 'Lesson ' + (mi + 1) + '.' + (li + 1) + ' needs a title.'; }); });
  if (!err && status === 'published' && !pl.modules.some(function (m) { return m.lessons.length; })) err = 'Add at least one lesson before publishing.';
  if (err) return toast(err, 'warn');
  var snapDraft = F, prevAdmin = clone(S.admin);
  applyCourseLocal(pl);                                   // optimistik: daftar langsung memuat perubahan
  go('admin-courses'); toast(status === 'published' ? 'Course saved and published.' : 'Course saved as draft.', 'ok');
  call('saveCourse', S.token, pl).then(function (data) { S.admin = data; LS.set('ll_admin', data); refreshPublic(); if (S.route.name === 'admin-courses') rerender(); })
    .catch(function (e) {
      if (e.code === 'AUTH') return;
      S.admin = prevAdmin; persistAdmin(); S.formDraft = snapDraft; toast(e.message, 'err', 'Course was not saved');
      go('admin-course-form', { id: snapDraft.id, draft: 1 }, { replace: true });
    });
};

/* ── Manajer kuis per modul ── */
var QF = null;
function blankQuestion() { return { id: uid(), question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct: '', weight: 1 }; }
route('admin-quiz', 'admin', 'admin', function (sec, p) {
  adminView(sec, function () {
    var A = S.admin, m = A.modules.filter(function (x) { return x.id === p.moduleId; })[0];
    if (!m) { sec.innerHTML = empty('quiz', 'Module not found', 'Save the course first, then manage the quiz.', '<button class="btn btn-primary mt-8" data-act="go" data-to="admin-courses">Back to courses</button>'); return; }
    var c = A.courses.filter(function (x) { return x.id === m.course_id; })[0] || {}, q = A.quizzes.filter(function (x) { return x.module_id === m.id; })[0];
    QF = { module_id: m.id, course_id: m.course_id, exists: !!q, title: q ? q.title : 'Quiz: ' + m.title, time_limit: q && q.time_limit ? Number(q.time_limit) : 0, shuffle: q ? q.shuffle === 'yes' : true,
      questions: q ? A.questions.filter(function (x) { return x.quiz_id === q.id; }).sort(function (a, b) { return a.order - b.order; }).map(function (x) { return clone(x); }) : [blankQuestion(), blankQuestion()], _dirty: false };
    sec.innerHTML = pageHead('<a href="#" data-act="go" data-to="admin-courses">Courses</a> / ' + esc(c.title || '') + ' / ' + esc(m.title), 'Module quiz', 'Single attempt · graded on the server · answers are never sent to learners\' browsers.', '') +
      '<div class="split" style="grid-template-columns:minmax(0,1fr) 320px"><div><div id="qList"></div><button class="add-dashed" data-act="qfAdd">' + ic('plus', 'i-sm') + 'Add question</button></div>' +
      '<aside class="stack gap-16 sticky"><div class="panel"><h3 class="bar-title" style="font-size:17px">Quiz settings</h3><div class="field mt-16"><label>Quiz title</label><input class="input" data-in="qf" data-p="title" value="' + esc(QF.title) + '"></div>' +
      '<div class="field mt-16"><label>Time limit (minutes)</label><input class="input" type="number" min="0" max="300" data-in="qf" data-p="time_limit" value="' + QF.time_limit + '"><span class="help">0 = no time limit. The timer starts when the learner begins.</span></div>' +
      '<div class="row between mt-16"><div><b class="small" style="font-family:var(--font-h)">Shuffle questions</b><div class="tiny muted">Different order for each learner</div></div><button class="toggle' + (QF.shuffle ? ' on' : '') + '" data-act="qfShuffle" aria-label="Shuffle"></button></div></div>' +
      '<div class="callout callout-p small">' + ic('info') + '<div>Each question needs at least 2 options and one correct answer. Scores are weighted by question weight.</div></div></aside></div>' +
      '<div class="sticky-bar"><span class="small muted grow" id="qfState">' + plural(QF.questions.length, 'question') + '</span>' + (QF.exists ? '<button class="btn btn-danger-soft" data-act="qfDelete">' + ic('trash', 'i-sm') + 'Delete quiz</button>' : '') +
      '<button class="btn btn-outline" data-act="qfBack">Back</button><button class="btn btn-primary" data-act="qfSave">' + ic('check', 'i-sm') + 'Save quiz</button></div>';
    paintQList();
  });
});
function paintQList() {
  var el = $('#qList'); if (!el) return;
  el.innerHTML = QF.questions.map(function (q, i) {
    var opts = ['a', 'b', 'c', 'd'].map(function (k) {
      return '<div class="row gap-8" style="margin-top:8px"><label class="check" style="margin:0" title="Mark as correct"><input type="radio" name="cor' + i + '" ' + (q.correct === k ? 'checked' : '') + ' data-ch="qfc" data-i="' + i + '" data-k="' + k + '"></label><span class="badge b-slate" style="min-width:26px;justify-content:center">' + k.toUpperCase() + '</span><input class="input" style="height:40px" data-in="qf" data-p="questions.' + i + '.option_' + k + '" placeholder="Option ' + k.toUpperCase() + (k > 'b' ? ' (optional)' : '') + '" value="' + esc(q['option_' + k]) + '"></div>';
    }).join('');
    return '<div class="q-item" style="flex-direction:column;gap:0"><div class="row gap-12"><span class="n">' + (i + 1) + '</span><div class="grow"><textarea class="textarea" style="min-height:64px" data-in="qf" data-p="questions.' + i + '.question" placeholder="Type the question…">' + esc(q.question) + '</textarea></div>' +
      '<div class="stack gap-4"><button class="icon-btn" style="width:30px;height:30px" data-act="qfMove" data-i="' + i + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">' + ic('chev-up', 'i-sm') + '</button><button class="icon-btn" style="width:30px;height:30px" data-act="qfMove" data-i="' + i + '" data-d="1"' + (i === QF.questions.length - 1 ? ' disabled' : '') + ' aria-label="Move down">' + ic('chev-down', 'i-sm') + '</button></div></div>' +
      '<div style="margin-left:42px">' + opts + '<div class="row between mt-12"><div class="row gap-8 small muted"><span>Weight</span><input class="input" type="number" min="1" style="width:76px;height:34px" data-in="qf" data-p="questions.' + i + '.weight" value="' + q.weight + '"><span>' + (q.correct ? 'Correct: <b style="color:var(--ok-tx)">' + q.correct.toUpperCase() + '</b>' : '<span class="text-warn">Select the correct answer</span>') + '</span></div>' +
      '<button class="btn btn-ghost btn-xs" style="color:var(--err)" data-act="qfDel" data-i="' + i + '">' + ic('trash', 'i-sm') + 'Remove</button></div></div></div>';
  }).join('') || '<div class="panel-flat">' + empty('quiz', 'No questions yet', 'Add your first question below.') + '</div>';
  var s = $('#qfState'); if (s) s.textContent = plural(QF.questions.length, 'question') + (QF._dirty ? ' · unsaved changes' : '');
}
INP.qf = function (el) { var p = el.dataset.p, v = el.value; if (/time_limit|weight$/.test(p)) v = v === '' ? '' : Number(v); setPath(QF, p, v); QF._dirty = true; var s = $('#qfState'); if (s) s.textContent = plural(QF.questions.length, 'question') + ' · unsaved changes'; };
CHG.qfc = function (el) { QF.questions[el.dataset.i].correct = el.dataset.k; QF._dirty = true; paintQList(); };
ACT.qfAdd = function () { QF.questions.push(blankQuestion()); QF._dirty = true; paintQList(); setTimeout(function () { var a = $$('#qList textarea'); if (a.length) a[a.length - 1].focus(); }, 30); };
ACT.qfDel = function (el) { QF.questions.splice(el.dataset.i, 1); QF._dirty = true; paintQList(); };
ACT.qfMove = function (el) { swap(QF.questions, Number(el.dataset.i), Number(el.dataset.d)); QF._dirty = true; paintQList(); };
ACT.qfShuffle = function (el) { QF.shuffle = !QF.shuffle; el.classList.toggle('on', QF.shuffle); QF._dirty = true; };
ACT.qfBack = function () {
  var back = function () { go('admin-course-form', { id: QF.course_id }); };
  if (!QF._dirty) return back();
  confirmBox({ title: 'Discard changes?', text: 'Your quiz edits have not been saved.', yes: 'Discard', no: 'Keep editing', danger: true }).then(function (ok) { if (ok) back(); });
};
ACT.qfSave = function () {
  var qs = QF.questions, err = null;
  qs.forEach(function (q, i) {
    if (err) return; if (!String(q.question).trim()) err = 'Question ' + (i + 1) + ' is empty.';
    var filled = ['a', 'b', 'c', 'd'].filter(function (k) { return String(q['option_' + k] || '').trim(); });
    if (!err && filled.length < 2) err = 'Question ' + (i + 1) + ' needs at least 2 options.';
    if (!err && filled.indexOf(q.correct) < 0) err = 'Choose the correct answer for question ' + (i + 1) + '.';
  });
  if (err) return toast(err, 'warn');
  var A = S.admin, snap = clone(A), body = { module_id: QF.module_id, title: QF.title, time_limit: Number(QF.time_limit) || 0, shuffle: QF.shuffle ? 'yes' : 'no', questions: qs.map(function (q) { return { id: q.id, question: q.question, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct: q.correct, weight: Number(q.weight) || 1 }; }) };
  var qz = A.quizzes.filter(function (x) { return x.module_id === QF.module_id; })[0];
  if (!qz) { qz = { id: 'tmp-' + uid(), module_id: QF.module_id, course_id: QF.course_id }; A.quizzes.push(qz); }
  qz.title = body.title; qz.time_limit = body.time_limit || ''; qz.shuffle = body.shuffle; qz.updated_at = Date.now();
  A.questions = A.questions.filter(function (x) { return x.quiz_id !== qz.id; }).concat(body.questions.map(function (q, i) { return Object.assign({ quiz_id: qz.id, order: i + 1 }, q); }));
  persistAdmin(); var cid = QF.course_id; toast('Quiz saved.', 'ok'); go('admin-course-form', { id: cid });
  call('saveQuiz', S.token, body).then(function (r) {
    var tmp = qz.id; qz.id = r.quiz.id; A.questions.forEach(function (x) { if (x.quiz_id === tmp) x.quiz_id = r.quiz.id; }); persistAdmin(); refreshPublic();
  }).catch(function (e) { if (e.code === 'AUTH') return; S.admin = snap; persistAdmin(); toast(e.message, 'err', 'Quiz was not saved'); });
};
ACT.qfDelete = function () {
  confirmBox({ title: 'Delete this quiz?', danger: true, yes: 'Delete quiz', text: 'Learners’ past attempts stay in the results list, but the quiz and its questions are removed.' }).then(function (ok) {
    if (!ok) return; var A = S.admin, snap = clone(A), qz = A.quizzes.filter(function (x) { return x.module_id === QF.module_id; })[0]; if (!qz) return go('admin-course-form', { id: QF.course_id });
    A.quizzes = A.quizzes.filter(function (x) { return x.id !== qz.id; }); A.questions = A.questions.filter(function (x) { return x.quiz_id !== qz.id; }); persistAdmin(); toast('Quiz deleted.', 'info'); var cid = QF.course_id; go('admin-course-form', { id: cid });
    bg(call('deleteQuiz', S.token, qz.id).then(refreshPublic), function () { S.admin = snap; persistAdmin(); }, 'Could not delete the quiz.');
  });
};


/* ════════════════════════════════════════════════════════════
   BAGIAN 4B — PANEL ADMIN: jalur belajar, member & enrollment, hasil kuis, sertifikat, pengaturan
   ════════════════════════════════════════════════════════════ */

/* ── Jalur belajar ── */
route('admin-paths', 'admin', 'admin', function (sec) {
  adminView(sec, function () {
    var A = S.admin, m = amap();
    var cards = A.paths.map(function (p) {
      var cs = String(p.course_ids || '').split(',').filter(String).map(function (id) { return m.courses[id]; }).filter(Boolean);
      return '<div class="panel"><div class="panel-head"><div><div class="row gap-8">' + (p.status === 'draft' ? badge('Draft', 'b-slate') : badge('Published', 'b-ok')) + '<span class="small muted">' + plural(cs.length, 'course') + '</span></div><h3 class="mt-8">' + esc(p.title) + '</h3><p class="small muted mt-4" style="max-width:560px">' + esc(p.description) + '</p></div>' +
        '<div class="row gap-8"><button class="btn btn-soft btn-sm" data-act="pathEdit" data-id="' + p.id + '">' + ic('edit', 'i-sm') + 'Edit</button><button class="icon-btn" style="color:var(--err)" data-act="pathDel" data-id="' + p.id + '" aria-label="Delete path">' + ic('trash', 'i-sm') + '</button></div></div>' +
        '<div class="stack gap-8">' + (cs.map(function (c, i) { return '<div class="lesson-line"><span class="avatar" style="width:28px;height:28px;font-size:12px">' + (i + 1) + '</span><span class="grow">' + esc(c.title) + '</span>' + statusBadge(c.status) + '</div>'; }).join('') || '<p class="muted small">No courses in this path yet.</p>') + '</div></div>';
    }).join('');
    sec.innerHTML = pageHead('Curation', 'Learning paths', 'Group courses into guided sequences for learners.', '<button class="btn btn-primary" data-act="pathEdit" data-id="">' + ic('plus', 'i-sm') + 'New path</button>') +
      '<div class="stack gap-16">' + (cards || '<div class="panel-flat">' + empty('route', 'No learning paths yet', 'Create a path to group related courses in a recommended order.') + '</div>') + '</div>';
  });
});
var PF = null;
ACT.pathEdit = function (el) {
  var A = S.admin, p = A.paths.filter(function (x) { return x.id === el.dataset.id; })[0];
  PF = p ? { id: p.id, title: p.title, description: p.description, status: p.status === 'draft' ? 'draft' : 'published', course_ids: String(p.course_ids || '').split(',').filter(String) } : { id: uid(), isNew: true, title: '', description: '', status: 'published', course_ids: [] };
  openModal({ title: PF.isNew ? 'New learning path' : 'Edit learning path', icon: 'route', size: 'lg', body:
    '<div class="form-grid"><div class="field full"><label>Title <span class="req">*</span></label><input class="input" data-in="pf" data-p="title" value="' + esc(PF.title) + '" placeholder="e.g. Teacher Excellence Path"></div>' +
    '<div class="field full"><label>Description</label><textarea class="textarea" style="min-height:70px" data-in="pf" data-p="description">' + esc(PF.description) + '</textarea></div>' +
    '<div class="field"><label>Status</label><select class="select" data-ch="pfs"><option value="published"' + (PF.status === 'published' ? ' selected' : '') + '>Published</option><option value="draft"' + (PF.status === 'draft' ? ' selected' : '') + '>Draft</option></select></div>' +
    '<div class="field"><label>Add a course</label><select class="select" id="pathAdd" data-ch="pfAdd"></select></div>' +
    '<div class="full"><div class="label mb-8">Courses in this path (in order)</div><div id="pathSel" class="stack gap-8"></div></div></div>',
    foot: '<button class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-primary" data-act="pathSave">Save path</button>', onMount: paintPathSel });
};
function paintPathSel() {
  var A = S.admin, m = amap(), sel = $('#pathSel'), add = $('#pathAdd'); if (!sel) return;
  sel.innerHTML = PF.course_ids.map(function (id, i) {
    var c = m.courses[id]; if (!c) return '';
    return '<div class="lesson-line"><span class="avatar" style="width:28px;height:28px;font-size:12px">' + (i + 1) + '</span><span class="grow">' + esc(c.title) + '</span>' +
      '<button class="icon-btn" style="width:30px;height:30px" data-act="pfMove" data-i="' + i + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">' + ic('chev-up', 'i-sm') + '</button><button class="icon-btn" style="width:30px;height:30px" data-act="pfMove" data-i="' + i + '" data-d="1"' + (i === PF.course_ids.length - 1 ? ' disabled' : '') + ' aria-label="Move down">' + ic('chev-down', 'i-sm') + '</button>' +
      '<button class="icon-btn" style="width:30px;height:30px" data-act="pfRem" data-i="' + i + '" aria-label="Remove">' + ic('x', 'i-sm') + '</button></div>';
  }).join('') || '<p class="muted small">No courses yet — pick one from the list above.</p>';
  var avail = A.courses.filter(function (c) { return PF.course_ids.indexOf(c.id) < 0; });
  add.innerHTML = '<option value="">' + (avail.length ? 'Select a course…' : 'All courses added') + '</option>' + avail.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('');
}
INP.pf = function (el) { PF[el.dataset.p] = el.value; };
CHG.pfs = function (el) { PF.status = el.value; };
CHG.pfAdd = function (el) { if (el.value) { PF.course_ids.push(el.value); paintPathSel(); } };
ACT.pfMove = function (el) { swap(PF.course_ids, Number(el.dataset.i), Number(el.dataset.d)); paintPathSel(); };
ACT.pfRem = function (el) { PF.course_ids.splice(el.dataset.i, 1); paintPathSel(); };
ACT.pathSave = function () {
  if (!PF.title.trim()) return toast('Please enter a path title.', 'warn');
  var A = S.admin, snap = clone(A.paths), body = { id: PF.id, title: PF.title.trim(), description: PF.description, status: PF.status, course_ids: PF.course_ids.slice() };
  var row = A.paths.filter(function (x) { return x.id === PF.id; })[0];
  if (!row) { row = { id: PF.id, order: A.paths.length + 1 }; A.paths.push(row); }
  row.title = body.title; row.description = body.description; row.status = body.status; row.course_ids = body.course_ids.join(','); persistAdmin();
  closeModal(); rerender(); toast('Learning path saved.', 'ok');
  bg(call('savePath', S.token, body).then(refreshPublic), function () { S.admin.paths = snap; persistAdmin(); rerender(); }, 'Could not save the path.');
};
ACT.pathDel = function (el) {
  confirmBox({ title: 'Delete this path?', danger: true, yes: 'Delete', text: 'The courses stay available — only the grouping is removed.' }).then(function (ok) {
    if (!ok) return; var snap = clone(S.admin.paths); S.admin.paths = S.admin.paths.filter(function (x) { return x.id !== el.dataset.id; }); persistAdmin(); rerender(); toast('Learning path deleted.', 'info');
    bg(call('deletePath', S.token, el.dataset.id).then(refreshPublic), function () { S.admin.paths = snap; persistAdmin(); rerender(); }, 'Could not delete the path.');
  });
};

/* ── Member & enrollment ── */
S.sel = {};
route('admin-members', 'admin', 'admin', function (sec) {
  adminView(sec, function () {
    var A = S.admin, tab = S.ui.memberTab;
    sec.innerHTML = pageHead('Enrollments', 'Members & enrollments', 'Review access requests, manage learners and send password resets.', '') +
      '<div class="panel-flat" style="padding:0;overflow:visible"><div style="padding:6px 16px 0"><div class="tabs" id="memTabs"><button class="tab' + (tab === 'enrollments' ? ' active' : '') + '" data-act="memTab" data-v="enrollments">' + ic('check-circle', 'i-sm') + 'Enrollments' + (pendingCount() ? ' <span class="badge b-warn" style="height:20px">' + pendingCount() + ' new</span>' : '') + '</button><button class="tab' + (tab === 'members' ? ' active' : '') + '" data-act="memTab" data-v="members">' + ic('users', 'i-sm') + 'All members <span class="badge b-slate" style="height:20px">' + A.users.length + '</span></button></div></div>' +
      '<div class="filter-bar"><div class="input-wrap">' + ic('search', 'i-left') + '<input class="input" id="memQ" data-in="memQ" placeholder="Search by name or email…" value="' + esc(S.ui.adminQ) + '"></div>' +
      '<span id="memFilters"></span></div><div id="bulkBar"></div><div id="memBody"></div></div>';
    paintMembers();
  });
});
ACT.memTab = function (el) { S.ui.memberTab = el.dataset.v; S.sel = {}; $$('#memTabs .tab').forEach(function (t) { t.classList.toggle('active', t.dataset.v === el.dataset.v); }); paintMembers(); };
INP.memQ = debounce(function (el) { S.ui.adminQ = el.value.trim(); paintMembers(); }, 80);
function paintMembers() { if (S.ui.memberTab === 'enrollments') paintEnrollTab(); else paintMemberTab(); }
function paintEnrollTab() {
  var A = S.admin, m = amap(), q = (S.ui.adminQ || '').toLowerCase(), st = S.ui.enrollStatus, cf = S.ui.enrollCourse || 'all';
  $('#memFilters').innerHTML = '<select class="select" data-ch="enSt"><option value="all">All statuses</option><option value="requested">Requested</option><option value="active">Active</option><option value="rejected">Rejected</option><option value="revoked">Revoked</option></select>' +
    '<select class="select" data-ch="enCo"><option value="all">All courses</option>' + A.courses.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('') + '</select>';
  $('[data-ch=enSt]').value = st; $('[data-ch=enCo]').value = cf;
  var list = A.enrollments.filter(function (e) {
    var u = m.users[e.user_id]; if (!u) return false;
    return (st === 'all' || e.status === st) && (cf === 'all' || e.course_id === cf) && (!q || (u.name + ' ' + u.email).toLowerCase().indexOf(q) > -1);
  }).sort(function (a, b) { return (b.requested_at || 0) - (a.requested_at || 0); });
  var keys = list.map(function (e) { return e.user_id + '|' + e.course_id; });
  Object.keys(S.sel).forEach(function (k) { if (keys.indexOf(k) < 0) delete S.sel[k]; });
  var rows = list.map(function (e) {
    var u = m.users[e.user_id], c = m.courses[e.course_id] || { title: 'Deleted course' }, k = e.user_id + '|' + e.course_id, acts;
    if (e.status === 'requested') acts = '<button class="btn btn-primary btn-xs" data-act="enr" data-u="' + e.user_id + '" data-c="' + e.course_id + '" data-s="active">' + ic('check', 'i-sm') + 'Activate</button><button class="btn btn-danger-soft btn-xs" data-act="enr" data-u="' + e.user_id + '" data-c="' + e.course_id + '" data-s="rejected">Reject</button>';
    else if (e.status === 'active') acts = '<button class="btn btn-outline btn-xs" data-act="enr" data-u="' + e.user_id + '" data-c="' + e.course_id + '" data-s="revoked">Revoke</button>';
    else acts = '<button class="btn btn-soft btn-xs" data-act="enr" data-u="' + e.user_id + '" data-c="' + e.course_id + '" data-s="active">Activate</button>';
    return '<tr><td style="width:40px"><label class="check"><input type="checkbox" data-ch="selRow" data-k="' + k + '"' + (S.sel[k] ? ' checked' : '') + '></label></td>' +
      '<td data-l="Learner"><button class="person" style="background:none;border:0;cursor:pointer;text-align:left;padding:0" data-act="memberOpen" data-id="' + u.id + '">' + avatar(u.name) + '<div><b>' + esc(u.name) + '</b><span>' + esc(u.email) + '</span></div></button></td>' +
      '<td data-l="Course" class="td-strong">' + esc(c.title) + '</td><td data-l="Requested" class="muted">' + fmtDate(e.requested_at) + '</td><td data-l="Status">' + statusBadge(e.status) + '</td>' +
      '<td data-l="Decided" class="small muted">' + (e.decided_at ? esc(e.approved_by || '') + '<br>' + fmtDate(e.decided_at) : '—') + '</td><td class="t-actions">' + acts + '</td></tr>';
  }).join('');
  $('#memBody').innerHTML = '<div class="table-wrap cards-m"><table class="table"><thead><tr><th><label class="check"><input type="checkbox" data-ch="selAll"' + (keys.length && keys.every(function (k) { return S.sel[k]; }) ? ' checked' : '') + '></label></th><th>Learner</th><th>Course</th><th>Requested</th><th>Status</th><th>Decided</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="7">' + empty('users', 'Nothing to show', st === 'requested' ? 'There are no pending requests right now.' : 'No enrollments match your filters.') + '</td></tr>') + '</tbody></table></div>' +
    '<div class="pagination"><span class="small muted">' + plural(list.length, 'enrollment') + '</span></div>';
  paintBulk();
}
function paintBulk() {
  var n = Object.keys(S.sel).filter(function (k) { return S.sel[k]; }).length, b = $('#bulkBar'); if (!b) return;
  b.innerHTML = n ? '<div class="row row-wrap gap-8" style="padding:10px 16px;background:var(--p-soft)"><b class="small">' + n + ' selected</b><span class="grow"></span><button class="btn btn-primary btn-sm" data-act="bulk" data-s="active">' + ic('check', 'i-sm') + 'Activate</button><button class="btn btn-danger-soft btn-sm" data-act="bulk" data-s="rejected">Reject</button><button class="btn btn-outline btn-sm" data-act="bulk" data-s="revoked">Revoke</button><button class="btn btn-ghost btn-sm" data-act="bulkClear">Clear</button></div>' : '';
}
CHG.enSt = function (el) { S.ui.enrollStatus = el.value; paintEnrollTab(); };
CHG.enCo = function (el) { S.ui.enrollCourse = el.value; paintEnrollTab(); };
CHG.selRow = function (el) { if (el.checked) S.sel[el.dataset.k] = 1; else delete S.sel[el.dataset.k]; paintBulk(); };
CHG.selAll = function (el) { $$('[data-ch=selRow]').forEach(function (c) { c.checked = el.checked; if (el.checked) S.sel[c.dataset.k] = 1; else delete S.sel[c.dataset.k]; }); paintBulk(); };
ACT.bulkClear = function () { S.sel = {}; paintEnrollTab(); };
ACT.bulk = function (el) {
  var pairs = Object.keys(S.sel).filter(function (k) { return S.sel[k]; }).map(function (k) { var p = k.split('|'); return { user_id: p[0], course_id: p[1] }; });
  S.sel = {}; applyEnroll(pairs, el.dataset.s);
};
function paintMemberTab() {
  var A = S.admin, q = (S.ui.adminQ || '').toLowerCase(), act = {};
  A.enrollments.forEach(function (e) { if (e.status === 'active') act[e.user_id] = (act[e.user_id] || 0) + 1; });
  $('#memFilters').innerHTML = ''; $('#bulkBar').innerHTML = '';
  var list = A.users.filter(function (u) { return !q || (u.name + ' ' + u.email).toLowerCase().indexOf(q) > -1; }).sort(function (a, b) { return (b.created_at || 0) - (a.created_at || 0); });
  var rows = list.map(function (u) {
    var role = isSuper() && u.id !== S.me.id ? '<select class="select" style="height:34px;min-width:120px" data-ch="roleSel" data-id="' + u.id + '"><option value="member"' + (u.role === 'member' ? ' selected' : '') + '>Member</option><option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option><option value="superadmin"' + (u.role === 'superadmin' ? ' selected' : '') + '>Super admin</option></select>'
      : badge(u.role === 'superadmin' ? 'Super admin' : u.role === 'admin' ? 'Admin' : 'Member', u.role === 'member' ? 'b-slate' : 'b-p');
    return '<tr><td data-l="Member"><button class="person" style="background:none;border:0;cursor:pointer;text-align:left;padding:0" data-act="memberOpen" data-id="' + u.id + '">' + avatar(u.name) + '<div><b>' + esc(u.name) + '</b><span>' + esc(u.email) + '</span></div></button></td>' +
      '<td data-l="Role">' + role + '</td><td data-l="Courses">' + (act[u.id] || 0) + '</td><td data-l="Joined" class="muted">' + fmtDate(u.created_at) + '</td><td data-l="Last login" class="muted">' + ago(u.last_login) + '</td>' +
      '<td class="t-actions"><button class="btn btn-soft btn-xs" data-act="memberOpen" data-id="' + u.id + '">' + ic('eye', 'i-sm') + 'View</button><button class="btn btn-outline btn-xs" data-act="memberReset" data-id="' + u.id + '">' + ic('key', 'i-sm') + 'Reset password</button></td></tr>';
  }).join('');
  $('#memBody').innerHTML = '<div class="table-wrap cards-m" style="overflow:visible"><table class="table"><thead><tr><th>Member</th><th>Role</th><th>Active courses</th><th>Joined</th><th>Last login</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="6">' + empty('users', 'No members found', 'Try a different search.') + '</td></tr>') + '</tbody></table></div><div class="pagination"><span class="small muted">' + plural(list.length, 'member') + '</span></div>';
}
CHG.roleSel = function (el) {
  var u = S.admin.users.filter(function (x) { return x.id === el.dataset.id; })[0], prev = u.role, role = el.value;
  u.role = role; persistAdmin(); toast(esc(u.name) + ' is now ' + (role === 'superadmin' ? 'a super admin' : role === 'admin' ? 'an admin' : 'a member') + '.', 'ok');
  bg(call('setUserRole', S.token, u.id, role), function () { u.role = prev; persistAdmin(); paintMembers(); }, 'Could not change the role.');
};
ACT.memberReset = function (el) {
  var u = S.admin.users.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!u) return;
  confirmBox({ title: 'Send password reset email?', icon: 'mail', yes: 'Send email', text: 'We will email <b>' + esc(u.email) + '</b> a one-time link (valid for 60 minutes) so ' + esc(u.name) + ' can choose a new password.' }).then(function (ok) {
    if (!ok) return; toast('Sending reset email…', 'info');
    call('adminSendReset', S.token, u.id).then(function () { toast('Reset email sent to ' + u.email + '.', 'ok'); }).catch(function (e) { toast(e.message, 'err'); });
  });
};
ACT.memberOpen = function (el) {
  var id = el.dataset.id; S.drawerUser = id; S.drawer = function () { paintDrawer(id); }; paintDrawer(id);
};
function paintDrawer(id) {
  var A = S.admin, m = amap(), u = m.users[id]; if (!u) return closeDrawer();
  var enr = A.enrollments.filter(function (e) { return e.user_id === id; });
  var lc = {}; A.lessons.forEach(function (l) { lc[l.course_id] = (lc[l.course_id] || 0) + 1; });
  var done = {}; A.progress.forEach(function (p) { if (p[0] === id) done[p[1]] = (done[p[1]] || 0) + 1; });
  var certs = A.certificates.filter(function (c) { return c.user_id === id; });
  var atts = A.attempts.filter(function (a) { return a.user_id === id && a.status === 'submitted'; });
  var courseRows = enr.map(function (e) {
    var c = m.courses[e.course_id] || { title: 'Deleted course' }, tot = lc[e.course_id] || 0, d = done[e.course_id] || 0, pct = tot ? Math.round(d * 100 / tot) : 0;
    var btns = e.status === 'requested' ? '<button class="btn btn-primary btn-xs" data-act="enr" data-u="' + id + '" data-c="' + e.course_id + '" data-s="active">Activate</button><button class="btn btn-danger-soft btn-xs" data-act="enr" data-u="' + id + '" data-c="' + e.course_id + '" data-s="rejected">Reject</button>'
      : e.status === 'active' ? '<button class="btn btn-outline btn-xs" data-act="enr" data-u="' + id + '" data-c="' + e.course_id + '" data-s="revoked">Revoke</button>' : '<button class="btn btn-soft btn-xs" data-act="enr" data-u="' + id + '" data-c="' + e.course_id + '" data-s="active">Activate</button>';
    return '<div class="panel-soft"><div class="row between gap-8" style="flex-wrap:wrap"><b style="font-family:var(--font-h)">' + esc(c.title) + '</b>' + statusBadge(e.status) + '</div>' +
      (e.status === 'active' ? '<div class="row gap-12 mt-8"><div class="progress grow"><span style="width:' + pct + '%"></span></div><span class="small"><b>' + pct + '%</b> · ' + d + '/' + tot + ' lessons</span></div>' : '') +
      '<div class="row row-wrap gap-8 mt-8">' + btns + '</div></div>';
  }).join('');
  var avail = A.courses.filter(function (c) { return !enr.some(function (e) { return e.course_id === c.id && e.status === 'active'; }); });
  openDrawer({ title: u.name, sub: u.email, body:
    '<div class="row gap-16">' + avatar(u.name, 'xl') + '<div><div class="row gap-8">' + badge(u.role === 'superadmin' ? 'Super admin' : u.role === 'admin' ? 'Admin' : 'Member', u.role === 'member' ? 'b-slate' : 'b-p') + (u.status === 'disabled' ? badge('Disabled', 'b-err') : '') + '</div><div class="small muted mt-8">Joined ' + fmtDate(u.created_at) + '<br>Last login ' + ago(u.last_login) + '</div></div></div>' +
    '<div class="grid g-3 mt-24" style="gap:10px"><div class="panel-soft"><div class="tiny muted">Courses</div><b style="font:800 20px var(--font-h)">' + enr.filter(function (e) { return e.status === 'active'; }).length + '</b></div><div class="panel-soft"><div class="tiny muted">Quizzes taken</div><b style="font:800 20px var(--font-h)">' + atts.length + '</b></div><div class="panel-soft"><div class="tiny muted">Certificates</div><b style="font:800 20px var(--font-h)">' + certs.length + '</b></div></div>' +
    '<h4 class="mt-24 mb-8">Course access</h4><div class="stack gap-8">' + (courseRows || '<p class="muted small">No enrollments yet.</p>') + '</div>' +
    '<div class="row gap-8 mt-16"><select class="select grow" id="grantSel"><option value="">Grant access to a course…</option>' + avail.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('') + '</select><button class="btn btn-primary" data-act="grant" data-id="' + id + '">Grant</button></div>' +
    (atts.length ? '<h4 class="mt-24 mb-8">Quiz results</h4><div class="stack gap-8">' + atts.map(function (a) { var qz = m.quizzes[a.quiz_id]; return '<div class="row between panel-soft"><span class="small">' + esc(qz ? qz.title : 'Quiz') + '</span>' + badge(a.score + '%', a.score >= 70 ? 'b-ok' : 'b-warn') + '</div>'; }).join('') + '</div>' : '') +
    (certs.length ? '<h4 class="mt-24 mb-8">Certificates</h4><div class="stack gap-8">' + certs.map(function (c) { return '<div class="row between panel-soft"><span class="small">' + esc(c.course_title) + '<br><span class="mono tiny muted">' + esc(c.cert_number) + '</span></span>' + badge(c.final_score + '%', 'b-ok') + '</div>'; }).join('') + '</div>' : ''),
    foot: '<button class="btn btn-outline" data-act="memberReset" data-id="' + id + '">' + ic('key', 'i-sm') + 'Send password reset</button><span class="grow"></span><button class="btn btn-soft" data-act="closeDrawer">Close</button>' });
  S.drawer = function () { paintDrawer(id); };
}
ACT.grant = function (el) { var v = $('#grantSel').value; if (!v) return toast('Pick a course first.', 'warn'); applyEnroll([{ user_id: el.dataset.id, course_id: v }], 'active'); };

/* ── Hasil kuis & reset percobaan ── */
function resultRows() {
  var A = S.admin, m = amap(), q = (S.ui.resQ || '').toLowerCase(), cf = S.ui.resCourse || 'all', st = S.ui.resStatus || 'all';
  return A.attempts.filter(function (a) {
    var u = m.users[a.user_id]; if (!u) return false;
    return (cf === 'all' || a.course_id === cf) && (st === 'all' || a.status === st) && (!q || (u.name + ' ' + u.email).toLowerCase().indexOf(q) > -1);
  }).sort(function (a, b) { return (b.submitted_at || b.started_at || 0) - (a.submitted_at || a.started_at || 0); });
}
function paintResults() {
  var A = S.admin, m = amap(), list = resultRows(), body = $('#resBody'); if (!body) return;
  body.innerHTML = list.map(function (a) {
    var u = m.users[a.user_id], c = m.courses[a.course_id] || { title: 'Deleted course', passing_score: 70 }, qz = m.quizzes[a.quiz_id] || { title: 'Deleted quiz' }, sub = a.status === 'submitted';
    return '<tr><td data-l="Learner"><div class="person">' + avatar(u.name) + '<div><b>' + esc(u.name) + '</b><span>' + esc(u.email) + '</span></div></div></td><td data-l="Quiz"><b class="td-strong">' + esc(qz.title) + '</b><div class="tiny muted">' + esc(c.title) + '</div></td>' +
      '<td data-l="Score">' + (sub ? badge(a.score + '%', a.score >= c.passing_score ? 'b-ok' : 'b-warn') : '<span class="muted">—</span>') + '</td><td data-l="Correct">' + (sub ? a.correct_count + ' / ' + a.total : '—') + '</td>' +
      '<td data-l="Status">' + (sub ? badge('Submitted', 'b-ok') : badge('In progress', 'b-info')) + '</td><td data-l="When" class="muted">' + (sub ? fmtDT(a.submitted_at) : 'Started ' + ago(a.started_at)) + '</td>' +
      '<td class="t-actions"><button class="btn btn-danger-soft btn-xs" data-act="resetAtt" data-id="' + a.id + '">' + ic('refresh', 'i-sm') + 'Reset attempt</button></td></tr>';
  }).join('') || '<tr><td colspan="7">' + empty('quiz', 'No quiz attempts yet', 'Results appear here as learners complete module quizzes.') + '</td></tr>';
  var cnt = $('#resCount'); if (cnt) cnt.textContent = plural(list.length, 'attempt');
}
route('admin-results', 'admin', 'admin', function (sec) {
  adminView(sec, function () {
    var A = S.admin, logs = A.audit.filter(function (a) { return a.action === 'reset_quiz_attempt'; }), m = amap();
    var logRows = logs.map(function (l) { var u = m.users[l.target_user_id]; return '<tr><td data-l="When" class="muted">' + fmtDT(l.at) + '</td><td data-l="Admin" class="td-strong">' + esc(l.actor_name) + '</td><td data-l="Learner">' + esc(u ? u.name : '—') + '</td><td data-l="Quiz" class="small">' + esc(l.target) + '</td><td data-l="Reason" class="small">' + esc(l.reason) + '</td></tr>'; }).join('');
    sec.innerHTML = pageHead('Assessments', 'Quiz results', 'Review scores and reset a learner\'s single attempt when needed.', '<button class="btn btn-outline" data-act="exportResults">' + ic('download', 'i-sm') + 'Export CSV</button>') +
      '<div class="panel-flat" style="padding:0"><div class="filter-bar"><div class="input-wrap">' + ic('search', 'i-left') + '<input class="input" data-in="resQ" placeholder="Search learners…" value="' + esc(S.ui.resQ || '') + '"></div>' +
      '<select class="select" data-ch="resCo"><option value="all">All courses</option>' + A.courses.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('') + '</select>' +
      '<select class="select" data-ch="resSt"><option value="all">All statuses</option><option value="submitted">Submitted</option><option value="in_progress">In progress</option></select><span class="small muted" id="resCount"></span></div>' +
      '<div class="table-wrap cards-m"><table class="table"><thead><tr><th>Learner</th><th>Quiz</th><th>Score</th><th>Correct</th><th>Status</th><th>When</th><th></th></tr></thead><tbody id="resBody"></tbody></table></div></div>' +
      '<div class="panel mt-24"><div class="panel-head"><div><h3 class="bar-title">Reset log</h3><p class="small muted mt-8">Every reset is recorded with the administrator and the reason.</p></div></div>' +
      (logRows ? '<div class="table-wrap cards-m"><table class="table"><thead><tr><th>When</th><th>Admin</th><th>Learner</th><th>Quiz</th><th>Reason</th></tr></thead><tbody>' + logRows + '</tbody></table></div>' : empty('shield', 'No resets yet', 'Attempt resets will be listed here for accountability.')) + '</div>';
    $('[data-ch=resCo]', sec).value = S.ui.resCourse || 'all'; $('[data-ch=resSt]', sec).value = S.ui.resStatus || 'all'; paintResults();
  });
});
INP.resQ = debounce(function (el) { S.ui.resQ = el.value; paintResults(); }, 80);
CHG.resCo = function (el) { S.ui.resCourse = el.value; paintResults(); };
CHG.resSt = function (el) { S.ui.resStatus = el.value; paintResults(); };
ACT.exportResults = function () {
  var m = amap(), rows = [['Learner', 'Email', 'Course', 'Quiz', 'Score %', 'Correct', 'Total', 'Status', 'Submitted']];
  resultRows().forEach(function (a) { var u = m.users[a.user_id], c = m.courses[a.course_id] || {}, q = m.quizzes[a.quiz_id] || {}; rows.push([u.name, u.email, c.title, q.title, a.status === 'submitted' ? a.score : '', a.correct_count, a.total, a.status, a.submitted_at ? new Date(a.submitted_at).toISOString() : '']); });
  downloadCSV('quiz-results.csv', rows);
};
ACT.resetAtt = function (el) {
  var A = S.admin, m = amap(), a = A.attempts.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!a) return;
  var u = m.users[a.user_id], q = m.quizzes[a.quiz_id] || { title: 'quiz' };
  openModal({ title: 'Reset quiz attempt', icon: 'refresh', tone: 'err', size: 'sm', body: '<div class="callout callout-warn small mb-16">' + ic('alert') + '<div>This permanently deletes <b>' + esc(u.name) + '</b>’s attempt for “' + esc(q.title) + '”' + (a.status === 'submitted' ? ' (score ' + a.score + '%)' : '') + '. They will be able to take the quiz again.</div></div>' +
    '<form data-form="resetAtt" data-id="' + a.id + '"><div class="field"><label>Reason <span class="req">*</span></label><textarea class="textarea" name="reason" style="min-height:90px" placeholder="e.g. Network failure during the quiz" required minlength="5"></textarea><span class="help">Recorded in the reset log with your name.</span></div></form>',
    foot: '<button class="btn btn-outline" data-act="closeModal">Cancel</button><button class="btn btn-danger" data-act="resetAttGo">Reset attempt</button>' });
};
ACT.resetAttGo = function (el) { var f = $('form[data-form=resetAtt]', el.closest('.modal')); FORM.resetAtt(f); };
FORM.resetAtt = function (f) {
  var reason = f.reason.value.trim(); if (reason.length < 5) return toast('Please write a reason (at least 5 characters).', 'warn');
  var A = S.admin, id = f.dataset.id, snap = clone(A), a = A.attempts.filter(function (x) { return x.id === id; })[0];
  var qz = amap().quizzes[a.quiz_id] || {};
  A.attempts = A.attempts.filter(function (x) { return x.id !== id; });
  A.audit.unshift({ id: uid(), at: Date.now(), actor_id: S.me.id, actor_name: S.me.name, action: 'reset_quiz_attempt', target_user_id: a.user_id, target: (qz.title || '') + ' (score ' + (a.score == null ? '-' : a.score) + ')', reason: reason });
  persistAdmin(); closeModal(); rerender(); toast('Attempt reset. The learner can retake the quiz.', 'ok');
  bg(call('resetQuizAttempt', S.token, id, reason), function () { S.admin = snap; persistAdmin(); rerender(); }, 'Could not reset the attempt.');
};

/* ── Sertifikat (admin) ── */
function certRows() {
  var A = S.admin, m = amap(), q = (S.ui.certQ || '').toLowerCase();
  return A.certificates.filter(function (c) { return !q || (c.learner_name + ' ' + c.course_title + ' ' + c.cert_number).toLowerCase().indexOf(q) > -1; }).sort(function (a, b) { return b.issued_at - a.issued_at; });
}
function paintCerts() {
  var b = $('#certBody'); if (!b) return; var list = certRows();
  b.innerHTML = list.map(function (c) {
    return '<tr><td data-l="Learner"><div class="person">' + avatar(c.learner_name) + '<div><b>' + esc(c.learner_name) + '</b></div></div></td><td data-l="Course" class="td-strong">' + esc(c.course_title) + '</td><td data-l="Number" class="mono">' + esc(c.cert_number) + '</td>' +
      '<td data-l="Score">' + badge(c.final_score + '%', 'b-ok') + '</td><td data-l="Issued" class="muted">' + fmtDate(c.issued_at) + '</td><td data-l="Status">' + (c.status === 'revoked' ? badge('Revoked', 'b-err') : badge('Valid', 'b-ok')) + '</td>' +
      '<td class="t-actions"><button class="btn btn-soft btn-xs" data-act="certView" data-num="' + esc(c.cert_number) + '">' + ic('eye', 'i-sm') + 'View</button><button class="icon-btn" style="width:30px;height:30px" data-act="copy" data-v="' + esc(verifyUrl(c.cert_number)) + '" aria-label="Copy verification link" title="Copy verification link">' + ic('link', 'i-sm') + '</button></td></tr>';
  }).join('') || '<tr><td colspan="7">' + empty('award', 'No certificates yet', 'Certificates are issued automatically when a learner completes a course.') + '</td></tr>';
}
route('admin-certs', 'admin', 'admin', function (sec) {
  adminView(sec, function () {
    sec.innerHTML = pageHead('Issued', 'Certificates', 'Certificates are issued automatically and can be verified publicly.', '<button class="btn btn-outline" data-act="exportCerts">' + ic('download', 'i-sm') + 'Export CSV</button>') +
      '<div class="panel-flat" style="padding:0"><div class="filter-bar"><div class="input-wrap">' + ic('search', 'i-left') + '<input class="input" data-in="certQ" placeholder="Search by learner, course or number…" value="' + esc(S.ui.certQ || '') + '"></div></div>' +
      '<div class="table-wrap cards-m"><table class="table"><thead><tr><th>Learner</th><th>Course</th><th>Number</th><th>Score</th><th>Issued</th><th>Status</th><th></th></tr></thead><tbody id="certBody"></tbody></table></div></div>';
    paintCerts();
  });
});
INP.certQ = debounce(function (el) { S.ui.certQ = el.value; paintCerts(); }, 80);
ACT.exportCerts = function () { var rows = [['Learner', 'Course', 'Certificate number', 'Final score %', 'Issued', 'Status']]; certRows().forEach(function (c) { rows.push([c.learner_name, c.course_title, c.cert_number, c.final_score, new Date(c.issued_at).toISOString(), c.status]); }); downloadCSV('certificates.csv', rows); };
ACT.certView = function (el) {
  var num = el.dataset.num, c = S.admin.certificates.filter(function (x) { return x.cert_number === num; })[0]; if (!c) return;
  var s = S.admin.settings, base = S.certAssets[num] || { cert: c, signer_name: s.signer_name, signer_title: s.signer_title, signature_data: s.signature_data, logo_data: s.logo_data, brand_name: s.brand_name, primary_color: s.primary_color };
  var m = openModal({ title: c.course_title, sub: c.learner_name + ' · ' + c.cert_number, icon: 'award', size: 'lg', body: '<div id="admCertBox">' + certHtml(base) + '</div>', foot: '<button class="btn btn-outline" data-act="closeModal">Close</button><button class="btn btn-primary" data-act="copy" data-v="' + esc(verifyUrl(num)) + '">' + ic('link', 'i-sm') + 'Copy verification link</button>' });
  certQr($('#admCertBox'));
  if (!S.certAssets[num]) call('getCertificateData', S.token, num).then(function (a) { S.certAssets[num] = a; var b = $('#admCertBox'); if (b) { b.innerHTML = certHtml(a); certQr(b); } }).catch(function () { /* tampil data lokal */ });
};

/* ── Pengaturan (super admin) ── */
var ST = null;
var SETTING_KEYS = ['brand_name', 'logo_data', 'primary_color', 'hero_badge', 'hero_headline', 'hero_highlight', 'hero_subheadline', 'admin_email', 'public_url', 'signer_name', 'signer_title', 'signature_data', 'footer_text'];
var SWATCHES = ['#6C3CE9', '#2F6BFF', '#E34BA9', '#0EA472', '#F97316', '#0F172A'];
route('admin-settings', 'admin', 'admin', function (sec) {
  adminView(sec, function () {
    if (!isSuper()) { sec.innerHTML = pageHead('Brand & access', 'Settings', '', '') + '<div class="callout callout-warn">' + ic('lock') + '<div><b>Super admin only.</b> Ask a super admin to change brand, signer or access settings.</div></div>'; return; }
    ST = clone(S.admin.settings); ST._dirty = false;
    var f = function (label, key, o) { o = o || {}; return '<div class="field' + (o.full ? ' full' : '') + '"><label>' + label + '</label>' + (o.area ? '<textarea class="textarea" style="min-height:76px" data-in="setf" data-p="' + key + '">' + esc(ST[key]) + '</textarea>' : '<input class="input" type="' + (o.type || 'text') + '" data-in="setf" data-p="' + key + '" placeholder="' + esc(o.ph || '') + '" value="' + esc(ST[key]) + '">') + (o.help ? '<span class="help">' + o.help + '</span>' : '') + '</div>'; };
    sec.innerHTML = pageHead('Brand & access', 'Settings', 'Everything here updates your site instantly — name, logo, colours, landing text and certificate signer.', '') +
      '<div class="split" style="grid-template-columns:minmax(0,1fr) 400px"><div class="stack gap-24">' +
      '<div class="panel"><div class="panel-head"><h3 class="bar-title">Brand identity</h3></div><div class="form-grid">' + f('Brand name', 'brand_name', { full: 1 }) +
      '<div class="field full"><label>Logo</label><div class="row gap-16"><div class="img-prev" id="logoPrev"></div><div class="stack gap-8"><label class="btn btn-soft btn-sm" style="cursor:pointer">' + ic('upload', 'i-sm') + 'Upload logo<input type="file" accept="image/*" hidden data-ch="setImg" data-k="logo_data"></label><button class="btn btn-ghost btn-sm" data-act="setImgDel" data-k="logo_data">Remove</button><span class="help">Square PNG works best. It is resized automatically.</span></div></div></div>' +
      '<div class="field full"><label>Primary colour</label><div class="row row-wrap gap-16"><div class="color-in"><input type="color" id="colorPick" data-in="setColor" value="' + esc(ST.primary_color) + '"><input type="text" id="colorHex" data-in="setColor" value="' + esc(ST.primary_color) + '" maxlength="7"></div><div class="swatches" id="swatches"></div></div></div></div></div>' +
      '<div class="panel"><div class="panel-head"><h3 class="bar-title">Landing page</h3></div><div class="form-grid">' + f('Badge text', 'hero_badge') + f('Footer text', 'footer_text') + f('Headline', 'hero_headline') + f('Highlighted word', 'hero_highlight') + f('Sub-headline', 'hero_subheadline', { full: 1, area: 1 }) + '</div></div>' +
      '<div class="panel"><div class="panel-head"><h3 class="bar-title">Contact & links</h3></div><div class="form-grid">' + f('Admin contact email', 'admin_email', { type: 'email', ph: 'admin@example.com', help: 'Enrollment requests open an email to this address.' }) +
      f('Public site URL', 'public_url', { ph: 'https://yourblog.blogspot.com/p/learn.html', help: 'Used in password-reset emails and certificate QR codes (your Blogger page or web app link).' }) + '</div></div>' +
      '<div class="panel"><div class="panel-head"><h3 class="bar-title">Certificate signer</h3></div><div class="form-grid">' + f('Signer name', 'signer_name') + f('Signer title', 'signer_title') +
      '<div class="field full"><label>Signature image</label><div class="row gap-16" style="align-items:flex-start"><div class="sig-prev" id="sigPrev" style="max-width:260px"></div><div class="stack gap-8"><label class="btn btn-soft btn-sm" style="cursor:pointer">' + ic('upload', 'i-sm') + 'Upload signature<input type="file" accept="image/*" hidden data-ch="setImg" data-k="signature_data"></label><button class="btn btn-ghost btn-sm" data-act="setImgDel" data-k="signature_data">Remove</button><span class="help">PNG with transparent background looks best.</span></div></div></div></div></div></div>' +
      '<aside class="sticky"><div class="panel"><div class="panel-head"><h3 class="bar-title" style="font-size:17px">Live preview</h3></div><div class="preview-frame" id="setPrev"></div></div></aside></div>' +
      '<div class="sticky-bar"><span class="small muted grow" id="setState">All changes saved</span><button class="btn btn-outline" data-act="setReset">Reset</button><button class="btn btn-primary" data-act="setSave">' + ic('check', 'i-sm') + 'Save changes</button></div>';
    paintSettingsBits();
  });
});
function paintSettingsBits() {
  var lp = $('#logoPrev'), sp = $('#sigPrev'); if (!lp) return;
  lp.innerHTML = ST.logo_data ? '<img src="' + esc(ST.logo_data) + '" alt="Logo">' : ic('image', 'i-xl');
  sp.innerHTML = ST.signature_data ? '<img src="' + esc(ST.signature_data) + '" alt="Signature">' : '<span class="muted small">No signature</span>';
  $('#swatches').innerHTML = SWATCHES.map(function (c) { return '<button class="swatch' + (ST.primary_color.toLowerCase() === c.toLowerCase() ? ' on' : '') + '" style="background:' + c + '" data-act="setSwatch" data-c="' + c + '" aria-label="Use ' + c + '"></button>'; }).join('');
  paintPreview();
}
function paintPreview() {
  var b = $('#setPrev'); if (!b) return; var c = /^#[0-9a-f]{6}$/i.test(ST.primary_color) ? ST.primary_color : '#6C3CE9', rgb = hex2rgb(c);
  var demo = { cert: { learner_name: 'Alex Morgan', course_title: 'Sample Course Title', final_score: 92, issued_at: Date.now(), cert_number: 'CERT-DEMO-2026-AB12C' }, signer_name: ST.signer_name, signer_title: ST.signer_title, signature_data: ST.signature_data, logo_data: ST.logo_data, brand_name: ST.brand_name || 'Lumina Learn', primary_color: c };
  b.innerHTML = '<div style="--p:' + c + ';--p-rgb:' + rgb.join(', ') + ';--p-dark:' + shade(c, -.28) + ';background:var(--bg)"><div class="row between" style="padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--border)"><span class="brand" style="font-size:15px">' + brandMark(ST.logo_data) + esc(ST.brand_name || 'Lumina Learn') + '</span><span class="btn btn-primary btn-xs">Sign up</span></div>' +
    '<div style="padding:18px 16px"><span class="pill" style="height:22px;font-size:10px">' + esc(ST.hero_badge) + '</span><div style="font:800 22px/1.15 var(--font-h);margin:10px 0 6px;letter-spacing:-.02em">' + esc(ST.hero_headline) + ' <span style="color:var(--p)">' + esc(ST.hero_highlight) + '</span></div><p class="small muted clamp-2">' + esc(ST.hero_subheadline) + '</p><span class="btn btn-primary btn-sm mt-12">Explore Courses</span></div>' +
    '<div style="padding:0 16px 16px;pointer-events:none">' + certHtml(demo) + '</div></div>';
}
INP.setf = function (el) { ST[el.dataset.p] = el.value; ST._dirty = true; var s = $('#setState'); if (s) s.textContent = 'Unsaved changes'; if (/brand_name|hero_|signer_/.test(el.dataset.p)) paintPreview(); };
INP.setColor = function (el) {
  var v = el.value.trim(); if (el.id === 'colorHex' && !/^#[0-9a-f]{6}$/i.test(v)) return;
  ST.primary_color = v; $('#colorPick').value = v; if (el.id === 'colorPick') $('#colorHex').value = v; ST._dirty = true; paintSettingsBits();
  var s = $('#setState'); if (s) s.textContent = 'Unsaved changes';
};
ACT.setSwatch = function (el) { ST.primary_color = el.dataset.c; $('#colorPick').value = el.dataset.c; $('#colorHex').value = el.dataset.c; ST._dirty = true; paintSettingsBits(); var s = $('#setState'); if (s) s.textContent = 'Unsaved changes'; };
function imgToDataUrl(file, maxW, maxH) {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onerror = function () { rej(new Error('Could not read the file.')); };
    fr.onload = function () {
      var im = new Image(); im.onerror = function () { rej(new Error('That file is not a valid image.')); };
      im.onload = function () {
        var sc = Math.min(1, maxW / im.width, maxH / im.height), out = '', tries = 0;
        do {
          var w = Math.max(16, Math.round(im.width * sc)), h = Math.max(16, Math.round(im.height * sc)), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(im, 0, 0, w, h); out = cv.toDataURL('image/png'); if (out.length > 46000) { var wp = cv.toDataURL('image/webp', .85); if (wp.indexOf('data:image/webp') === 0 && wp.length < out.length) out = wp; }
          sc *= .75; tries++;
        } while (out.length > 46000 && tries < 6);
        out.length > 46000 ? rej(new Error('Image is too complex. Please use a simpler or smaller file.')) : res(out);
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
CHG.setImg = function (el) {
  var file = el.files[0], k = el.dataset.k; if (!file) return;
  var dims = k === 'logo_data' ? [256, 256] : [420, 160];
  imgToDataUrl(file, dims[0], dims[1]).then(function (url) {
    ST[k] = url; ST._dirty = true; paintSettingsBits(); var s = $('#setState'); if (s) s.textContent = 'Unsaved changes'; el.value = '';
  }).catch(function (e) { toast(e.message, 'err'); el.value = ''; });
};
ACT.setImgDel = function (el) { ST[el.dataset.k] = ''; ST._dirty = true; paintSettingsBits(); var s = $('#setState'); if (s) s.textContent = 'Unsaved changes'; };
ACT.setReset = function () { ST = clone(S.admin.settings); ST._dirty = false; rerender(); toast('Changes discarded.', 'info'); };
ACT.setSave = function (el) {
  if (!/^#[0-9a-f]{6}$/i.test(ST.primary_color)) return toast('Primary colour must be a hex value like #6C3CE9.', 'warn');
  if (ST.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ST.admin_email)) return toast('The admin contact email is not valid.', 'warn');
  if (!ST.brand_name.trim()) return toast('Please enter a brand name.', 'warn');
  var body = {}; SETTING_KEYS.forEach(function (k) { body[k] = ST[k]; });
  var prevPub = clone(S.pub.settings), prevAdm = clone(S.admin.settings);
  S.admin.settings = Object.assign({}, S.admin.settings, body);                                   // optimistik: brand langsung berubah
  S.pub.settings = Object.assign({}, S.pub.settings, body); delete S.pub.settings.signature_data;
  LS.set('ll_pub', S.pub); persistAdmin(); applyBrand(); renderChrome(); ST._dirty = false; var s = $('#setState'); if (s) s.textContent = 'All changes saved';
  toast('Settings saved — your site is updated.', 'ok');
  call('saveSettings', S.token, body).then(function (cur) { S.admin.settings = cur; persistAdmin(); })
    .catch(function (e) {
      if (e.code === 'AUTH') return;
      S.pub.settings = prevPub; S.admin.settings = prevAdm; LS.set('ll_pub', S.pub); persistAdmin(); applyBrand(); renderChrome(); toast(e.message, 'err', 'Settings were not saved');
    });
};


/* ════════════════════════════════════════════════════════════
   BAGIAN 5 — BOOT: deep link, sinkronisasi latar belakang, mulai aplikasi
   ════════════════════════════════════════════════════════════ */
function hideSplash() { var sp = $('#splash'); if (sp) { sp.classList.add('out'); setTimeout(function () { sp.remove(); }, 260); } }
function splashError(msg) {
  var sp = $('#splash'); if (!sp) return;
  sp.innerHTML = '<div class="splash-box"><div class="state-icon" style="background:var(--err-soft,#FEE2E2);color:var(--err,#DC2626)">' + ic('alert', 'i-lg') + '</div><h2>We could not load the app</h2><p>' + esc(msg) + '</p><button class="btn btn-primary" data-act="splashRetry">Try again</button></div>';
}
ACT.splashRetry = function () { location.reload(); };
function startApp() {
  applyBrand();
  var d = S.deep || {};
  // Halaman awal: deep link (reset sandi / verifikasi QR) → atau beranda
  if (d.reset) go('reset', { token: d.reset }, { replace: true });
  else if (d.verify) go('verify', { num: d.verify }, { replace: true });
  else go('home', {}, { replace: true });
}
(function boot() {
  var afterStart = function () { if (S.token) syncMember(true); };   // sesi tersimpan: tampil instan dari cache lokal, lalu segarkan
  if (S.pubReady) { startApp(); hideSplash(); afterStart(); refreshPublic().then(function () { if (['home', 'catalog', 'course', 'paths'].indexOf(S.route.name) > -1) rerender(); }); }
  else if (!apiConfigured()) { splashError('The app is not connected to its server yet. Open js/config.js and set API_URL to your Apps Script Web App URL.'); return; }
  else loadPublic().then(function () { startApp(); hideSplash(); afterStart(); }).catch(function (e) { splashError(e.message); });

  // Sinkronisasi berkala saat tab aktif (agar persetujuan enrollment muncul otomatis)
  var last = Date.now();
  setInterval(function () {
    if (document.hidden || !S.token || modalStack.length) return;
    if (S.route.name === 'quiz') return;
    if (Date.now() - last < 90000) return; last = Date.now();
    if (S.route.name.indexOf('admin') === 0 && isAdminUser()) { if (FORM_ROUTES.indexOf(S.route.name) < 0) ensureAdmin().then(function () { if (FORM_ROUTES.indexOf(S.route.name) < 0 && !modalStack.length) rerender(); }).catch(function () {}); }
    else syncMember(true);
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && S.token && Date.now() - last > 60000 && S.route.name !== 'quiz') { last = Date.now(); if (S.route.name.indexOf('admin') !== 0) syncMember(true); }
  });
})();

})();
