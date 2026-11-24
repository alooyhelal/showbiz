/* كتالوج وهمي للتجربة فقط: 100 منتج في 10 أقسام رئيسية.
   يظهر فقط بالرابط ?demo=1 ولا يظهر للزوار العاديين.
   - الأقسام الرئيسية والفرعية تُعرّف في TREE بالترتيب اللي يظهر فيه في الموقع.
   - كل منتج يحدد مساره بـ cat مثل "cars/mercedes/sedan" (مستوى ثالث).
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

  // ===== المنتجات: [المسار، الاسم، السعر بالدولار، الأيقونة] =====
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

  var SIZES = {
    clothing: ["S", "M", "L", "XL"],
    shoes: ["EU 40", "EU 41", "EU 42", "EU 43", "EU 44"]
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

  var products = ROWS.map(function (row, i) {
    var n = i + 1;
    var path = row[0], name = row[1], price = row[2], emoji = row[3];
    var root = path.split("/")[0];
    var hue = (n * 37) % 360;
    var sizes = SIZES[root];
    var keys = sizes ? sizes : [""];
    var sku = "DEMO-" + String(n).padStart(3, "0");
    // بعض المنتجات عليها خصم (سعر قبل الخصم أعلى)
    var compareAt = (n % 4 === 0) ? Math.round(price * 1.25) : 0;
    return {
      pid: "demo-" + n,
      nameEn: name,
      cat: path,
      catPath: path.split("/"),
      isNew: n % 9 === 1,
      bestseller: n % 7 === 3,
      image: svgImg(name, emoji, hue),
      images: [svgImg(name, emoji, hue), svgImg(name + " 2", emoji, (hue + 90) % 360)],
      variants: keys.map(function (k, j) {
        var v = {
          vid: "demo-" + n + (k ? "-" + k.replace(/\s+/g, "") : "-base"),
          key: k,
          sku: sku + (k ? "-" + k.replace(/\s+/g, "") : ""),
          price: price,
          weightG: 200 + n * 5
        };
        if (compareAt) v.compareAt = compareAt;
        return v;
      })
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

  window.SHOWBIZ_DEMO = { tree: TREE, labels: labels, products: products };
})();
