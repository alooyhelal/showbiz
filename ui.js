/* ui.js (v41): واجهة مشتركة للصفحة الرئيسية وصفحة السلة.
   يعتمد على متغيرات الصفحة نفسها: state, save, cartLines, selLines, subtotalUSD, discountUSD,
   shippingCalc, shipLocal, localPrice, fmt, COUNTRIES, COUPONS, selectedAddr, variantLabel. */
(function () {
  "use strict";

  // ===== إعدادات قابلة للتعديل =====
  // حد التوصيل المجاني لكل دولة موجود في COUNTRIES[..].free (بالعملة المحلية)
  var CFG = {
    tier: null,           // مستوى خصم بالكمية. معطّل، ولا يطبّق أي خصم تلقائي
    days: { ar: "التوصيل خلال 2–4 أيام عمل", en: "Delivery in 2–4 working days" }
  };

  var L = {
    ar: {
      cart: "السلة", close: "إغلاق", keep: "متابعة التسوق", checkout: "إتمام الطلب", empty: "سلتك فارغة حالياً",
      all: "الكل", selHint: "المنتجات غير المحددة تبقى في السلة ولا تنحذف",
      remaining: "باقي {x} للتوصيل المجاني", freeDone: "وصلت للتوصيل المجاني",
      freeMsg: "مبروك، شحنك مجاني لهذا الطلب", freeIn: "التوصيل المجاني",
      tierLeft: "باقي {x} لمستوى الخصم", tierDone: "وصلت لمستوى الخصم",
      wish: "حفظ في المفضلة", remove: "حذف", addCart: "إضافة للسلة", details: "التفاصيل", coupon: "عندي كود خصم", apply: "تطبيق", couponBad: "الكود غير صحيح",
      productsVal: "قيمة المنتجات", discount: "الخصم", shipping: "الشحن",
      shipLater: "يُحسب بعد اختيار العنوان", grand: "الإجمالي",
      shipInfo: "رسوم التوصيل تُحسب حسب الوزن والدولة",
      suggest: "مقترحة لك", recent: "شاهدتها مؤخراً", add: "إضافة", lowStock: "باقي قطعة وحدة",
      mayLike: "منتجات قد تعجبك", bhd: "د.ب", choose: "اختر اللون والمقاس", fromPrice: "يبدأ من"
    },
    en: {
      cart: "Cart", close: "Close", keep: "Keep shopping", checkout: "Checkout", empty: "Your cart is empty",
      all: "All", selHint: "Unselected items stay in your cart",
      remaining: "{x} more for free delivery", freeDone: "You reached free delivery",
      freeMsg: "Congrats, your shipping is free on this order", freeIn: "Free delivery",
      tierLeft: "{x} more to reach the next tier", tierDone: "You reached the next tier",
      wish: "Save to wishlist", remove: "Remove", addCart: "Add to cart", details: "Details", coupon: "Have a discount code?", apply: "Apply", couponBad: "Invalid code",
      productsVal: "Products", discount: "Discount", shipping: "Shipping",
      shipLater: "Calculated after choosing an address", grand: "Total",
      shipInfo: "Delivery fee depends on weight and country",
      suggest: "Suggested for you", recent: "Recently viewed", add: "Add", lowStock: "Only 1 left",
      mayLike: "You may also like", bhd: "BD", choose: "Choose color and size", fromPrice: "From"
    }
  };

  function st() { return typeof state !== "undefined" ? state : { lang: "ar", cart: [], unsel: [] }; }
  function lang() { return st().lang === "en" ? "en" : "ar"; }
  function tr(k) { return L[lang()][k]; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k]; }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function emit() { try { document.dispatchEvent(new CustomEvent("cartchange")); } catch (e) {} }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // اسم المنتج حسب اللغة المختارة (إذا ما فيه اسم عربي يرجع للإنجليزي)
  function pName(p) { return (lang() === "ar" && p.nameAr) ? p.nameAr : (p.nameEn || ""); }
  function pDesc(p) { return (lang() === "ar" && p.descAr) ? p.descAr : (p.descEn || ""); }

  // ===== التوصيل المجاني: حد لكل دولة بالعملة المحلية =====
  function country() { return COUNTRIES[st().country] || COUNTRIES.BH; }
  function localSub() { return localPrice(subtotalUSD() - discountUSD()); }
  function isFree() { return selLines().length > 0 && localSub() >= country().free; }
  function freeLeft() { return Math.max(0, country().free - localSub()); }

  // ===== لقطة السلة (نفس شكل showbiz_cart_snap) =====
  function readSnap() { return jget("showbiz_cart_snap", []); }
  function writeSnap(arr) { jset("showbiz_cart_snap", arr); }
  function entryOf(p, v) {
    return {
      vid: v.vid,
      p: { pid: String(p.pid), nameEn: p.nameEn, nameAr: p.nameAr || "", image: p.image, weightG: p.weightG, dimsCm: p.dimsCm, categoryName: p.categoryName || null, stock: p.stock == null ? null : p.stock, choose: !!p.choose },
      v: { vid: v.vid, key: v.key, keyAr: v.keyAr || "", sku: v.sku, price: v.price, image: v.image, weightG: v.weightG, dimsCm: v.dimsCm }
    };
  }
  var catCache = null;
  var firstNum = function (v) { var n = parseFloat(String(v == null ? "" : v).split("-")[0]); return isNaN(n) ? null : n; };
  function rawEntry(p) {
    var pid = p.pid != null ? p.pid : (p.productId != null ? p.productId : p.id);
    if (pid == null) return null;
    var image = p.image || p.bigImage || "";
    var vs = Array.isArray(p.variants) ? p.variants.filter(function (v) { return v && v.vid && !isNaN(Number(v.price)); }) : [];
    vs.sort(function (a, b) { return Number(a.price) - Number(b.price); });
    var v0 = vs[0];
    var price = v0 ? Number(v0.price) : firstNum(p.sellPrice != null ? p.sellPrice : p.price);
    if (price === null || isNaN(price)) return null;
    var vid = v0 ? v0.vid : (p.vid || ("base-" + pid));
    var weightG = p.weightG || firstNum(p.weight);
    var dimsCm = p.dimsCm || null;
    return entryOf({ pid: pid, nameEn: p.nameEn || p.name || "", nameAr: p.nameAr || "", choose: !!p.choose, image: image, weightG: weightG, dimsCm: dimsCm, categoryName: typeof p.categoryName === "string" ? p.categoryName : null, stock: p.stock },
      { vid: vid, key: v0 ? (v0.key || "") : "", keyAr: v0 ? (v0.keyAr || "") : "", sku: v0 ? v0.sku : p.sku, price: price, image: (v0 && v0.image) || image, weightG: v0 ? v0.weightG : weightG, dimsCm: v0 ? v0.dimsCm : dimsCm });
  }
  // قائمة المقترحات من الكتالوج الوهمي (مرحلة التجربة: بدون أي جلب من الـ API)
  function catalogDemo() {
    if (catCache) return Promise.resolve(catCache);
    var list = (window.SHOWBIZ_DEMO && window.SHOWBIZ_DEMO.products) || [];
    catCache = list.map(rawEntry).filter(Boolean);
    return Promise.resolve(catCache);
  }
  function catalog(url) {
    if (catCache) return Promise.resolve(catCache);
    return fetch(url + "?action=list", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var list = Array.isArray(d) ? d : (d.products || d.items || d.list || (d.data && (d.data.content || d.data.list || d.data.products)) || d.data || []);
        catCache = (Array.isArray(list) ? list : []).map(rawEntry).filter(Boolean);
        return catCache;
      })
      .catch(function () { return []; });
  }
  function recentList() { return jget("showbiz_recent", []); }
  function pushRecent(entry) {
    var r = recentList().filter(function (x) { return x.p.pid !== entry.p.pid; });
    r.unshift(entry);
    jset("showbiz_recent", r.slice(0, 8));
  }
  function searches() { return jget("showbiz_searches", []); }
  function pushSearch(q) {
    q = String(q || "").trim();
    if (!q) return;
    var s = searches().filter(function (x) { return x !== q; });
    s.unshift(q);
    jset("showbiz_searches", s.slice(0, 5));
  }
  // المفضلة: قائمة لقطات منتجات {pid, nameEn, image, vid, price, key, ...}
  function wishList() { return jget("showbiz_wish", []); }
  function wishedPids() { return wishList().map(function (x) { return String(x.p ? x.p.pid : x.pid); }); }
  function toggleWish(pid, entry) {
    var w = wishList(), id = String(pid);
    var k = w.findIndex(function (x) { return String(x.p ? x.p.pid : x.pid) === id; });
    if (k >= 0) w.splice(k, 1);
    else {
      var e = entry || findEntryByPid(id);
      w.push(e || { p: { pid: id, nameEn: "", nameAr: "", image: "" }, v: { vid: "", price: 0 }, vid: "" });
    }
    jset("showbiz_wish", w);
    emit();
  }
  function findEntryByPid(pid) {
    var pools = [catCache || [], recentList(), readSnap(), wishList()];
    for (var i = 0; i < pools.length; i++) {
      var f = pools[i].find(function (x) { return String(x.p.pid) === String(pid); });
      if (f) return f;
    }
    return null;
  }
  function findEntry(vid) {
    var pools = [catCache || [], recentList(), readSnap()];
    for (var i = 0; i < pools.length; i++) {
      var f = pools[i].find(function (x) { return x.vid === vid; });
      if (f) return f;
    }
    return null;
  }
  function inCart(vid) { return st().cart.some(function (x) { return x.vid === vid; }); }
  function addEntry(entry, qty) {
    var snap = readSnap().filter(function (x) { return x.vid !== entry.vid; });
    snap.push(entry);
    writeSnap(snap);
    var s = st(), i = s.cart.find(function (x) { return x.vid === entry.vid; });
    if (i) i.qty = Math.min(99, i.qty + (qty || 1)); else s.cart.push({ vid: entry.vid, qty: qty || 1 });
    save();
    flash(lang() === "en" ? "Added to cart" : "تمت الإضافة للسلة");
    emit();
  }
  // رسالة تأكيد صغيرة تختفي بعد لحظات
  function flash(msg) {
    var d = document.createElement("div");
    d.className = "ui-toast";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 1600);
  }

  // ===== تغييرات السلة =====
  function setQty(vid, d) {
    var s = st(), i = s.cart.find(function (x) { return x.vid === vid; });
    if (!i) return;
    i.qty = Math.min(99, Math.max(0, i.qty + d));
    if (i.qty <= 0) s.cart = s.cart.filter(function (x) { return x.vid !== vid; });
    save(); emit();
    if (openState) maybeCelebrate();
  }
  function removeLine(vid) {
    var s = st();
    s.cart = s.cart.filter(function (x) { return x.vid !== vid; });
    s.unsel = (s.unsel || []).filter(function (x) { return x !== vid; });
    save(); emit();
  }
  function toggleSel(vid) {
    var s = st(); s.unsel = s.unsel || [];
    var k = s.unsel.indexOf(vid);
    if (k >= 0) s.unsel.splice(k, 1); else s.unsel.push(vid);
    save(); emit();
  }
  function selectAll(on) {
    var s = st();
    s.unsel = on ? [] : s.cart.map(function (x) { return x.vid; });
    save(); emit();
  }

  // ===== شريط التوصيل المجاني والإعلان المتحرك =====
  function progressHTML() {
    var c = country(), have = localSub(), need = c.free, left = need - have;
    var pct = Math.min(100, Math.max(0, (have / need) * 100));
    var html = '<div class="ui-bar"><div class="ui-msg">' + (left > 0 ? fill(tr("remaining"), { x: fmt(left) }) : tr("freeMsg")) +
      '</div><div class="ui-track"><span style="width:' + pct.toFixed(1) + '%"></span></div></div>';
    if (CFG.tier) {
      var b = (subtotalUSD() - discountUSD()) * RATE_BHD;
      var l2 = CFG.tier.minBHD - b;
      var p2 = Math.min(100, Math.max(0, (b / CFG.tier.minBHD) * 100));
      html += '<div class="ui-bar"><div class="ui-msg">' + (l2 > 0 ? fill(tr("tierLeft"), { x: l2.toFixed(3) }) : tr("tierDone")) +
        '</div><div class="ui-track"><span style="width:' + p2.toFixed(1) + '%"></span></div></div>';
    }
    return html;
  }
  // نص الإعلان يتغير حسب الدولة المختارة (بعملتها)
  function announceText() {
    var c = country();
    return lang() === "en" ? "Free delivery over " + c.sym.en + " " + c.free : "توصيل مجاني فوق " + c.free + " " + c.sym.ar;
  }
  // الإعلان يظهر مرة وحدة ويتحرك بشكل مستمر من اليمين لليسار
  function announceHTML() { return '<span class="mq">' + esc(announceText()) + '</span>'; }
  // يحسب مسافة الحركة من عرض الشريط وطول النص: يدخل من اليمين، يخرج كامل من اليسار، ثم يعيد البداية بدون فراغ طويل
  function runAnnounce() {
    var box = document.getElementById("announce");
    if (!box) return;
    var m = box.querySelector(".mq");
    if (!m) return;
    var W = box.clientWidth, T = m.offsetWidth;
    m.setAttribute("dir", lang() === "en" ? "ltr" : "rtl");
    m.style.setProperty("--mqw", W + "px");
    m.style.setProperty("--mqt", T + "px");
    m.style.animationDuration = ((W + T) / 70).toFixed(2) + "s";
  }
  window.addEventListener("resize", function () { runAnnounce(); });

  // ===== احتفال صغير عند الوصول للتوصيل المجاني =====
  var lastFree = null;
  function celebrate() {
    if (document.getElementById("confetti") || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    var box = document.createElement("div");
    box.id = "confetti"; box.className = "ui-conf";
    var colors = ["#f59e4b", "#5b9cff", "#7ee2a8", "#ffffff", "#ffb4bf"];
    for (var i = 0; i < 26; i++) {
      var p = document.createElement("i");
      var ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 120;
      p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--dy", (Math.sin(ang) * dist + 80) + "px");
      p.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.15) + "s";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 1600);
  }
  // يقارن حالة التوصيل المجاني مع آخر مرة، ويحتفل فقط عند الانتقال من "غير مجاني" إلى "مجاني"
  function syncFree() {
    var f = isFree();
    if (lastFree === null) {
      var prev = null;
      try { prev = sessionStorage.getItem("showbiz_free"); } catch (e) {}
      lastFree = prev === "1" ? true : (prev === "0" ? false : f);
    }
    if (!f) { try { sessionStorage.removeItem("showbiz_celebrated"); } catch (e) {} }
    lastFree = f;
    try { sessionStorage.setItem("showbiz_free", f ? "1" : "0"); } catch (e) {}
  }
  // الاحتفال يطلع عند فتح السلة الجانبية (أو تغيير الكمية داخلها) إذا الطلب محقق للتوصيل المجاني
  function maybeCelebrate() {
    if (!isFree()) return;
    var done = null;
    try { done = sessionStorage.getItem("showbiz_celebrated"); } catch (e) {}
    if (done === "1") return;
    celebrate();
    try { sessionStorage.setItem("showbiz_celebrated", "1"); } catch (e) {}
  }
  function trustHTML() { return ""; }

  // ===== بطاقات مصغّرة وشرائط أفقية =====
  function miniHTML(e) {
    var low = e.p.stock != null && Number(e.p.stock) === 1;
    var pid = esc(e.p.pid);
    return '<div class="ui-mini"><div class="ui-mini-img" data-ui="details" data-pid="' + pid + '"><img src="' + esc(e.v.image || e.p.image) + '" alt=""></div>' +
      '<div class="ui-mini-n">' + esc(pName(e.p)) + '</div>' +
      '<div class="ui-mini-p">' + (e.p.choose ? tr("fromPrice") + " " : "") + fmt(localPrice(e.v.price)) + '</div>' +
      (low ? '<div class="ui-low">' + tr("lowStock") + '</div>' : '') +
      '<button class="ui-add-full" data-ui="addSug" data-vid="' + esc(e.vid) + '" data-pid="' + pid + '">' + tr("addCart") + '</button>' +
      '<button class="ui-det" data-ui="details" data-pid="' + pid + '">' + tr("details") + '</button></div>';
  }
  // المنتجات اللي تحتاج اختيار خيارات ما تنضاف من السلة مباشرة
  function addable(list) { return list.filter(function (e) { return !e.p.choose && !inCart(e.vid); }); }
  function blockHTML(title, entries) {
    return '<h4 class="ui-h">' + esc(title) + '</h4><div class="ui-grid">' + entries.map(miniHTML).join("") + '</div>';
  }
  function recentBlock() {
    var r = addable(recentList());
    return r.length ? blockHTML(tr("recent"), r.slice(0, 8)) : "";
  }
  function suggestBlock(entries) {
    var list = addable(entries).slice(0, 8);
    return list.length ? blockHTML(tr("suggest"), list) : "";
  }
  // صف أفقي يتسحب: منتجات قد تعجبك في صفحة السلة
  function suggestRow(entries) {
    var list = entries.filter(function (e) { return !inCart(e.vid); }).slice(0, 10);
    if (!list.length) return "";
    return '<h4 class="ui-h">' + esc(tr("mayLike")) + '</h4><div class="ui-hrow">' + list.map(miniHTML).join("") + '</div>';
  }
  function lookHTML(entries) { return ""; }

  // إزالة من المفضلة: صورة المنتج تطير من أيقونة المفضلة في الهيدر إلى مكان الزر اللي ضغطته
  function wishRemoveFx(el, cb) {
    var fav = document.getElementById("favBtn");
    var line = el && el.closest ? el.closest(".sd-line") : null;
    var im = line ? line.querySelector("img") : null;
    if (window.__sbFly && fav && im) window.__sbFly(fav, im.src, el, cb); else cb();
  }
  // ===== فتح التفاصيل (نافذة الخيارات) =====
  var detailsHandler = null;
  function setDetailsHandler(fn) { detailsHandler = fn; }
  function openDetails(pid) {
    if (openState) close();
    if (detailsHandler) { detailsHandler(String(pid)); return; }
    location.href = "index.html?open=" + encodeURIComponent(String(pid));
  }

  // ===== السلة الجانبية =====
  var openState = false, folded = {}, mode = "cart";
  function ensureDom() {
    if (document.getElementById("sd")) return;
    var ov = document.createElement("div");
    ov.id = "sdOv"; ov.className = "sd-ov hidden";
    ov.addEventListener("click", close);
    document.body.appendChild(ov);
    var a = document.createElement("aside");
    a.id = "sd"; a.className = "sd hidden"; a.setAttribute("role", "dialog");
    a.innerHTML = '<div class="sd-head" id="sdHead"></div><div class="sd-body" id="sdBody"></div><div class="sd-foot" id="sdFoot"></div>';
    document.body.appendChild(a);
  }
  function show(on) {
    document.getElementById("sdOv").classList.toggle("hidden", !on);
    document.getElementById("sd").classList.toggle("hidden", !on);
  }
  // المود: "cart" للسلة، أو "wish" للمفضلة
  function open(m) { ensureDom(); mode = m === "wish" ? "wish" : "cart"; openState = true; drawRender(); show(true); if (mode === "cart") maybeCelebrate(); }
  function close() { openState = false; if (document.getElementById("sd")) show(false); }

  function heartSVG() { return ShowbizCore.icon("heart"); }
  function trashSVG() { return ShowbizCore.icon("trash"); }

  function lineHTML(l) {
    var on = (st().unsel || []).indexOf(l.vid) < 0;
    var wished = wishedPids().indexOf(String(l.p.pid)) >= 0;
    return '<div class="sd-line">' +
      '<input type="checkbox" class="sd-chk" data-ui="sel" data-vid="' + esc(l.vid) + '" ' + (on ? "checked" : "") + '>' +
      '<img src="' + esc(l.v.image || l.p.image) + '" alt="">' +
      '<div class="sd-info"><div class="sd-name">' + esc(pName(l.p)) + '</div>' +
      (l.v.key ? '<div class="sd-var">' + esc(variantLabel(l.v)) + '</div>' : '') +
      '<div class="sd-price">' + fmt(localPrice(l.v.price)) + '</div>' +
      '<div class="sd-days">' + CFG.days[lang()] + '</div>' +
      '<div class="sd-ctl">' +
        '<span class="sd-qty"><button data-ui="dec" data-vid="' + esc(l.vid) + '" aria-label="−">−</button><span>' + l.qty + '</span><button data-ui="inc" data-vid="' + esc(l.vid) + '" aria-label="+">+</button></span>' +
        '<button class="sd-ic sd-heart ' + (wished ? "on" : "") + '" data-ui="wish" data-pid="' + esc(l.p.pid) + '" aria-label="' + tr("wish") + '">' + heartSVG() + '</button>' +
        '<button class="sd-ic" data-ui="rm" data-vid="' + esc(l.vid) + '" aria-label="' + tr("remove") + '">' + trashSVG() + '</button>' +
      '</div></div></div>';
  }
  // كود الخصم: صندوق مرتب قابل للطي
  function couponHTML() {
    var s = st();
    if (s.coupon) return '<div class="sd-coupon sd-coupon-on"><span>' + esc(s.coupon) + '</span><button class="sd-ic" data-ui="removeCoupon" aria-label="' + tr("remove") + '">' + trashSVG() + '</button></div>';
    var isOpen = !!folded.coupon;
    return '<div class="sd-coupon">' +
      '<button class="sd-fold" data-ui="fold" data-k="coupon"><span>% ' + tr("coupon") + '</span><span>' + (isOpen ? "▴" : "▾") + '</span></button>' +
      (isOpen ? '<div class="sd-cpn"><input id="sdCpn" placeholder="' + esc(tr("coupon")) + '"><button data-ui="apply">' + tr("apply") + '</button></div><p id="sdCpnMsg" class="sd-hint"></p>' : '') +
      '</div>';
  }
  function totalsValue() {
    var sub = localPrice(subtotalUSD()), disc = localPrice(discountUSD());
    var free = isFree();
    var ship = free ? 0 : (selectedAddr() ? shipLocal(shippingCalc().shipBHD) : null);
    return { sub: sub, disc: disc, ship: ship, free: free, total: sub - disc + (ship || 0) };
  }
  function totalsHTML() {
    var v = totalsValue();
    var rows = '<div class="sd-row"><span>' + tr("productsVal") + '</span><span>' + fmt(v.sub) + '</span></div>';
    if (v.disc > 0) rows += '<div class="sd-row"><span>' + tr("discount") + '</span><span>- ' + fmt(v.disc) + '</span></div>';
    if (v.free) {
      rows += '<div class="sd-row sd-ok"><span>' + tr("shipping") + '</span><span>' + tr("freeMsg") + '</span></div>';
    } else {
      rows += '<div class="sd-row"><span>' + tr("shipping") + '</span><span class="sd-muted">' +
        (v.ship === null ? tr("shipLater") : fmt(v.ship)) + '</span></div>';
    }
    rows += '<div class="sd-row sd-total"><strong>' + tr("grand") + '</strong><strong>' + fmt(v.total) + '</strong></div>';
    if (!v.free) rows += '<p class="sd-hint">' + tr("shipInfo") + '</p>';
    return '<div class="sd-totals">' + rows + '</div>';
  }
  function wishHTML() {
    var w = wishList();
    var head = '<strong>' + (lang() === "en" ? "Wishlist" : "المفضلة") + ' · ' + w.length + '</strong>' +
      '<button class="sd-x" data-ui="close" aria-label="' + tr("close") + '">✕</button>';
    document.getElementById("sdHead").innerHTML = head;
    var body = w.length
      ? w.map(function (e) {
          var pidE = esc(e.p.pid);
          return '<div class="sd-line"><img src="' + esc(e.v.image || e.p.image) + '" alt="">' +
            '<div class="sd-info"><div class="sd-name">' + esc(pName(e.p)) + '</div>' +
            '<div class="sd-price">' + (e.v.price ? fmt(localPrice(e.v.price)) : "") + '</div>' +
            '<div class="sd-ctl sd-ctl-wide">' +
              '<button class="sd-addc-full" data-ui="addSug" data-vid="' + esc(e.v.vid) + '" data-pid="' + pidE + '">' + tr("addCart") + '</button>' +
              '<button class="sd-ic" data-ui="wish" data-pid="' + esc(e.p.pid) + '" aria-label="' + tr("remove") + '">' + trashSVG() + '</button>' +
            '</div></div></div>';
        }).join("")
      : '<p class="sd-empty">' + (lang() === "en" ? "No saved products yet" : "ما حفظت منتجات بعد") + '</p>';
    document.getElementById("sdBody").innerHTML = body;
    document.getElementById("sdFoot").innerHTML = "";
  }

  function drawRender() {
    if (!openState || !document.getElementById("sd")) return;
    if (mode === "wish") { wishHTML(); return; }
    var s = st(), lines = cartLines(), sel = s.unsel || [];
    var n = lines.reduce(function (a, l) { return a + l.qty; }, 0);
    document.getElementById("sdHead").innerHTML =
      '<strong>' + tr("cart") + ' · ' + n + '</strong>' +
      '<button class="sd-link" data-ui="close">' + tr("keep") + '</button>' +
      '<button class="sd-x" data-ui="close" aria-label="' + tr("close") + '">✕</button>';
    var body, foot = "";
    if (!lines.length) {
      body = '<p class="sd-empty">' + tr("empty") + '</p>' + recentBlock();
    } else {
      var allOn = lines.every(function (l) { return sel.indexOf(l.vid) < 0; });
      var selCount = lines.filter(function (l) { return sel.indexOf(l.vid) < 0; }).length;
      body = progressHTML() +
        '<label class="sd-all"><input type="checkbox" data-ui="selAll" ' + (allOn ? "checked" : "") + '> ' + tr("all") + ' (' + lines.length + ')</label>' +
        '<p class="sd-hint">' + tr("selHint") + '</p>' +
        lines.map(lineHTML).join("") + couponHTML() + totalsHTML();
      var tv = totalsValue();
      foot = '<div class="sd-tot"><span class="sd-hint">' + tr("grand") + '</span><strong>' + fmt(tv.total) + '</strong></div>' +
        '<a class="sd-go' + (selCount ? "" : " dis") + '" href="cart.html">' + tr("checkout") + '</a>';
    }
    document.getElementById("sdBody").innerHTML = body;
    document.getElementById("sdFoot").innerHTML = foot;
    syncFree();
  }

  function applyCoupon() {
    var inp = document.getElementById("sdCpn");
    var code = ((inp && inp.value) || "").trim().toUpperCase();
    if (typeof COUPONS !== "undefined" && COUPONS[code]) { st().coupon = code; save(); emit(); return; }
    var m = document.getElementById("sdCpnMsg");
    if (m) m.textContent = tr("couponBad");
  }

  // ===== الأحداث المشتركة =====
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-ui]");
    if (!el || el.tagName === "INPUT") return;
    var a = el.dataset.ui, vid = el.dataset.vid;
    if (a === "close") { close(); return; }
    if (a === "inc") { setQty(vid, 1); return; }
    if (a === "dec") { setQty(vid, -1); return; }
    if (a === "rm") { ShowbizCore.confirmDel("product", function () { removeLine(vid); }); return; }
    if (a === "wish") {
      var pidW = el.dataset.pid;
      if (wishedPids().indexOf(String(pidW)) >= 0) ShowbizCore.confirmDel("wish", function () { wishRemoveFx(el, function () { toggleWish(pidW); }); });
      else toggleWish(pidW);
      return;
    }
    if (a === "fold") { folded[el.dataset.k] = !folded[el.dataset.k]; drawRender(); return; }
    if (a === "apply") { applyCoupon(); return; }
    if (a === "removeCoupon") { st().coupon = null; save(); emit(); return; }
    if (a === "details") { openDetails(el.dataset.pid); return; }
    if (a === "addSug") {
      var en = findEntry(vid);
      if (en && en.p.choose) { openDetails(en.p.pid); return; }
      if (en) addEntry(en, 1);
      return;
    }
  });
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (!el || !el.dataset || !el.dataset.ui) return;
    if (el.dataset.ui === "sel") toggleSel(el.dataset.vid);
    if (el.dataset.ui === "selAll") {
      var s = st(), unselected = (s.unsel || []).length > 0;
      selectAll(unselected);
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  document.addEventListener("cartchange", drawRender);

  // ===== الأنماط =====
  var CSS = [
    ".hidden{display:none !important}",
    ".sd-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40}",
    ".sd{position:fixed;top:0;bottom:0;inset-inline-end:0;width:50%;min-width:min(300px,100%);max-width:100%;background:#0f1a2e;border-inline-start:1px solid #26334d;z-index:41;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.6);color:#eef2f7;font-size:14px}",
    ".sd.hidden{display:none}",
    ".sd input[type=checkbox], .sd-chk { width:auto; padding:0; margin:0; flex:0 0 auto; accent-color:#f59e4b; }",
    ".sd-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #26334d}",
    ".sd-head strong{flex:1}",
    ".sd-body{flex:1;overflow:auto;padding:12px 16px}",
    ".sd-foot{border-top:1px solid #26334d;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#0d1728}",
    ".sd-tot{display:flex;flex-direction:column}",
    ".sd-go{background:#f59e4b;color:#111;padding:12px 18px;border-radius:12px;font-weight:800;text-decoration:none}",
    ".sd-go.dis{opacity:.4;pointer-events:none}",
    ".sd-x,.sd-ic,.sd-link{border:1px solid #26334d;background:transparent;color:#eef2f7;border-radius:10px;padding:4px 10px;font:inherit;cursor:pointer}",
    ".sd-link{border:0;color:#f59e4b;text-decoration:underline;padding:4px}",
    ".sd-ic{width:34px;height:34px;padding:0;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}",
    ".sd-ic .ico{width:17px;height:17px}",
    ".sd-heart svg{stroke:#eef2f7}",
    ".sd-heart.on svg{fill:#e5484d;stroke:#e5484d}",
    ".sd-coupon{background:#162033;border:1px dashed #3a4a68;border-radius:14px;padding:10px 12px;margin:12px 0}",
    ".sd-coupon-on{display:flex;justify-content:space-between;align-items:center;gap:8px;border-style:solid;border-color:#2f6b4f;color:#7ee2a8}",
    ".sd-fold{display:flex;width:100%;justify-content:space-between;align-items:center;background:transparent;border:0;color:#eef2f7;font:inherit;font-weight:700;padding:4px 0;cursor:pointer}",
    ".sd-cpn{display:flex;gap:8px;margin:10px 0 4px}",
    ".sd-cpn input{flex:1;min-width:0;padding:9px 10px;border-radius:10px;border:1px solid #26334d;background:#1d2a44;color:#eef2f7;font:inherit}",
    ".sd-cpn button{background:#f59e4b;color:#111;border:0;border-radius:10px;padding:0 14px;font-weight:700;font:inherit;cursor:pointer}",
    ".sd-all{display:flex;gap:8px;align-items:center;font-weight:700;margin:10px 0 2px}",
    ".sd-hint{color:#9aa7bd;font-size:12px;line-height:1.6;margin:4px 0}",
    ".sd-line{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #26334d}",
    ".sd-chk{margin-top:4px;accent-color:#f59e4b}",
    ".sd-line img{width:60px;height:60px;object-fit:cover;border-radius:10px;background:#1d2a44;flex-shrink:0}",
    ".sd-info{flex:1;min-width:0}",
    ".sd-name{font-weight:700;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}",
    ".sd-var,.sd-days,.sd-muted{color:#9aa7bd;font-size:12px}",
    ".sd-price{color:#f59e4b;font-weight:700;margin-top:2px}",
    ".sd-ctl{display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:8px;flex-wrap:nowrap}",
    ".sd-qty{display:inline-flex;align-items:center;gap:0;border:1px solid #26334d;border-radius:10px;overflow:hidden;height:34px}",
    ".sd-qty button{width:32px;height:100%;padding:0;border:0;background:transparent;color:#eef2f7;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}",
    ".sd-qty span{min-width:28px;text-align:center;font-weight:700}",
    ".sd-totals .sd-row,.sd-row{display:flex;justify-content:space-between;gap:8px;padding:5px 0}",
    ".sd-ok{color:#7ee2a8;font-weight:700}",
    ".sd-total{border-top:1px solid #26334d;margin-top:6px;padding-top:10px;font-size:16px}",
    ".sd-empty{text-align:center;color:#9aa7bd;padding:20px 0}",
    ".ui-bar{background:#162033;border:1px solid #26334d;border-radius:14px;padding:10px 12px;margin-bottom:10px}",
    ".ui-msg{font-size:13px;margin-bottom:6px}",
    ".ui-track{height:6px;background:#26334d;border-radius:99px;overflow:hidden}",
    ".ui-track span{display:block;height:100%;background:#f59e4b;border-radius:99px;transition:width .5s ease}",
    ".ui-h{margin:16px 0 8px;color:#9aa7bd;font-size:14px;font-weight:700}",
    ".ui-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px}",
    ".ui-hrow{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}",
    ".ui-hrow::-webkit-scrollbar{display:none}",
    ".ui-hrow .ui-mini{flex:0 0 138px}",
    ".ui-mini{min-width:0;background:#162033;border:1px solid #26334d;border-radius:14px;padding:8px}",
    ".ui-mini img{width:100%;height:110px;object-fit:cover;border-radius:10px;background:#1d2a44}",
    ".ui-mini-n{font-size:13px;line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}",
    ".ui-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#162033;color:#7ee2a8;border:1px solid #2f6b4f;padding:12px 20px;border-radius:14px;font-weight:700;z-index:70;box-shadow:0 10px 30px rgba(0,0,0,.5);max-width:90vw;text-align:center}",
    ".ui-mini-p{color:#f59e4b;font-weight:700;font-size:13px}",
    ".ui-low{color:#ff8593;font-size:12px}",
    ".ui-add{width:100%;margin-top:6px;padding:6px;border-radius:9px;border:1px solid #26334d;background:transparent;color:#eef2f7;font:inherit;font-size:12px;cursor:pointer}",
    ".ui-conf{position:fixed;left:50%;top:40%;width:0;height:0;z-index:80;pointer-events:none}",
    ".ui-conf i{position:absolute;left:0;top:0;width:9px;height:14px;border-radius:2px;animation:ui-burst 1.3s cubic-bezier(.15,.7,.3,1) forwards}",
    "@keyframes ui-burst{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}",
    "@media (prefers-reduced-motion: reduce){.ui-conf{display:none}}"
  ].join("\n");
  // أنماط الهيدر المشترك (الصفحة الرئيسية وصفحة السلة)
  CSS += "\n" + "/* ===== v37: هيدر جديد، شبكة بدون سكرول يمين ويسار، أسماء بسطرين ===== */\n.hd { position:sticky; top:0; z-index:5; background:rgba(13,23,40,.97); border-bottom:1px solid var(--line); padding:10px 16px; }\n.hd-row { display:flex; align-items:center; gap:10px; max-width:1200px; margin:0 auto; flex-wrap:wrap; }\n.hd-acts { display:flex; align-items:center; gap:4px; margin-inline-start:auto; }\n.logo { font-weight:800; font-size:20px; color:var(--orange); text-decoration:none; white-space:nowrap; }\n.searchbox { position:relative; flex:1; min-width:0; }\n.searchbox input { margin:0; border-radius:999px; padding:10px 14px 10px 40px; height:42px; }\nhtml[dir=rtl] .searchbox input { padding:10px 40px 10px 14px; }\n.s-ico { position:absolute; top:50%; inset-inline-start:14px; transform:translateY(-50%); color:var(--muted); pointer-events:none; display:inline-flex; z-index:1; }\n.s-ico .ico { width:18px; height:18px; }\n.ic-btn { position:relative; width:42px; height:42px; display:inline-flex; align-items:center; justify-content:center; background:transparent; color:var(--fg); border:0; border-radius:12px; padding:0; flex-shrink:0; }\n.ic-btn:hover { background:var(--card2); }\n.ic-btn .ico { width:22px; height:22px; }\n.cartn { position:absolute; top:-6px; inset-inline-end:-6px; min-width:18px; height:18px; border-radius:999px; background:var(--orange); color:#111; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; padding:0 4px; }\n.cartn[hidden] { display:none !important; }\n.pref-btn { padding:9px 12px; border-radius:999px; border:1px solid var(--line); background:var(--card); color:var(--fg); font-size:13px; font-weight:700; white-space:nowrap; cursor:pointer; font-family:inherit; }\n.hd-row2 { display:flex; gap:8px; align-items:center; margin-top:10px; max-width:1200px; margin-inline:auto; flex-wrap:wrap; }\n.hd-row2 select { width:auto; margin:0; }\n.menubtn { display:none; }\n@media (max-width:700px) {\n  .hd { padding:8px 10px; }\n  .menubtn { display:inline-flex; }\n  .catdd { display:none; }\n  .logo { font-size:18px; }\n  .hd-acts { gap:0; }\n  .ic-btn { width:38px; height:38px; }\n  .pref-btn { padding:7px 9px; font-size:12px; }\n}\n.heartbtn { position:absolute; top:10px; inset-inline-end:10px; z-index:2; width:36px; height:36px; border-radius:50%; border:0; background:rgba(255,255,255,.92); color:#333; display:inline-flex; align-items:center; justify-content:center; padding:0; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.15); }\n.heartbtn .ico { width:18px; height:18px; }\n.heartbtn.on { color:#e5484d; }\n.heartbtn.on svg { fill:#e5484d; }\n.pref-lbl { font-size:13px; color:var(--muted); margin:14px 0 8px; }\n.pref-langs { display:flex; gap:8px; }\n.pref-langs button { flex:1; }\n.pref-langs button.on { border-color:var(--orange); color:var(--orange); }\n.pref-list { display:flex; flex-direction:column; gap:6px; max-height:52vh; overflow-y:auto; }\n.pref-item { display:flex; justify-content:space-between; align-items:center; gap:10px; width:100%; text-align:start; background:transparent; color:var(--fg); border:1px solid var(--line); border-radius:12px; padding:11px 12px; font-weight:400; font-family:inherit; }\n.pref-item strong { font-weight:700; color:var(--muted); font-size:13px; white-space:nowrap; }\n.pref-item.on { border-color:var(--orange); }\n.pimg { height:auto; aspect-ratio:1 / 1; }\n.pimg img { width:100%; height:100%; object-fit:cover; }\n.grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }\n@media (min-width:860px) { .grid { grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; } }\n.card { min-width:0; }\n.pbody { min-width:0; }\n.pname { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; min-height:3em; }\n.price { font-size:15px; }\n.hov button { padding:8px; font-size:12px; }\n";
  // أنماط مشتركة لصفحة السلة والمودالات (v41)
  CSS += "\n" + ".req-star{color:#ff5d6c}\n.ui-req::after{content:' *';color:#ff5d6c;font-weight:800}\n";
  // أنماط v42: شريط الإعلان، ترتيب الهيدر، بطاقات بأزرار ثابتة، إعلانات متعددة، كود الخصم
  CSS += "\n" + `/* ===== v43 ===== */
.card .heartbtn{width:30px;height:30px;top:8px;inset-inline-end:8px}
.card .heartbtn .ico{width:15px;height:15px}
.price .old{display:block;white-space:nowrap;font-size:13px;font-weight:400;color:var(--muted)}
.price .now{display:block;white-space:nowrap}
.ad-s[data-cat]{cursor:pointer}
.sd-addc{background:var(--orange,#f59e4b);color:#111;border-radius:8px;padding:6px 10px;font-weight:700}
.sd-line .sd-ctl{align-items:center;gap:8px}
/* ===== v29: بطاقات المقترحات، زر إضافة بسطر واحد، المفضلة ===== */
.ui-hrow .ui-mini{flex:0 0 150px}
.ui-mini{display:flex;flex-direction:column;gap:6px}
.ui-mini-img{display:block;cursor:pointer;border-radius:10px;overflow:hidden}
.ui-mini-img img{display:block}
.ui-mini .ui-add-full,.ui-mini .ui-det{display:block;width:100%;box-sizing:border-box;white-space:nowrap;font-size:13px;padding:8px 10px;border-radius:10px;text-align:center;font-family:inherit;cursor:pointer}
.ui-mini .ui-add-full{background:var(--orange,#f59e4b);color:#111;font-weight:700;border:0}
.ui-mini .ui-det{background:transparent;color:var(--fg,#eef2f7);border:1px solid #26334d;font-weight:400}
.sd-addc-full{flex:1 1 auto;width:100%;height:auto;min-height:36px;white-space:nowrap;padding:8px 12px;border-radius:10px;background:var(--orange,#f59e4b);color:#111;font-weight:700;font-size:14px;border:0;text-align:center;box-sizing:border-box;cursor:pointer;font-family:inherit}
.sd-ctl-wide{flex-wrap:wrap;width:100%}
.sd-ctl-wide .sd-ic{flex-shrink:0}
/* ===== v42 ===== */
.announce{direction:ltr;text-align:start;overflow:hidden;white-space:nowrap;position:relative;padding:7px 0}
.mq{display:block;width:max-content;position:relative;left:0;animation-name:mq2;animation-timing-function:linear;animation-iteration-count:infinite;will-change:transform;unicode-bidi:isolate}
@keyframes mq2{from{transform:translateX(var(--mqw,100vw))}to{transform:translateX(calc(-1 * var(--mqt,100%)))}}
#sortSel{flex:0 0 auto;width:118px;min-width:0;height:40px;margin:0;padding:0 26px 0 12px;appearance:none;-webkit-appearance:none;background-color:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:999px;font-size:12px;background-image:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 6%22%3E%3Cpath d=%22M1 1l4 4 4-4%22 fill=%22none%22 stroke=%22%239aa7bd%22 stroke-width=%221.6%22/%3E%3C/svg%3E");background-repeat:no-repeat;background-size:10px 6px;background-position:right 10px center}
html[dir=rtl] #sortSel{padding:0 12px 0 26px;background-position:left 10px center}
.hd-row2{gap:6px;flex-wrap:nowrap}
.searchbox{flex:1 1 0;min-width:0}
.card{display:flex;flex-direction:column}
.pbody{flex:1;display:flex;flex-direction:column}
.pbody .row2{margin-top:auto;padding-top:10px}
.price{min-height:1.5em}
.ad{background:none;border:0;padding:0;min-height:0;position:relative;margin:10px 0 4px}
.ad-s{position:relative;border-radius:18px;border:1px solid var(--line);padding:18px 52px 16px;min-height:138px;color:#fff;background:linear-gradient(125deg,#17264a 0%,#25396a 58%,#c96a2a 130%)}
.ad-s.v1{background:linear-gradient(125deg,#12343a 0%,#1f6b64 60%,#5fb89b 140%)}
.ad-s.v2{background:linear-gradient(125deg,#3a1a3a 0%,#7a2d5c 60%,#f59e4b 140%)}
.ad-s[hidden]{display:none}
.ad .ad-arr{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:30px;height:30px;min-height:0;margin:0;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,.28);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;cursor:pointer}
.ad .ad-arr:hover{background:rgba(0,0,0,.42)}
.ad .ad-arr.n{inset-inline-end:8px}
.ad .ad-arr.p{inset-inline-start:8px}
.ad .ad-arr[hidden]{display:none}
.ad-dots{display:flex;justify-content:center;gap:6px;margin:10px 0 2px}
.ad-dots .ad-dot{width:7px;height:7px;min-height:0;padding:0;margin:0;border:0;border-radius:999px;background:var(--dot);cursor:pointer}
.ad-dots .ad-dot.on{width:18px;background:var(--blue)}
.sd-coupon{padding:6px 10px;margin:8px 0}
.sd-fold{padding:2px 0;font-size:14px}
.sd-cpn{margin:6px 0 2px;gap:6px}
.sd-cpn input{padding:0 10px;height:34px;font-size:13px;border-radius:9px}
.sd-cpn button{height:34px;padding:0 12px;font-size:13px;border-radius:9px}
`;
  var styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  window.ShowbizUI = {
    cfg: CFG,
    tr: tr,
    pName: pName,
    pDesc: pDesc,
    isFree: isFree,
    freeLeft: freeLeft,
    syncFree: syncFree,
    open: open,
    close: close,
    wishedPids: wishedPids,
    findEntryByPid: findEntryByPid,
    entryOf: entryOf,
    pushRecent: pushRecent,
    recentList: recentList,
    pushSearch: pushSearch,
    searches: searches,
    catalog: catalog,
    catalogDemo: catalogDemo,
    findEntry: findEntry,
    addEntry: addEntry,
    inCart: inCart,
    wishList: wishList,
    toggleWish: toggleWish,
    setQty: setQty,
    removeLine: removeLine,
    toggleSel: toggleSel,
    selectAll: selectAll,
    progressHTML: progressHTML,
    trustHTML: trustHTML,
    announceText: announceText,
    announceHTML: announceHTML,
    runAnnounce: runAnnounce,
    miniHTML: miniHTML,
    recentBlock: recentBlock,
    suggestBlock: suggestBlock,
    suggestRow: suggestRow,
    lookHTML: lookHTML,
    openDetails: openDetails,
    setDetailsHandler: setDetailsHandler,
    emit: emit
  };
})();
