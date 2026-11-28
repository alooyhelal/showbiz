// Cloudflare Worker: وسيط بين موقع Showbiz و CJ Dropshipping
// المفاتيح السرية تنحط في إعدادات Cloudflare (Secrets)، ما تنحط في الكود:
//   CJ_API_KEY   (إلزامي)
//   CJ_ORIGIN    (اختياري، بلد الانطلاق، الافتراضي CN)
//
// الأوامر:
//   GET  ?action=list            منتجات CJ (مخزنة 5 دقايق)
//   GET  ?pid=...                تفاصيل منتج واحد
//   POST ?action=freight         طرق الشحن وأسعارها بعملة الدولة (تكلفة CJ، بدون مخاطرة)
//        body: { "country": "BH", "items": [ { "vid": "...", "qty": 2 } ] }
//   POST ?action=avail           هل كل منتج يتشحن للدولة (حتى 10 منتجات، نتيجة كل منتج 6 ساعات)
//        body: { "country": "BH", "vids": [ "..." ] }  ->  { "available": { "vid": true|false } }
//
// أسعار الصرف من open.er-api.com (تتحدث يومياً، والمصدر يطلب ذكره في الموقع).

const ALLOWED_ORIGIN = "https://alooyhelal.github.io";
const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const LIST_TTL = 5 * 60 * 1000;
const FREIGHT_TTL = 10 * 60 * 1000;
const FREIGHT_CACHE_MAX = 500;

// قواعد السعر (متفق عليها):
//   السعر النهائي = أكبر قيمة بين (الحد الأدنى للدولة) و(تكلفة CJ)، بدون أي هامش مخاطرة
// الحد الأدنى بالدينار البحريني، ويتحول لعملة الدولة بسعر الصرف اليوم
const MIN_FEE_BHD = {
  BH: 2.2,
  SA: 3.3,
  AE: 3.3,
  KW: 3.3,
  QA: 3.3,
  OM: 3.3,
};
const COUNTRY_CURRENCY = { BH: "BHD", SA: "SAR", AE: "AED", KW: "KWD", QA: "QAR", OM: "OMR" };
const CURRENCY_DECIMALS = { BHD: 3, KWD: 3, OMR: 3 };
const FX_TTL = 60 * 60 * 1000;
const FX_URL = "https://open.er-api.com/v6/latest/USD";

let cachedToken = null;
let tokenExpiresAt = 0;
let listCache = { at: 0, body: null };
let fxCache = { at: 0, rates: null, date: null };
const freightCache = new Map();

// أسعار الصرف: ساعة في الذاكرة، وإذا فشل التحديث نستخدم آخر سعر معروف
async function getRates() {
  if (fxCache.rates && Date.now() - fxCache.at < FX_TTL) return fxCache;
  try {
    const res = await fetch(FX_URL);
    const d = await res.json();
    if (d.result === "success" && d.rates) {
      fxCache = { at: Date.now(), rates: d.rates, date: d.time_last_update_utc || null };
      return fxCache;
    }
  } catch (e) {}
  if (fxCache.rates) return fxCache;
  throw new Error("fx rates unavailable");
}

// نقرب للأعلى حتى ما ننزل تحت التكلفة بسبب التقريب
const ceilTo = (n, dec) => {
  const f = 10 ** dec;
  return Math.ceil(n * f - 1e-9) / f;
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders() });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getToken(env, force = false) {
  if (!force && cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: env.CJ_API_KEY }),
  });
  const data = await res.json();
  if (!data.data || !data.data.accessToken) {
    throw new Error("token: " + (data.message || res.status));
  }
  cachedToken = data.data.accessToken;
  tokenExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
  return cachedToken;
}

async function cjRequest(env, method, path, body) {
  let token = await getToken(env);
  const send = async (t) => {
    const init = { method, headers: { "CJ-Access-Token": t } };
    if (body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    const res = await fetch(CJ_BASE + path, init);
    return res.json();
  };
  let data = await send(token);
  if (data.result === false && /token/i.test(data.message || "")) {
    token = await getToken(env, true);
    data = await send(token);
  }
  return data;
}

const cjGet = (env, path) => cjRequest(env, "GET", path);
const cjPost = (env, path, body) => cjRequest(env, "POST", path, body);

function parseImages(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a : [v];
  } catch (e) {
    return [v];
  }
}

function parseDims(desc) {
  const m = String(desc || "").match(
    /(\d+(?:\.\d+)?)\s*[*x×]\s*(\d+(?:\.\d+)?)\s*[*x×]\s*(\d+(?:\.\d+)?)\s*cm/i
  );
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

// CJ يرجع الأبعاد بالمليمتر
function parseDimsFromItem(item) {
  const L = item.lengthList, W = item.widthList, H = item.heightList;
  if (Array.isArray(L) && Array.isArray(W) && Array.isArray(H) && L[0] && W[0] && H[0]) {
    return [L[0] / 10, W[0] / 10, H[0] / 10];
  }
  return null;
}

// الوزن يجي كنطاق مثل "690.00-750.00"، ناخذ الأعلى (احتياط)
function maxWeight(w) {
  if (!w) return null;
  const nums = String(w).split("-").map(Number).filter((n) => !isNaN(n));
  return nums.length ? Math.max(...nums) : null;
}

// خيارات كل منتج وكل خيار فيه سعره ووزنه وأبعاده وصورته
function variantsOf(d) {
  const arr = Array.isArray(d.variants) ? d.variants : [];
  return arr.map((v) => ({
    vid: v.vid,
    key: v.variantKey || v.variantNameEn || v.vid,
    sku: v.variantSku || null,
    price: v.variantSellPrice != null ? Number(v.variantSellPrice) : null,
    image: v.variantImage || "",
    weightG: v.variantWeight != null ? Number(v.variantWeight) : null,
    dimsCm: v.variantLength
      ? [v.variantLength / 10, v.variantWidth / 10, v.variantHeight / 10]
      : null,
  }));
}

function normalize(item, detail) {
  const d = detail || {};
  const imgs = parseImages(d.productImage || item.bigImage || d.bigImage);
  return {
    pid: item.productId || item.pid || d.pid || null,
    sku: item.sku || d.productSku || null,
    nameEn: item.nameEn || d.productNameEn || "",
    image: imgs[0] || item.bigImage || "",
    images: imgs,
    sellPrice: item.sellPrice || d.sellPrice || null,
    weightG: maxWeight(d.productWeight || item.weight),
    dimsCm: parseDimsFromItem(item) || parseDims(d.description),
    description: d.description || "",
    optionNames: Array.isArray(d.productKeyEnSet) ? d.productKeyEnSet : [],
    variants: variantsOf(d),
  };
}

async function handleList(env) {
  if (listCache.body && Date.now() - listCache.at < LIST_TTL) {
    return jsonResponse(listCache.body);
  }
  const d = await cjGet(env, "/product/myProduct/query?pageNum=1&pageSize=50");
  const list = Array.isArray(d.data?.content)
    ? d.data.content
    : Array.isArray(d.data?.list)
    ? d.data.list
    : [];

  // بالتسلسل (واحد ورا الثاني) عشان CJ ما يرفض الطلبات المتزامنة
  const products = [];
  for (const item of list) {
    const pid = item.productId || item.pid;
    let detail = null;
    if (pid) {
      // CJ يحدد عدد الطلبات بالثانية، فنستنى بين الطلبات، ونعيد المحاولة بوقت أطول
      for (let attempt = 0; attempt < 3 && !detail; attempt++) {
        await sleep(CJ_GAP_MS * (attempt + 1));
        try {
          const dd = await cjGet(env, "/product/query?pid=" + encodeURIComponent(pid));
          if (dd.data) detail = dd.data;
        } catch (e) {
          // نعيد المحاولة
        }
      }
    }
    products.push(normalize(item, detail));
  }

  const body = { products, count: products.length };
  listCache = { at: Date.now(), body };
  return jsonResponse(body);
}

async function handleProduct(env, pid) {
  const d = await cjGet(env, "/product/query?pid=" + encodeURIComponent(pid));
  return jsonResponse(normalize(d.data || {}, d.data || {}));
}

async function handleFreight(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "bad json" }, 400);
  }

  const country = String(body.country || "").toUpperCase();
  const currency = COUNTRY_CURRENCY[country];
  if (!currency) return jsonResponse({ error: "unsupported country" }, 400);

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > 50) return jsonResponse({ error: "bad items" }, 400);

  const lines = items.map((i) => ({
    vid: String(i.vid || ""),
    quantity: Math.floor(Number(i.qty)),
  }));
  if (lines.some((l) => !l.vid || !(l.quantity >= 1 && l.quantity <= 99))) {
    return jsonResponse({ error: "bad item" }, 400);
  }

  // نفس السلة والوجهة ترجع من الذاكرة المؤقتة (تقلل الطلبات لـ CJ)
  const key = country + "|" + lines.map((l) => l.vid + "x" + l.quantity).sort().join(",");
  const hit = freightCache.get(key);
  if (hit && Date.now() - hit.at < FREIGHT_TTL) return jsonResponse(hit.body);

  let fx;
  try {
    fx = await getRates();
  } catch (e) {
    return jsonResponse({ error: "rates unavailable" }, 503);
  }
  const rate = fx.rates[currency];
  const rateBHD = fx.rates.BHD;
  if (!rate || !rateBHD) return jsonResponse({ error: "rate missing" }, 503);

  // كل المبالغ نحولها من الدولار لعملة الدولة بسعر اليوم
  const dec = CURRENCY_DECIMALS[currency] ?? 2;
  const bhdToLocal = rate / rateBHD;
  const minFee = MIN_FEE_BHD[country] * bhdToLocal;

  const origin = env.CJ_ORIGIN || "CN";
  const d = await cjPost(env, "/logistic/freightCalculate", {
    startCountryCode: origin,
    endCountryCode: country,
    products: lines,
  });
  if (!Array.isArray(d.data)) {
    return jsonResponse({ error: "cj: " + (d.message || "no freight data") }, 502);
  }

  // التكلفة الداخلية ما تنرجع للعميل، ينرجع السعر النهائي بس
  const methods = d.data
    .map((m) => {
      const cost = (Number(m.logisticPrice) || 0) * rate;
      const price = Math.max(minFee, cost);
      return {
        carrier: m.logisticName || "",
        aging: m.logisticAging || "",
        price: ceilTo(price, dec),
      };
    })
    .sort((a, b) => a.price - b.price);

  const result = { country, currency, decimals: dec, methods, rateDate: fx.date, at: Date.now() };
  if (freightCache.size >= FREIGHT_CACHE_MAX) freightCache.clear();
  freightCache.set(key, { at: Date.now(), body: result });
  return jsonResponse(result);
}

// توفر الشحن لكل منتج ولكل دولة: نداء واحد لـ CJ لكل منتج، ونتيجته تنحفظ 6 ساعات
// في ذاكرة Cloudflare (Cache API) فكل الزوار يستخدمون نفس النتيجة ما يستهلكون الرصيد.
const AVAIL_TTL_S = 6 * 60 * 60;
const AVAIL_MAX_VIDS = 10;
const CJ_GAP_MS = 1100; // فاصل بين نداءات CJ (حد الطلبات بالثانية)

async function availFor(env, country, vid) {
  const cacheKey = new Request("https://avail.internal/" + country + "/" + encodeURIComponent(vid));
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return (await hit.json()).ok;

  const origin = env.CJ_ORIGIN || "CN";
  const d = await cjPost(env, "/logistic/freightCalculate", {
    startCountryCode: origin,
    endCountryCode: country,
    products: [{ vid: vid, quantity: 1 }],
  });
  if (!Array.isArray(d.data)) throw new Error("cj: " + (d.message || "no freight data"));
  const ok = d.data.length > 0;
  await cache.put(cacheKey, new Response(JSON.stringify({ ok: ok }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + AVAIL_TTL_S },
  }));
  return ok;
}

async function handleAvail(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "bad json" }, 400);
  }
  const country = String(body.country || "").toUpperCase();
  if (!COUNTRY_CURRENCY[country]) return jsonResponse({ error: "unsupported country" }, 400);
  const vids = Array.isArray(body.vids) ? body.vids.map(String).filter(Boolean) : [];
  if (!vids.length || vids.length > AVAIL_MAX_VIDS) return jsonResponse({ error: "bad vids" }, 400);

  const available = {};
  for (let i = 0; i < vids.length; i++) {
    if (i > 0) await sleep(CJ_GAP_MS);
    available[vids[i]] = await availFor(env, country, vids[i]);
  }
  return jsonResponse({ country, available });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    try {
      if (request.method === "POST") {
        if (url.searchParams.get("action") === "freight") return await handleFreight(request, env);
        if (url.searchParams.get("action") === "avail") return await handleAvail(request, env);
        return jsonResponse({ error: "not found" }, 404);
      }

      if (request.method !== "GET") {
        return jsonResponse({ error: "method not allowed" }, 405);
      }

      const action = url.searchParams.get("action");
      if (action === "list") return await handleList(env);

      const pid = url.searchParams.get("pid");
      if (!pid) return jsonResponse({ error: "missing pid or action" }, 400);
      return await handleProduct(env, pid);
    } catch (e) {
      return jsonResponse({ error: String(e.message || e) }, 500);
    }
  },
};
