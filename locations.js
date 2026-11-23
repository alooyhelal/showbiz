// ============================================================
// ملف المواقع الجغرافية: المصدر الرئيسي لقوائم الدول والمحافظات والإمارات والمدن والمناطق
// الإصدار: v2 (البحرين + الإمارات)
// ============================================================
// كل عنصر له:
//   id       : معرّف ثابت وفريد. لا تغيّره بعد الحفظ لأن العناوين المحفوظة تعتمد عليه
//   type     : نوع العنصر: gov (محافظة)، emirate (إمارة)، region (منطقة كبيرة)، city (مدينة)، area (منطقة سكنية)
//   ar       : الاسم بالعربي
//   en       : الاسم بالإنجليزي (إذا متوفر)
//   children : العناصر التابعة له (اختياري)
// البنية مرنة، وكل دولة لها تصنيفها الخاص:
//   البحرين : دولة ← محافظة ← منطقة
//   الإمارات: دولة ← إمارة ← (منطقة) ← مدينة ← منطقة سكنية
// "len" = عدد أرقام الجوال بدون كود الدولة

const N = (id, type, ar, en, children) => {
  const o = { id, type, ar };
  if (en) o.en = en;
  if (children) o.children = children;
  return o;
};

const SHOWBIZ_LOCATIONS = {

  // ================= مملكة البحرين =================
  BH: {
    ar: "مملكة البحرين", en: "Bahrain", flag: "🇧🇭", dial: "+973", len: 8,
    children: [
      N("BH-CAP", "gov", "محافظة العاصمة", "Capital Governorate", [
        N("BH-CAP-01", "area", "المنامة"),
        N("BH-CAP-02", "area", "الحورة"),
        N("BH-CAP-03", "area", "القضيبية"),
        N("BH-CAP-04", "area", "العدلية"),
        N("BH-CAP-05", "area", "الجفير"),
        N("BH-CAP-06", "area", "الفاتح"),
        N("BH-CAP-07", "area", "أم الحصم"),
        N("BH-CAP-08", "area", "السلمانية"),
        N("BH-CAP-09", "area", "النعيم"),
        N("BH-CAP-10", "area", "القفول"),
        N("BH-CAP-11", "area", "السويفية"),
        N("BH-CAP-12", "area", "السقية"),
        N("BH-CAP-13", "area", "الماحوز"),
        N("BH-CAP-14", "area", "بو عشيرة"),
        N("BH-CAP-15", "area", "الزنج"),
        N("BH-CAP-16", "area", "بلاد القديم"),
        N("BH-CAP-17", "area", "الخميس"),
        N("BH-CAP-18", "area", "السنابس"),
        N("BH-CAP-19", "area", "كرباباد"),
        N("BH-CAP-20", "area", "ضاحية السيف"),
        N("BH-CAP-21", "area", "المنطقة الدبلوماسية"),
        N("BH-CAP-22", "area", "ميناء سلمان"),
        N("BH-CAP-23", "area", "النبيه صالح"),
        N("BH-CAP-24", "area", "توبلي"),
        N("BH-CAP-25", "area", "جد علي"),
        N("BH-CAP-26", "area", "جرداب"),
        N("BH-CAP-27", "area", "العكر"),
        N("BH-CAP-28", "area", "المصلى"),
        N("BH-CAP-29", "area", "عذاري"),
        N("BH-CAP-30", "area", "الصالحية"),
        N("BH-CAP-31", "area", "البرهامة")
      ]),
      N("BH-MUH", "gov", "محافظة المحرق", "Muharraq Governorate", [
        N("BH-MUH-01", "area", "المحرق"),
        N("BH-MUH-02", "area", "البسيتين"),
        N("BH-MUH-03", "area", "الحد"),
        N("BH-MUH-04", "area", "عراد"),
        N("BH-MUH-05", "area", "قلالي"),
        N("BH-MUH-06", "area", "سماهيج"),
        N("BH-MUH-07", "area", "الدير"),
        N("BH-MUH-08", "area", "حالة بوماهر"),
        N("BH-MUH-09", "area", "حالة السلطة"),
        N("BH-MUH-10", "area", "حالة النعيم"),
        N("BH-MUH-11", "area", "حالة عراد"),
        N("BH-MUH-12", "area", "جزر أمواج"),
        N("BH-MUH-13", "area", "ديار المحرق"),
        N("BH-MUH-14", "area", "دلمونيا"),
        N("BH-MUH-15", "area", "شمال شرق المحرق")
      ]),
      N("BH-NOR", "gov", "المحافظة الشمالية", "Northern Governorate", [
        N("BH-NOR-01", "area", "مدينة حمد"),
        N("BH-NOR-02", "area", "المدينة الشمالية"),
        N("BH-NOR-03", "area", "البديع"),
        N("BH-NOR-04", "area", "الدراز"),
        N("BH-NOR-05", "area", "بني جمرة"),
        N("BH-NOR-06", "area", "باربار"),
        N("BH-NOR-07", "area", "كرانة"),
        N("BH-NOR-08", "area", "جنوسان"),
        N("BH-NOR-09", "area", "المرخ"),
        N("BH-NOR-10", "area", "الجنبية"),
        N("BH-NOR-11", "area", "الجسرة"),
        N("BH-NOR-12", "area", "الهملة"),
        N("BH-NOR-13", "area", "أبو قوة"),
        N("BH-NOR-14", "area", "سار"),
        N("BH-NOR-15", "area", "مقابة"),
        N("BH-NOR-16", "area", "عالي"),
        N("BH-NOR-17", "area", "بوري"),
        N("BH-NOR-18", "area", "دمستان"),
        N("BH-NOR-19", "area", "كرزكان"),
        N("BH-NOR-20", "area", "المالكية"),
        N("BH-NOR-21", "area", "صدد"),
        N("BH-NOR-22", "area", "شهركان"),
        N("BH-NOR-23", "area", "دار كليب"),
        N("BH-NOR-24", "area", "سلماباد"),
        N("BH-NOR-25", "area", "هورة عالي"),
        N("BH-NOR-26", "area", "القدم"),
        N("BH-NOR-27", "area", "جبلة حبشي"),
        N("BH-NOR-28", "area", "السهلة الشمالية"),
        N("BH-NOR-29", "area", "السهلة الجنوبية"),
        N("BH-NOR-30", "area", "جدحفص"),
        N("BH-NOR-31", "area", "الديه"),
        N("BH-NOR-32", "area", "السنابس الشمالية")
      ]),
      N("BH-SOU", "gov", "المحافظة الجنوبية", "Southern Governorate", [
        N("BH-SOU-01", "area", "الرفاع الشرقي"),
        N("BH-SOU-02", "area", "الرفاع الغربي"),
        N("BH-SOU-03", "area", "البحير"),
        N("BH-SOU-04", "area", "مدينة عيسى"),
        N("BH-SOU-05", "area", "عوالي"),
        N("BH-SOU-06", "area", "الصخير"),
        N("BH-SOU-07", "area", "الزلاق"),
        N("BH-SOU-08", "area", "عسكر"),
        N("BH-SOU-09", "area", "جو"),
        N("BH-SOU-10", "area", "الدور"),
        N("BH-SOU-11", "area", "بلاج الجزائر"),
        N("BH-SOU-12", "area", "درة البحرين"),
        N("BH-SOU-13", "area", "جزر حوار"),
        N("BH-SOU-14", "area", "رأس حيان"),
        N("BH-SOU-15", "area", "المعامير"),
        N("BH-SOU-16", "area", "النويدرات"),
        N("BH-SOU-17", "area", "العكر الشرقي"),
        N("BH-SOU-18", "area", "العكر الغربي"),
        N("BH-SOU-19", "area", "سند"),
        N("BH-SOU-20", "area", "هورة سند"),
        N("BH-SOU-21", "area", "مدينة زايد")
      ])
    ]
  },

  // ================= الإمارات العربية المتحدة =================
  // المدن والمناطق السكنية داخل كل مدينة: الأسماء الموجودة هنا من الملف المرسل.
  // المناطق السكنية لم تُرسل بعد، لذلك children غير موجودة حاليًا (ولا تُضاف أسماء غير موثقة).
  AE: {
    ar: "الإمارات العربية المتحدة", en: "United Arab Emirates", flag: "🇦🇪", dial: "+971", len: 9,
    children: [
      N("AE-AUH", "emirate", "إمارة أبوظبي", "Abu Dhabi", [
        N("AE-AUH-01", "city", "مدينة أبوظبي"),
        N("AE-AUH-02", "city", "مدينة العين"),
        N("AE-AUH-DHF", "region", "منطقة الظفرة", "Al Dhafra", [
          N("AE-AUH-DHF-01", "city", "مدينة زايد"),
          N("AE-AUH-DHF-02", "city", "ليوا"),
          N("AE-AUH-DHF-03", "city", "غياثي"),
          N("AE-AUH-DHF-04", "city", "الرويس"),
          N("AE-AUH-DHF-05", "city", "المرفأ"),
          N("AE-AUH-DHF-06", "city", "السلع"),
          N("AE-AUH-DHF-07", "city", "جزيرة دلما")
        ])
      ]),
      N("AE-DXB", "emirate", "إمارة دبي", "Dubai", [
        N("AE-DXB-01", "city", "مدينة دبي"),
        N("AE-DXB-02", "city", "جبل علي"),
        N("AE-DXB-03", "city", "حتا")
      ]),
      N("AE-SHJ", "emirate", "إمارة الشارقة", "Sharjah", [
        N("AE-SHJ-01", "city", "مدينة الشارقة"),
        N("AE-SHJ-02", "city", "خورفكان"),
        N("AE-SHJ-03", "city", "كلباء"),
        N("AE-SHJ-04", "city", "دبا الحصن"),
        N("AE-SHJ-05", "city", "الذيد"),
        N("AE-SHJ-06", "city", "المدام"),
        N("AE-SHJ-07", "city", "البطائح"),
        N("AE-SHJ-08", "city", "مليحة"),
        N("AE-SHJ-09", "city", "الحمرية")
      ]),
      N("AE-AJM", "emirate", "إمارة عجمان", "Ajman", [
        N("AE-AJM-01", "city", "مدينة عجمان"),
        N("AE-AJM-02", "city", "مصفوت"),
        N("AE-AJM-03", "city", "المنامة")
      ]),
      N("AE-UAQ", "emirate", "إمارة أم القيوين", "Umm Al Quwain", [
        N("AE-UAQ-01", "city", "مدينة أم القيوين"),
        N("AE-UAQ-02", "city", "فلج المعلا")
      ]),
      N("AE-RAK", "emirate", "إمارة رأس الخيمة", "Ras Al Khaimah", [
        N("AE-RAK-01", "city", "مدينة رأس الخيمة"),
        N("AE-RAK-02", "city", "الجزيرة الحمراء"),
        N("AE-RAK-03", "city", "الرمس"),
        N("AE-RAK-04", "city", "شعم"),
        N("AE-RAK-05", "city", "غليلة"),
        N("AE-RAK-06", "city", "الدقداقة")
      ]),
      N("AE-FUJ", "emirate", "إمارة الفجيرة", "Fujairah", [
        N("AE-FUJ-01", "city", "مدينة الفجيرة"),
        N("AE-FUJ-02", "city", "دبا الفجيرة"),
        N("AE-FUJ-03", "city", "مسافي"),
        N("AE-FUJ-04", "city", "البدية"),
        N("AE-FUJ-05", "city", "الطويين"),
        N("AE-FUJ-06", "city", "مربح"),
        N("AE-FUJ-07", "city", "قدفع")
      ])
    ]
  }
};

// ============ مساعدات يستخدمها الموقع ============

// كل الدول (مع الكود)
function getCountries() {
  return Object.entries(SHOWBIZ_LOCATIONS).map(([code, c]) => ({ code, ...c }));
}

// دولة واحدة بالكود
function getCountry(code) {
  return SHOWBIZ_LOCATIONS[code] || null;
}

// العناصر التابعة لعنصر (تُرجع مصفوفة فاضية إذا ما فيه تابع)
function getChildren(node) {
  return (node && node.children) || [];
}

// أول مستوى بعد الدولة: محافظات البحرين أو إمارات الإمارات
function getTopLevel(code) {
  return getChildren(getCountry(code));
}

// البحث عن أي عنصر بمعرّفه
function findNode(id) {
  const stack = getCountries().flatMap(c => getChildren(c));
  while (stack.length) {
    const n = stack.pop();
    if (n.id === id) return n;
    stack.push(...getChildren(n));
  }
  return null;
}

// توافق مع الكود القديم
function getGovs(code) {
  return getTopLevel(code);
}
function getGov(code, govAr) {
  return getTopLevel(code).find(g => g.ar === govAr) || null;
}

// فحص سريع للبيانات: يرجّع قائمة مشاكل (إذا فاضية = كل شي تمام)
// يتحقق من: تكرار المعرّفات، وتكرار نفس المنطقة السكنية تحت أكثر من عنصر في الدولة
function validateLocations() {
  const problems = [];
  const ids = new Set();
  getCountries().forEach(c => {
    const areaNames = new Set();
    const walk = (node) => {
      if (ids.has(node.id)) problems.push("معرّف مكرر: " + node.id);
      ids.add(node.id);
      if (node.type === "area") {
        if (areaNames.has(node.ar)) problems.push("منطقة مكررة في " + c.code + ": " + node.ar);
        areaNames.add(node.ar);
      }
      getChildren(node).forEach(walk);
    };
    getChildren(c).forEach(walk);
  });
  return problems;
}
