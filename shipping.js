/* حساب الشحن من CJ (عبر الوسيط على Cloudflare).
   - ShowbizShip.status(country, lines)  -> { state: "none" | "loading" | "err" | "ok", methods, pick }
   - ShowbizShip.amount(country, lines)  -> السعر المختار بعملة الدولة، أو null إذا ما اختير شي
   - ShowbizShip.html(country, lines)    -> قائمة طرق الشحن للعرض
   - ShowbizShip.listen(fn)              -> ينادي fn لما تتغير النتائج أو الاختيار
   lines: [{ vid, qty }] (المنتجات المحددة فقط)
   الاختيار يتحفظ في localStorage، ويصير غير صالح إذا تغيرت السلة أو الدولة. */
(function () {
  var WORKER = "https://shrill-math-8abeshowbiz-api.alooyhelal.workers.dev/";
  var PICK_KEY = "showbiz_ship";
  var ERR_TTL = 60 * 1000;
  var cache = {};
  var listeners = [];

  var T = {
    ar: { title: "طرق الشحن", loading: "جاري حساب الشحن...", err: "تعذر حساب الشحن الآن، حاول مرة ثانية",
          none: "أضف منتجات لحساب الشحن", pickHint: "اختر طريقة الشحن", aging: "المدة", days: "",
          rates: "أسعار الصرف من Exchange Rate API" },
    en: { title: "Shipping methods", loading: "Calculating shipping...", err: "Could not calculate shipping, try again",
          none: "Add products to calculate shipping", pickHint: "Choose a shipping method", aging: "Delivery", days: "",
          rates: "Exchange rates by Exchange Rate API" }
  };

  function lang() {
    try { return JSON.parse(localStorage.getItem("showbiz_state") || "{}").lang === "en" ? "en" : "ar"; }
    catch (e) { return "ar"; }
  }
  function tr(k) { return T[lang()][k]; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function keyOf(country, lines) {
    return country + "|" + lines.map(function (l) { return l.vid + "x" + l.qty; }).sort().join(",");
  }

  function notify() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  function readPick() {
    try { return JSON.parse(localStorage.getItem(PICK_KEY) || "null"); } catch (e) { return null; }
  }
  function writePick(p) {
    try {
      if (p) localStorage.setItem(PICK_KEY, JSON.stringify(p));
      else localStorage.removeItem(PICK_KEY);
    } catch (e) {}
  }

  function fetchQuote(country, lines, k) {
    cache[k] = { state: "loading" };
    fetch(WORKER + "?action=freight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: country, items: lines.map(function (l) { return { vid: l.vid, qty: l.qty }; }) })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d && Array.isArray(res.d.methods)) {
          cache[k] = { state: "ok", data: res.d, at: Date.now() };
        } else {
          cache[k] = { state: "err", at: Date.now() };
        }
        notify();
      })
      .catch(function () {
        cache[k] = { state: "err", at: Date.now() };
        notify();
      });
  }

  function status(country, lines) {
    if (!country || !lines || !lines.length) return { state: "none", methods: [], pick: null };
    var k = keyOf(country, lines);
    var e = cache[k];
    if (!e || (e.state === "err" && Date.now() - e.at > ERR_TTL)) {
      fetchQuote(country, lines, k);
      e = cache[k];
    }
    var pick = readPick();
    if (pick && pick.k !== k) pick = null;
    return {
      state: e.state,
      methods: e.state === "ok" ? e.data.methods : [],
      rateDate: e.state === "ok" ? e.data.rateDate : null,
      decimals: e.state === "ok" ? e.data.decimals : 2,
      currency: e.state === "ok" ? e.data.currency : null,
      pick: pick
    };
  }

  function amount(country, lines) {
    var s = status(country, lines);
    return s.pick ? s.pick.price : null;
  }

  function choose(country, lines, index) {
    var s = status(country, lines);
    var m = s.methods[index];
    if (!m) return;
    writePick({
      k: keyOf(country, lines),
      carrier: m.carrier, aging: m.aging, price: m.price,
      currency: s.currency, decimals: s.decimals
    });
    notify();
  }

  function html(country, lines) {
    var s = status(country, lines);
    if (s.state === "none") return '<p class="shipnote">' + esc(tr("none")) + "</p>";
    if (s.state === "loading") return '<p class="shipnote">' + esc(tr("loading")) + "</p>";
    if (s.state === "err") return '<p class="shipnote">' + esc(tr("err")) + "</p>";
    var dec = s.decimals;
    var list = s.methods.map(function (m, i) {
      var on = s.pick && s.pick.carrier === m.carrier && s.pick.price === m.price;
      return '<button type="button" class="shipopt' + (on ? " on" : "") + '" data-ship="' + i + '">' +
        '<span class="shipname">' + esc(m.carrier) + '</span>' +
        (m.aging ? '<span class="shipaging">' + esc(tr("aging")) + ": " + esc(m.aging) + "</span>" : "") +
        '<strong class="shipprice">' + Number(m.price).toFixed(dec) + " " + esc(s.currency) + "</strong>" +
        "</button>";
    }).join("");
    if (!s.methods.length) return '<p class="shipnote">' + esc(tr("err")) + "</p>";
    return '<div class="shipbox"><p class="shipnote">' + esc(tr("pickHint")) + "</p>" + list +
      '<p class="shipnote shiprate">' + esc(tr("rates")) + "</p></div>";
  }

  // اختيار طريقة الشحن من الصفحة (الزر فيه data-ship = رقم الطريقة)
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-ship]");
    if (!b) return;
    var lines = window.ShowbizShip && window.ShowbizShip._linesFn ? window.ShowbizShip._linesFn() : null;
    var country = window.ShowbizShip && window.ShowbizShip._countryFn ? window.ShowbizShip._countryFn() : null;
    if (!lines || !country) return;
    choose(country, lines, Number(b.getAttribute("data-ship")));
  });

  // أنماط قائمة الشحن (تنحقن تلقائياً، عشان ما نعدل CSS كل صفحة)
  (function injectCss() {
    if (document.getElementById("shipCss")) return;
    var s = document.createElement("style");
    s.id = "shipCss";
    s.textContent =
      ".shipbox{margin-top:10px}" +
      ".shipnote{color:#9aa7bd;font-size:12px;line-height:1.7;margin:6px 0}" +
      ".shiprate{font-size:11px;opacity:.8}" +
      ".shipopt{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;width:100%;text-align:start;" +
        "background:transparent;color:inherit;border:1px solid #2c4168;border-radius:12px;padding:10px 12px;margin:6px 0;font:inherit;cursor:pointer}" +
      ".shipopt.on{border-color:#f59e4b;box-shadow:0 0 0 1px #f59e4b inset}" +
      ".shipname{font-weight:700}" +
      ".shipaging{color:#9aa7bd;font-size:12px}" +
      ".shipprice{margin-inline-start:auto;white-space:nowrap}";
    document.head.appendChild(s);
  })();

  window.ShowbizShip = {
    status: status,
    amount: amount,
    html: html,
    choose: choose,
    listen: function (fn) { listeners.push(fn); },
    // كل صفحة تعطي الدولة والسلة المحددة (للنقر على طريقة الشحن)
    setSource: function (countryFn, linesFn) { this._countryFn = countryFn; this._linesFn = linesFn; },
    _countryFn: null,
    _linesFn: null
  };
})();
