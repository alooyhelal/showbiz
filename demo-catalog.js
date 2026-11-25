/* كتالوج وهمي للتجربة فقط: 100 منتج في 10 أقسام رئيسية (v41).
   - يظهر للجميع في مرحلة التجربة، ولا يتم جلب أي منتجات من الـ API أو CJ.
   - كل منتج له اسم عربي (nameAr) وإنجليزي (nameEn)، والموقع يعرض حسب اللغة المختارة.
   - الإلكترونيات تحتاج اختيار اللون والمقاس قبل الإضافة، والخيار الأساسي بدون فرق سعر،
     وباقي الخيارات تضيف فرق السعر SURCHARGE_USD.
   - الصور SVG داخلية (بدون تحميل من الإنترنت). */
(function () {
  // ===== شجرة الأقسام (الترتيب هنا هو ترتيب ظهورها في الصفحة الرئيسية) =====
  var TREE = [
    { id: "cars", ar: "السيارات", en: "Cars", children: [
      { id: "hyundai", ar: "هيونداي", en: "Hyundai" },
      { id: "kia", ar: "كيا", en: "Kia" },
      { id: "mercedes", ar: "مرسيدس", en: "Mercedes", children: [
        { id: "sedan", ar: "سيدان", en: "Sedan" }
      ] },
      { id: "bmw", ar: "بي إم دبليو", en: "BMW" },
      { id: "jeep", ar: "جيب", en: "Jeep" },
      { id: "honda", ar: "هوندا", en: "Honda" },
      { id: "bugatti", ar: "بوغاتي", en: "Bugatti" },
      { id: "toyota", ar: "تويوتا", en: "Toyota" },
      { id: "ford", ar: "فورد", en: "Ford" },
      { id: "lexus", ar: "لكزس", en: "Lexus" }
    ] },
    { id: "electronics", ar: "الإلكترونيات", en: "Electronics", children: [
      { id: "phones", ar: "الهواتف", en: "Phones" },
      { id: "laptops", ar: "اللابتوب", en: "Laptops" },
      { id: "audio", ar: "الصوتيات", en: "Audio" }
    ] },
    { id: "clothing", ar: "الملابس", en: "Clothing" },
    { id: "shoes", ar: "الأحذية", en: "Shoes" },
    { id: "watches", ar: "الساعات", en: "Watches" },
    { id: "bags", ar: "الحقائب", en: "Bags" },
    { id: "perfumes", ar: "العطور", en: "Perfumes" },
    { id: "toys", ar: "الألعاب", en: "Toys" },
    { id: "home", ar: "المنزل", en: "Home" },
    { id: "sports", ar: "الرياضة", en: "Sports" }
  ];

  // فرق السعر لكل خيار غير أساسي في الإلكترونيات (بالدولار، عملة الكتالوج)
  var SURCHARGE_USD = 5.5;

  // ===== المنتجات: [المسار، الاسم الإنجليزي، السعر بالدولار، الأيقونة] =====
  var ROWS = [
    // السيارات: منتج لكل ماركة، ومرسيدس تحت تصنيف فرعي
    ["cars/hyundai", "Hyundai Elantra", 18500, "🚗"],
    ["cars/kia", "Kia Sportage", 26900, "🚙"],
    ["cars/mercedes/sedan", "Mercedes C-Class", 52000, "🚘"],
    ["cars/bmw", "BMW M3", 78000, "🏎️"],
    ["cars/jeep", "Jeep Wrangler", 45000, "🚙"],
    ["cars/honda", "Honda Civic", 21000, "🚗"],
    ["cars/bugatti", "Bugatti Chiron", 3200000, "🏎️"],
    ["cars/toyota", "Toyota Land Cruiser", 68000, "🚙"],
    ["cars/ford", "Ford Mustang", 49000, "🚗"],
    ["cars/lexus", "Lexus LX", 91000, "🚙"],
    // الإلكترونيات
    ["electronics/phones", "Nova X1 Phone", 499, "📱"],
    ["electronics/phones", "Nova X1 Pro", 799, "📱"],
    ["electronics/phones", "Pixel Lite 5", 329, "📱"],
    ["electronics/phones", "Arka Mini 8", 219, "📱"],
    ["electronics/laptops", "Vertex Book 14", 1199, "💻"],
    ["electronics/laptops", "Vertex Pro 16", 1899, "💻"],
    ["electronics/laptops", "Lumen Slim 13", 849, "💻"],
    ["electronics/audio", "Echo Buds Air", 129, "🎧"],
    ["electronics/audio", "Bass Max Headset", 249, "🎧"],
    ["electronics/audio", "Mini Speaker Go", 59, "🔊"],
    // الملابس (مقاسات S-XL)
    ["clothing", "Basic Cotton Tee", 15, "👕"],
    ["clothing", "Denim Jacket", 58, "🧥"],
    ["clothing", "Linen Shirt", 35, "👔"],
    ["clothing", "Classic Hoodie", 42, "🧥"],
    ["clothing", "Chino Pants", 39, "👖"],
    ["clothing", "Knit Sweater", 46, "🧶"],
    ["clothing", "Polo Shirt", 24, "👕"],
    ["clothing", "Winter Coat", 120, "🧥"],
    ["clothing", "Track Pants", 28, "👖"],
    ["clothing", "Summer Dress", 52, "👗"],
    // الأحذية (مقاسات EU 40-44)
    ["shoes", "Air Runner", 129, "👟"],
    ["shoes", "Classic Loafer", 89, "👞"],
    ["shoes", "Trail Boot", 149, "🥾"],
    ["shoes", "Canvas Sneaker", 55, "👟"],
    ["shoes", "Leather Oxford", 110, "👞"],
    ["shoes", "Running Pro", 165, "👟"],
    ["shoes", "Slip-on Mule", 48, "🥿"],
    ["shoes", "Chelsea Boot", 135, "🥾"],
    ["shoes", "Court White", 75, "👟"],
    ["shoes", "Flex Sandal", 29, "🩴"],
    // الساعات
    ["watches", "Classic Watch", 249, "⌚"],
    ["watches", "Chrono Steel", 320, "⌚"],
    ["watches", "Smart Band", 99, "⌚"],
    ["watches", "Rose Watch", 189, "⌚"],
    ["watches", "Diver 200", 275, "⌚"],
    ["watches", "Minimal Black", 130, "⌚"],
    ["watches", "Field Watch", 160, "⌚"],
    ["watches", "Pilot Gold", 410, "⌚"],
    ["watches", "Sport Digital", 70, "⌚"],
    ["watches", "Slim Date", 145, "⌚"],
    // الحقائب
    ["bags", "Pink Tote Bag", 49, "👜"],
    ["bags", "Crossbody Bag", 65, "👜"],
    ["bags", "Backpack Pro", 89, "🎒"],
    ["bags", "Mini Clutch", 38, "👛"],
    ["bags", "Travel Duffel", 110, "🧳"],
    ["bags", "Laptop Sleeve", 32, "💼"],
    ["bags", "Belt Bag", 27, "👝"],
    ["bags", "Leather Satchel", 145, "👜"],
    ["bags", "Weekend Bag", 128, "🧳"],
    ["bags", "Hip Pack", 22, "👝"],
    // العطور
    ["perfumes", "Oud Night", 95, "🧴"],
    ["perfumes", "Rose Veil", 78, "🌹"],
    ["perfumes", "Citrus Splash", 42, "🍋"],
    ["perfumes", "Amber Musk", 88, "🧴"],
    ["perfumes", "Ocean Breeze", 56, "🌊"],
    ["perfumes", "Vanilla Dream", 64, "🍦"],
    ["perfumes", "Jasmine Glow", 72, "🌼"],
    ["perfumes", "Sandal Wood", 99, "🪵"],
    ["perfumes", "Mint Fresh", 36, "🌿"],
    ["perfumes", "Night Bloom", 84, "🌙"],
    // الألعاب
    ["toys", "Puzzle 500", 18, "🧩"],
    ["toys", "Race Car Set", 34, "🏁"],
    ["toys", "Plush Bear", 22, "🧸"],
    ["toys", "Building Blocks", 40, "🧱"],
    ["toys", "Mini Drone", 75, "🚁"],
    ["toys", "Board Game Night", 28, "🎲"],
    ["toys", "Doll House", 90, "🏠"],
    ["toys", "Science Kit", 33, "🔬"],
    ["toys", "Train Set", 60, "🚂"],
    ["toys", "Art Studio", 45, "🎨"],
    // المنزل
    ["home", "Table Lamp", 46, "🪔"],
    ["home", "Ceramic Vase", 31, "🏺"],
    ["home", "Throw Blanket", 52, "🛏️"],
    ["home", "Wall Clock", 38, "🕰️"],
    ["home", "Coffee Mug Set", 27, "☕"],
    ["home", "Storage Box", 19, "📦"],
    ["home", "Candle Set", 34, "🕯️"],
    ["home", "Cushion Cover", 16, "🛋️"],
    ["home", "Desk Organizer", 24, "🗂️"],
    ["home", "Plant Pot", 21, "🪴"],
    // الرياضة
    ["sports", "Yoga Mat", 29, "🧘"],
    ["sports", "Dumbbell Pair", 48, "🏋️"],
    ["sports", "Football", 25, "⚽"],
    ["sports", "Tennis Racket", 92, "🎾"],
    ["sports", "Steel Bottle", 18, "🧴"],
    ["sports", "Jump Rope", 12, "🪢"],
    ["sports", "Gym Gloves", 20, "🥊"],
    ["sports", "Cycling Helmet", 65, "⛑️"],
    ["sports", "Resistance Bands", 17, "🎽"],
    ["sports", "Basketball", 30, "🏀"]
  ];

  // ===== أسماء المنتجات بالعربي =====
  var AR_NAMES = {
    "Hyundai Elantra": "هيونداي إلانترا", "Kia Sportage": "كيا سبورتيج", "Mercedes C-Class": "مرسيدس فئة C",
    "BMW M3": "بي إم دبليو M3", "Jeep Wrangler": "جيب رانجلر", "Honda Civic": "هوندا سيفيك",
    "Bugatti Chiron": "بوغاتي شيرون", "Toyota Land Cruiser": "تويوتا لاند كروزر", "Ford Mustang": "فورد موستانج",
    "Lexus LX": "لكزس LX",
    "Nova X1 Phone": "هاتف Nova X1", "Nova X1 Pro": "Nova X1 برو", "Pixel Lite 5": "بيكسل لايت 5",
    "Arka Mini 8": "أركا ميني 8", "Vertex Book 14": "فيرتكس بوك 14", "Vertex Pro 16": "فيرتكس برو 16",
    "Lumen Slim 13": "لومن سليم 13", "Echo Buds Air": "سماعات إيكو بادز إير", "Bass Max Headset": "سماعة باس ماكس",
    "Mini Speaker Go": "مكبر صوت ميني غو",
    "Basic Cotton Tee": "تيشيرت قطن أساسي", "Denim Jacket": "جاكيت جينز", "Linen Shirt": "قميص كتان",
    "Classic Hoodie": "هودي كلاسيك", "Chino Pants": "بنطلون تشينو", "Knit Sweater": "سويتر محبوك",
    "Polo Shirt": "قميص بولو", "Winter Coat": "معطف شتوي", "Track Pants": "بنطلون رياضي", "Summer Dress": "فستان صيفي",
    "Air Runner": "حذاء Air Runner", "Classic Loafer": "لوفر كلاسيك", "Trail Boot": "بوت للمشي",
    "Canvas Sneaker": "حذاء قماش", "Leather Oxford": "أوكسفورد جلد", "Running Pro": "حذاء جري برو",
    "Slip-on Mule": "موك بدون رباط", "Chelsea Boot": "بوت تشيلسي", "Court White": "حذاء أبيض كورت",
    "Flex Sandal": "صندل مرن",
    "Classic Watch": "ساعة كلاسيك", "Chrono Steel": "ساعة كرونو ستيل", "Smart Band": "سمارت باند",
    "Rose Watch": "ساعة روز", "Diver 200": "ساعة غطس 200", "Minimal Black": "ساعة مينيمال سوداء",
    "Field Watch": "ساعة فيلد", "Pilot Gold": "ساعة طيار ذهبية", "Sport Digital": "ساعة رياضية رقمية",
    "Slim Date": "ساعة سليم بالتاريخ",
    "Pink Tote Bag": "حقيبة توت وردية", "Crossbody Bag": "حقيبة كروس بودي", "Backpack Pro": "حقيبة ظهر برو",
    "Mini Clutch": "كلتش صغير", "Travel Duffel": "حقيبة سفر", "Laptop Sleeve": "غلاف لابتوب",
    "Belt Bag": "حقيبة حزام", "Leather Satchel": "حقيبة جلد ساتشيل", "Weekend Bag": "حقيبة عطلة",
    "Hip Pack": "حقيبة خصر",
    "Oud Night": "عود الليل", "Rose Veil": "ستار الورد", "Citrus Splash": "حمضيات منعشة",
    "Amber Musk": "عنبر ومسك", "Ocean Breeze": "نسيم المحيط", "Vanilla Dream": "حلم الفانيليا",
    "Jasmine Glow": "توهج الياسمين", "Sandal Wood": "خشب الصندل", "Mint Fresh": "نعناع منعش",
    "Night Bloom": "إزهار الليل",
    "Puzzle 500": "بازل 500 قطعة", "Race Car Set": "طقم سيارات سباق", "Plush Bear": "دب قطيفة",
    "Building Blocks": "مكعبات بناء", "Mini Drone": "درون صغير", "Board Game Night": "لعبة ليلة السمر",
    "Doll House": "بيت دمى", "Science Kit": "مجموعة علوم", "Train Set": "طقم قطار", "Art Studio": "استوديو فنون",
    "Table Lamp": "مصباح طاولة", "Ceramic Vase": "مزهرية خزف", "Throw Blanket": "بطانية ناعمة",
    "Wall Clock": "ساعة حائط", "Coffee Mug Set": "طقم أكواب قهوة", "Storage Box": "صندوق تخزين",
    "Candle Set": "طقم شموع", "Cushion Cover": "غطاء وسادة", "Desk Organizer": "منظم مكتب", "Plant Pot": "أصيص نباتات",
    "Yoga Mat": "سجادة يوغا", "Dumbbell Pair": "زوج دمبل", "Football": "كرة قدم", "Tennis Racket": "مضرب تنس",
    "Steel Bottle": "زجاجة ستيل", "Jump Rope": "حبل قفز", "Gym Gloves": "قفازات جيم",
    "Cycling Helmet": "خوذة دراجة", "Resistance Bands": "أربطة مقاومة", "Basketball": "كرة سلة"
  };

  // ===== وصف عام لكل قسم (يتكيّف مع اسم المنتج) =====
  var DESC = {
    cars: { ar: "سيارة عملية ومريحة للاستخدام اليومي والرحلات الطويلة.", en: "A practical, comfortable car for daily driving and long trips." },
    electronics: { ar: "جهاز بمواصفات حديثة وتصميم أنيق، ومتوفر بعدة ألوان وخيارات.", en: "A modern device with a sleek design, available in several colors and options." },
    clothing: { ar: "قطعة مريحة بخامة ناعمة تناسب الاستخدام اليومي. اختر المقاس المناسب.", en: "A comfortable piece in a soft fabric for everyday wear. Choose your size." },
    shoes: { ar: "حذاء مريح بنعل متين، متوفر بمقاسات EU 40 إلى 44.", en: "Comfortable shoes with a durable sole, available in EU 40 to 44." },
    watches: { ar: "ساعة بتصميم أنيق ومقاومة للاستخدام اليومي.", en: "A stylish watch built for everyday use." },
    bags: { ar: "حقيبة عملية بتصميم أنيق تتسع لأغراضك اليومية.", en: "A practical bag with a clean design that fits your daily essentials." },
    perfumes: { ar: "عطر بتركيبة متوازنة تدوم طويلاً.", en: "A balanced fragrance that lasts." },
    toys: { ar: "لعبة ممتعة ومناسبة للأطفال، تنمّي الخيال والمهارات.", en: "A fun toy that builds imagination and skills." },
    home: { ar: "قطعة منزلية عملية تضيف لمسة جميلة لمساحتك.", en: "A practical home piece that adds a nice touch to your space." },
    sports: { ar: "أداة رياضية متينة للتدريب واللياقة اليومية.", en: "A durable sports item for training and everyday fitness." }
  };

  // ===== خيارات الإلكترونيات: لون + مقاس (إجباري قبل الإضافة) =====
  var COLORS = [
    { en: "Black", ar: "أسود" },
    { en: "Silver", ar: "فضي" },
    { en: "Blue", ar: "أزرق" }
  ];
  var ELEC_SIZES = {
    phones: [{ en: "128GB", ar: "128 جيجا" }, { en: "256GB", ar: "256 جيجا" }],
    laptops: [{ en: "13-inch", ar: "13 بوصة" }, { en: "14-inch", ar: "14 بوصة" }],
    audio: [{ en: "Standard", ar: "عادي" }, { en: "Plus", ar: "بلس" }]
  };
  var SIZES = {
    clothing: [{ en: "S", ar: "S" }, { en: "M", ar: "M" }, { en: "L", ar: "L" }, { en: "XL", ar: "XL" }],
    shoes: [{ en: "EU 40", ar: "EU 40" }, { en: "EU 41", ar: "EU 41" }, { en: "EU 42", ar: "EU 42" }, { en: "EU 43", ar: "EU 43" }, { en: "EU 44", ar: "EU 44" }]
  };

  function svgImg(label, emoji, hue) {
    var h2 = (hue + 40) % 360;
    var lab = String(label).replace(/[&<>"]/g, "");
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + hue + ',70%,55%)"/>' +
      '<stop offset="1" stop-color="hsl(' + h2 + ',70%,30%)"/></linearGradient></defs>' +
      '<rect width="600" height="600" fill="url(#g)"/>' +
      '<text x="300" y="290" font-size="200" text-anchor="middle" dominant-baseline="middle">' + emoji + '</text>' +
      '<text x="300" y="500" font-size="40" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">' + lab + '</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }

  // بناء خيارات المنتج: الإلكترونيات لها لون ومقاس، والأساسي (أول خيار) بدون فرق سعر
  function buildVariants(n, root, sub, price, sku, compareAt) {
    var list = [];
    if (root === "electronics") {
      var sizes = ELEC_SIZES[sub] || ELEC_SIZES.phones;
      COLORS.forEach(function (c, ci) {
        sizes.forEach(function (s, si) {
          var extra = si ? SURCHARGE_USD : 0; // اللون ما يغيّر السعر، المقاس فقط
          var v = {
            vid: "demo-" + n + "-" + c.en + "-" + s.en,
            key: c.en + "-" + s.en,
            keyAr: c.ar + " · " + s.ar,
            sku: sku + "-" + c.en.slice(0, 2).toUpperCase() + s.en.replace(/\W/g, ""),
            price: price + extra,
            weightG: 200 + n * 5,
            opt: { color: c, size: s }
          };
          if (compareAt) v.compareAt = compareAt + extra;
          list.push(v);
        });
      });
      return { choose: true, variants: list };
    }
    var keys = SIZES[root] ? SIZES[root] : [null];
    keys.forEach(function (k) {
      var v = {
        vid: "demo-" + n + (k ? "-" + k.en.replace(/\s+/g, "") : "-base"),
        key: k ? k.en : "",
        keyAr: k ? k.ar : "",
        sku: sku + (k ? "-" + k.en.replace(/\s+/g, "") : ""),
        price: price,
        weightG: 200 + n * 5
      };
      if (compareAt) v.compareAt = compareAt;
      list.push(v);
    });
    return { choose: false, variants: list };
  }

  var products = ROWS.map(function (row, i) {
    var n = i + 1;
    var path = row[0], name = row[1], price = row[2], emoji = row[3];
    var parts = path.split("/");
    var root = parts[0];
    var sub = parts.length > 1 ? parts[1] : "";
    var hue = (n * 37) % 360;
    var sku = "DEMO-" + String(n).padStart(3, "0");
    // بعض المنتجات عليها خصم (سعر قبل الخصم أعلى)
    var compareAt = (n % 4 === 0) ? Math.round(price * 1.25) : 0;
    var built = buildVariants(n, root, sub, price, sku, compareAt);
    // مقاسات غير متوفرة في التيشيرت الأساسي (تظهر باهتة وغير قابلة للاختيار)
    if (name === "Basic Cotton Tee") built.variants.forEach(function (v) { if (/-(M|XL)$/.test(v.vid)) v.unavailable = true; });
    // جاكيت جينز: مقاس لارج غير متوفر
    if (name === "Denim Jacket") built.variants.forEach(function (v) { if (/-L$/.test(v.vid)) v.unavailable = true; });
    var ar = AR_NAMES[name] || name;
    var d = DESC[root] || { ar: "", en: "" };
    return {
      pid: "demo-" + n,
      nameEn: name,
      nameAr: ar,
      descEn: name + ". " + d.en,
      descAr: ar + ". " + d.ar,
      cat: path,
      catPath: parts,
      isNew: n % 9 === 1,
      bestseller: n % 7 === 3,
      choose: built.choose,
      image: svgImg(name, emoji, hue),
      images: [svgImg(name, emoji, hue), svgImg(name + " 2", emoji, (hue + 90) % 360)],
      variants: built.variants
    };
  });

  // ===== أسماء الأقسام (عربي / إنجليزي) =====
  var labels = {};
  (function walk(list) {
    list.forEach(function (c) {
      labels[c.id] = { ar: c.ar, en: c.en };
      if (c.children) walk(c.children);
    });
  })(TREE);

  window.SHOWBIZ_DEMO = { tree: TREE, labels: labels, products: products, surchargeUSD: SURCHARGE_USD };
})();
