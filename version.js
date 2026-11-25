// مصدر رقم النسخة الوحيد للموقع: عدّل VER و DATE هنا عند كل تعديل، وكل الصفحات تتحدث
window.SHOWBIZ_BUILD = { version: "v32", updated: "2026-11-25 08:55" };
(function () {
  function put() {
    var el = document.getElementById("verLine");
    if (el) el.textContent = "النسخة: " + window.SHOWBIZ_BUILD.version + " · آخر تحديث: " + window.SHOWBIZ_BUILD.updated;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", put); else put();
})();
