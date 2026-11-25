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

  // ===== أيقونات خطية بسيطة (من تصميمنا، مو منسوخة) =====
  var ICONS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
    cart: '<path d="M3 4.5h2.2l2.3 11.2h10.4l2.1-7.6H6.6"/><circle cx="9.3" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 3 2.6 14 0 17M12 3.5c-2.6 3-2.6 14 0 17"/>',
    trash: '<path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"/>'
  };
  function icon(name, cls) {
    return '<svg class="ico ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }
  // أي عنصر فيه data-icon="اسم" يتعبّى بالأيقونة
  function fillIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      if (!el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));
    });
  }

  // ===== التذييل: يظهر في أسفل كل الصفحات =====
  // املأ القيم هنا وتظهر تلقائياً. الفارغ ما يظهر
  var CONTACT = { phone: "", whatsapp: "", hours: "", email: "" };
  var FT = {
    ar: { about: "متجر إلكتروني لمنتجات منزلية وإلكترونيات وأكثر.", links: "روابط", support: "دعم العملاء",
      pay: "طرق الدفع", home: "الصفحة الرئيسية", orders: "طلباتي", addr: "عناويني", acct: "حسابي", terms: "الشروط والأحكام",
      cod: "الدفع عند الاستلام", card: "بطاقة ائتمان", copy: "جميع الحقوق محفوظة" },
    en: { about: "An online store for home goods, electronics and more.", links: "Links", support: "Customer support",
      pay: "Payment methods", home: "Home", orders: "My orders", addr: "My addresses", acct: "My account", terms: "Terms and conditions",
      cod: "Cash on delivery", card: "Credit card", copy: "All rights reserved" }
  };
  function buildFooter(full) {
    var old = document.getElementById("siteFooter"); if (old) old.parentNode.removeChild(old);
    var s = readJSON("showbiz_state", {});
    var L = FT[s.lang === "en" ? "en" : "ar"];
    // التذييل الكامل في الصفحة الرئيسية فقط، وكل الباقي سطر حقوق واحد
    if (!full) {
      var line = document.createElement("p");
      line.id = "siteFooter"; line.className = "copyline";
      line.textContent = copyright(s.lang);
      document.body.appendChild(line);
      return;
    }
    var sup = [];
    if (CONTACT.phone) sup.push('<a dir="ltr" href="tel:' + CONTACT.phone + '">' + CONTACT.phone + "</a>");
    if (CONTACT.whatsapp) sup.push('<a href="https://wa.me/' + CONTACT.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>');
    if (CONTACT.email) sup.push('<a dir="ltr" href="mailto:' + CONTACT.email + '">' + CONTACT.email + "</a>");
    if (CONTACT.hours) sup.push("<span>" + CONTACT.hours + "</span>");
    var f = document.createElement("footer");
    f.id = "siteFooter"; f.className = "sfoot";
    f.innerHTML =
      '<div class="sfoot-in">' +
        '<div><strong class="sfoot-brand">Showbiz</strong><p>' + L.about + "</p></div>" +
        '<div><h5>' + L.links + '</h5><a href="index.html">' + L.home + '</a><a href="orders.html">' + L.orders + '</a><a href="addresses.html">' + L.addr + '</a><a href="account.html">' + L.acct + '</a><a href="terms.html">' + L.terms + "</a></div>" +
        '<div><h5>' + L.support + "</h5>" + (sup.length ? sup.join("") : "") + "</div>" +
        '<div><h5>' + L.pay + '</h5><span>Apple Pay</span><span>Benefit</span><span>' + L.cod + "</span><span>" + L.card + "</span></div>" +
        '<div class="sfoot-copy">© 2026 Showbiz · ' + L.copy + "</div>" +
      "</div>";
    document.body.appendChild(f);
  }
  function mountFooter() {
    if (document.getElementById("siteFooter")) return;
    // الكامل فقط في الصفحة الرئيسية (فيها حاوية المتجر)، وبقية الصفحات سطر الحقوق
    buildFooter(!!document.getElementById("shopBody") && !(document.body && document.body.hasAttribute("data-lite")));
  }
  // زر العودة للأعلى: شفاف في الزاوية، حلقته تمتلئ مع النزول وتكتمل عند النهاية
  function mountToTop() {
    if (document.getElementById("toTop")) return;
    var b = document.createElement("button");
    b.id = "toTop"; b.type = "button"; b.className = "totop";
    b.setAttribute("aria-label", "Back to top");
    b.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="trk" cx="24" cy="24" r="21" fill="none" stroke-width="3"/><circle class="prg" cx="24" cy="24" r="21" fill="none" stroke-width="3" stroke-linecap="round"/></svg><span class="arr">&#8593;</span>';
    if (document.querySelector(".stickyfoot, .build")) b.classList.add("lift");
    document.body.appendChild(b);
    var prg = b.querySelector(".prg"), C = 2 * Math.PI * 21;
    prg.style.strokeDasharray = C + "";
    var raf = 0;
    var upd = function () {
      raf = 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var r = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      prg.style.strokeDashoffset = C * (1 - r) + "";
      b.classList.toggle("on", window.scrollY > 200);
    };
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener("resize", upd);
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    upd();
  }

  document.addEventListener("DOMContentLoaded", function () { fillIcons(); mountFooter(); mountToTop(); });

  // ===== أنماط مشتركة: بدون سكرول يمين ويسار، وتذييل في كل الصفحات =====
  var SHARED_CSS = [
    "html{overflow-x:hidden}",
    "body{max-width:100%}",
    ".totop{position:fixed;inset-inline-end:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:19;width:46px;height:46px;border:0;padding:0;background:transparent;color:#f59e4b;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .25s;-webkit-tap-highlight-color:transparent}",
    ".totop.lift{bottom:calc(92px + env(safe-area-inset-bottom,0px))}",
    ".totop.on{opacity:1;pointer-events:auto}",
    ".totop svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}",
    ".totop .trk{stroke:rgba(128,128,128,.3)}",
    ".totop .prg{stroke:#f59e4b;transition:stroke-dashoffset .15s linear}",
    ".totop .arr{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;line-height:1}",
    "img{max-width:100%}",
    ".ico{width:20px;height:20px;display:inline-block;vertical-align:middle;flex-shrink:0}",
    ".sfoot{margin-top:40px;background:#070d18;border-top:1px solid #26334d;color:#9aa7bd;padding:28px 16px calc(40px + env(safe-area-inset-bottom,0px));font-size:13px;line-height:1.8}",
    ".sfoot-in{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}",
    ".sfoot h5{margin:0 0 8px;color:#eef2f7;font-size:14px}",
    ".sfoot a{display:block;color:#eef2f7;text-decoration:none;padding:2px 0}",
    ".sfoot span{display:block}",
    ".sfoot p{margin:0}",
    ".sfoot-brand{color:#f59e4b;font-size:18px}",
    ".sfoot-copy{grid-column:1/-1;text-align:center;border-top:1px solid #26334d;padding-top:14px;margin-top:4px}",
    "label.req::after{content:\" *\";color:#ff5d6c;font-weight:800}",
    ".copyline{text-align:center;color:#6b7a94;font-size:12px;margin:18px 0 0;padding:0 16px}",
    "@media (max-width:700px){.sfoot-in{grid-template-columns:1fr;gap:18px}}"
  ].join("\n");
  var sharedStyle = document.createElement("style");
  sharedStyle.textContent = SHARED_CSS;
  document.head.appendChild(sharedStyle);

  // سطر حقوق النشر الموحّد في كل الصفحات
  function copyright(lang) {
    return lang === "en" ? "© 2026 Showbiz · All rights reserved" : "© 2026 Showbiz · جميع الحقوق محفوظة";
  }
  // نافذة تأكيد الحذف: تنفذ الحذف فقط عند الضغط على "نعم"
  function confirmDel(kind, onYes) {
    var s = readJSON("showbiz_state", {});
    var en = s.lang === "en";
    if (!document.getElementById("sbConfCss")) {
      var st = document.createElement("style");
      st.id = "sbConfCss";
      st.textContent = ".sb-conf{position:fixed;inset:0;z-index:400;background:rgba(5,10,20,.6);display:flex;align-items:center;justify-content:center;padding:16px}" +
        ".sb-conf-box{background:#162033;color:#eef2f7;border:1px solid #26334d;border-radius:16px;padding:18px;width:min(92vw,360px)}" +
        ".sb-conf-box p{margin:0 0 16px;font-size:15px;line-height:1.7;text-align:center}" +
        ".sb-conf-btns{display:flex;gap:8px}" +
        ".sb-conf-btns button{flex:1;padding:11px;border-radius:10px;border:0;font:inherit;font-weight:700;cursor:pointer}" +
        ".sb-conf-no{background:transparent;color:#eef2f7;border:1px solid #3a4a68 !important}" +
        ".sb-conf-yes{background:#f59e4b;color:#111}";
      document.head.appendChild(st);
    }
    var msg = kind === "address" ? (en ? "Are you sure you want to delete this address?" : "هل أنت متأكد من حذف هذا العنوان؟")
      : kind === "wish" ? (en ? "Remove this from your wishlist?" : "هل أنت متأكد من حذفه من المفضلة؟")
      : (en ? "Are you sure you want to remove this product?" : "هل أنت متأكد من حذف هذا المنتج؟");
    var ov = document.createElement("div");
    ov.className = "sb-conf";
    ov.innerHTML = '<div class="sb-conf-box" role="dialog" aria-modal="true"><p></p><div class="sb-conf-btns">' +
      '<button class="sb-conf-no" type="button">' + (en ? "Cancel" : "إلغاء") + '</button>' +
      '<button class="sb-conf-yes" type="button">' + (en ? "Yes" : "نعم") + '</button></div></div>';
    ov.querySelector("p").textContent = msg;
    document.body.appendChild(ov);
    function close() { ov.remove(); }
    ov.querySelector(".sb-conf-no").addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".sb-conf-yes").addEventListener("click", function () { close(); onYes(); });
  }

  // ===== المظهر (داكن/فاتح) لكل صفحات الموقع =====
  // الداكن هو الأساسي: أول فتح للموقع أو ريفرش يرجع داكن. الاختيار يبقى عند التنقل بين الصفحات داخل نفس التبويب.
  // الفاتح: قلب الألوان على كامل الصفحة (فلتر)، والصور ترجع لألوانها الأصلية، فكل الصفحات تبقى متناسقة.
  var THEME_KEY = "showbiz_theme";
  var reduceMotionT = function () { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; };
  function navKind() {
    try { var e = performance.getEntriesByType("navigation")[0]; return e ? e.type : "navigate"; } catch (x) { return "navigate"; }
  }
  function storedMode() {
    try { return sessionStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"; } catch (x) { return "dark"; }
  }
  function themeNow() { return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  function applyThemeMode(m) {
    document.documentElement.setAttribute("data-theme", m);
    try { sessionStorage.setItem(THEME_KEY, m); } catch (x) {}
    try { document.dispatchEvent(new Event("sbthemechange")); } catch (x) {}
  }
  (function initTheme() {
    var st = document.createElement("style");
    st.id = "sbTheme";
    st.textContent =
      'html[data-theme="light"]{filter:invert(1) hue-rotate(180deg);background:#0b1220}' +
      'html[data-theme="light"] img,html[data-theme="light"] video{filter:invert(1) hue-rotate(180deg)}' +
      '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}' +
      ':root[data-vt="dark"]::view-transition-old(root){z-index:2}:root[data-vt="dark"]::view-transition-new(root){z-index:1}' +
      ':root[data-vt="light"]::view-transition-new(root){z-index:2}:root[data-vt="light"]::view-transition-old(root){z-index:1}';
    document.head.appendChild(st);
    applyThemeMode(navKind() === "reload" ? "dark" : storedMode());
  })();
  // انتقال المظهر: الفاتح يطلع من داخل زر الشمس وينتشر على الشاشة.
  // الداكن: الفاتح ينكمش من الأسفل إلى الأعلى ويدخل داخل زر القمر.
  function setTheme(next, fromEl) {
    var apply = function () { applyThemeMode(next); };
    var r = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : null;
    if (!document.startViewTransition || !r || reduceMotionT()) { apply(); return; }
    var root = document.documentElement;
    var W = window.innerWidth, H = window.innerHeight;
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
    var rtl = root.dir === "rtl" || document.dir === "rtl" || getComputedStyle(root).direction === "rtl";
    // الطبقة اللي تتحرك لازم تكون فوق: الانتشار للفاتح = الجديدة فوق، الانكماش للداكن = القديمة فوق
    root.setAttribute("data-vt", next);
    var vt = document.startViewTransition(apply);
    var cleanup = function () { root.removeAttribute("data-vt"); };
    vt.finished.then(cleanup, cleanup);
    vt.ready.then(function () {
      if (next === "light") {
        // الفاتح يطلع من داخل الشمس وينتشر على الشاشة
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + R + "px at " + x + "px " + y + "px)"] },
          { duration: 600, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" });
      } else {
        // الداكن: الفاتح ينكمش من الجانب (يسار بالعربي، يمين بالإنجليزي) ويدخل داخل القمر
        // الانكماش دائري مثل الانتشار: من الشاشة كاملة لنقطة زر القمر
        root.animate(
          { clipPath: ["circle(" + R + "px at " + x + "px " + y + "px)", "circle(0px at " + x + "px " + y + "px)"] },
          { duration: 600, easing: "ease-in-out", pseudoElement: "::view-transition-old(root)" });
      }
    }).catch(function () {});
  }

  // هيكل تحميل (Skeleton) يُستخدم في صفحات الحساب والطلبات والعناوين وحذف الحساب والسلة
  (function initSkeleton() {
    var st = document.createElement("style");
    st.id = "sbSkel";
    st.textContent =
      ".sk-b{background:linear-gradient(90deg,var(--card2,#1d2a44) 25%,var(--line,#26334d) 50%,var(--card2,#1d2a44) 75%);background-size:200% 100%;animation:sbSk 1.3s linear infinite;border-radius:10px}" +
      ".sk-title{height:26px;width:55%;margin:6px 0 14px}" +
      ".sk-line{height:12px;width:35%;margin:14px 0 8px}" +
      ".sk-input{height:44px;width:100%;margin-bottom:6px}" +
      ".sk-row{height:84px;width:100%;margin-bottom:10px;border-radius:16px}" +
      ".sk-panel{border:1px solid var(--line,#26334d);border-radius:16px;padding:14px;margin-bottom:12px;background:var(--card,#162033)}" +
      "@keyframes sbSk{from{background-position:200% 0}to{background-position:-200% 0}}" +
      "@media (prefers-reduced-motion:reduce){.sk-b{animation:none}}";
    document.head.appendChild(st);
  })();

  window.ShowbizCore = {
    setFooter: function (full) { buildFooter(!!full); },
    theme: themeNow,
    setTheme: setTheme,
    copyright: copyright,
    confirmDel: confirmDel,
    icon: icon,
    fillIcons: fillIcons,
    mountFooter: mountFooter,
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
