/* ui.js (v36): واجهة مشتركة للصفحة الرئيسية وصفحة السلة.
   يعتمد على متغيرات الصفحة نفسها: state, save, cartLines, subtotalUSD, discountUSD,
   shippingCalc, shipLocal, localPrice, fmt, RATE_BHD, COUPONS, selectedAddr, variantLabel. */
(function () {
  "use strict";

  // ===== إعدادات قابلة للتعديل =====
  var CFG = {
    freeShipBHD: 20,      // التوصيل مجاني إذا قيمة المنتجات بعد الخصم وصلت هذا المبلغ (د.ب). قيمة مبدئية، عدّلها
    tier: null,           // مستوى خصم بالكمية، مثال: { minBHD: 50 }. معطّل، ولا يطبّق أي خصم تلقائي
    announce: {
      ar: "التوصيل مجاني فوق 20 د.ب · الدفع عند الاستلام متاح",
      en: "Free delivery over BD 20 · Cash on delivery available"
    },
    days: { ar: "التوصيل خلال 2–4 أيام عمل", en: "Delivery in 2–4 working days" }
  };

  var L = {
    ar: {
      cart: "السلة", close: "إغلاق", keep: "متابعة التسوق", checkout: "إتمام الطلب", empty: "سلتك فارغة حالياً",
      all: "الكل", selHint: "المنتجات غير المحددة تبقى في السلة ولا تنحذف",
      remaining: "باقي {x} د.ب للتوصيل المجاني", freeDone: "التوصيل مجاني لطلبك",
      tierLeft: "باقي {x} د.ب لمستوى الخصم", tierDone: "وصلت لمستوى الخصم",
      wish: "حفظ في المفضلة", remove: "حذف", coupon: "عندي كود خصم", apply: "تطبيق", couponBad: "الكود غير صحيح",
      productsVal: "قيمة المنتجات", discount: "الخصم", shipping: "الشحن", free: "مجاني",
      shipLater: "يُحسب بعد اختيار العنوان", grand: "الإجمالي",
      shipInfo: "رسوم التوصيل تُحسب حسب الوزن والدولة",
      trust: ["دفع آمن", "توصيل لدول الخليج", "إرجاع حسب الشروط", "دعم العملاء"],
      suggest: "مقترحة لك", recent: "شاهدتها مؤخراً", add: "إضافة", lowStock: "باقي قطعة وحدة",
      completeLook: "أكمل الإطلالة", bhd: "د.ب"
    },
    en: {
      cart: "Cart", close: "Close", keep: "Keep shopping", checkout: "Checkout", empty: "Your cart is empty",
      all: "All", selHint: "Unselected items stay in your cart",
      remaining: "BD {x} more for free delivery", freeDone: "Free delivery on your order",
      tierLeft: "BD {x} more to reach the next tier", tierDone: "You reached the next tier",
      wish: "Save to wishlist", remove: "Remove", coupon: "Have a discount code?", apply: "Apply", couponBad: "Invalid code",
      productsVal: "Products", discount: "Discount", shipping: "Shipping", free: "Free",
      shipLater: "Calculated after choosing an address", grand: "Total",
      shipInfo: "Delivery fee depends on weight and country",
      trust: ["Secure payment", "Delivery across the Gulf", "Returns per terms", "Customer support"],
      suggest: "Suggested for you", recent: "Recently viewed", add: "Add", lowStock: "Only 1 left",
      completeLook: "Complete the look", bhd: "BD"
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

  // ===== لقطة السلة (نفس شكل showbiz_cart_snap) =====
  function readSnap() { return jget("showbiz_cart_snap", []); }
  function writeSnap(arr) { jset("showbiz_cart_snap", arr); }
  function entryOf(p, v) {
    return {
      vid: v.vid,
      p: { pid: String(p.pid), nameEn: p.nameEn, image: p.image, weightG: p.weightG, dimsCm: p.dimsCm, categoryName: p.categoryName || null, stock: p.stock == null ? null : p.stock },
      v: { vid: v.vid, key: v.key, sku: v.sku, price: v.price, image: v.image, weightG: v.weightG, dimsCm: v.dimsCm }
    };
  }
  var catCache = null;
  var firstNum = function (v) { var n = parseFloat(String(v == null ? "" : v).split("-")[0]); return isNaN(n) ? null : n; };
  function rawEntry(p) {
    var pid = p.pid != null ? p.pid : (p.productId != null ? p.productId : p.id);
    if (pid == null) return null;
    var image = p.image || p.bigImage || "";
    var vs = Array.isArray(p.variants) ? p.variants.filter(function (v) { return v && v.vid && !isNaN(Number(v.price)); }) : [];
    var v0 = vs[0];
    var price = v0 ? Number(v0.price) : firstNum(p.sellPrice != null ? p.sellPrice : p.price);
    if (price === null || isNaN(price)) return null;
    var vid = v0 ? v0.vid : (p.vid || ("base-" + pid));
    var weightG = p.weightG || firstNum(p.weight);
    var dimsCm = p.dimsCm || null;
    return entryOf({ pid: pid, nameEn: p.nameEn || p.name || "", image: image, weightG: weightG, dimsCm: dimsCm, categoryName: typeof p.categoryName === "string" ? p.categoryName : null, stock: p.stock },
      { vid: vid, key: v0 ? (v0.key || "") : "", sku: v0 ? v0.sku : p.sku, price: price, image: (v0 && v0.image) || image, weightG: v0 ? v0.weightG : weightG, dimsCm: v0 ? v0.dimsCm : dimsCm });
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
  function wishList() { return jget("showbiz_wish", []); }
  function toggleWish(pid) {
    var w = wishList(), k = w.indexOf(String(pid));
    if (k >= 0) w.splice(k, 1); else w.push(String(pid));
    jset("showbiz_wish", w);
    emit();
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
    emit();
  }

  // ===== تغييرات السلة =====
  function setQty(vid, d) {
    var s = st(), i = s.cart.find(function (x) { return x.vid === vid; });
    if (!i) return;
    i.qty = Math.min(99, Math.max(0, i.qty + d));
    if (i.qty <= 0) s.cart = s.cart.filter(function (x) { return x.vid !== vid; });
    save(); emit();
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

  // ===== أشرطة الشحن والعروض =====
  function totalBHD() { return (subtotalUSD() - discountUSD()) * RATE_BHD; }
  function progressHTML() {
    var b = totalBHD(), need = CFG.freeShipBHD, left = need - b;
    var pct = Math.min(100, Math.max(0, (b / need) * 100));
    var html = '<div class="ui-bar"><div class="ui-msg">' + (left > 0 ? fill(tr("remaining"), { x: left.toFixed(3) }) : tr("freeDone")) +
      '</div><div class="ui-track"><span style="width:' + pct.toFixed(1) + '%"></span></div></div>';
    if (CFG.tier) {
      var l2 = CFG.tier.minBHD - b;
      var p2 = Math.min(100, Math.max(0, (b / CFG.tier.minBHD) * 100));
      html += '<div class="ui-bar"><div class="ui-msg">' + (l2 > 0 ? fill(tr("tierLeft"), { x: l2.toFixed(3) }) : tr("tierDone")) +
        '</div><div class="ui-track"><span style="width:' + p2.toFixed(1) + '%"></span></div></div>';
    }
    return html;
  }
  function trustHTML() {
    return '<div class="ui-trust">' + tr("trust").map(function (x) { return "<div>" + esc(x) + "</div>"; }).join("") + "</div>";
  }
  function announceText() { return CFG.announce[lang()]; }

  // ===== بطاقات مصغّرة وشرائط أفقية =====
  function miniHTML(e) {
    var low = e.p.stock != null && Number(e.p.stock) === 1;
    return '<div class="ui-mini"><img src="' + esc(e.v.image || e.p.image) + '" alt="">' +
      '<div class="ui-mini-n">' + esc(e.p.nameEn) + '</div>' +
      '<div class="ui-mini-p">' + fmt(localPrice(e.v.price)) + '</div>' +
      (low ? '<div class="ui-low">' + tr("lowStock") + '</div>' : '') +
      '<button class="ui-add" data-ui="addSug" data-vid="' + esc(e.vid) + '">+ ' + tr("add") + '</button></div>';
  }
  function blockHTML(title, entries) {
    return '<h4 class="ui-h">' + esc(title) + '</h4><div class="ui-hscroll">' + entries.map(miniHTML).join("") + '</div>';
  }
  function recentBlock() {
    var r = recentList().filter(function (e) { return !inCart(e.vid); });
    return r.length ? blockHTML(tr("recent"), r.slice(0, 8)) : "";
  }
  function suggestBlock(entries) {
    var list = entries.filter(function (e) { return !inCart(e.vid); }).slice(0, 8);
    return list.length ? blockHTML(tr("suggest"), list) : "";
  }
  function lookHTML(entries) {
    var e = entries.filter(function (x) { return !inCart(x.vid); })[0];
    if (!e) return "";
    var low = e.p.stock != null && Number(e.p.stock) === 1;
    return '<div class="ui-look"><div class="ui-look-t">' + tr("completeLook") + '</div><div class="ui-look-row">' +
      '<img src="' + esc(e.v.image || e.p.image) + '" alt="">' +
      '<div class="ui-look-i"><div class="ui-mini-n">' + esc(e.p.nameEn) + '</div>' +
      '<div class="ui-mini-p">' + fmt(localPrice(e.v.price)) + '</div>' + (low ? '<div class="ui-low">' + tr("lowStock") + '</div>' : '') + '</div>' +
      '<button class="ui-add2" data-ui="addSug" data-vid="' + esc(e.vid) + '">+ ' + tr("add") + ' · ' + fmt(localPrice(e.v.price)) + '</button></div></div>';
  }

  // ===== السلة الجانبية =====
  var openState = false, folded = {};
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
  function open() { ensureDom(); openState = true; drawRender(); show(true); }
  function close() { openState = false; if (document.getElementById("sd")) show(false); }

  function lineHTML(l) {
    var on = (st().unsel || []).indexOf(l.vid) < 0;
    var wished = wishList().indexOf(String(l.p.pid)) >= 0;
    return '<div class="sd-line">' +
      '<input type="checkbox" class="sd-chk" data-ui="sel" data-vid="' + esc(l.vid) + '" ' + (on ? "checked" : "") + '>' +
      '<img src="' + esc(l.v.image || l.p.image) + '" alt="">' +
      '<div class="sd-info"><div class="sd-name">' + esc(l.p.nameEn) + '</div>' +
      (l.v.key ? '<div class="sd-var">' + esc(variantLabel(l.v)) + '</div>' : '') +
      '<div class="sd-price">' + fmt(localPrice(l.v.price)) + '</div>' +
      '<div class="sd-days">' + CFG.days[lang()] + '</div>' +
      '<div class="sd-ctl">' +
        '<span class="sd-qty"><button data-ui="dec" data-vid="' + esc(l.vid) + '">−</button><span>' + l.qty + '</span><button data-ui="inc" data-vid="' + esc(l.vid) + '">+</button></span>' +
        '<button class="sd-ic" data-ui="wish" data-pid="' + esc(l.p.pid) + '" aria-label="' + tr("wish") + '">' + (wished ? "♥" : "♡") + '</button>' +
        '<button class="sd-ic" data-ui="rm" data-vid="' + esc(l.vid) + '">' + tr("remove") + '</button>' +
      '</div></div></div>';
  }
  function couponHTML() {
    var s = st();
    if (s.coupon) return '<div class="sd-row"><span>' + esc(s.coupon) + '</span><button class="sd-ic" data-ui="removeCoupon">' + tr("remove") + '</button></div>';
    var isOpen = !!folded.coupon;
    return '<button class="sd-fold" data-ui="fold" data-k="coupon">' + tr("coupon") + ' ' + (isOpen ? "▴" : "▾") + '</button>' +
      (isOpen ? '<div class="sd-cpn"><input id="sdCpn" placeholder="' + tr("coupon") + '"><button data-ui="apply">' + tr("apply") + '</button></div><p id="sdCpnMsg" class="sd-hint"></p>' : '');
  }
  function totalsValue() {
    var sub = localPrice(subtotalUSD()), disc = localPrice(discountUSD());
    var ship = selectedAddr() ? shipLocal(shippingCalc().shipBHD) : null;
    return { sub: sub, disc: disc, ship: ship, total: sub - disc + (ship || 0) };
  }
  function totalsHTML() {
    var v = totalsValue();
    var rows = '<div class="sd-row"><span>' + tr("productsVal") + '</span><span>' + fmt(v.sub) + '</span></div>';
    if (v.disc > 0) rows += '<div class="sd-row"><span>' + tr("discount") + '</span><span>- ' + fmt(v.disc) + '</span></div>';
    rows += '<div class="sd-row"><span>' + tr("shipping") + '</span><span class="sd-muted">' +
      (v.ship === null ? tr("shipLater") : (v.ship === 0 ? tr("free") : fmt(v.ship))) + '</span></div>';
    rows += '<div class="sd-row sd-total"><strong>' + tr("grand") + '</strong><strong>' + fmt(v.total) + '</strong></div>';
    rows += '<p class="sd-hint">' + tr("shipInfo") + '</p>';
    return '<div class="sd-totals">' + rows + '</div>';
  }
  function drawRender() {
    if (!openState || !document.getElementById("sd")) return;
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
      drawFootCount = selCount;
    }
    document.getElementById("sdBody").innerHTML = body;
    document.getElementById("sdFoot").innerHTML = foot;
  }
  var drawFootCount = 0;

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
    if (a === "rm") { removeLine(vid); return; }
    if (a === "wish") { toggleWish(el.dataset.pid); return; }
    if (a === "fold") { folded[el.dataset.k] = !folded[el.dataset.k]; drawRender(); return; }
    if (a === "apply") { applyCoupon(); return; }
    if (a === "removeCoupon") { st().coupon = null; save(); emit(); return; }
    if (a === "addSug") { var en = findEntry(vid); if (en) addEntry(en, 1); return; }
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
    ".sd{position:fixed;top:0;bottom:0;inset-inline-end:0;width:min(400px,94vw);background:#0f1a2e;border-inline-start:1px solid #26334d;z-index:41;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.6);color:#eef2f7;font-size:14px}",
    ".sd.hidden{display:none}",
    ".sd-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #26334d}",
    ".sd-head strong{flex:1}",
    ".sd-body{flex:1;overflow:auto;padding:12px 16px}",
    ".sd-foot{border-top:1px solid #26334d;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#0d1728}",
    ".sd-tot{display:flex;flex-direction:column}",
    ".sd-go{background:#f59e4b;color:#111;padding:12px 18px;border-radius:12px;font-weight:800;text-decoration:none}",
    ".sd-go.dis{opacity:.4;pointer-events:none}",
    ".sd-x,.sd-ic,.sd-fold,.sd-link,.sd-cpn button{border:1px solid #26334d;background:transparent;color:#eef2f7;border-radius:10px;padding:4px 10px;font:inherit;cursor:pointer}",
    ".sd-link{border:0;color:#f59e4b;text-decoration:underline;padding:4px}",
    ".sd-cpn{display:flex;gap:8px;margin:8px 0}",
    ".sd-cpn input{flex:1;padding:8px;border-radius:10px;border:1px solid #26334d;background:#1d2a44;color:#eef2f7;font:inherit}",
    ".sd-cpn button{background:#f59e4b;color:#111;border:0;font-weight:700}",
    ".sd-fold{display:block;width:100%;text-align:start;margin:10px 0;border-radius:12px}",
    ".sd-all{display:flex;gap:8px;align-items:center;font-weight:700;margin:10px 0 2px}",
    ".sd-hint{color:#9aa7bd;font-size:12px;line-height:1.6;margin:4px 0}",
    ".sd-line{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #26334d}",
    ".sd-chk{margin-top:4px;accent-color:#f59e4b}",
    ".sd-line img{width:60px;height:60px;object-fit:cover;border-radius:10px;background:#1d2a44;flex-shrink:0}",
    ".sd-info{flex:1;min-width:0}",
    ".sd-name{font-weight:700;line-height:1.5}",
    ".sd-var,.sd-days,.sd-muted{color:#9aa7bd;font-size:12px}",
    ".sd-price{color:#f59e4b;font-weight:700;margin-top:2px}",
    ".sd-ctl{display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap}",
    ".sd-qty{display:inline-flex;align-items:center;gap:6px}",
    ".sd-qty button{width:28px;height:28px;border-radius:9px;border:1px solid #26334d;background:transparent;color:#eef2f7;cursor:pointer}",
    ".sd-totals .sd-row,.sd-row{display:flex;justify-content:space-between;gap:8px;padding:5px 0}",
    ".sd-total{border-top:1px solid #26334d;margin-top:6px;padding-top:10px;font-size:16px}",
    ".sd-empty{text-align:center;color:#9aa7bd;padding:20px 0}",
    ".ui-bar{background:#162033;border:1px solid #26334d;border-radius:14px;padding:10px 12px;margin-bottom:10px}",
    ".ui-msg{font-size:13px;margin-bottom:6px}",
    ".ui-track{height:6px;background:#26334d;border-radius:99px;overflow:hidden}",
    ".ui-track span{display:block;height:100%;background:#f59e4b;border-radius:99px}",
    ".ui-trust{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:14px 0;text-align:center;font-size:12px;color:#9aa7bd}",
    ".ui-trust div{background:rgba(255,255,255,.03);border:1px solid #26334d;border-radius:12px;padding:10px 4px}",
    "@media (max-width:520px){.ui-trust{grid-template-columns:repeat(2,1fr)}}",
    ".ui-h{margin:16px 0 8px;color:#9aa7bd;font-size:14px;font-weight:700}",
    ".ui-hscroll{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px}",
    ".ui-mini{flex:0 0 140px;scroll-snap-align:start;background:#162033;border:1px solid #26334d;border-radius:14px;padding:8px}",
    ".ui-mini img{width:100%;height:110px;object-fit:cover;border-radius:10px;background:#1d2a44}",
    ".ui-mini-n{font-size:13px;line-height:1.5;margin-top:6px;min-height:38px}",
    ".ui-mini-p{color:#f59e4b;font-weight:700;font-size:13px}",
    ".ui-low{color:#ff8593;font-size:12px}",
    ".ui-add{width:100%;margin-top:6px;padding:6px;border-radius:9px;border:1px solid #26334d;background:transparent;color:#eef2f7;font:inherit;font-size:12px;cursor:pointer}",
    ".ui-look{background:#162033;border:1px solid #26334d;border-radius:16px;padding:12px;margin:14px 0}",
    ".ui-look-t{font-size:12px;letter-spacing:.06em;color:#9aa7bd;margin-bottom:8px}",
    ".ui-look-row{display:flex;gap:10px;align-items:center}",
    ".ui-look-row img{width:56px;height:56px;border-radius:10px;object-fit:cover;background:#1d2a44}",
    ".ui-look-i{flex:1;min-width:0}",
    ".ui-add2{padding:9px 10px;border-radius:12px;border:0;background:#f59e4b;color:#111;font:inherit;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap}"
  ].join("\n");
  var styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  window.ShowbizUI = {
    cfg: CFG,
    tr: tr,
    freeShipBHD: function () { return CFG.freeShipBHD; },
    open: open,
    close: close,
    entryOf: entryOf,
    pushRecent: pushRecent,
    recentList: recentList,
    pushSearch: pushSearch,
    searches: searches,
    catalog: catalog,
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
    miniHTML: miniHTML,
    recentBlock: recentBlock,
    suggestBlock: suggestBlock,
    lookHTML: lookHTML,
    emit: emit
  };
})();
