// api/tiktok-followers.js
// Debug-friendly lightweight TikTok scraper for a single channel.
// - Adds CORS headers so you can call from the browser easily
// - Adds server console logs and a `?debug=1` query that returns extra fields
// - Returns { followers: number|null, debug?: {...} }

const DEFAULT_CACHE_TTL = 60 * 1000; // 60s cache
const cache = new Map();

const KEY_REGEX = /(followers?|follower_count|followerCount|follow_count|fan_count|fans|likes|subscribers|subscriber_count)/i;

function toNumberIfLooksLike(str) {
  if (typeof str === "number") return Number.isFinite(str) ? str : null;
  if (!str || typeof str !== "string") return null;
  const cleaned = str.replace(/[^\d.,kKmM]/g, "").trim();
  if (!cleaned) return null;
  const mMatch = cleaned.match(/^([\d,.]+)\s*[mM]$/);
  if (mMatch) {
    const val = Number(mMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(val)) return Math.round(val * 1_000_000);
  }
  const kMatch = cleaned.match(/^([\d,.]+)\s*[kK]$/);
  if (kMatch) {
    const val = Number(kMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(val)) return Math.round(val * 1_000);
  }
  const digits = cleaned.replace(/[^\d]/g, "");
  if (/^\d+$/.test(digits)) return Number(digits);
  return null;
}

function findFollowerDeep(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== "object") return null;
  if (seen.has(obj)) return null;
  seen.add(obj);

  for (const key of Object.keys(obj)) {
    try {
      const val = obj[key];
      if (val == null) continue;

      if (KEY_REGEX.test(key)) {
        const n = toNumberIfLooksLike(val);
        if (n !== null) return n;
      }

      if (typeof val === "object") {
        const nested = findFollowerDeep(val, seen);
        if (nested !== null) return nested;
      } else {
        if (KEY_REGEX.test(key)) {
          const n = toNumberIfLooksLike(val);
          if (n !== null) return n;
        }
        if (typeof val === "string") {
          const n = toNumberIfLooksLike(val);
          if (n !== null && n >= 10) return n;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "object") {
      const found = findFollowerDeep(val, seen);
      if (found !== null) return found;
    }
  }

  return null;
}

function tryExtractFromMetaOgDescription(html) {
  try {
    const metaMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (metaMatch && metaMatch[1]) {
      const txt = metaMatch[1];
      const numMatch = txt.match(/([\d.,]+(?:\s*[kKmM])?)[^\d]*followers?/i);
      if (numMatch) {
        return toNumberIfLooksLike(numMatch[1]);
      }
    }
  } catch (e) {}
  return null;
}

function tryExtractFromSigI(html) {
  // <script id="SIGI_STATE">JSON</script>
  const sigiMatch = html.match(/<script[^>]*id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/i);
  if (sigiMatch && sigiMatch[1]) {
    try {
      const jsonText = sigiMatch[1].trim();
      const parsed = JSON.parse(jsonText);
      const found = findFollowerDeep(parsed);
      if (found !== null) return found;
    } catch (e) {
      // parse failed
    }
  }

  // window['SIGI_STATE'] = {...};
  const winMatch = html.match(/window\[['"]SIGI_STATE['"]\]\s*=\s*({[\s\S]*?});/i);
  if (winMatch && winMatch[1]) {
    try {
      const parsed = JSON.parse(winMatch[1]);
      const found = findFollowerDeep(parsed);
      if (found !== null) return found;
    } catch (e) {}
  }
  return null;
}

function tryExtractByRegex(html) {
  const numRegexes = [
    /"followerCount"\s*:\s*([0-9]{2,})/i,
    /"follower_count"\s*:\s*([0-9]{2,})/i,
    /"fans"\s*:\s*([0-9]{2,})/i,
    /"fan_count"\s*:\s*([0-9]{2,})/i,
  ];
  for (const r of numRegexes) {
    const m = html.match(r);
    if (m && m[1]) return Number(m[1]);
  }
  const human = html.match(/([\d.,]+(?:\s*[kKmM])?)\s*followers?/i);
  if (human && human[1]) return toNumberIfLooksLike(human[1]);
  return null;
}

export default async function handler(req, res) {
  // allow CORS from localhost dev quickly
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const debug = Boolean(req.query.debug === "1" || req.query.debug === "true");
    const username = ((req.query.user || req.query.username) + "").replace(/^@/, "").trim() || "boy.throb";
    const cacheKey = username.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < DEFAULT_CACHE_TTL) {
      if (debug) {
        console.log(`[tiktok-followers] cache hit for ${username}:`, cached.value);
      }
      return res.status(200).json({ followers: cached.value, cached: true });
    }

    const url = `https://www.tiktok.com/@${encodeURIComponent(username)}`;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };

    if (debug) console.log(`[tiktok-followers] fetching ${url}`);

    let resp;
    try {
      resp = await fetch(url, { method: "GET", headers });
    } catch (networkErr) {
      console.error("[tiktok-followers] network error fetching TikTok:", networkErr);
      cache.set(cacheKey, { value: null, ts: Date.now() });
      return res.status(200).json({ followers: null, error: "network_error", details: String(networkErr) });
    }

    if (!resp.ok) {
      const status = resp.status;
      const text = await resp.text().catch(() => "<no-body>");
      console.warn(`[tiktok-followers] fetch returned ${status} for ${url}`);
      cache.set(cacheKey, { value: null, ts: Date.now() });
      const payload = { followers: null, note: `fetch returned ${status}` };
      if (debug) payload.debug = { status, bodySnippet: text.slice(0, 1200) };
      return res.status(200).json(payload);
    }

    const html = await resp.text();

    if (debug) console.log(`[tiktok-followers] fetched ${html.length} chars.`);

    // try heuristics
    let followers = null;
    let source = null;

    followers = tryExtractFromSigI(html);
    if (followers !== null) source = "SIGI_STATE";
    if (followers === null) {
      followers = tryExtractFromMetaOgDescription(html);
      if (followers !== null) source = "og:description";
    }
    if (followers === null) {
      followers = tryExtractByRegex(html);
      if (followers !== null) source = "regex";
    }

    cache.set(cacheKey, { value: followers, ts: Date.now() });

    const result = { followers: followers === null ? null : Number(followers) };
    if (debug) {
      result.debug = {
        url,
        fetchedChars: html.length,
        sourceDetected: source || null,
      };
      // include short snippet for inspection
      result.debug.snippet = html.slice(0, 1200);
    }

    if (debug) console.log(`[tiktok-followers] result for ${username}:`, result);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[tiktok-followers] unexpected error:", err);
    return res.status(500).json({ error: "internal", details: String(err) });
  }
}
