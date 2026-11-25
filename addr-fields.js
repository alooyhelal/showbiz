/* تعريفات حقول العنوان المشتركة (v41): تُستخدم في صفحة عناويني ونافذة إضافة العنوان داخل السلة.
   عدّل الحقول هنا وتنعكس على الصفحتين. */

// أكواد الجوال (مستقلة عن دولة العنوان)
var PHONE_CODES = [
  { dial: "+973", flag: "🇧🇭", len: 8 },
  { dial: "+971", flag: "🇦🇪", len: 9 },
  { dial: "+966", flag: "🇸🇦", len: 9 },
  { dial: "+965", flag: "🇰🇼", len: 8 },
  { dial: "+974", flag: "🇶🇦", len: 8 },
  { dial: "+968", flag: "🇴🇲", len: 8 }
];

// حقول كل دولة (الحقول الاختيارية ما هي إلزامية)
var FIELDS = {
  BH: [
    { k: "building", ar: "رقم المنزل أو المبنى", en: "Building no.", req: true, digits: true },
    { k: "street", ar: "رقم الطريق", en: "Road no.", req: true, digits: true },
    { k: "complex", ar: "رقم المجمع (اختياري)", en: "Complex no. (optional)", req: false, digits: true },
    { k: "flat", ar: "رقم الشقة (اختياري)", en: "Flat no. (optional)", req: false, digits: true }
  ],
  AE: [
    { k: "building", ar: "رقم المبنى", en: "Building no.", req: true, digits: false },
    { k: "street", ar: "اسم الشارع", en: "Street name", req: true, digits: false },
    { k: "flat", ar: "رقم الشقة أو الفيلا (اختياري)", en: "Flat or villa no. (optional)", req: false, digits: false },
    { k: "makani", ar: "رقم مكاني (اختياري)", en: "Makani no. (optional)", req: false, digits: true },
    { k: "pobox", ar: "صندوق البريد (اختياري)", en: "P.O. box (optional)", req: false, digits: true }
  ],
  SA: [
    { k: "district", ar: "الحي", en: "District", req: true, digits: false },
    { k: "building", ar: "رقم المبنى (4 أرقام)", en: "Building no. (4 digits)", req: true, digits: true },
    { k: "street", ar: "اسم الشارع", en: "Street name", req: true, digits: false },
    { k: "subno", ar: "الرقم الفرعي (4 أرقام)", en: "Additional no. (4 digits)", req: true, digits: true },
    { k: "postal", ar: "الرمز البريدي (5 أرقام)", en: "Postal code (5 digits)", req: true, digits: true },
    { k: "flat", ar: "رقم الوحدة / الشقة (اختياري)", en: "Unit / flat no. (optional)", req: false, digits: false },
    { k: "short", ar: "العنوان المختصر (اختياري)", en: "Short address (optional)", req: false, digits: false }
  ],
  KW: [
    { k: "block", ar: "القطعة", en: "Block", req: true, digits: true },
    { k: "street", ar: "رقم الشارع أو اسم الشارع", en: "Street no. or name", req: true, digits: false },
    { k: "avenue", ar: "الجادة (اختياري)", en: "Avenue (optional)", req: false, digits: false },
    { k: "building", ar: "رقم المبنى / القسيمة", en: "Building no.", req: true, digits: false },
    { k: "floor", ar: "الدور (اختياري)", en: "Floor (optional)", req: false, digits: false },
    { k: "flat", ar: "رقم الشقة / الوحدة (اختياري)", en: "Flat / unit (optional)", req: false, digits: false },
    { k: "paci", ar: "الرقم الآلي PACI (اختياري)", en: "PACI number (optional)", req: false, digits: true }
  ],
  QA: [
    { k: "street", ar: "رقم الشارع", en: "Street no.", req: true, digits: true },
    { k: "building", ar: "رقم المبنى", en: "Building no.", req: true, digits: true },
    { k: "block", ar: "رقم المربع (Block) (اختياري)", en: "Block no. (optional)", req: false, digits: true },
    { k: "unit", ar: "رقم الوحدة / الشقة (اختياري)", en: "Unit / flat no. (optional)", req: false, digits: false }
  ],
  OM: [
    { k: "street", ar: "اسم الشارع", en: "Street name", req: true, digits: false },
    { k: "building", ar: "رقم المبنى / وحدة العنوان", en: "Building / unit no.", req: true, digits: false },
    { k: "flat", ar: "رقم الشقة (اختياري)", en: "Flat no. (optional)", req: false, digits: false }
  ]
};

var TYPE_LABEL = {
  gov: ["المحافظة", "Governorate"],
  emirate: ["الإمارة", "Emirate"],
  region: ["المنطقة الكبيرة", "Region"],
  city: ["المدينة", "City"],
  area: ["المنطقة", "Area"],
  muni: ["البلدية", "Municipality"],
  wilayat: ["الولاية", "Wilayat"]
};
