// الرائج الآن: قائمة منتجات يحددها الموقع، كل عنصر لقطة: { pid, nameAr, nameEn, image }
// لين يتوفر عداد بحث حقيقي من الزوار، تُعرض أول منتجات من الكتالوج التجريبي كبديل مؤقت.
// إذا window.SHOWBIZ_POPULAR فيها عناصر، تنعرض هي بدل البديل.
window.SHOWBIZ_POPULAR = [];
window.SHOWBIZ_POPULAR_LIST = function () {
  var v = window.SHOWBIZ_POPULAR;
  if (Array.isArray(v) && v.length) return v.slice();
  var d = (window.SHOWBIZ_DEMO && window.SHOWBIZ_DEMO.products) || [];
  return d.map(function (p) { return { pid: String(p.pid), nameAr: p.nameAr || "", nameEn: p.nameEn || "", image: p.image || "" }; });
};
