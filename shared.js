/* ملف مشترك لكل صفحات الموقع.
   - تصفير اللغة والدولة: عند تغيير النسخة، أو بعد ساعتين من دخول الموقع. السلة والعناوين والطلبات لا تنمسح.
   - انتهاء جلسة الحساب: بعد ساعتين من تسجيل الدخول يتم تسجيل الخروج من المتصفح.
   - العناوين تُقرأ وتُكتب في جدول addresses في Supabase، ويبقى نسخة محلية للعرض فقط. */
(function () {
  "use strict";

  var H2 = 2 * 60 * 60 * 1000;
  var LOGIN_KEY = "showbiz_login_at";
  var SITE_KEY = "showbiz_site_at";

  function readJSON(k, d) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; }
  }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // تصفير اختيار اللغة والدولة فقط (السلة تبقى)
  function resetSiteChoices() {
    var st = readJSON("showbiz_state", {});
    delete st.lang;
    delete st.country;
    st.seen = false;
    writeJSON("showbiz_state", st);
  }

  // ===== تشغيل أولي: عند تحميل أي صفحة =====
  try {
    var V = window.SHOWBIZ_BUILD && window.SHOWBIZ_BUILD.version;
    if (V && localStorage.getItem("showbiz_ver") !== V) {
      resetSiteChoices();
      localStorage.setItem("showbiz_ver", V);
    }
    var now = Date.now();
    var at = Number(localStorage.getItem(SITE_KEY)) || 0;
    if (!at) localStorage.setItem(SITE_KEY, String(now));
    else if (now - at > H2) { resetSiteChoices(); localStorage.setItem(SITE_KEY, String(now)); }
  } catch (e) {}

  // ===== الجلسة =====
  // يتحقق من عمر الجلسة. إذا تجاوزت ساعتين يسجل الخروج. يرجع true إذا الجلسة صالحة
  async function enforceLogin(sb) {
    var session = null;
    try { var r = await sb.auth.getSession(); session = r && r.data && r.data.session; } catch (e) {}
    if (!session) { try { localStorage.removeItem(LOGIN_KEY); } catch (e) {} return false; }
    var now = Date.now();
    var at = Number(localStorage.getItem(LOGIN_KEY)) || 0;
    if (!at) { localStorage.setItem(LOGIN_KEY, String(now)); return true; }
    if (now - at > H2) {
      try { await sb.auth.signOut({ scope: "local" }); } catch (e) {}
      try { localStorage.removeItem(LOGIN_KEY); } catch (e) {}
      return false;
    }
    return true;
  }
  function markLogin() { try { localStorage.setItem(LOGIN_KEY, String(Date.now())); } catch (e) {} }
  function clearLogin() { try { localStorage.removeItem(LOGIN_KEY); } catch (e) {} }

  // ===== العناوين (Supabase مع نسخة محلية للعرض) =====
  function cacheKey(uid) { return "showbiz_addr2_" + uid; }
  function cachedAddresses(uid) { return readJSON(cacheKey(uid), []); }
  function rowToAddr(r) {
    return { id: r.id, label: r.label, country: r.country, path: r.path || [], fields: r.fields || {}, phone: r.phone || "", recipient: r.recipient || "" };
  }
  function addrToRow(a, uid) {
    return { id: a.id, user_id: uid, label: a.label, country: a.country, path: a.path, fields: a.fields, phone: a.phone, recipient: a.recipient };
  }
  async function fetchAddresses(sb, uid) {
    try {
      var r = await sb.from("addresses").select("*").eq("user_id", uid).order("created_at", { ascending: true });
      if (r.error) throw r.error;
      var arr = (r.data || []).map(rowToAddr);
      writeJSON(cacheKey(uid), arr);
      return arr;
    } catch (e) {
      return cachedAddresses(uid);
    }
  }
  async function upsertAddress(sb, uid, a) {
    var r = await sb.from("addresses").upsert(addrToRow(a, uid));
    if (r.error) throw r.error;
    var arr = cachedAddresses(uid).filter(function (x) { return x.id !== a.id; });
    arr.push(a);
    writeJSON(cacheKey(uid), arr);
  }
  async function deleteAddress(sb, uid, id) {
    var r = await sb.from("addresses").delete().eq("id", id).eq("user_id", uid);
    if (r.error) throw r.error;
    writeJSON(cacheKey(uid), cachedAddresses(uid).filter(function (x) { return x.id !== id; }));
  }

  // الوجهة بعد الدخول أو إنشاء الحساب: إذا جاي من السلة نرجعه لخطوة العنوان مباشرة
  function nextUrl() {
    var n = null;
    try { n = localStorage.getItem("showbiz_next"); localStorage.removeItem("showbiz_next"); } catch (e) {}
    return (n === "cart" || n === "checkout") ? "cart.html#address" : "index.html";
  }

  window.ShowbizCore = {
    nextUrl: nextUrl,
    enforceLogin: enforceLogin,
    markLogin: markLogin,
    clearLogin: clearLogin,
    resetSiteChoices: resetSiteChoices,
    cachedAddresses: cachedAddresses,
    fetchAddresses: fetchAddresses,
    upsertAddress: upsertAddress,
    deleteAddress: deleteAddress
  };
})();
