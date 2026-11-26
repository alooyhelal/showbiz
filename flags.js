/* أعلام الدول كصور SVG ثابتة (v42) — بديل لإيموجي الأعلام اللي تختلف بين الأجهزة.
   الاستخدام:
   ShowbizFlags.img("BH")          -> <img> جاهز للإدراج في HTML
   ShowbizFlags.attach(selectEl)   -> يعرض علم الدولة المختارة جنب القائمة ويحدّثه تلقائياً
   ShowbizFlags.len("BH")          -> عدد أرقام الجوال المسموح لكل دولة */
(function () {
  var SVG = {
    BH: '<rect width="60" height="40" fill="#CE1126"/><polygon points="0,0 14,0 8,5 14,10 8,15 14,20 8,25 14,30 8,35 14,40 0,40" fill="#fff"/>',
    SA: '<rect width="60" height="40" fill="#006C35"/><rect x="14" y="24" width="32" height="2.5" fill="#fff"/><rect x="18" y="19" width="24" height="1.5" fill="#fff" opacity=".8"/>',
    AE: '<rect width="60" height="13.4" fill="#00732F"/><rect y="13.3" width="60" height="13.4" fill="#fff"/><rect y="26.7" width="60" height="13.3" fill="#000"/><rect width="15" height="40" fill="#FF0000"/>',
    KW: '<rect width="60" height="13.4" fill="#007A3D"/><rect y="13.3" width="60" height="13.4" fill="#fff"/><rect y="26.7" width="60" height="13.3" fill="#CE1126"/><polygon points="0,0 22,20 0,40" fill="#000"/>',
    QA: '<rect width="60" height="40" fill="#8A1538"/><path d="M0 0 L14 0 L14 40 L0 40 Z" fill="#fff"/><path d="M14 0 L9 5 L14 10 L9 15 L14 20 L9 25 L14 30 L9 35 L14 40 Z" fill="#8A1538"/>',
    OM: '<rect width="60" height="13.4" fill="#fff"/><rect y="13.3" width="60" height="13.4" fill="#DB161B"/><rect y="26.7" width="60" height="13.3" fill="#008000"/><rect width="14" height="40" fill="#DB161B"/>'
  };
  var NAMES = { BH: "البحرين", SA: "السعودية", AE: "الإمارات", KW: "الكويت", QA: "قطر", OM: "عُمان" };
  var LEN = { BH: 8, SA: 9, AE: 9, KW: 8, QA: 8, OM: 8 };
  var DIAL = { BH: "+973", SA: "+966", AE: "+971", KW: "+965", QA: "+974", OM: "+968" };

  function uri(code) {
    var body = SVG[code];
    if (!body) return "";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">' + body + "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function img(code, cls) {
    if (!SVG[code]) return "";
    return '<img class="' + (cls || "cflag") + '" src="' + uri(code) + '" alt="' + (NAMES[code] || code) + '" width="24" height="16">';
  }
  // علم جنب قائمة منسدلة: يعرض علم الخيار المختار ويتحدث عند التغيير
  function attach(sel) {
    if (!sel) return;
    if (sel.dataset.flagAttached) { if (sel._fUpd) sel._fUpd(); return; }
    sel.dataset.flagAttached = "1";
    var wrap = document.createElement("span");
    wrap.className = "fsel-wrap";
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    var fl = document.createElement("img");
    fl.className = "fsel-flag";
    fl.alt = "";
    wrap.appendChild(fl);
    var update = function () {
      var v = sel.value;
      var code = Object.keys(DIAL).find(function (c) { return DIAL[c] === v; }) || (SVG[v] ? v : "");
      fl.src = code ? uri(code) : "";
      fl.style.display = code ? "" : "none";
    };
    sel.addEventListener("change", update);
    sel._fUpd = update;
    update();
    // لو الواجهة اتغيّرت برمجياً
    setTimeout(update, 0);
  }
  // أنماط الأعلام (تُحقن مرة واحدة)
  var css = ".fsel-wrap{position:relative;display:block;min-width:0}" +
    ".fsel-wrap select{padding-inline-start:44px !important}" +
    ".fsel-flag{position:absolute;top:50%;transform:translateY(-50%);inset-inline-start:12px;width:24px;height:16px;border-radius:2px;object-fit:cover;pointer-events:none;box-shadow:0 0 0 1px rgba(0,0,0,.15)}" +
    ".cflag{width:24px;height:16px;border-radius:2px;object-fit:cover;vertical-align:middle;box-shadow:0 0 0 1px rgba(0,0,0,.15)}";
  try { var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); } catch (e) {}
  window.ShowbizFlags = { img: img, uri: uri, attach: attach, len: function (c) { return LEN[c] || 8; }, dial: function (c) { return DIAL[c] || ""; }, names: NAMES, LEN: LEN, DIAL: DIAL };
})();
